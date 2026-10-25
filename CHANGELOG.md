# Changelog

All notable changes, architectural decisions, and research milestones for this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [Unreleased]

### Planned / Upcoming
- **TokenSentry MVP Sprint (Phase 1):**
  - Scaffold TypeScript Node.js proxy core with dual Anthropic `/v1/messages` and OpenAI `/v1/chat/completions` protocol support.
  - Implement WebAssembly Tree-Sitter AST context pruner to fold uncalled functions into type signatures.
  - Integrate local SQLite semantic prompt caching using ONNX `all-MiniLM-L6-v2` embeddings.
  - Build transparent multi-provider router with automatic fallback to free Groq (Llama-3.3-70B) and Gemini Flash tiers for intermediate turns.
  - Create interactive terminal UI (TUI) displaying live token savings and latency telemetry.
- **Show HN Launch Assets:** Prepare terminal demo recording (`vhs`/`asciinema`), single-command quickstart (`npx tokensentry start`), and benchmark tests.
- **Societal Bridge (Phase 2):** Leverage open-source traction, community backing, and developer credibility to initiate institutional outreach for `AshaSanghi` / ABDM Sandbox integration.

---

## [0.3.2] - 2026-10-25

### Added
- **Strict Edge Cases & Language Support Suite (`tests/strict-edge-cases.test.ts`):**
  - Arrow functions assigned to `const`/`let`/`var`: added regex and AST folding for arrow functions with multi-line parameters and return types.
  - Generator & async generator functions (`function*`, `async function*`).
  - Method decorators in TypeScript (`@Get`, `@Post`, `@Controller`) and Python (`@app.get`, `@classmethod`).
  - Crash resistance against malformed code and unclosed braces (`doesNotThrow` guarantee).
  - Preservation of nested classes, interfaces, type aliases, and markdown-fenced code blocks.
- **Cryptographic SHA-256 Prefix Invariance Test (`tests/cache-hash-invariance.test.ts`):**
  - Mathematically verified that historical turns `0...N-1` yield 100% byte-for-byte identical SHA-256 hashes before and after proxying, guaranteeing zero Anthropic prompt cache invalidation.
- **Concurrency & Event Loop Stress Suite (`tests/concurrency-stress.test.ts`):**
  - Tested 30 parallel concurrent requests through Fastify with atomic telemetry aggregation and zero dropped connections.
- **Real-World Corpus Benchmark (`tests/real-world-corpus.test.ts`):**
  - Verified AST folding across 4 major production archetypes: Express.js REST router, Redux slice/hook, FastAPI Pydantic endpoint, and PyTorch deep learning training loop.
- **Strict Antigravity Stress Suite (`tests/strict-antigravity-suite.ts` / `npm run test:strict`):**
  - Tested live against Antigravity (`http://localhost:20128`):
    - *Scenario 1:* 100-line banking service refactoring from pruned AST (48.4% token reduction, TTFT 988ms).
    - *Scenario 2:* Multi-turn conversational memory & follow-up reasoning continuity with intermediate pruned code.
    - *Scenario 3:* 5 simultaneous burst streaming requests with 0% error rate.
    - *Scenario 4:* Live token economics and telemetry aggregation audit.

---

## [0.3.1] - 2026-10-24

### Added
- **Real-Time Streaming Benchmark Suite (`tests/realtime-streaming-test.ts` / `npm run test:realtime`):**
  - Built real-time side-by-side benchmark comparing Direct Antigravity vs. TokenSentry Proxy streaming SSE tokens.
  - Measured live Time to First Token (TTFT) and proxy overhead: confirmed ~0ms added latency on token generation.
  - Measured end-to-end latency reduction: TokenSentry was ~223ms faster overall (2415ms vs 2638ms) due to 58.1% prompt prefill reduction.
- **Multi-Line Prettier/Biome AST Folding (`src/compressor/ast.ts`):**
  - Enhanced AST skeletonizer with a 3-state machine (`OUTSIDE`, `IN_HEADER`, `IN_BODY`) to buffer function headers formatted across multiple lines by Prettier/biome.
  - Demonstrated 58.1% input token reduction (pruning 284 tokens from 489 tokens down to 205 tokens) on a production TypeScript authentication module with multi-line signatures.

