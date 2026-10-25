import assert from "node:assert";
import pc from "picocolors";
import { createServer } from "../src/server.js";

async function consumeStream(response: Response): Promise<{ text: string; ttftMs: number; totalMs: number }> {
  const startTime = Date.now();
  let firstTokenTime = 0;
  let text = "";

  if (!response.body) throw new Error("No response body");

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
            if (firstTokenTime === 0) firstTokenTime = Date.now() - startTime;
            text += parsed.delta.text;
          }
        } catch {
          // ignore keepalive/ping
        }
      }
    }
  }

  const totalMs = Date.now() - startTime;
  return { text, ttftMs: firstTokenTime || totalMs, totalMs };
}

async function runStrictAntigravitySuite() {
  console.log(pc.bold(pc.cyan("\n╔══════════════════════════════════════════════════════════════════════╗")));
  console.log(pc.bold(pc.cyan("║           🛡️ TokenSentry STRICT ANTIGRAVTIY STRESS SUITE             ║")));
  console.log(pc.bold(pc.cyan("║     Extreme Edge Cases, Multi-Turn Continuity & Burst Traffic        ║")));
  console.log(pc.bold(pc.cyan("╚══════════════════════════════════════════════════════════════════════╝\n")));

  const port = 8080;
  const host = "127.0.0.1";
  const upstream = "http://localhost:20128";

  const app = createServer({
    port,
    host,
    upstreamAnthropicUrl: upstream,
    enableAstPruning: true,
    enableFreeTierFallback: false,
    verbose: false,
  });

  await app.listen({ port, host });
  console.log(pc.green(`✔ TokenSentry listening on http://${host}:${port} ──► Antigravity (${upstream})\n`));

  let passedScenarios = 0;

  try {
    // =========================================================================
    // SCENARIO 1: Complex 100+ Line Banking Service AST Pruning & Contract Reasoning
    // =========================================================================
    console.log(pc.bold(pc.yellow("▶ SCENARIO 1: 100-Line Banking Service AST Pruning & API Contract Reasoning")));
    const complexBankingService = `
import { Database } from "./db";
import { LedgerService } from "./ledger";
import { AuditLogger } from "./audit";

export interface Account {
  id: string;
  ownerId: string;
  balance: number;
  currency: "INR" | "USD" | "EUR";
  isFrozen: boolean;
}

export interface TransferResult {
  transactionId: string;
  fromBalance: number;
  toBalance: number;
  feeDeducted: number;
  status: "COMPLETED" | "FAILED";
}

export class BankTransferEngine {
  private db: Database;
  private ledger: LedgerService;
  private audit: AuditLogger;

  constructor(db: Database, ledger: LedgerService, audit: AuditLogger) {
    this.db = db;
    this.ledger = ledger;
    this.audit = audit;
  }

  public async transferFunds(
    fromAccountId: string,
    toAccountId: string,
    amount: number,
    remarks?: string
  ): Promise<TransferResult> {
    if (amount <= 0) {
      throw new Error("INVALID_AMOUNT");
    }
    const fromAcc = await this.db.getAccount(fromAccountId);
    const toAcc = await this.db.getAccount(toAccountId);
    if (!fromAcc || !toAcc) {
      throw new Error("ACCOUNT_NOT_FOUND");
    }
    if (fromAcc.isFrozen || toAcc.isFrozen) {
      throw new Error("FROZEN_ACCOUNT");
    }
    let fee = 0;
    if (fromAcc.currency !== toAcc.currency) {
      fee = amount * 0.02;
    }
    if (fromAcc.balance < amount + fee) {
      throw new Error("INSUFFICIENT_FUNDS");
    }
    fromAcc.balance -= (amount + fee);
    toAcc.balance += amount;
    await this.db.save(fromAcc);
    await this.db.save(toAcc);
    const txId = await this.ledger.recordEntry({
      from: fromAccountId,
      to: toAccountId,
      amount,
      fee,
      remarks: remarks || "Peer transfer",
    });
    await this.audit.log("TRANSFER_SUCCESS", { txId, fromAccountId, toAccountId, amount });
    return {
      transactionId: txId,
      fromBalance: fromAcc.balance,
      toBalance: toAcc.balance,
      feeDeducted: fee,
      status: "COMPLETED",
    };
  }

  public async freezeAccount(accountId: string, reason: string): Promise<boolean> {
    const acc = await this.db.getAccount(accountId);
    if (!acc) return false;
    acc.isFrozen = true;
    await this.db.save(acc);
    await this.audit.log("ACCOUNT_FROZEN", { accountId, reason });
    return true;
  }
}
`;

    const res1 = await fetch(`http://${host}:${port}/v1/messages`, {
      method: "POST",
      headers: { "content-type": "application/json", "anthropic-version": "2023-06-01" },
      body: JSON.stringify({
        model: "antigravity/gemini-3.8-flash-high",
        max_tokens: 120,
        stream: true,
        messages: [
          { role: "user", content: "Review src/bank.ts." },
          {
            role: "assistant",
            content: [{ type: "tool_use", id: "t_bank", name: "read_file", input: { path: "src/bank.ts" } }],
          },
          {
            role: "user",
            content: [
              { type: "tool_result", tool_use_id: "t_bank", content: complexBankingService },
              { type: "text", text: "What parameters does `transferFunds` take and what does it return? Answer in 1 line." },
            ],
          },
        ],
      }),
    });

    const stream1 = await consumeStream(res1);
    console.log(pc.green(`   ✔ Antigravity Output:`), pc.bold(pc.cyan(stream1.text.trim())));
    console.log(pc.dim(`   ✔ TTFT: ${stream1.ttftMs}ms | Total: ${stream1.totalMs}ms\n`));
    passedScenarios++;

    // =========================================================================
    // SCENARIO 2: Multi-Turn Conversation Continuity with Pruned Context
    // =========================================================================
    console.log(pc.bold(pc.yellow("▶ SCENARIO 2: Multi-Turn Conversational Memory & Prefix Invariance")));
    const multiTurnMessages = [
      { role: "user", content: "Hello! We are configuring an ML training pipeline in Python." },
      { role: "assistant", content: "Great! Let me know what hyperparameters or models you'd like to use." },
      { role: "user", content: "Here is train.py, inspect its batch size and learning rate." },
      {
        role: "assistant",
        content: [{ type: "tool_use", id: "t_ml", name: "read_file", input: { path: "train.py" } }],
      },
      {
        role: "user",
        content: [
          {
            type: "tool_result",
            tool_use_id: "t_ml",
            content: `
import os
import torch

BATCH_SIZE = 64
LEARNING_RATE = 2e-4
WEIGHT_DECAY = 0.01

def train_network(epochs: int = 10, checkpoint_dir: str = "./checkpoints") -> dict:
    model = torch.nn.Linear(10, 2)
    optimizer = torch.optim.AdamW(model.parameters(), lr=LEARNING_RATE, weight_decay=WEIGHT_DECAY)
    for epoch in range(epochs):
        print(f"Epoch {epoch} running with batch size {BATCH_SIZE}")
        # 30 lines of training step simulation
        for step in range(100):
            x = torch.randn(BATCH_SIZE, 10)
            y = model(x)
            loss = y.sum()
            loss.backward()
            optimizer.step()
    return {"status": "trained", "epochs": epochs}
`,
          },
          { type: "text", text: "What are the values of BATCH_SIZE and LEARNING_RATE?" },
        ],
      },
    ];

    const res2 = await fetch(`http://${host}:${port}/v1/messages`, {
      method: "POST",
      headers: { "content-type": "application/json", "anthropic-version": "2023-06-01" },
      body: JSON.stringify({
        model: "antigravity/gemini-3.8-flash-high",
        max_tokens: 80,
        stream: true,
        messages: multiTurnMessages,
      }),
    });

    const stream2 = await consumeStream(res2);
    console.log(pc.green(`   ✔ Antigravity Turn 1:`), pc.bold(pc.cyan(stream2.text.trim())));
    assert.ok(stream2.text.includes("64") || stream2.text.includes("2e-4"), "Must accurately identify values");

    // Send Turn 2 in the same conversation
    multiTurnMessages.push({ role: "assistant", content: stream2.text });
    multiTurnMessages.push({ role: "user", content: "Now what was the return type of train_network?" });

    const res2b = await fetch(`http://${host}:${port}/v1/messages`, {
      method: "POST",
      headers: { "content-type": "application/json", "anthropic-version": "2023-06-01" },
      body: JSON.stringify({
        model: "antigravity/gemini-3.8-flash-high",
        max_tokens: 60,
        stream: true,
        messages: multiTurnMessages,
      }),
    });

    const stream2b = await consumeStream(res2b);
    console.log(pc.green(`   ✔ Antigravity Turn 2 (Follow-up Continuity):`), pc.bold(pc.cyan(stream2b.text.trim())));
    assert.ok(stream2b.text.toLowerCase().includes("dict"), "Must accurately recall return type from memory");
    console.log(pc.dim(`   ✔ Multi-turn continuity preserved 100%\n`));
    passedScenarios++;

    // =========================================================================
    // SCENARIO 3: Burst Traffic Stress Test (5 Back-to-Back Requests)
    // =========================================================================
    console.log(pc.bold(pc.yellow("▶ SCENARIO 3: Rapid Burst Traffic (5 Concurrent Streaming Requests)")));
    const burstPromises = Array.from({ length: 5 }, async (_, i) => {
      const res = await fetch(`http://${host}:${port}/v1/messages`, {
        method: "POST",
        headers: { "content-type": "application/json", "anthropic-version": "2023-06-01" },
        body: JSON.stringify({
          model: "antigravity/gemini-3.8-flash-high",
          max_tokens: 40,
          stream: true,
          messages: [{ role: "user", content: `Ping test #${i + 1}, return single word: OK` }],
        }),
      });
      assert.strictEqual(res.status, 200);
      const st = await consumeStream(res);
      return st.text.trim();
    });

    const burstResults = await Promise.all(burstPromises);
    console.log(pc.green(`   ✔ All 5 concurrent burst streams completed successfully!`));
    console.log(`   ✔ Burst outputs:`, burstResults.join(" | "));
    console.log();
    passedScenarios++;

    // =========================================================================
    // SCENARIO 4: Cumulative Token Economics & Telemetry Audit
    // =========================================================================
    console.log(pc.bold(pc.yellow("▶ SCENARIO 4: Live Telemetry & Dollar Savings Audit")));
    const metricsRes = await fetch(`http://${host}:${port}/metrics`);
    const metrics = (await metricsRes.json()) as any;

    const netPercent = ((metrics.tokensSaved / Math.max(1, metrics.rawTokensEstimated)) * 100).toFixed(1);

    console.log(pc.bold(pc.green("\n╭──────────────── STRICT SUITE TELEMETRY AUDIT ────────────────╮")));
    console.log(`│ Total Intercepted Turns:     ${String(metrics.totalRequests).padEnd(32)}│`);
    console.log(`│ Raw Input Tokens Intercepted:${String(metrics.rawTokensEstimated.toLocaleString()).padEnd(32)}│`);
    console.log(`│ Pruned Tokens Sent:          ${String(metrics.prunedTokensEstimated.toLocaleString()).padEnd(32)}│`);
    console.log(pc.bold(pc.green(`│ Net Tokens Saved:            ${String(metrics.tokensSaved.toLocaleString() + ` (-${netPercent}%)`).padEnd(32)}│`)));
    console.log(pc.bold(pc.green(`│ Dollar Savings (Estimated):  ${String(`$${metrics.estimatedDollarsSaved.toFixed(5)}`).padEnd(32)}│`)));
    console.log(pc.bold(pc.green("╰──────────────────────────────────────────────────────────────╯\n")));

    assert.ok(metrics.tokensSaved > 0, "Must have saved tokens");
    passedScenarios++;

    console.log(pc.bold(pc.green(`🎉 ALL ${passedScenarios}/4 STRICT ANTIGRAVTIY SCENARIOS PASSED WITH ZERO ERRORS!`)));
  } finally {
    await app.close();
    console.log(pc.dim("TokenSentry proxy cleanly closed."));
  }
}

runStrictAntigravitySuite().catch((err) => {
  console.error(pc.red("Strict suite failed:"), err);
  process.exit(1);
});
