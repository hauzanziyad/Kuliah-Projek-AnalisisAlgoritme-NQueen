import { ISolver, SolverInfo } from '../types/solver';
import { BacktrackingSolver } from './solvers/backtracking-solver';
import { BitwiseSolver } from './solvers/bitwise-solver';
import { CSPSolver } from './solvers/csp-solver';
import { GreedyWallSolver } from './solvers/greedy-wall-solver';

export class SolverRegistry {
  private static solvers: Map<string, () => ISolver> = new Map([
    ['backtracking', () => new BacktrackingSolver()],
    ['bitwise', () => new BitwiseSolver()],
    ['csp', () => new CSPSolver()],
    ['greedy_wall', () => new GreedyWallSolver()]
  ]);

  public static getSolver(id: string): ISolver | undefined {
    const factory = this.solvers.get(id);
    return factory ? factory() : undefined;
  }

  public static getAllSolverInfos(): SolverInfo[] {
    return Array.from(this.solvers.values()).map(factory => factory().info);
  }

  public static registerSolver(id: string, factory: () => ISolver): void {
    this.solvers.set(id, factory);
  }
}