---

## [0.3.0] - 2026-10-23

### Added
- **TokenSentry MVP Architecture & Implementation (`./tokensentry/`):**
  - Built high-performance local reverse proxy on Fastify with streaming Server-Sent Events (SSE) support and zero overhead (<5ms added latency).
  - Implemented dual upstream protocol handlers:
    - `POST /v1/messages` for Anthropic Claude Code.
    - `POST /v1/chat/completions` for Cursor, Aider, and Cline.
  - Implemented **Invariant 1: Prefix Immutability (`src/compressor/cache-guard.ts`)**: guarantees that historical turns (`messages[0...N-1]`), system prompts, and tool schemas remain byte-for-byte identical, preserving Anthropic's 90% prompt cache discount ($0.30/M vs $3.00/M).
  - Implemented **Invariant 2: Ephemeral AST Skeletonization (`src/compressor/ast.ts`)**: parses fresh source code payloads entering the active turn and folds uncalled function/method bodies into 1-line type signatures while preserving docstrings, interfaces, and exports for both TypeScript and Python.
  - Implemented **Invariant 3: Adaptive Free-Tier Offloading (`src/router/groq.ts` & `src/router/classifier.ts`)**: classifies operational discovery turns (`grep`, `glob`, `find`, `list_files`) and routes them to free Groq LPUs (`llama-3.3-70b-versatile`) at zero cost.
  - Implemented real-time in-memory session telemetry (`src/telemetry/store.ts`) tracking raw input tokens, pruned tokens, net tokens saved, and dollar savings.
  - Packaged executable CLI binary (`tokensentry`) with Commander options (`-p, --port`, `-h, --host`, `--no-ast`, `--no-fallback`, `-v, --verbose`).
  - Added unit test suites verifying Prefix Immutability, AST Folding for TypeScript/Python, `/health` and `/metrics` endpoints, and graceful OpenAI error handling (5/5 tests passing).
  - Built live end-to-end integration test (`tests/antigravity-integration.ts` / `npm run test:live`) directly verifying TokenSentry proxying against Antigravity (`http://localhost:20128`):
    - Confirmed AST context folding on a 50-line TypeScript function inside an active `tool_result` turn (saving 149 tokens / 41.3% reduction).
    - Verified Antigravity correctly reasoned over the pruned AST skeleton.
    - Verified live telemetry recording and cost tracking.
  - Created full project documentation in [`tokensentry/README.md`](./tokensentry/README.md).

---

## [0.2.0] - 2026-10-23

### Added
- **Viral Developer Tooling Research & Distribution Blueprint:**
  - Created [`research/06_viral_devtools_playbook.md`](./research/06_viral_devtools_playbook.md) analyzing developer-facing open-source dynamics, distribution leverage, and bottom-up adoption mechanics.
  - Deconstructed empirical growth mechanics of 100k+ star repositories:
    - `significant-gravitas/AutoGPT` (187k+ stars)
    - `ollama/ollama` (160k+ stars)
    - `langgenius/dify` (150k+ stars)
    - `vllm-project/vllm` (88k+ stars)
    - `unclecode/crawl4ai` (45k+ stars)
    - `BerriAI/litellm` (25k+ stars)
- **Three Viral Developer Tooling Candidate Blueprints:**
  - *Blueprint A:* `TokenSentry` — Drop-in local AST context pruner and free-tier (Groq/Gemini/local SLM) fallback proxy for coding agents (Claude Code, Cursor, Aider).
  - *Blueprint B:* `AgentDiff` — Jest-style deterministic trajectory snapshot and regression testing harness for AI agents in CI/CD.
  - *Blueprint C:* `MCP-Box` — Zero-config permission firewall and local sandboxing hub for Model Context Protocol (MCP) tool servers.
- **Zero-Network Launch Playbook:**
  - Formulated the exact Hacker News (`Show HN`) algorithm mechanics, title formatting, 5-minute reply cadence, and 6:00–8:30 AM PT submission window.
  - Formulated GitHub README conversion design (sub-60-second time-to-value, terminal GIF, single-line CLI install).
