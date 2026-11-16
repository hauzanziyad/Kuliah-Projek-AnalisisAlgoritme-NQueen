import { BoardConfiguration } from './problem';
import { SolverMetrics } from './solver';

export interface BenchmarkRun {
  runNumber: number;
  durationMs: number;
  memoryKb?: number;
  nodesExplored?: number;
}

export interface SolverBenchmarkReport {
  solverId: string;
  solverName: string;
  runs: BenchmarkRun[];
  metrics: SolverMetrics;
  isValid: boolean;
  validationStatus: 'VALID' | 'INVALID' | 'INCOMPLETE' | 'REFERENCE_UNAVAILABLE';
}

export interface MultiAlgorithmComparisonResult {
  config: BoardConfiguration;
  reports: SolverBenchmarkReport[];
  bestPerformer: {
    solverId: string;
    solverName: string;
    medianMs: number;
    reason: string;
  };
}
