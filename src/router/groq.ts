import type { OpenAiRequest } from "../types.js";

export interface GroqOffloadResult {
  handled: boolean;
  response?: unknown;
  modelUsed?: string;
  latencyMs?: number;
}

/**
 * GroqFreeTierAdapter handles transparent offloading of discovery subtasks
 * (grep, glob, directory searches) to free Groq LPUs running Llama-3.3-70B.
 */
export class GroqFreeTierAdapter {
  private static GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions";
  private static GROQ_MODEL = "llama-3.3-70b-versatile";

  /**
   * Executes a discovery subtask turn on Groq LPU at zero cost.
   */
  public static async executeOpenAIOffload(
    req: OpenAiRequest,
    groqApiKey: string
  ): Promise<GroqOffloadResult> {
    const startTime = Date.now();

    // Clone request and redirect to Groq model
    const groqPayload = {
      ...req,
      model: this.GROQ_MODEL,
      stream: false, // Groq LPUs respond in <300ms for discovery
    };

    try {
      const response = await fetch(this.GROQ_API_URL, {
        method: "POST",
        headers: {
          "content-type": "application/json",
          authorization: `Bearer ${groqApiKey}`,
        },
        body: JSON.stringify(groqPayload),
      });

      if (!response.ok) {
        return { handled: false };
      }

      const data = await response.json();
      return {
        handled: true,
        response: data,
        modelUsed: this.GROQ_MODEL,
        latencyMs: Date.now() - startTime,
      };
    } catch {
      return { handled: false };
    }
  }
}