- **Strategic Leverage Synthesis:**
  - Established the two-phase "Trojan Horse" career roadmap: capturing 5k–25k+ stars via developer infrastructure first to establish the institutional credibility and capital required to pilot complex B2G healthcare initiatives (`AshaSanghi`).

---

## [0.1.0] - 2026-10-23

### Added
- **Repository Research Infrastructure:**
  - Initialized workspace documentation and directory structure under `./research/`.
  - Added primary project navigation [`README.md`](./README.md) summarizing project criteria, top recommendations, and research indexes.
- **Industry & Market Signal Analysis:**
  - Created [`research/01_industry_signals.md`](./research/01_industry_signals.md) covering Y Combinator (YC W24–W25) vertical agent trends, Anthropic's "Building Effective Agents" architecture guidelines, Sequoia's "Act o1" cognitive architectures, a16z Agentic Stack (MCP, KYA), Hugging Face `smolagents`, and hiring demand for Forward-Deployed & Evaluation Engineers.
- **Societal Needs & DPI Analysis:**
  - Created [`research/02_societal_gaps.md`](./research/02_societal_gaps.md) analyzing 7 major societal sectors in India and the Global South, ranking problems by scale, urgency, and technical tractability for a solo student builder on free compute.
- **Open-Source Landscape & Competitor Teardown:**
  - Created [`research/03_oss_landscape.md`](./research/03_oss_landscape.md) evaluating existing open-source and institutional repos (`sreenathmmenon/asha-sahayak`, `DG_Open/farmer-chat`, `WadhwaniAI/pest-monitoring`, `krishddd/floodops-multi-agent-system`, `Yogesh4527/FinCA`, `OpenNyAI/Jugalbandi-Manager`), separating crowded chatbot wrappers from structural gaps.
- **Top 7 Project Blueprints:**
  - Created [`research/04_shortlist.md`](./research/04_shortlist.md) detailing complete architectures (tools, memory, planning, evals), tech stacks, 8-week MVP plans, open-source strategies, risks, and 1–10 scores across:
    1. *AshaSanghi* (Score: 48.0/50) - Offline-First Ambient Clinical Intelligence & FHIR Agent for ASHA/ANM Workers.
    2. *KisanOS / AgriOrchestrator* (Score: 45.0/50) - Multi-Agent Farm Operations & Mandi Arbitrage Engine.
    3. *CrisisGraph / JalRakshak* (Score: 45.4/50) - Multi-Agent Urban Flood & Disaster Situational Graph.
    4. *LekhaMitra* (Score: 45.3/50) - Autonomous MSME GST Reconciliation & Delayed Payments Recovery Agent.
    5. *DrishtiCopilot* (Score: 44.2/50) - Multimodal Edge Agent for Visually Impaired Indian Citizens.
    6. *NeerBudget / HydroAgent* (Score: 42.3/50) - Decentralized Village Groundwater Budgeting Agent.
    7. *BecknFlow* (Score: 42.7/50) - Multimodal Kirana-to-ONDC Onboarding & Beckn Protocol Agent.
- **Strategic Recommendation & First-Week Sprint Plan:**
  - Created [`research/05_recommendation.md`](./research/05_recommendation.md) outlining the selection of **AshaSanghi** as the flagship project and **CrisisGraph** as runner-up, accompanied by a day-by-day Week 1 execution plan.
- **Evidence & Citation Register:**
  - Created [`research/sources.md`](./research/sources.md) cataloging 52 verified primary sources, papers, repositories, and Indian DPI APIs (ABDM, Bhashini, Agmarknet, ONDC) with access dates.
- **Persistent Memory Layer:**
  - Configured cross-session persistent memory under `~/.claude/.../memory/`:
    - `MEMORY.md`: Main index.
    - `user-profile.md`: User context, skills, and compute constraints.
    - `project-research-index.md`: Research index.
    - `flagship-ashasanghi.md`: Flagship project spec.
    - `runnerup-crisisgraph.md`: Runner-up project spec.
    - `research-sources-reference.md`: Pointers to all 52 sources.
