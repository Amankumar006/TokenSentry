# 07. TokenSentry Technical Specification & Architecture

> **Document Type:** Systems Architecture & Technical Specification  
> **Status:** Active Flagship Project (Phase 1)  
> **Target Release:** v0.1.0-alpha  
> **Target Ecosystem:** Claude Code, Cursor, Cline, Aider, OpenCode  

---

## 1. Executive Problem Statement: The Token Compression Paradox

### 1.1 The Coding Agent Economics
Autonomous coding agents (such as Claude Code, Cursor, and Cline) operate across long multi-turn sessions. In a typical 30-turn session:
- The context window grows from 10,000 to over 150,000 tokens as the agent reads source files, inspection outputs, and terminal logs.
- Over **75% of context consists of peripheral source code**: unchanged library files, uncalled class methods, helper routines, and boilerplate imports.
- Developers face two acute daily bottlenecks:
  1. **Cost Excursions:** Large sessions burn millions of tokens, resulting in $15–$50+ daily costs.
  2. **Per-Minute Rate Limits (`HTTP 429`):** Breaching tier limits (e.g. Anthropic's 40,000–80,000 tokens-per-minute rate caps) halts development workflows mid-stride.

### 1.2 The "Compression Paradox" (Why Existing Tools Fail)
Early token reduction utilities (e.g. regex compressors, RTK, Tamp) attempt aggressive text minification, line deduplication, or dynamic prompt rewriting across the conversation history.

However, modern frontier models (Claude 3.5/3.7 Sonnet, Gemini 1.5/2.5 Pro) incorporate **Prompt Caching** with massive price discounts:
- **Anthropic Claude 3.5/3.7 Sonnet:**
  - Base Uncached Input: **$3.00 per million tokens**
  - Cache Read (Hit): **$0.30 per million tokens (90% discount!)**
  - Cache Write (5-minute TTL): **$3.75 per million tokens**
- **The Failure Mode:**
  Prompt caching requires an **exact, byte-for-byte prefix match**. When a tool dynamically rewrites historical conversation turns, it **invalidates the cache prefix**:
  
  $$\text{Cost}_{\text{naive}} = 100,000 \text{ tokens} \times 0.70 \text{ (30\% compressed)} \times \$3.00/\text{M} = \$0.210/\text{turn}$$
  
  $$\text{Cost}_{\text{cached}} = 100,000 \text{ tokens} \times \$0.30/\text{M (90\% cache hit)} = \$0.030/\text{turn}$$

*Result:* By breaking the prompt cache, naive compression tools actually make requests **7x more expensive** than leaving the context uncompressed!

---

## 2. The Core Invariants of TokenSentry

`TokenSentry` is engineered around three non-negotiable architectural invariants:

```
┌─────────────────────────────────────────────────────────────────┐
│ Invariant 1: Prefix Immutability (100% Cache Preservation)       │
│ • Historical messages (turns 0 to N-1) are NEVER mutated.       │
│ • System prompt prefix and active tool schemas stay bit-identical│
│ • Guarantees 90% Anthropic prompt cache discount on every turn. │
├─────────────────────────────────────────────────────────────────┤
│ Invariant 2: Ephemeral AST Skeletonization                      │
│ • Tree-Sitter parsing operates ONLY on fresh, incoming file     │
│   payloads and tool execution outputs in turn N.                │
│ • Collapses uncalled function/method bodies into type signatures│
│ • Preserves all exports, interfaces, type definitions, & docstrings
├─────────────────────────────────────────────────────────────────┤
│ Invariant 3: Adaptive Subtask Offloading (Free-Tier LPUs)       │
│ • Non-generative operational turns (file grep, directory listing│
│   syntax validation) are routed to FREE Groq Llama-3.3-70B      │
│   or Gemini 2.5 Flash free tiers.                               │
│ • Expensive frontier models are reserved for code synthesis.    │
└─────────────────────────────────────────────────────────────────┘
```

---

## 3. System Architecture & Request Lifecycle

```
┌────────────────────────────────────────────────────────┐
│ Client (Claude Code / Cursor / Aider / Cline)          │
└───────────────────────────┬────────────────────────────┘
                            │ HTTP POST (SSE Stream)
                            │ localhost:8080/v1/messages OR /v1/chat/completions
                            ▼
┌────────────────────────────────────────────────────────┐
│ TokenSentry Local Proxy Daemon                         │
│                                                        │
│  ├─ Phase 1: Request Interception & Format Inspection  │
│  │   • Normalizes Anthropic vs OpenAI request shapes   │
│  │   • Checks Cache Breakpoints (`cache_control`)      │
│  │                                                     │
│  ├─ Phase 2: Turn Intent Classifier                    │
│  │   • Operational Discovery Turn ──► Route to Free LPU│
│  │   • Synthesis / Edit Turn      ──► Route to Frontier│
│  │                                                     │
│  ├─ Phase 3: Ephemeral AST Pruner (Turn N Only)        │
│  │   • Detects code blocks in latest user/tool result  │
│  │   • Tree-Sitter AST folding (TS, JS, Py, Go, Rust)  │
│  │   • Generates skeletonized representation           │
│  │                                                     │
│  ├─ Phase 4: Upstream Dispatch & Streaming Relay       │
│  │   • Zero-latency HTTP/2 or HTTP/1.1 SSE pipe        │
│  │   • Telemetry recorder logs tokens & latency delta  │
└───────────────────────────┬────────────────────────────┘
                            │
              ┌─────────────┴─────────────┐
              ▼                           ▼
      FREE LPU Endpoints          Frontier Model APIs
 (Groq Llama-3.3 / Gemini Flash) (Claude 3.7 / GPT-4o)
```

---

## 4. Deep Dive: Tree-Sitter AST Skeletonization

### 4.1 The Mechanism
When an agent reads a 600-line file to edit a single 20-line function, 90% of the token payload is dead weight. However, standard LLM reasoning requires understanding the file's surrounding architecture (what functions exist, what types they take, what exports are available).

`TokenSentry` executes **AST Skeletonization**:
1. Uses `web-tree-sitter` (WebAssembly) to generate an Abstract Syntax Tree of the target source file in memory (<3ms).
2. Traverses the AST and identifies:
   - Export declarations
   - Type aliases, interfaces, and structs
   - Function & class method signatures
   - JSDoc / docstring comments
3. Replaces non-target function bodies with a deterministic folded comment:

#### Example: Original TypeScript Context (45 lines, ~320 tokens)
```typescript
/**
 * Processes database batch transactions with retries.
 */
export async function executeBatch(
  pool: DatabasePool,
  transactions: TransactionItem[],
  options: BatchOptions
): Promise<BatchResult> {
  const connection = await pool.acquire();
  const results: TransactionItem[] = [];
  try {
    for (const item of transactions) {
      const sanitized = sanitizeInput(item);
      const res = await connection.query(sanitized.sql, sanitized.params);
      results.push(res);
      if (options.delayMs) await sleep(options.delayMs);
    }
    return { success: true, count: results.length, data: results };
  } catch (err) {
    logger.error("Batch failure", err);
    throw new BatchExecutionError(err);
  } finally {
    pool.release(connection);
  }
}
```

#### Skeletonized Output Forwarded to Model (6 lines, ~45 tokens — 86% Reduction)
```typescript
/**
 * Processes database batch transactions with retries.
 */
export async function executeBatch(
  pool: DatabasePool,
  transactions: TransactionItem[],
  options: BatchOptions
): Promise<BatchResult>; /* [folded by TokenSentry: 22 lines omitted] */
```

**Outcome:** The model retains 100% semantic knowledge of `executeBatch`, its types, and its purpose, while saving over 270 tokens on that single function definition.

---

## 5. Deep Dive: Subtask Classifier & Free-Tier Fallback

### 5.1 Classification Matrix
Not all agent turns require a $15/M token frontier model. `TokenSentry` inspects the active turn tools and prompt intent:

| Turn Type | Trigger Pattern | Upstream Target | Cost / M Tokens |
| :--- | :--- | :--- | :--- |
| **File Discovery** | `tool_use: grep`, `glob`, `find_files`, `list_dir` | **Groq LPU (Llama-3.3-70B)** | **$0.00 (Free Tier)** |
| **Syntax / Lint** | `tool_use: run_test`, `check_types`, `read_lint` | **Google Gemini 2.5 Flash** | **$0.00 (Free Tier)** |
| **Code Synthesis** | `tool_use: edit_file`, `write_file`, reasoning turns | **Claude 3.7 Sonnet / GPT-4o** | **$0.30 (Cached) / $3.00** |

### 5.2 Provider Free Tiers
- **Groq LPU Cloud (Free Tier):**
  - 30 requests/minute (RPM), 6,000 tokens/minute (TPM) on `llama-3.3-70b-versatile`.
  - Sub-300ms time-to-first-token (TTFT). Ideal for grep analysis and discovery tasks.
- **Google AI Studio (Gemini 2.5 Flash Free Tier):**
  - 15 requests/minute (RPM), 1,000,000 tokens/minute (TPM).
  - 1M token context window. Ideal for large repository scanning and diagnostic log reviews.

---

## 6. Developer Experience & Quickstart

Zero configuration is the primary growth driver:

### 6.1 Installation
```bash
# Global install or instant execution
npx tokensentry start
```

### 6.2 Agent Configuration (One-Line Setup)

#### For Claude Code CLI:
```bash
export ANTHROPIC_BASE_URL="http://localhost:8080"
claude
```

#### For Cursor / Cline / Aider:
```bash
export OPENAI_BASE_URL="http://localhost:8080/v1"
```

### 6.3 Live Terminal Telemetry (TUI)
```text
╭─── TokenSentry v0.1.0 ───────────────────────────────────────────────╮
│ Status: LISTENING on http://localhost:8080 (PID: 84920)              │
│ Active Provider: Anthropic + Groq Free LPU Fallback                  │
├──────────────────────────────────────────────────────────────────────┤
│ SESSION METRICS                                                      │
│ • Requests Intercepted:  48          • Cache Hit Rate:   92.4%       │
│ • Raw Input Tokens:      824,000     • Pruned Input:     312,000     │
│ • Tokens Saved:          512,000     • Token Reduction:  62.1%       │
│ • Estimated Cost Saved:  $6.84       • Added Latency:    +3.2ms      │
├──────────────────────────────────────────────────────────────────────┤
│ LIVE EVENT LOG                                                       │
│ [14:42:01] POST /v1/messages ──► AST Pruned (auth.ts: -74%) ──► Sonnet│
│ [14:42:15] POST /v1/messages ──► Subtask: grep ──► Routed to Free Groq│
│ [14:42:28] POST /v1/messages ──► Prompt Cache Hit (90% discount)     │
╰──────────────────────────────────────────────────────────────────────╯
```

---

## 7. Project Directory Structure

```text
tokensentry/
├── package.json               # Fastify/Hono, web-tree-sitter, ink (TUI)
├── tsconfig.json              # Modern NodeNext ESM config
├── bin/
│   └── tokensentry.ts         # CLI entrypoint executable
├── src/
│   ├── server.ts              # Local HTTP & SSE reverse proxy server
│   ├── config.ts              # User settings (~/.tokensentry/config.json)
│   ├── compressor/
│   │   ├── engine.ts          # Orchestrator for token compression
│   │   ├── tree-sitter.ts     # WASM Tree-sitter AST parser & skeletonizer
│   │   ├── languages/         # Language grammar definitions (TS, Py, Go)
│   │   └── cache-guard.ts     # Prompt cache boundary protector
│   ├── router/
│   │   ├── classifier.ts      # Turn intent classifier (Discovery vs Edit)
│   │   ├── groq.ts            # Free Groq LPU adapter
│   │   └── gemini.ts          # Free Gemini Flash adapter
│   ├── telemetry/
│   │   ├── store.ts           # Local SQLite database for session stats
│   │   └── tui.tsx            # Terminal dashboard interface (Ink/Blessed)
│   └── utils/
│       ├── stream.ts          # Zero-copy SSE stream transformer
│       └── sse-parser.ts      # Server-Sent Events parser
└── tests/
    ├── proxy.test.ts          # Forwarding & streaming tests
    ├── ast-folding.test.ts    # Tree-Sitter token reduction tests
    └── cache-preserve.test.ts # Byte-level cache prefix verification
```

---

## 8. Milestone Roadmap

- [ ] **Sprint 1 (Days 1–2):** Reverse Proxy Core with Streaming SSE support for Anthropic `/v1/messages` and OpenAI `/v1/chat/completions`.
- [ ] **Sprint 2 (Days 3–4):** Tree-Sitter AST Skeletonization for TypeScript, JavaScript, and Python. Cache-prefix preservation verification.
- [ ] **Sprint 3 (Day 5):** Groq LPU & Gemini Flash free-tier subtask routing.
- [ ] **Sprint 4 (Day 6):** Terminal UI dashboard and single-command CLI packaging (`npx tokensentry start`).
- [ ] **Sprint 5 (Day 7):** Launch assets: automated benchmarks, terminal demo recording (`vhs`), and Hacker News `Show HN` publication.
