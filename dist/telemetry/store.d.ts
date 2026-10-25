import type { SessionMetrics } from "../types.js";
export declare class TelemetryStore {
    private static metrics;
    static recordTurn(stats: {
        rawTokens: number;
        prunedTokens: number;
        tokensSaved: number;
        isCacheHit?: boolean;
        provider: string;
    }): void;
    static getMetrics(): SessionMetrics;
    static formatSummary(): string;
}
