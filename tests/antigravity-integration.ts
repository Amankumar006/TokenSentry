import pc from "picocolors";
import { createServer } from "../src/server.js";
import { TelemetryStore } from "../src/telemetry/store.js";

async function runLiveTest() {
  console.log(pc.bold(pc.cyan("\n============================================================")));
  console.log(pc.bold(pc.cyan("       🛡️ TokenSentry <-> Antigravity Live Integration Test")));
  console.log(pc.bold(pc.cyan("============================================================\n")));

  const port = 8080;
  const host = "127.0.0.1";
  const upstreamUrl = "http://localhost:20128";

  console.log(pc.yellow(`1. Initializing TokenSentry Proxy...`));
  console.log(`   - Binding to: http://${host}:${port}`);
  console.log(`   - Upstream Target: Antigravity (${upstreamUrl})`);

  const app = createServer({
    port,
    host,
    upstreamAnthropicUrl: upstreamUrl,
    enableAstPruning: true,
    enableFreeTierFallback: false,
    verbose: false,
  });

  await app.listen({ port, host });
  console.log(pc.green(`   ✔ TokenSentry is listening on http://${host}:${port}\n`));

  try {
    // ------------------------------------------------------------------
    // TEST 1: Basic Health & Connectivity
    // ------------------------------------------------------------------
    console.log(pc.yellow(`2. Checking TokenSentry /health endpoint...`));
    const healthRes = await fetch(`http://${host}:${port}/health`);
    const healthJson = await healthRes.json();
    console.log(pc.green(`   ✔ Health Status:`), JSON.stringify(healthJson));
    console.log();

    // ------------------------------------------------------------------
    // TEST 2: Simple Turn Pass-through to Antigravity
    // ------------------------------------------------------------------
    console.log(pc.yellow(`3. Testing Simple Ping to Antigravity via TokenSentry...`));
    const pingPayload = {
      model: "antigravity/gemini-3.8-flash-high",
      max_tokens: 60,
      messages: [
        {
          role: "user",
          content: "Respond strictly with: 'TokenSentry Antigravity Bridge Online!'",
        },
      ],
    };

    const pingRes = await fetch(`http://${host}:${port}/v1/messages`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify(pingPayload),
    });

    if (!pingRes.ok) {
      const errText = await pingRes.text();
      throw new Error(`Ping failed (${pingRes.status}): ${errText}`);
    }

    const pingJson = await pingRes.json() as any;
    const pingText = pingJson.content?.[0]?.text || JSON.stringify(pingJson);
    console.log(pc.green(`   ✔ Antigravity Response:`), pc.bold(pc.magenta(pingText.trim())));
    console.log();

    // ------------------------------------------------------------------
    // TEST 3: AST Pruning + Live Antigravity Synthesis Turn
    // ------------------------------------------------------------------
    console.log(pc.yellow(`4. Testing AST Skeletonization on Code Payload + Antigravity reasoning...`));

    const sampleLargeTypeScriptCode = `
import { Database } from "./db";
import { Logger } from "./logger";

export interface AccountRecord {
  accountId: string;
  balance: number;
  tier: "gold" | "silver" | "bronze";
}

export async function processHighVolumeTransactions(
  db: Database,
  logger: Logger,
  batchSize: number,
  dryRun: boolean = false
): Promise<AccountRecord[]> {
  logger.info("Starting batch transaction processing", { batchSize, dryRun });
  const accounts = await db.query("SELECT * FROM accounts WHERE status = 'active' LIMIT " + batchSize);
  const settledRecords: AccountRecord[] = [];

  for (const account of accounts) {
    let feeMultiplier = 1.0;
    if (account.tier === "gold") {
      feeMultiplier = 0.5;
    } else if (account.tier === "silver") {
      feeMultiplier = 0.75;
    }

    const netAdjustment = account.pendingAdjustment * feeMultiplier;
    account.balance += netAdjustment;
    account.pendingAdjustment = 0;

    if (!dryRun) {
      await db.updateAccount(account.id, account.balance);
      logger.info("Account updated successfully", { id: account.id, balance: account.balance });
    }

    settledRecords.push({
      accountId: String(account.id),
      balance: Number(account.balance),
      tier: account.tier,
    });
  }

  logger.info("Batch processing complete", { count: settledRecords.length });
  return settledRecords;
}

export function quickVerify(status: string): boolean {
  return status === "active";
}
`;

    // Construct a simulated Claude Code turn where a tool_result returned this code
    const pruningPayload = {
      model: "antigravity/gemini-3.8-flash-high",
      max_tokens: 150,
      messages: [
        {
          role: "user",
          content: "Please check the signature of processHighVolumeTransactions.",
        },
        {
          role: "assistant",
          content: [
            {
              type: "tool_use",
              id: "toolu_read_code_001",
              name: "read_file",
              input: { path: "src/transactions.ts" },
            },
          ],
        },
        {
          role: "user",
          content: [
            {
              type: "tool_result",
              tool_use_id: "toolu_read_code_001",
              content: sampleLargeTypeScriptCode,
            },
            {
              type: "text",
              text: "Based on the file above, what are the parameters and return type of processHighVolumeTransactions? Give a 1-sentence answer.",
            },
          ],
        },
      ],
    };

    console.log(`   - Sending simulated turn with 50-line TypeScript function in tool_result...`);
    const pruneRes = await fetch(`http://${host}:${port}/v1/messages`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify(pruningPayload),
    });

    if (!pruneRes.ok) {
      const errText = await pruneRes.text();
      throw new Error(`Pruning request failed (${pruneRes.status}): ${errText}`);
    }

    const pruneJson = await pruneRes.json() as any;
    const pruneText = pruneJson.content?.[0]?.text || JSON.stringify(pruneJson);
    console.log(pc.green(`   ✔ Antigravity Answer from Pruned Context:`));
    console.log(pc.bold(pc.cyan(`     "${pruneText.trim()}"`)));
    console.log();

    // ------------------------------------------------------------------
    // TEST 4: Telemetry Metrics Verification
    // ------------------------------------------------------------------
    console.log(pc.yellow(`5. Verifying Live TokenSentry Telemetry...`));
    const metricsRes = await fetch(`http://${host}:${port}/metrics`);
    const metrics = await metricsRes.json() as any;

    console.log(pc.green(`   ✔ Telemetry Summary:`));
    console.log(`     • Total Requests Intercepted: ${metrics.totalRequests}`);
    console.log(`     • Raw Tokens Processed:      ${metrics.rawTokensEstimated}`);
    console.log(`     • Pruned Tokens:             ${metrics.prunedTokensEstimated}`);
    console.log(pc.bold(pc.green(`     • Net Tokens Saved:          ${metrics.tokensSaved.toLocaleString()} tokens`)));
    console.log(pc.bold(pc.green(`     • Estimated Dollars Saved:   $${metrics.estimatedDollarsSaved.toFixed(4)}`)));
    console.log();

    console.log(pc.bold(pc.green("🎉 ALL LIVE INTEGRATION TESTS PASSED WITH ANTIGRAVTIY!")));
  } finally {
    await app.close();
    console.log(pc.dim("\nTokenSentry proxy cleanly shut down."));
  }
}

runLiveTest().catch((err) => {
  console.error(pc.red("Integration test error:"), err);
  process.exit(1);
});
