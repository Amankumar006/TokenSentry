import Fastify from "fastify";
import cors from "@fastify/cors";
import pc from "picocolors";
import { defaultConfig } from "./config.js";
import { CacheGuard } from "./compressor/cache-guard.js";
import { AstSkeletonizer } from "./compressor/ast.js";
import { TelemetryStore } from "./telemetry/store.js";
import { TurnClassifier } from "./router/classifier.js";
import { GroqFreeTierAdapter } from "./router/groq.js";
function getAnthropicEndpoint(baseUrl) {
    const clean = baseUrl.replace(/\/+$/, "");
    return clean.endsWith("/v1") ? `${clean}/messages` : `${clean}/v1/messages`;
}
function getOpenAiEndpoint(baseUrl) {
    const clean = baseUrl.replace(/\/+$/, "");
    return clean.endsWith("/v1") ? `${clean}/chat/completions` : `${clean}/v1/chat/completions`;
}
export function createServer(customConfig) {
    const config = { ...defaultConfig, ...customConfig };
    const app = Fastify({ logger: config.verbose });
    app.register(cors, { origin: true });
    // Health check endpoint
    app.get("/health", async () => {
        return {
            status: "ok",
            name: "TokenSentry",
            version: "0.1.0-alpha",
            uptimeSeconds: Math.floor((Date.now() - TelemetryStore.getMetrics().startTime) / 1000),
            metrics: TelemetryStore.getMetrics(),
        };
    });
    // Telemetry endpoint
    app.get("/metrics", async () => {
        return TelemetryStore.getMetrics();
    });
    // Anthropic /v1/messages interceptor
    app.post("/v1/messages", async (req, reply) => {
        const body = req.body;
        let originalTokensEstimate = 0;
        let prunedTokensEstimate = 0;
        // Phase 1: Apply Invariant 1 (Prefix Immutability) & Invariant 2 (Ephemeral AST Pruning)
        if (config.enableAstPruning && body.messages) {
            const analysis = CacheGuard.analyzeRequest(body);
            for (const target of analysis.safeToPruneBlocks) {
                if (typeof target.block.content === "string") {
                    const originalText = target.block.content;
                    const origTokens = CacheGuard.estimateTokens(originalText);
                    originalTokensEstimate += origTokens;
                    // Attempt AST skeletonization
                    const folded = AstSkeletonizer.foldCode(originalText);
                    if (folded.tokensSaved > 0) {
                        target.block.content = folded.code;
                        prunedTokensEstimate += folded.prunedTokens;
                    }
                    else {
                        prunedTokensEstimate += origTokens;
                    }
                }
            }
        }
        const tokensSaved = Math.max(0, originalTokensEstimate - prunedTokensEstimate);
        TelemetryStore.recordTurn({
            rawTokens: originalTokensEstimate,
            prunedTokens: prunedTokensEstimate,
            tokensSaved,
            provider: "anthropic",
        });
        if (tokensSaved > 0) {
            console.log(pc.green(`✔ [TokenSentry]`) +
                pc.cyan(` Intercepted Anthropic turn: Saved ~${tokensSaved.toLocaleString()} tokens`) +
                pc.dim(` | Cumulative: ${TelemetryStore.formatSummary()}`));
        }
        // Phase 2: Forward to upstream Anthropic endpoint
        const upstreamUrl = getAnthropicEndpoint(config.upstreamAnthropicUrl);
        const clientHeaders = {
            "content-type": "application/json",
            "anthropic-version": req.headers["anthropic-version"] || "2023-06-01",
        };
        // Forward Anthropic API key or Auth Token
        const authHeader = req.headers["x-api-key"] || req.headers["authorization"];
        if (authHeader) {
            if (req.headers["x-api-key"]) {
                clientHeaders["x-api-key"] = req.headers["x-api-key"];
            }
            else {
                clientHeaders["authorization"] = req.headers["authorization"];
            }
        }
        else if (config.anthropicApiKey) {
            clientHeaders["x-api-key"] = config.anthropicApiKey;
        }
        // Forward beta headers (e.g. prompt-caching, tools)
        if (req.headers["anthropic-beta"]) {
            clientHeaders["anthropic-beta"] = req.headers["anthropic-beta"];
        }
        try {
            const upstreamResponse = await fetch(upstreamUrl, {
                method: "POST",
                headers: clientHeaders,
                body: JSON.stringify(body),
            });
            reply.status(upstreamResponse.status);
            upstreamResponse.headers.forEach((val, key) => {
                if (!["content-encoding", "content-length", "transfer-encoding"].includes(key.toLowerCase())) {
                    reply.header(key, val);
                }
            });
            if (body.stream && upstreamResponse.body) {
                reply.header("content-type", "text/event-stream");
                reply.header("cache-control", "no-cache");
                reply.header("connection", "keep-alive");
                const reader = upstreamResponse.body.getReader();
                const responseStream = reply.raw;
                while (true) {
                    const { done, value } = await reader.read();
                    if (done)
                        break;
                    responseStream.write(value);
                }
                responseStream.end();
                return reply;
            }
            const data = await upstreamResponse.json();
            return reply.send(data);
        }
        catch (err) {
            const errorMsg = err instanceof Error ? err.message : String(err);
            console.error(pc.red(`✖ [TokenSentry Upstream Error]:`), errorMsg);
            return reply.status(502).send({
                error: {
                    type: "tokensentry_upstream_error",
                    message: `TokenSentry failed to reach upstream ${upstreamUrl}: ${errorMsg}`,
                },
            });
        }
    });
    // OpenAI /v1/chat/completions interceptor (for Cursor, Aider, Cline)
    app.post("/v1/chat/completions", async (req, reply) => {
        const body = req.body;
        let originalTokensEstimate = 0;
        let prunedTokensEstimate = 0;
        // Check for Groq free-tier offloading if enabled
        const groqKey = config.groqApiKey || process.env.GROQ_API_KEY;
        if (config.enableFreeTierFallback && groqKey) {
            const classification = TurnClassifier.classifyOpenAI(body, true);
            if (classification.suggestedProvider === "groq") {
                const offload = await GroqFreeTierAdapter.executeOpenAIOffload(body, groqKey);
                if (offload.handled) {
                    console.log(pc.green(`⚡ [TokenSentry Groq Offload]`) +
                        pc.yellow(` Discovery turn routed to free Groq LPU (${offload.latencyMs}ms) - $0.00 billed!`));
                    return reply.send(offload.response);
                }
            }
        }
        // Apply Invariant 1 (Prefix Immutability) on OpenAI messages: only inspect the last message
        if (config.enableAstPruning && body.messages && body.messages.length > 0) {
            const lastMsg = body.messages[body.messages.length - 1];
            if (typeof lastMsg.content === "string" && lastMsg.content.length > 200) {
                const origTokens = CacheGuard.estimateTokens(lastMsg.content);
                originalTokensEstimate += origTokens;
                const folded = AstSkeletonizer.foldCode(lastMsg.content);
                if (folded.tokensSaved > 0) {
                    lastMsg.content = folded.code;
                    prunedTokensEstimate += folded.prunedTokens;
                }
                else {
                    prunedTokensEstimate += origTokens;
                }
            }
        }
        const tokensSaved = Math.max(0, originalTokensEstimate - prunedTokensEstimate);
        TelemetryStore.recordTurn({
            rawTokens: originalTokensEstimate,
            prunedTokens: prunedTokensEstimate,
            tokensSaved,
            provider: "openai",
        });
        if (tokensSaved > 0) {
            console.log(pc.green(`✔ [TokenSentry]`) +
                pc.cyan(` Intercepted OpenAI turn: Saved ~${tokensSaved.toLocaleString()} tokens`) +
                pc.dim(` | Cumulative: ${TelemetryStore.formatSummary()}`));
        }
        // Forward to upstream OpenAI
        const upstreamUrl = getOpenAiEndpoint(config.upstreamOpenAiUrl);
        const clientHeaders = {
            "content-type": "application/json",
        };
        const authHeader = req.headers["authorization"];
        if (authHeader) {
            clientHeaders["authorization"] = authHeader;
        }
        else if (config.openaiApiKey) {
            clientHeaders["authorization"] = `Bearer ${config.openaiApiKey}`;
        }
        try {
            const upstreamResponse = await fetch(upstreamUrl, {
                method: "POST",
                headers: clientHeaders,
                body: JSON.stringify(body),
            });
            reply.status(upstreamResponse.status);
            upstreamResponse.headers.forEach((val, key) => {
                if (!["content-encoding", "content-length", "transfer-encoding"].includes(key.toLowerCase())) {
                    reply.header(key, val);
                }
            });
            if (body.stream && upstreamResponse.body) {
                reply.header("content-type", "text/event-stream");
                reply.header("cache-control", "no-cache");
                reply.header("connection", "keep-alive");
                const reader = upstreamResponse.body.getReader();
                const responseStream = reply.raw;
                while (true) {
                    const { done, value } = await reader.read();
                    if (done)
                        break;
                    responseStream.write(value);
                }
                responseStream.end();
                return reply;
            }
            const data = await upstreamResponse.json();
            return reply.send(data);
        }
        catch (err) {
            const errorMsg = err instanceof Error ? err.message : String(err);
            console.error(pc.red(`✖ [TokenSentry Upstream OpenAI Error]:`), errorMsg);
            return reply.status(502).send({
                error: {
                    type: "tokensentry_upstream_error",
                    message: `TokenSentry failed to reach upstream ${upstreamUrl}: ${errorMsg}`,
                },
            });
        }
    });
    return app;
}
//# sourceMappingURL=server.js.map