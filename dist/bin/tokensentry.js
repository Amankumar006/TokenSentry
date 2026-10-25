#!/usr/bin/env node
import { Command } from "commander";
import pc from "picocolors";
import { createServer } from "../server.js";
import { defaultConfig } from "../config.js";
const program = new Command();
program
    .name("tokensentry")
    .description("Cache-preserving local AST context pruner & free-tier proxy for coding agents")
    .version("0.1.0-alpha")
    .option("-p, --port <number>", "Port to bind proxy server", String(defaultConfig.port))
    .option("-h, --host <string>", "Host to bind proxy server", defaultConfig.host)
    .option("--no-ast", "Disable Tree-Sitter AST context folding")
    .option("--no-fallback", "Disable Free-Tier LPU fallback")
    .option("-v, --verbose", "Enable verbose request logging")
    .action(async (options) => {
    const port = parseInt(options.port, 10);
    const host = options.host;
    console.log(pc.bold(pc.cyan(`
  ╭────────────────────────────────────────────────────────────╮
  │                    🛡️  TokenSentry v0.1.0                   │
  │     Cache-Preserving AST Pruner & Free-Tier AI Proxy       │
  ╰────────────────────────────────────────────────────────────╯
    `)));
    const app = createServer({
        port,
        host,
        enableAstPruning: options.ast,
        enableFreeTierFallback: options.fallback,
        verbose: options.verbose,
    });
    try {
        await app.listen({ port, host });
        console.log(pc.green(`  ✔ Proxy listening on: `) + pc.bold(`http://${host}:${port}`));
        console.log(pc.dim(`  ------------------------------------------------------------`));
        console.log(pc.yellow(`  👉 How to use with Claude Code:`));
        console.log(pc.bold(`     export ANTHROPIC_BASE_URL="http://${host}:${port}"`));
        console.log(pc.bold(`     claude\n`));
        console.log(pc.yellow(`  👉 How to use with Cursor / Aider / Cline:`));
        console.log(pc.bold(`     export OPENAI_BASE_URL="http://${host}:${port}/v1"\n`));
        console.log(pc.dim(`  Telemetry & health status: http://${host}:${port}/health`));
        console.log(pc.dim(`  Press Ctrl+C to stop.\n`));
    }
    catch (err) {
        console.error(pc.red(`  ✖ Failed to start server:`), err);
        process.exit(1);
    }
});
program.parse(process.argv);
//# sourceMappingURL=tokensentry.js.map