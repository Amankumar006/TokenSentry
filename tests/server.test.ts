import test from "node:test";
import assert from "node:assert";
import { createServer } from "../src/server.js";

test("Server exposes /health and /metrics endpoints", async () => {
  const app = createServer({ verbose: false });

  const healthRes = await app.inject({
    method: "GET",
    url: "/health",
  });

  assert.strictEqual(healthRes.statusCode, 200);
  const healthJson = JSON.parse(healthRes.payload);
  assert.strictEqual(healthJson.status, "ok");
  assert.strictEqual(healthJson.name, "TokenSentry");

  const metricsRes = await app.inject({
    method: "GET",
    url: "/metrics",
  });

  assert.strictEqual(metricsRes.statusCode, 200);
  const metricsJson = JSON.parse(metricsRes.payload);
  assert.ok("totalRequests" in metricsJson);
  assert.ok("tokensSaved" in metricsJson);
});

test("Server handles OpenAI /v1/chat/completions endpoint gracefully", async () => {
  const app = createServer({ verbose: false, upstreamOpenAiUrl: "http://127.0.0.1:9999" });

  const res = await app.inject({
    method: "POST",
    url: "/v1/chat/completions",
    payload: {
      model: "gpt-4o",
      messages: [
        { role: "user", content: "Hello from Cursor" }
      ]
    }
  });

  // Upstream is unreachable in unit test, should return 502 with structured error
  assert.strictEqual(res.statusCode, 502);
  const json = JSON.parse(res.payload);
  assert.strictEqual(json.error.type, "tokensentry_upstream_error");
});

