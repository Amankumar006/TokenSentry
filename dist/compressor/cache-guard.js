/**
 * CacheGuard ensures that TokenSentry NEVER mutates historical conversation turns.
 * Anthropic Prompt Caching requires strict byte-for-byte prefix matching.
 * Any modification to historical messages invalidates the 90% discount.
 */
export class CacheGuard {
    /**
     * Analyzes an incoming Anthropic request to isolate the immutable prefix
     * from ephemeral incoming tool results in the current turn.
     */
    static analyzeRequest(req) {
        const messages = req.messages || [];
        const safeToPruneBlocks = [];
        if (messages.length === 0) {
            return { isCacheable: false, prefixLength: 0, safeToPruneBlocks: [] };
        }
        // Only inspect the final turn (messages[messages.length - 1])
        // All previous turns (0 to messages.length - 2) MUST remain bit-identical.
        const lastMessageIndex = messages.length - 1;
        const lastMessage = messages[lastMessageIndex];
        if (Array.isArray(lastMessage.content)) {
            lastMessage.content.forEach((block, blockIndex) => {
                // Safe to prune: fresh tool_result blocks returning raw source code or large text
                if (block.type === "tool_result" && typeof block.content === "string") {
                    safeToPruneBlocks.push({
                        messageIndex: lastMessageIndex,
                        blockIndex,
                        block,
                    });
                }
            });
        }
        return {
            isCacheable: true,
            prefixLength: messages.length - 1,
            safeToPruneBlocks,
        };
    }
    /**
     * Estimates token count using standard 4 characters per token heuristic.
     */
    static estimateTokens(text) {
        if (!text)
            return 0;
        return Math.ceil(text.length / 4);
    }
}
//# sourceMappingURL=cache-guard.js.map