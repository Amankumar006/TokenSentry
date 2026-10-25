import type { AnthropicRequest, OpenAiRequest, TurnClassification } from "../types.js";
/**
 * Classifier evaluates the intent of an agent turn to determine whether it can
 * safely be offloaded to a fast, free-tier LPU (e.g. Groq Llama-3.3-70B or Gemini Flash)
 * or requires a frontier reasoning model (Claude Sonnet / GPT-4o).
 */
export declare class TurnClassifier {
    static classifyAnthropic(req: AnthropicRequest, hasFreeTierConfigured: boolean): TurnClassification;
    static classifyOpenAI(req: OpenAiRequest, hasFreeTierConfigured: boolean): TurnClassification;
}
