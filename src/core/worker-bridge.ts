import { MainToWorkerMessage, WorkerToMainMessage } from '../types/worker-messages';
import { BoardConfiguration } from '../types/problem';
import { SolverResult } from '../types/solver';
import { SolverBenchmarkReport } from '../types/benchmark';
import { VisualizationEvent } from '../types/visualization';

export class WorkerBridge {
  private worker: Worker | null = null;
  private onVizEventCallback?: (event: VisualizationEvent) => void;
  private onSolveCompletedCallback?: (result: SolverResult) => void;
  private onSolveErrorCallback?: (error: string) => void;
  private onBenchmarkProgressCallback?: (solver: string, run: number, total: number) => void;
  private onBenchmarkCompletedCallback?: (reports: SolverBenchmarkReport[]) => void;

  private initWorker(): void {
    if (this.worker) return;
    this.worker = new Worker(
      new URL('../worker/solver.worker.ts', import.meta.url),
      { type: 'module' }
    );

    this.worker.onmessage = (e: MessageEvent<WorkerToMainMessage>) => {
      const msg = e.data;
      switch (msg.type) {
        case 'VIZ_EVENT':
          if (this.onVizEventCallback) this.onVizEventCallback(msg.payload);
          break;
        case 'SOLVE_COMPLETED':
          if (this.onSolveCompletedCallback) this.onSolveCompletedCallback(msg.payload);
          break;
        case 'SOLVE_ERROR':
          if (this.onSolveErrorCallback) this.onSolveErrorCallback(msg.payload.error);
          break;
        case 'BENCHMARK_PROGRESS':
          if (this.onBenchmarkProgressCallback) {
            this.onBenchmarkProgressCallback(
              msg.payload.currentSolver,
              msg.payload.currentRun,
              msg.payload.totalRuns
            );
          }
          break;
        case 'BENCHMARK_COMPLETED':
          if (this.onBenchmarkCompletedCallback) {
            this.onBenchmarkCompletedCallback(msg.payload);
          }
          break;
      }
    };
  }

  public startSolve(
    solverId: string,
    config: BoardConfiguration,
    debugMode: boolean,
    callbacks: {
      onEvent?: (event: VisualizationEvent) => void;
      onCompleted?: (result: SolverResult) => void;
      onError?: (error: string) => void;
    }
  ): void {
    this.terminate();
    this.initWorker();

    this.onVizEventCallback = callbacks.onEvent;
    this.onSolveCompletedCallback = callbacks.onCompleted;
    this.onSolveErrorCallback = callbacks.onError;

    const msg: MainToWorkerMessage = {
      type: 'START_SOLVE',
      payload: { solverId, config, debugMode }
    };
    this.worker?.postMessage(msg);
  }

  public runBenchmark(
    solverIds: string[],
    config: BoardConfiguration,
    callbacks: {
      onProgress?: (solver: string, run: number, total: number) => void;
      onCompleted?: (reports: SolverBenchmarkReport[]) => void;
      onError?: (error: string) => void;
    }
  ): void {
    this.terminate();
    this.initWorker();

    this.onBenchmarkProgressCallback = callbacks.onProgress;
    this.onBenchmarkCompletedCallback = callbacks.onCompleted;
    this.onSolveErrorCallback = callbacks.onError;

    const msg: MainToWorkerMessage = {
      type: 'RUN_BENCHMARK',
      payload: { solverIds, config, runsCount: 7 }
    };
    this.worker?.postMessage(msg);
  }

  public stop(): void {
    if (this.worker) {
      this.worker.postMessage({ type: 'STOP_SOLVE' });
      this.terminate();
    }
  }

  public terminate(): void {
    if (this.worker) {
      this.worker.terminate();
      this.worker = null;
    }
  }
}

export const workerBridge = new WorkerBridge();
