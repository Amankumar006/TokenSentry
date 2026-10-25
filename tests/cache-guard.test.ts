import test from "node:test";
import assert from "node:assert";
import { CacheGuard } from "../src/compressor/cache-guard.js";
import type { AnthropicRequest } from "../src/types.js";

test("CacheGuard preserves historical conversation prefix", () => {
  const mockReq: AnthropicRequest = {
    model: "claude-3-7-sonnet-20250219",
    max_tokens: 1024,
    messages: [
      { role: "user", content: "Can you inspect auth.ts and fix login bug?" },
      {
        role: "assistant",
        content: [
          {
            type: "tool_use",
            id: "toolu_123",
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
            tool_use_id: "toolu_123",
            content: "export function login() {\n  return true;\n}",
          },
        ],
      },
    ],
  };

  const analysis = CacheGuard.analyzeRequest(mockReq);

  // Verifies that only the last message (index 2) is flagged for pruning
  assert.strictEqual(analysis.isCacheable, true);
  assert.strictEqual(analysis.prefixLength, 2);
  assert.strictEqual(analysis.safeToPruneBlocks.length, 1);
  assert.strictEqual(analysis.safeToPruneBlocks[0].messageIndex, 2);
  assert.strictEqual(analysis.safeToPruneBlocks[0].block.type, "tool_result");
});
