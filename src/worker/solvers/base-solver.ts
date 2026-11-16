import { BoardConfiguration } from '../../types/problem';
import { ISolver, SolverInfo, SolverResult } from '../../types/solver';
import { VisualizationEvent } from '../../types/visualization';

export abstract class BaseSolver implements ISolver {
  public abstract readonly info: SolverInfo;

  public abstract solve(
    config: BoardConfiguration,
    onEvent?: (event: VisualizationEvent) => void
  ): Promise<SolverResult>;
}
