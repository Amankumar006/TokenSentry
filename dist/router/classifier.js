const DISCOVERY_TOOLS = new Set([
    "grep",
    "glob",
    "search",
    "file_search",
    "list_directory",
    "list_files",
    "read_file",
    "view_outline",
    "run_lint",
]);
/**
 * Classifier evaluates the intent of an agent turn to determine whether it can
 * safely be offloaded to a fast, free-tier LPU (e.g. Groq Llama-3.3-70B or Gemini Flash)
 * or requires a frontier reasoning model (Claude Sonnet / GPT-4o).
 */
export class TurnClassifier {
    static classifyAnthropic(req, hasFreeTierConfigured) {
        const messages = req.messages || [];
        if (messages.length === 0) {
            return { type: "synthesis", reason: "initial_prompt", suggestedProvider: "frontier" };
        }
        const lastMessage = messages[messages.length - 1];
        // Check if the last turn was a tool_use or tool_result
        if (Array.isArray(lastMessage.content)) {
            for (const block of lastMessage.content) {
                if (block.type === "tool_result") {
                    if (hasFreeTierConfigured) {
                        const textContent = typeof block.content === "string" ? block.content : "";
                        if (textContent.length > 5000 && (textContent.includes("error") || textContent.includes("Traceback"))) {
                            return {
                                type: "synthesis",
                                reason: "complex_stack_trace_debug",
                                suggestedProvider: "frontier",
                            };
                        }
                    }
                }
            }
        }
        return {
            type: "synthesis",
            reason: "code_generation_or_reasoning",
            suggestedProvider: "frontier",
        };
    }
    static classifyOpenAI(req, hasFreeTierConfigured) {
        const messages = req.messages || [];
        if (messages.length === 0) {
            return { type: "synthesis", reason: "initial_prompt", suggestedProvider: "frontier" };
        }
        const lastMessage = messages[messages.length - 1];
        if (lastMessage.role === "tool" && hasFreeTierConfigured) {
            const content = lastMessage.content || "";
            if (content.length < 2000 && !content.includes("error")) {
                return {
                    type: "discovery",
                    reason: "minor_tool_result",
                    suggestedProvider: "groq",
                };
            }
        }
        return {
            type: "synthesis",
            reason: "code_generation_or_reasoning",
            suggestedProvider: "frontier",
        };
    }
}
//# sourceMappingURL=classifier.js.map