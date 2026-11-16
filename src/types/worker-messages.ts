import { BoardConfiguration } from './problem';
import { SolverResult } from './solver';
import { VisualizationEvent } from './visualization';
import { SolverBenchmarkReport } from './benchmark';

export type MainToWorkerMessage =
  | { type: 'START_SOLVE'; payload: { solverId: string; config: BoardConfiguration; debugMode: boolean } }
  | { type: 'STOP_SOLVE' }
  | { type: 'RUN_BENCHMARK'; payload: { solverIds: string[]; config: BoardConfiguration; runsCount?: number } };

export type WorkerToMainMessage =
  | { type: 'VIZ_EVENT'; payload: VisualizationEvent }
  | { type: 'SOLVE_PROGRESS'; payload: { nodesExplored: number; solutionsCount: number; currentDepth: number } }
  | { type: 'SOLVE_COMPLETED'; payload: SolverResult }
  | { type: 'SOLVE_ERROR'; payload: { error: string } }
  | { type: 'BENCHMARK_PROGRESS'; payload: { currentSolver: string; currentRun: number; totalRuns: number } }
  | { type: 'BENCHMARK_COMPLETED'; payload: SolverBenchmarkReport[] };
