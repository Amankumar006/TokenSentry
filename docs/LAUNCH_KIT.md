# 🚀 TokenSentry Community Launch Playbook

This kit contains submission-ready copy, timing schedules, and distribution templates for launching **TokenSentry** across Hacker News, Twitter/X, Reddit, and open-source developer channels.

---

## 1. Hacker News (Show HN)

### Target Submission Window
- **Day:** Tuesday or Wednesday
- **Time:** 6:30 AM – 7:30 AM US Pacific Time (PT) / 7:00 PM – 8:00 PM IST
- **URL:** `https://news.ycombinator.com/submit`

### Title
```text
Show HN: TokenSentry – Cache-preserving proxy for AI coding agents
```

### URL Field
```text
https://github.com/Amankumar006/TokenSentry
```

### First Comment (Post immediately after submission)
```markdown
Hi HN! I’m Aman, an AI engineering student in Bengaluru. Over the past few months of building autonomous coding agents with Claude Code and Cursor, I noticed a painful paradox in the LLM economics:

**The Prompt Compression Paradox:**
Frontier models like Claude 3.5/3.7 Sonnet and Google Gemini offer a 90% discount on cached input tokens ($0.30/M cached vs. $3.00/M uncached). But prompt caching requires a 100% byte-for-byte prefix match.

Existing token compression tools try to save money by summarizing or rewriting historical conversation turns. In doing so, they invalidate the cache prefix on every single turn! A tool that compresses 30% of your tokens but forces you to pay the full $3.00/M rate instead of $0.30/M actually makes your API calls **7x more expensive**.

I built **TokenSentry** to solve this. It’s a zero-overhead local reverse proxy designed around 3 strict invariants:

1. **Prefix Immutability (Zero Cache Misses):**
   All historical messages (0...N-1), system prompts, and tool definitions remain completely byte-for-byte untouched. We mathematically assert SHA-256 hash equality across turns. You keep your 90% Anthropic prompt cache discount 100% of the time.

2. **Ephemeral AST Skeletonization:**
   When fresh source code enters the active turn (e.g. Claude Code reading a 200-line service), TokenSentry parses the AST on the fly and folds uncalled function/method bodies into 1-line type signatures (`/* [folded by TokenSentry: 42 lines] */`). Type definitions, return types, interfaces, exports, and docstrings are preserved, so model reasoning is unaffected while saving 50–94% of raw tokens.

3. **Universal Protocol:**
   Works seamlessly with both Anthropic (`POST /v1/messages` for Claude Code) and OpenAI (`POST /v1/chat/completions` for Cursor, Aider, and Cline).

**Quickstart (No API key needed for local proxying):**
```bash
npx tokensentry start
export ANTHROPIC_BASE_URL="http://127.0.0.1:8080"
claude
```

Repo: https://github.com/Amankumar006/TokenSentry  
MIT Licensed.

Would love feedback on edge cases, language support (currently TypeScript & Python), and your experience running it with your agents!
```

---

## 2. Twitter / X Announcement Thread

### Tweet 1 (Hook + Video Demo)
> AI coding agents (Claude Code, Cursor, Aider) are burning through token budgets resending entire files on every turn.
> 
> But existing "compression" tools break Anthropic's 90% prompt cache discount—making calls 7x MORE expensive.
> 
> Introducing **TokenSentry**: A cache-preserving local AST proxy that cuts input tokens by 50–94% with 0 cache misses.
> 
> 🛡️ 100% Open Source: github.com/Amankumar006/TokenSentry
> 
> *(Attach: `assets/demo.mp4`)*

### Tweet 2 (The Technical Insight)
> Why do naive compressors fail?
> 
> Anthropic charges $0.30/M for cached tokens vs $3.00/M uncached.
> Caching requires an exact byte-for-byte prefix match.
> 
> Rewriting history to "save" 30% tokens invalidates the prefix:
> • 100k tokens x 0.70 x $3.00/M = $0.210
> • 100k tokens x $0.30/M = $0.030
> 
> You pay 7x more!

### Tweet 3 (The Solution)
> TokenSentry enforces Prefix Immutability:
> 
> 1. History (0...N-1) is SHA-256 locked.
> 2. Fresh code entering turn N is parsed into an AST skeleton.
> 3. Uncalled function bodies fold into 1-line signatures while keeping full type contracts, interfaces, and docstrings.
> 
> Zero loss in agent reasoning. 94% fewer tokens.

### Tweet 4 (Quickstart Call to Action)
> Try it in 30 seconds with your existing Claude Code or Cursor setup:
> 
> ```bash
> npx tokensentry start
> export ANTHROPIC_BASE_URL="http://127.0.0.1:8080"
> claude
> ```
> 
> ⭐ Star the repo on GitHub: github.com/Amankumar006/TokenSentry

---

## 3. Reddit Launch Plan

### Target Subreddits
1. **r/ClaudeAI** (High density of Claude Code early adopters and token cost complaints)
2. **r/LocalLLaMA** (Developers running local Ollama/vLLM proxies)
3. **r/Cursor** (Cursor users hitting 500 fast requests limits)

### Post Title Template
`I built TokenSentry: A drop-in proxy that cuts Claude Code / Cursor token bills by 50–94% without breaking prompt caching`

### Post Body
*(Adapt the Show HN first comment with emphasis on local execution and privacy: TokenSentry runs entirely on localhost `127.0.0.1:8080` with zero telemetry leaving the machine).*
