# 🛡️ TokenSentry

> **Cache-Preserving AST Context Pruner & Free-Tier Proxy for AI Coding Agents**  
> Cut your token bills by 50–70% and eliminate `HTTP 429 Rate Limits` without breaking Anthropic's 90% prompt cache discount.

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![Node.js Version](https://img.shields.io/badge/node-%3E%3D20.0.0-brightgreen)](https://nodejs.org/)
[![Works with Claude Code](https://img.shields.io/badge/Works%20with-Claude%20Code-purple)](https://claude.ai/code)
[![Works with Cursor](https://img.shields.io/badge/Works%20with-Cursor-black)](https://cursor.com)

---

## 🚀 30-Second Quickstart

### 1. Launch the Local Proxy
```bash
npx tokensentry start
```
*TokenSentry starts listening locally on `http://127.0.0.1:8080`.*

### 2. Point Your Coding Agent to TokenSentry

#### For **Claude Code**:
```bash
export ANTHROPIC_BASE_URL="http://127.0.0.1:8080"
claude
```

#### For **Cursor / Aider / Cline**:
Set the OpenAI Base URL in your editor settings or terminal:
```bash
export OPENAI_BASE_URL="http://127.0.0.1:8080/v1"
```

---

## ⚡ The Problem: The Token Compression Paradox

AI coding agents (Claude Code, Cursor, Cline) consume millions of tokens on large codebases by resending whole files and directories on every turn.

Early token tools (RTK, Tamp) attempt to compress tokens by rewriting historical conversation messages. **This creates a catastrophic failure with modern models:**
1. **Prompt Cache Invalidation:** Anthropic Claude 3.5/3.7 and Google Gemini offer a **90% discount on cached tokens** ($0.30/M vs $3.00/M). Prompt caching requires an exact, byte-for-byte prefix match.
2. **The Math:** A tool that compresses 30% of your tokens but invalidates the prompt cache forces you to pay the full $3.00/M uncached rate—making your API calls **7x more expensive**!

```
Naive Compression:  100k tokens x 0.70 (30% compressed) x $3.00/M = $0.210 per turn
TokenSentry Cache:  100k tokens x $0.30/M (90% cache discount)   = $0.030 per turn (7x Cheaper!)
```

---

## 🛡️ How TokenSentry Solves This

TokenSentry enforces three core architectural invariants:

1. **Prefix Immutability (100% Cache Preservation):**
   * Historical conversation turns (`messages[0...N-1]`) are **never mutated**.
   * The system prompt and tool definitions stay byte-for-byte identical, guaranteeing a 90% Anthropic prompt cache hit on every turn.
2. **Ephemeral AST Skeletonization:**
   * Operates only on fresh file reads entering the latest turn.
   * Uses Abstract Syntax Tree (AST) parsing to fold uncalled function and method bodies into 1-line type signatures while keeping docstrings, interfaces, and exports intact.
3. **Adaptive Free-Tier Offloading:**
   * Non-generative operational turns (such as `grep`, `glob`, file searching, or syntax checks) are automatically routed to **free Groq LPU (Llama-3.3-70B)** or **Gemini Flash free tiers**.
   * Expensive frontier models (Claude 3.7 Sonnet) are reserved exclusively for architectural synthesis and code generation.

---

## 📊 Live Terminal Telemetry

When running, TokenSentry displays real-time token savings and cost telemetry:

```text
╭─── TokenSentry v0.1.0 ───────────────────────────────────────────────╮
│ Status: LISTENING on http://127.0.0.1:8080 (PID: 84920)              │
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

## ⚙️ Configuration (`.env` or Flags)

| Variable | Flag | Default | Description |
| :--- | :--- | :--- | :--- |
| `TOKENSENTRY_PORT` | `-p, --port` | `8080` | Local port to bind proxy |
| `TOKENSENTRY_HOST` | `-h, --host` | `127.0.0.1` | Local host to bind proxy |
| `ANTHROPIC_UPSTREAM_URL` | — | `https://api.anthropic.com` | Upstream Anthropic endpoint |
| `OPENAI_UPSTREAM_URL` | — | `https://api.openai.com` | Upstream OpenAI endpoint |
| `GROQ_API_KEY` | — | — | Optional: Free Groq LPU fallback |
| `GEMINI_API_KEY` | — | — | Optional: Free Gemini Flash fallback |
| `TOKENSENTRY_AST_PRUNING` | `--no-ast` | `true` | Toggle AST code skeletonization |

---

## 🧪 Testing

```bash
npm test
```

---

## 📜 License

MIT License © 2026 Aman Kumar
