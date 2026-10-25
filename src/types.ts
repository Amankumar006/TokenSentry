export interface TokenSentryConfig {
  port: number;
  host: string;
  upstreamAnthropicUrl: string;
  upstreamOpenAiUrl: string;
  anthropicApiKey?: string;
  openaiApiKey?: string;
  groqApiKey?: string;
  geminiApiKey?: string;
  enableAstPruning: boolean;
  enableFreeTierFallback: boolean;
  enableSemanticCache: boolean;
  verbose: boolean;
}

export interface AnthropicMessage {
  role: "user" | "assistant";
  content: string | Array<AnthropicContentBlock>;
}

export interface AnthropicContentBlock {
  type: "text" | "image" | "tool_use" | "tool_result";
  text?: string;
  id?: string;
  name?: string;
  input?: Record<string, unknown>;
  tool_use_id?: string;
  content?: string | Array<unknown>;
  cache_control?: { type: "ephemeral" };
}

export interface AnthropicRequest {
  model: string;
  messages: Array<AnthropicMessage>;
  system?: string | Array<{ type: "text"; text: string; cache_control?: { type: "ephemeral" } }>;
  max_tokens: number;
  tools?: Array<Record<string, unknown>>;
  stream?: boolean;
  temperature?: number;
}

export interface OpenAiMessage {
  role: "system" | "user" | "assistant" | "tool";
  content: string | null;
  name?: string;
  tool_calls?: Array<unknown>;
  tool_call_id?: string;
}

export interface OpenAiRequest {
  model: string;
  messages: Array<OpenAiMessage>;
  tools?: Array<unknown>;
  stream?: boolean;
  temperature?: number;
  max_tokens?: number;
}

export interface TurnClassification {
  type: "discovery" | "synthesis";
  reason: string;
  suggestedProvider: "frontier" | "groq" | "gemini";
}

export interface SessionMetrics {
  totalRequests: number;
  rawTokensEstimated: number;
  prunedTokensEstimated: number;
  tokensSaved: number;
  cacheHits: number;
  estimatedDollarsSaved: number;
  startTime: number;
}
