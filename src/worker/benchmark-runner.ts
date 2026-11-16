import { BoardConfiguration } from '../types/problem';
import { BenchmarkRun, SolverBenchmarkReport } from '../types/benchmark';
import { SolverRegistry } from './solver-registry';
import { StatisticsHelper } from '../core/metrics';
import { ProblemValidator } from '../core/validator';

export class BenchmarkRunner {
  public static async runBenchmarkForSolvers(
    solverIds: string[],
    config: BoardConfiguration,
    runsCount: number = 7,
    onProgress?: (solverId: string, currentRun: number, totalRuns: number) => void
  ): Promise<SolverBenchmarkReport[]> {
    const reports: SolverBenchmarkReport[] = [];

    for (const id of solverIds) {
      const solverFactory = () => SolverRegistry.getSolver(id);
      const testSolver = solverFactory();
      if (!testSolver) continue;

      // 1. Validation run
      if (onProgress) onProgress(id, 0, runsCount);
      const validationRunResult = await testSolver.solve(config);
      
      // Validasi solusi pertama
      let isValid = true;
      let valStatus: 'VALID' | 'INVALID' | 'INCOMPLETE' | 'REFERENCE_UNAVAILABLE' = 'VALID';
      if (validationRunResult.solutions.length > 0) {
        const check = ProblemValidator.validateSolution(
          validationRunResult.solutions[0].queenPositions,
          config
        );
        isValid = check.isValid;
        valStatus = isValid ? 'VALID' : 'INVALID';
      } else {
        valStatus = 'INCOMPLETE';
      }

      // 2. Warm-up run
      const warmSolver = solverFactory()!;
      await warmSolver.solve(config);

      // 3. 7 Measurement runs with fresh instances
      const runs: BenchmarkRun[] = [];
      for (let r = 1; r <= runsCount; r++) {
        if (onProgress) onProgress(id, r, runsCount);
        
        const freshSolver = solverFactory()!;
        const start = performance.now();
        const res = await freshSolver.solve(config);
        const end = performance.now();

        runs.push({
          runNumber: r,
          durationMs: parseFloat((end - start).toFixed(3)),
          memoryKb: res.metrics.memoryUsageKb,
          nodesExplored: res.metrics.nodesExplored
        });
      }

      // 4. Compute statistics (Median, MAD, etc.)
      const computedMetrics = StatisticsHelper.computeMetricsFromRuns(runs);
      if (validationRunResult.metrics.maxQueensFound !== undefined) {
        computedMetrics.maxQueensFound = validationRunResult.metrics.maxQueensFound;
        computedMetrics.optimalSolutionsCount = validationRunResult.metrics.optimalSolutionsCount;
      }

      reports.push({
        solverId: id,
        solverName: testSolver.info.name,
        runs,
        metrics: computedMetrics,
        isValid,
        validationStatus: valStatus
      });
    }

    return reports;
  }
}
