import { SolverMetrics } from '../types/solver';
import { BenchmarkRun } from '../types/benchmark';

export class StatisticsHelper {
  public static calculateMedian(values: number[]): number {
    if (values.length === 0) return 0;
    const sorted = [...values].sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    if (sorted.length % 2 !== 0) {
      return sorted[mid];
    }
    return (sorted[mid - 1] + sorted[mid]) / 2;
  }

  /**
   * Menghitung Median Absolute Deviation (MAD):
   * MAD = Median(|X_i - Median(X)|)
   */
  public static calculateMAD(values: number[], median: number): number {
    if (values.length === 0) return 0;
    const absoluteDeviations = values.map(v => Math.abs(v - median));
    return this.calculateMedian(absoluteDeviations);
  }

  public static computeMetricsFromRuns(runs: BenchmarkRun[]): SolverMetrics {
    if (runs.length === 0) {
      return { totalExecutionTimeMs: 0 };
    }

    const times = runs.map(r => r.durationMs);
    const sum = times.reduce((acc, t) => acc + t, 0);
    const avg = sum / times.length;
    const min = Math.min(...times);
    const max = Math.max(...times);
    const median = this.calculateMedian(times);
    const mad = this.calculateMAD(times, median);

    const mems = runs.filter(r => r.memoryKb !== undefined).map(r => r.memoryKb!);
    const peakMem = mems.length > 0 ? Math.max(...mems) : undefined;

    const nodes = runs.filter(r => r.nodesExplored !== undefined).map(r => r.nodesExplored!);
    const avgNodes = nodes.length > 0 ? Math.round(nodes.reduce((a, b) => a + b, 0) / nodes.length) : undefined;

    return {
      totalExecutionTimeMs: parseFloat(sum.toFixed(3)),
      avgExecutionTimeMs: parseFloat(avg.toFixed(3)),
      medianExecutionTimeMs: parseFloat(median.toFixed(3)),
      minExecutionTimeMs: parseFloat(min.toFixed(3)),
      maxExecutionTimeMs: parseFloat(max.toFixed(3)),
      madMs: parseFloat(mad.toFixed(3)),
      memoryUsageKb: peakMem ? parseFloat(peakMem.toFixed(1)) : undefined,
      nodesExplored: avgNodes
    };
  }
}
