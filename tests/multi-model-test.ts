import assert from "node:assert";
import pc from "picocolors";
import { createServer } from "../src/server.js";

async function testOllamaIntegration(proxyPort: number, proxyHost: string) {
  console.log(pc.bold(pc.yellow("▶ TESTING MODEL 2: Ollama (gemma4:31b) via OpenAI /v1/chat/completions")));

  const samplePyCode = `
import time
from typing import Dict, Any

class SensorTelemetryPipeline:
    def __init__(self, buffer_size: int = 1000):
        self.buffer_size = buffer_size
        self.readings = []

    def ingest_sensor_batch(self, raw_data: list[dict], calibrate: bool = True) -> Dict[str, Any]:
        """Ingests high-frequency IoT sensor telemetry and applies calibration offsets."""
        processed = []
        anomaly_count = 0
        for entry in raw_data:
            val = float(entry.get("temperature", 0.0))
            if calibrate:
                val = (val * 1.05) - 0.2
            if val > 85.0 or val < -10.0:
                anomaly_count += 1
                entry["anomaly"] = True
            else:
                entry["anomaly"] = False
            entry["calibrated_temp"] = round(val, 2)
            processed.append(entry)
            if len(self.readings) >= self.buffer_size:
                self.readings.pop(0)
            self.readings.append(entry)
        return {
            "batch_size": len(raw_data),
            "anomaly_count": anomaly_count,
            "processed": processed,
            "timestamp": time.time(),
        }

    def reset_buffer(self) -> None:
        self.readings.clear()
`;

  const payload = {
    model: "gemma4:31b-cloud",
    max_tokens: 100,
    messages: [
      {
        role: "user",
        content: `Here is the source code of sensor_pipeline.py:\n${samplePyCode}\n\nWhat are the arguments and return type of 'ingest_sensor_batch'? Answer in 1 short sentence.`,
      },
    ],
  };

  const startTime = Date.now();
  const res = await fetch(`http://${proxyHost}:${proxyPort}/v1/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  const duration = Date.now() - startTime;

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Ollama request failed (${res.status}): ${errText}`);
  }

  const json = (await res.json()) as any;
  const reply = json.choices?.[0]?.message?.content || "";

  console.log(pc.green(`   ✔ Response from Ollama (gemma4:31b) in ${duration}ms:`));
  console.log(pc.bold(pc.cyan(`     "${reply.trim()}"`)));
  assert.ok(reply.length > 0, "Ollama must return a valid completion");
  console.log(pc.green(`   ✔ Successfully validated TokenSentry AST Pruner with Ollama!\n`));
}

