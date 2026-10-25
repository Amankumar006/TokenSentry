import type { AnthropicRequest, AnthropicContentBlock } from "../types.js";
export interface CacheAnalysis {
    isCacheable: boolean;
    prefixLength: number;
    safeToPruneBlocks: Array<{
        messageIndex: number;
        blockIndex: number;
        block: AnthropicContentBlock;
    }>;
}
/**
 * CacheGuard ensures that TokenSentry NEVER mutates historical conversation turns.
 * Anthropic Prompt Caching requires strict byte-for-byte prefix matching.
 * Any modification to historical messages invalidates the 90% discount.
 */
export declare class CacheGuard {
    /**
     * Analyzes an incoming Anthropic request to isolate the immutable prefix
     * from ephemeral incoming tool results in the current turn.
     */
    static analyzeRequest(req: AnthropicRequest): CacheAnalysis;
    /**
     * Estimates token count using standard 4 characters per token heuristic.
     */
    static estimateTokens(text: string): number;
}
