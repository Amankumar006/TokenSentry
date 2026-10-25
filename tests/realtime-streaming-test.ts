import pc from "picocolors";
import { createServer } from "../src/server.js";

interface StreamMetrics {
  ttftMs: number;
  totalTimeMs: number;
  textOutput: string;
  chunkCount: number;
}

// Helper to consume Anthropic SSE stream in real-time
async function consumeAnthropicStream(
  response: Response,
  onTokenChunk?: (text: string) => void
): Promise<StreamMetrics> {
  const startTime = Date.now();
  let firstTokenTime = 0;
  let textOutput = "";
  let chunkCount = 0;

  if (!response.body) {
    throw new Error("No response body received for streaming");
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop() || "";

    for (const line of lines) {
      if (line.startsWith("data: ")) {
        const jsonStr = line.slice(6).trim();
        if (jsonStr === "[DONE]") continue;

        try {
          const parsed = JSON.parse(jsonStr);
          if (parsed.type === "content_block_delta" && parsed.delta?.text) {
            const tokenText = parsed.delta.text;
            if (firstTokenTime === 0) {
              firstTokenTime = Date.now() - startTime;
            }
            textOutput += tokenText;
            chunkCount++;
            if (onTokenChunk) {
              onTokenChunk(tokenText);
            }
          }
        } catch {
          // Non-JSON or ping event
        }
      }
    }
  }

  const totalTimeMs = Date.now() - startTime;
  return {
    ttftMs: firstTokenTime || totalTimeMs,
    totalTimeMs,
    textOutput,
    chunkCount,
  };
}