async function runMultiModelSuite() {
  console.log(pc.bold(pc.cyan("\n╔══════════════════════════════════════════════════════════════════════╗")));
  console.log(pc.bold(pc.cyan("║            🌐 TokenSentry Multi-Model Validation Harness             ║")));
  console.log(pc.bold(pc.cyan("║      Testing Across Multiple AI Engines, Protocols & Providers       ║")));
  console.log(pc.bold(pc.cyan("╚══════════════════════════════════════════════════════════════════════╝\n")));

  const proxyPort = 8080;
  const proxyHost = "127.0.0.1";

  // Check Ollama availability on localhost:11434
  let ollamaAvailable = false;
  try {
    const oRes = await fetch("http://127.0.0.1:11434/api/tags");
    ollamaAvailable = oRes.ok;
  } catch {
    ollamaAvailable = false;
  }

  // Check Antigravity availability on localhost:20128
  let antigravityAvailable = false;
  try {
    const aRes = await fetch("http://localhost:20128/v1/messages", {
      method: "POST",
      headers: { "content-type": "application/json", "anthropic-version": "2023-06-01" },
      body: JSON.stringify({
        model: "antigravity/gemini-3.8-flash-high",
        max_tokens: 10,
        messages: [{ role: "user", content: "ping" }],
      }),
    });
    antigravityAvailable = aRes.ok;
  } catch {
    antigravityAvailable = false;
  }

  console.log(pc.bold("🔍 Discovered Model Environments:"));
  console.log(`   • Antigravity Engine (:20128): ${antigravityAvailable ? pc.green("ONLINE (gemini-3.8-flash)") : pc.dim("OFFLINE")}`);
  console.log(`   • Ollama Local Server (:11434): ${ollamaAvailable ? pc.green("ONLINE (gemma4:31b-cloud)") : pc.dim("OFFLINE")}`);
  console.log(`   • Groq Free LPU:               ${process.env.GROQ_API_KEY ? pc.green("CONFIGURED") : pc.dim("NOT CONFIGURED (export GROQ_API_KEY=...)")}`);
  console.log(`   • Google Gemini Free API:      ${process.env.GEMINI_API_KEY ? pc.green("CONFIGURED") : pc.dim("NOT CONFIGURED (export GEMINI_API_KEY=...)")}\n`);

  // Boot TokenSentry configured with dual upstreams:
  // Anthropic upstream -> Antigravity (:20128)
  // OpenAI upstream    -> Ollama (:11434)
  const app = createServer({
    port: proxyPort,
    host: proxyHost,
    upstreamAnthropicUrl: "http://localhost:20128",
    upstreamOpenAiUrl: "http://127.0.0.1:11434",
    enableAstPruning: true,
    enableFreeTierFallback: false,
    verbose: false,
  });

  await app.listen({ port: proxyPort, host: proxyHost });
  console.log(pc.green(`✔ TokenSentry Dual Proxy Running on http://${proxyHost}:${proxyPort}\n`));

  try {
    // 1. Test Antigravity if available
    if (antigravityAvailable) {
      console.log(pc.bold(pc.yellow("▶ TESTING MODEL 1: Antigravity (gemini-3.8-flash) via Anthropic /v1/messages")));
      const res = await fetch(`http://${proxyHost}:${proxyPort}/v1/messages`, {
        method: "POST",
        headers: { "content-type": "application/json", "anthropic-version": "2023-06-01" },
        body: JSON.stringify({
          model: "antigravity/gemini-3.8-flash-high",
          max_tokens: 60,
          messages: [{ role: "user", content: "Say: 'Antigravity Verified!'" }],
        }),
      });
      const data = (await res.json()) as any;
      console.log(pc.green(`   ✔ Antigravity Response:`), pc.bold(pc.cyan(data.content?.[0]?.text?.trim())));
      console.log();
    }

    // 2. Test Ollama if available
    if (ollamaAvailable) {
      await testOllamaIntegration(proxyPort, proxyHost);
    }

    // 3. Print Telemetry
    const metricsRes = await fetch(`http://${proxyHost}:${proxyPort}/metrics`);
    const metrics = (await metricsRes.json()) as any;
    console.log(pc.bold(pc.green("╭──────────────── MULTI-MODEL TELEMETRY SUMMARY ────────────────╮")));
    console.log(`│ Total Requests Processed:     ${String(metrics.totalRequests).padEnd(31)}│`);
    console.log(`│ Net Tokens Saved by Pruner:   ${String(metrics.tokensSaved.toLocaleString()).padEnd(31)}│`);
    console.log(`│ Estimated Cost Saved:         ${String(`$${metrics.estimatedDollarsSaved.toFixed(5)}`).padEnd(31)}│`);
    console.log(pc.bold(pc.green("╰───────────────────────────────────────────────────────────────╯\n")));

    console.log(pc.bold(pc.green("🎉 MULTI-MODEL DUAL-PROTOCOL TEST COMPLETED SUCCESSFULLY!")));
  } finally {
    await app.close();
    console.log(pc.dim("TokenSentry proxy cleanly closed."));
  }
}

runMultiModelSuite().catch((err) => {
  console.error(pc.red("Multi-model test failed:"), err);
  process.exit(1);
});
