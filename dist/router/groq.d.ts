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
export declare class GroqFreeTierAdapter {
    private static GROQ_API_URL;
    private static GROQ_MODEL;
    /**
     * Executes a discovery subtask turn on Groq LPU at zero cost.
     */
    static executeOpenAIOffload(req: OpenAiRequest, groqApiKey: string): Promise<GroqOffloadResult>;
}
