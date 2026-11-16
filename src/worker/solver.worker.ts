import { MainToWorkerMessage, WorkerToMainMessage } from '../types/worker-messages';
import { SolverRegistry } from './solver-registry';
import { BenchmarkRunner } from './benchmark-runner';

let isCancelled = false;

self.onmessage = async (e: MessageEvent<MainToWorkerMessage>) => {
  const msg = e.data;

  if (msg.type === 'STOP_SOLVE') {
    isCancelled = true;
    return;
  }

  if (msg.type === 'START_SOLVE') {
    isCancelled = false;
    const { solverId, config, debugMode } = msg.payload;
    const solver = SolverRegistry.getSolver(solverId) || SolverRegistry.getSolver('backtracking');

    if (!solver) {
      const errReply: WorkerToMainMessage = {
        type: 'SOLVE_ERROR',
        payload: { error: `Solver ${solverId} not found in registry.` }
      };
      self.postMessage(errReply);
      return;
    }

    try {
      const result = await solver.solve(config, (event) => {
        if (isCancelled) return;
        if (debugMode) {
          const vizReply: WorkerToMainMessage = {
            type: 'VIZ_EVENT',
            payload: event
          };
          self.postMessage(vizReply);
        }
      });

      if (!isCancelled) {
        const completeReply: WorkerToMainMessage = {
          type: 'SOLVE_COMPLETED',
          payload: result
        };
        self.postMessage(completeReply);
      }
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      const errReply: WorkerToMainMessage = {
        type: 'SOLVE_ERROR',
        payload: { error: errorMsg }
      };
      self.postMessage(errReply);
    }
  }

  if (msg.type === 'RUN_BENCHMARK') {
    isCancelled = false;
    const { solverIds, config, runsCount } = msg.payload;

    try {
      const reports = await BenchmarkRunner.runBenchmarkForSolvers(
        solverIds,
        config,
        runsCount || 7,
        (currentSolver, currentRun, totalRuns) => {
          const progReply: WorkerToMainMessage = {
            type: 'BENCHMARK_PROGRESS',
            payload: { currentSolver, currentRun, totalRuns }
          };
          self.postMessage(progReply);
        }
      );

      const doneReply: WorkerToMainMessage = {
        type: 'BENCHMARK_COMPLETED',
        payload: reports
      };
      self.postMessage(doneReply);
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      const errReply: WorkerToMainMessage = {
        type: 'SOLVE_ERROR',
        payload: { error: errorMsg }
      };
      self.postMessage(errReply);
    }
  }
};