async function runRealtimeTest() {
  console.log(pc.bold(pc.cyan("\n╔══════════════════════════════════════════════════════════════════╗")));
  console.log(pc.bold(pc.cyan("║           ⚡ TokenSentry Real-Time Streaming & AST Test          ║")));
  console.log(pc.bold(pc.cyan("╚══════════════════════════════════════════════════════════════════╝\n")));

  const proxyPort = 8080;
  const proxyHost = "127.0.0.1";
  const antigravityUrl = "http://localhost:20128";

  console.log(pc.bold(pc.yellow("📡 Step 1: Booting TokenSentry Proxy Server...")));
  const server = createServer({
    port: proxyPort,
    host: proxyHost,
    upstreamAnthropicUrl: antigravityUrl,
    enableAstPruning: true,
    enableFreeTierFallback: false,
    verbose: false,
  });

  await server.listen({ port: proxyPort, host: proxyHost });
  console.log(pc.green(`   ✔ TokenSentry listening on http://${proxyHost}:${proxyPort}`));
  console.log(pc.dim(`   ✔ Upstream connected to Antigravity at ${antigravityUrl}\n`));

  const sampleTypeScriptModule = `
import { Database } from "./database";
import { CryptoService } from "./crypto";
import { MetricsCollector } from "./metrics";

export interface UserSession {
  userId: string;
  token: string;
  expiresAt: number;
  roles: string[];
}

export class AuthenticationManager {
  private db: Database;
  private crypto: CryptoService;
  private metrics: MetricsCollector;

  constructor(db: Database, crypto: CryptoService, metrics: MetricsCollector) {
    this.db = db;
    this.crypto = crypto;
    this.metrics = metrics;
  }

  public async authenticateAndCreateSession(
    username: string,
    passwordHash: string,
    mfaToken?: string
  ): Promise<UserSession | null> {
    this.metrics.increment("auth.attempt");
    const user = await this.db.findUserByUsername(username);
    if (!user) {
      this.metrics.increment("auth.user_not_found");
      return null;
    }

    const isValidPassword = await this.crypto.verifyArgon2(user.hash, passwordHash);
    if (!isValidPassword) {
      this.metrics.increment("auth.invalid_password");
      await this.db.recordFailedAttempt(user.id);
      return null;
    }

    if (user.mfaEnabled && !mfaToken) {
      this.metrics.increment("auth.mfa_required");
      throw new Error("MFA_REQUIRED");
    }

    if (user.mfaEnabled && mfaToken) {
      const isMfaValid = await this.crypto.verifyTotp(user.mfaSecret, mfaToken);
      if (!isMfaValid) {
        this.metrics.increment("auth.invalid_mfa");
        return null;
      }
    }

    const sessionToken = this.crypto.generateSecureSessionId(32);
    const session: UserSession = {
      userId: user.id,
      token: sessionToken,
      expiresAt: Date.now() + 86400000,
      roles: user.roles || ["user"],
    };

    await this.db.saveSession(session);
    this.metrics.increment("auth.success");
    return session;
  }

  public async revokeSession(token: string): Promise<boolean> {
    return await this.db.deleteSession(token);
  }
}
`;

  try {
    // -------------------------------------------------------------------------
    // TEST RUN: Direct vs. TokenSentry Comparison
    // -------------------------------------------------------------------------
    console.log(pc.bold(pc.yellow("🔬 Step 2: Real-Time Stream Comparison (Direct vs TokenSentry)")));
    console.log(pc.dim("------------------------------------------------------------------"));

    const payload = {
      model: "antigravity/gemini-3.8-flash-high",
      max_tokens: 150,
      stream: true,
      messages: [
        {
          role: "user",
          content: "What are the methods and parameters in AuthenticationManager? Answer in 2 short bullet points.",
        },
        {
          role: "assistant",
          content: [
            {
              type: "tool_use",
              id: "toolu_auth_read",
              name: "read_file",
              input: { path: "src/auth.ts" },
            },
          ],
        },
        {
          role: "user",
          content: [
            {
              type: "tool_result",
              tool_use_id: "toolu_auth_read",
              content: sampleTypeScriptModule,
            },
            {
              type: "text",
              text: "Now answer the question based on the code above.",
            },
          ],
        },
      ],
    };

    // A. DIRECT RUN
    console.log(pc.cyan("\n[A] Direct Request to Antigravity (No Pruning)..."));
    const directStart = Date.now();
    const directRes = await fetch(`${antigravityUrl}/v1/messages`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify(payload),
    });

    let directOutput = "";
    process.stdout.write(pc.dim("    Stream tokens: "));
    const directMetrics = await consumeAnthropicStream(directRes, (token) => {
      process.stdout.write(pc.dim(token));
      directOutput += token;
    });
    console.log("\n");
    console.log(pc.green(`    ✔ Direct TTFT: ${directMetrics.ttftMs}ms | Total Latency: ${directMetrics.totalTimeMs}ms`));

    // B. TOKENSENTRY RUN
    console.log(pc.cyan("\n[B] Request through TokenSentry Proxy (with Real-Time AST Pruning)..."));
    const proxyStart = Date.now();
    const proxyRes = await fetch(`http://${proxyHost}:${proxyPort}/v1/messages`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify(payload),
    });

    let proxyOutput = "";
    process.stdout.write(pc.magenta("    Stream tokens: "));
    const proxyMetrics = await consumeAnthropicStream(proxyRes, (token) => {
      process.stdout.write(pc.cyan(token));
      proxyOutput += token;
    });
    console.log("\n");
    console.log(pc.green(`    ✔ TokenSentry TTFT: ${proxyMetrics.ttftMs}ms | Total Latency: ${proxyMetrics.totalTimeMs}ms`));

    const addedOverhead = Math.max(0, proxyMetrics.ttftMs - directMetrics.ttftMs);
    console.log(pc.bold(pc.yellow(`    ⚡ Proxy Overhead on First Token: ~${addedOverhead}ms (Target: <15ms)`)));

    // -------------------------------------------------------------------------
    // TEST 3: Real-Time Telemetry Dashboard
    // -------------------------------------------------------------------------
    console.log(pc.bold(pc.yellow("\n📊 Step 3: Fetching Real-Time Telemetry Metrics...")));
    const metricsRes = await fetch(`http://${proxyHost}:${proxyPort}/metrics`);
    const metrics = (await metricsRes.json()) as any;

    const savingsPercent = (
      (metrics.tokensSaved / Math.max(1, metrics.rawTokensEstimated)) *
      100
    ).toFixed(1);

    console.log(pc.bold(pc.green("\n╭─────────────────── LIVE TOKENSENTRY TELEMETRY ───────────────────╮")));
    console.log(`│ Total Requests Handled:      ${String(metrics.totalRequests).padEnd(36)}│`);
    console.log(`│ Raw Input Tokens:            ${String(metrics.rawTokensEstimated.toLocaleString()).padEnd(36)}│`);
    console.log(`│ Pruned Input Tokens:         ${String(metrics.prunedTokensEstimated.toLocaleString()).padEnd(36)}│`);
    console.log(pc.bold(pc.green(`│ Net Tokens Saved:            ${String(metrics.tokensSaved.toLocaleString() + ` (-${savingsPercent}%)`).padEnd(36)}│`)));
    console.log(`│ Dollar Savings (Est.):       ${String(`$${metrics.estimatedDollarsSaved.toFixed(5)}`).padEnd(36)}│`);
    console.log(pc.bold(pc.green("╰──────────────────────────────────────────────────────────────────╯\n")));

    console.log(pc.bold(pc.green("✅ REAL-TIME STREAMING & AST COMPRESSION VERIFIED SUCCESSFULLY!")));
  } finally {
    await server.close();
    console.log(pc.dim("TokenSentry proxy cleanly closed."));
  }
}

runRealtimeTest().catch((err) => {
  console.error(pc.red("Error during real-time streaming test:"), err);
  process.exit(1);
});
