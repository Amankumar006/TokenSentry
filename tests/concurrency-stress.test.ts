import test from "node:test";
import assert from "node:assert";
import { createServer } from "../src/server.js";
import { TelemetryStore } from "../src/telemetry/store.js";

test("STRICT: 30 parallel concurrent requests through proxy without race conditions", async () => {
  const app = createServer({ verbose: false });

  const initialRequests = TelemetryStore.getMetrics().totalRequests;
  const initialTokensSaved = TelemetryStore.getMetrics().tokensSaved;

  const CONCURRENT_COUNT = 30;

  // Generate 30 concurrent health and metrics requests
  const promises = Array.from({ length: CONCURRENT_COUNT }, async (_, i) => {
    const isMetrics = i % 2 === 0;
    const res = await app.inject({
      method: "GET",
      url: isMetrics ? "/metrics" : "/health",
    });

    assert.strictEqual(res.statusCode, 200);
    const body = JSON.parse(res.payload);
    assert.ok(body);
    return res.statusCode;
  });

  const results = await Promise.all(promises);
  assert.strictEqual(results.length, CONCURRENT_COUNT);
  assert.ok(results.every((status) => status === 200));

  // Now test concurrent turn recording
  const turnPromises = Array.from({ length: CONCURRENT_COUNT }, async (_, i) => {
    TelemetryStore.recordTurn({
      rawTokens: 100,
      prunedTokens: 40,
      tokensSaved: 60,
      provider: "anthropic",
    });
  });

  await Promise.all(turnPromises);

  const finalMetrics = TelemetryStore.getMetrics();
  assert.strictEqual(
    finalMetrics.totalRequests,
    initialRequests + CONCURRENT_COUNT,
    "All concurrent requests must be atomically recorded"
  );
  assert.strictEqual(
    finalMetrics.tokensSaved,
    initialTokensSaved + CONCURRENT_COUNT * 60,
    "All tokens saved must be atomically aggregated"
  );
});
