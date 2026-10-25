import test from "node:test";
import assert from "node:assert";
import crypto from "node:crypto";
import { CacheGuard } from "../src/compressor/cache-guard.js";
import { AstSkeletonizer } from "../src/compressor/ast.js";
import type { AnthropicRequest } from "../src/types.js";

function hashPrefix(messages: AnthropicRequest["messages"]): string {
  // Hash turns 0 to N-2 (all turns before the active turn)
  const prefix = messages.slice(0, -1);
  return crypto.createHash("sha256").update(JSON.stringify(prefix)).digest("hex");
}

test("STRICT: Cryptographic SHA-256 Prefix Invariance across 10-turn conversation", () => {
  const mockConversation: AnthropicRequest = {
    model: "claude-3-7-sonnet-20250219",
    max_tokens: 4096,
    system: "You are a senior TypeScript architect. Follow clean architecture strictly.",
    messages: [
      { role: "user", content: "Can you analyze our backend repository?" },
      { role: "assistant", content: "Certainly. Which directory should I inspect first?" },
      { role: "user", content: "Start with src/controllers/user.controller.ts." },
      {
        role: "assistant",
        content: [
          {
            type: "tool_use",
            id: "toolu_01",
            name: "read_file",
            input: { path: "src/controllers/user.controller.ts" },
          },
        ],
      },
      {
        role: "user",
        content: [
          {
            type: "tool_result",
            tool_use_id: "toolu_01",
            content: "export class UserController { constructor() {} }",
          },
        ],
      },
      {
        role: "assistant",
        content: "Now I need to inspect src/services/auth.service.ts to check security rules.",
      },
      {
        role: "assistant",
        content: [
          {
            type: "tool_use",
            id: "toolu_02",
            name: "read_file",
            input: { path: "src/services/auth.service.ts" },
          },
        ],
      },
      {
        role: "user",
        content: "Please hurry, we have a deployment deadline.",
      },
      {
        role: "assistant",
        content: "Understood. Reading auth.service.ts now.",
      },
      {
        // Active Turn (Index 9)
        role: "user",
        content: [
          {
            type: "tool_result",
            tool_use_id: "toolu_02",
            content: `
export class AuthService {
  public async verifyToken(token: string, secretKey: string): Promise<boolean> {
    const segments = token.split(".");
    if (segments.length !== 3) {
      return false;
    }
    const signature = segments[2];
    const computed = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(secretKey));
    return signature.length > 10;
  }
}
`,
          },
        ],
      },
    ],
  };

  // 1. Calculate SHA-256 hash of historical prefix turns BEFORE TokenSentry processing
  const prefixHashBefore = hashPrefix(mockConversation.messages);
  const systemPromptBefore = mockConversation.system;

  // 2. Execute TokenSentry CacheGuard analysis and pruning
  const analysis = CacheGuard.analyzeRequest(mockConversation);
  assert.strictEqual(analysis.isCacheable, true);
  assert.strictEqual(analysis.prefixLength, 9);
  assert.strictEqual(analysis.safeToPruneBlocks.length, 1);
  assert.strictEqual(analysis.safeToPruneBlocks[0].messageIndex, 9);

  // Apply pruning only to safe blocks in the active turn
  for (const target of analysis.safeToPruneBlocks) {
    if (typeof target.block.content === "string") {
      const folded = AstSkeletonizer.foldCode(target.block.content);
      if (folded.tokensSaved > 0) {
        target.block.content = folded.code;
      }
    }
  }

  // 3. Calculate SHA-256 hash of historical prefix turns AFTER TokenSentry processing
  const prefixHashAfter = hashPrefix(mockConversation.messages);
  const systemPromptAfter = mockConversation.system;

  // 4. Assert Mathematical 100% Prefix Invariance
  assert.strictEqual(
    prefixHashBefore,
    prefixHashAfter,
    "Prefix turns 0...N-1 must be 100% byte-for-byte identical (SHA-256 exact match)"
  );

  assert.strictEqual(
    systemPromptBefore,
    systemPromptAfter,
    "System prompt must remain 100% identical for Anthropic prompt caching"
  );
});
