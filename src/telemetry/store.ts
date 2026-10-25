import type { SessionMetrics } from "../types.js";

export class TelemetryStore {
  private static metrics: SessionMetrics = {
    totalRequests: 0,
    rawTokensEstimated: 0,
    prunedTokensEstimated: 0,
    tokensSaved: 0,
    cacheHits: 0,
    estimatedDollarsSaved: 0,
    startTime: Date.now(),
  };

  public static recordTurn(stats: {
    rawTokens: number;
    prunedTokens: number;
    tokensSaved: number;
    isCacheHit?: boolean;
    provider: string;
  }) {
    this.metrics.totalRequests++;
    this.metrics.rawTokensEstimated += stats.rawTokens;
    this.metrics.prunedTokensEstimated += stats.prunedTokens;
    this.metrics.tokensSaved += stats.tokensSaved;
    if (stats.isCacheHit) this.metrics.cacheHits++;

    // Anthropic Sonnet base input price: $3.00 / 1M tokens ($0.000003 per token)
    // Saved dollars estimated on base uncached token savings
    this.metrics.estimatedDollarsSaved += stats.tokensSaved * 0.000003;
  }

  public static getMetrics(): SessionMetrics {
    return { ...this.metrics };
  }

  public static formatSummary(): string {
    const m = this.metrics;
    const reductionPercent = m.rawTokensEstimated > 0
      ? ((m.tokensSaved / m.rawTokensEstimated) * 100).toFixed(1)
      : "0.0";

    return [
      `Requests: ${m.totalRequests}`,
      `Raw Tokens: ${m.rawTokensEstimated.toLocaleString()}`,
      `Tokens Saved: ${m.tokensSaved.toLocaleString()} (${reductionPercent}%)`,
      `Est. Cost Saved: $${m.estimatedDollarsSaved.toFixed(3)}`,
    ].join(" | ");
  }
}
