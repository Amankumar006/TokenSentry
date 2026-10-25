import dotenv from "dotenv";
dotenv.config();
export const defaultConfig = {
    port: parseInt(process.env.TOKENSENTRY_PORT || "8080", 10),
    host: process.env.TOKENSENTRY_HOST || "127.0.0.1",
    upstreamAnthropicUrl: process.env.ANTHROPIC_UPSTREAM_URL || "https://api.anthropic.com",
    upstreamOpenAiUrl: process.env.OPENAI_UPSTREAM_URL || "https://api.openai.com",
    anthropicApiKey: process.env.ANTHROPIC_API_KEY,
    openaiApiKey: process.env.OPENAI_API_KEY,
    groqApiKey: process.env.GROQ_API_KEY,
    geminiApiKey: process.env.GEMINI_API_KEY,
    enableAstPruning: process.env.TOKENSENTRY_AST_PRUNING !== "false",
    enableFreeTierFallback: process.env.TOKENSENTRY_FREE_FALLBACK !== "false",
    enableSemanticCache: process.env.TOKENSENTRY_CACHE !== "false",
    verbose: process.env.TOKENSENTRY_VERBOSE === "true",
};
//# sourceMappingURL=config.js.map