import { BoardConfiguration, BoardCoordinate, ProblemCategory } from './problem';
import { VisualizationEvent } from './visualization';

export interface Solution {
  id: number;
  queenPositions: BoardCoordinate[];
  vector: number[]; // 1-indexed column per row (if applicable) or row/col array
  isValid?: boolean;
}

export interface SolverMetrics {
  totalExecutionTimeMs: number;
  avgExecutionTimeMs?: number;
  medianExecutionTimeMs?: number;
  minExecutionTimeMs?: number;
  maxExecutionTimeMs?: number;
  madMs?: number; // Median Absolute Deviation
  memoryUsageKb?: number;
  nodesExplored?: number;
  iterations?: number;
  maxQueensFound?: number; // Khusus Walled
  optimalSolutionsCount?: number; // Khusus Walled
  pruningRatePercent?: number;
}

export interface SolverResult {
  solverId: string;
  status: 'COMPLETED' | 'STOPPED' | 'TIMEOUT' | 'ERROR';
  solutions: Solution[];
  metrics: SolverMetrics;
  error?: string;
}

export interface SolverInfo {
  id: string;
  name: string;
  description: string;
  badge: string;
  supportedCategories: ProblemCategory[];
}

export interface ISolver {
  readonly info: SolverInfo;
  solve(
    config: BoardConfiguration,
    onEvent?: (event: VisualizationEvent) => void
  ): Promise<SolverResult>;
}
