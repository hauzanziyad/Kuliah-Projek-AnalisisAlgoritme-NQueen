import { store } from '../../state/app-state';
import { workerBridge } from '../../core/worker-bridge';
import { VisualizationEvent } from '../../types/visualization';

export class ExecutionControls {
  private logContainer: HTMLElement;
  private queuedEvents: VisualizationEvent[] = [];
  private playbackTimer: number | null = null;

  constructor(logContainer: HTMLElement) {
    this.logContainer = logContainer;
    this.initEventListeners();
    store.subscribe(state => this.updateUI(state));
  }

  private initEventListeners(): void {
    const btnRun = document.getElementById('btn-run');
    if (btnRun) {
      btnRun.addEventListener('click', () => this.toggleRun());
    }

    const btnStep = document.getElementById('btn-step');
    if (btnStep) {
      btnStep.addEventListener('click', () => this.stepForward());
    }

    const btnStop = document.getElementById('btn-stop');
    if (btnStop) {
      btnStop.addEventListener('click', () => this.stopExecution());
    }

    const speedSlider = document.getElementById('speed-slider') as HTMLInputElement | null;
    if (speedSlider) {
      speedSlider.addEventListener('input', () => {
        const val = parseInt(speedSlider.value);
        const delays = [200, 50, 10, 0];
        const delay = delays[val - 1] ?? 50;
        store.setState({ stepDelayMs: delay });

        const labels = ['200 ms (Slow)', '50 ms (Normal)', '10 ms (Turbo)', '0 ms (Instant)'];
        const speedLabel = document.getElementById('speed-label');
        if (speedLabel) speedLabel.innerText = labels[val - 1] ?? '50 ms';
      });
    }

    const debugToggle = document.getElementById('debug-toggle') as HTMLInputElement | null;
    if (debugToggle) {
      debugToggle.addEventListener('change', () => {
        store.setState({ debugMode: debugToggle.checked });
      });
    }
  }

  public toggleRun(): void {
    const state = store.getState();

    if (state.engineStatus === 'RUNNING') {
      // Pause playback
      this.pausePlayback();
      store.setState({ engineStatus: 'PAUSED' });
      return;
    }

    if (state.engineStatus === 'PAUSED' && this.queuedEvents.length > 0) {
      // Resume playback
      store.setState({ engineStatus: 'RUNNING' });
      this.startEventPlayback();
      return;
    }

    // Start fresh solve
    this.queuedEvents = [];
    store.setState({
      engineStatus: 'RUNNING',
      eventLogs: [],
      currentBoardQueens: []
    });

    this.logContainer.innerHTML = `<div class="text-[#10b981]">&gt; [KERNEL_INIT] Search tree initialized for N=${state.config.n}</div>`;

    workerBridge.startSolve(
      state.selectedSolverId,
      state.config,
      state.debugMode,
      {
        onEvent: (event) => {
          this.queuedEvents.push(event);
          if (!this.playbackTimer) {
            this.startEventPlayback();
          }
        },
        onCompleted: (result) => {
          store.setState({
            solutions: result.solutions,
            currentSolutionIndex: result.solutions.length > 0 ? 1 : 0,
            metrics: result.metrics,
            currentBoardQueens: result.solutions.length > 0 ? result.solutions[0].queenPositions : []
          });

          // Wait until remaining queued events are drained before setting COMPLETED
          if (this.queuedEvents.length === 0) {
            store.setState({ engineStatus: 'COMPLETED' });
          }
        },
        onError: (err) => {
          store.setState({ engineStatus: 'ERROR' });
          this.appendLogEntry('text-[#f87171]', `&gt; [ERROR] ${err}`);
        }
      }
    );
  }

  private startEventPlayback(): void {
    const processNext = () => {
      const state = store.getState();
      if (state.engineStatus !== 'RUNNING') {
        this.pausePlayback();
        return;
      }

      if (this.queuedEvents.length === 0) {
        if (state.metrics) {
          store.setState({ engineStatus: 'COMPLETED' });
        }
        this.playbackTimer = null;
        return;
      }

      // Batch drain if delay is 0ms (Instant)
      const count = state.stepDelayMs === 0 ? this.queuedEvents.length : 1;
      for (let i = 0; i < count; i++) {
        const ev = this.queuedEvents.shift();
        if (ev) {
          this.applyVisualizationEvent(ev);
        }
      }

      if (this.queuedEvents.length > 0) {
        this.playbackTimer = window.setTimeout(processNext, Math.max(1, state.stepDelayMs));
      } else {
        this.playbackTimer = null;
        if (state.metrics) {
          store.setState({ engineStatus: 'COMPLETED' });
        }
      }
    };

    if (this.playbackTimer) clearTimeout(this.playbackTimer);
    this.playbackTimer = window.setTimeout(processNext, store.getState().stepDelayMs);
  }

  private pausePlayback(): void {
    if (this.playbackTimer) {
      clearTimeout(this.playbackTimer);
      this.playbackTimer = null;
    }
  }

  public stepForward(): void {
    const state = store.getState();
    if (this.queuedEvents.length > 0) {
      const ev = this.queuedEvents.shift();
      if (ev) this.applyVisualizationEvent(ev);
    } else {
      // If idle, simulate stepping metric
      const curNodes = state.metrics?.nodesExplored || 0;
      store.setState({
        metrics: {
          ...(state.metrics || { totalExecutionTimeMs: 0 }),
          nodesExplored: curNodes + 1
        }
      });
      this.appendLogEntry('text-surface-dim', `&gt; Step #${curNodes + 1}: Inspected next branch state.`);
    }
  }

  public stopExecution(): void {
    this.pausePlayback();
    this.queuedEvents = [];
    workerBridge.stop();
    store.setState({ engineStatus: 'STOPPED' });
    this.appendLogEntry('text-[#f87171] font-bold', '&gt; [HALTED] Solver execution stopped by user.');
  }

  private applyVisualizationEvent(ev: VisualizationEvent): void {
    // 1. Update Board State if snapshot provided
    if (ev.queensSnapshot) {
      store.setState({ currentBoardQueens: ev.queensSnapshot });
    }

    // 2. Append Terminal Log
    let colorClass = 'text-surface-dim';
    if (ev.type === 'SOLUTION_FOUND') colorClass = 'text-[#10b981] font-bold';
    else if (ev.type === 'CONFLICT_DETECTED') colorClass = 'text-[#f87171]';
    else if (ev.type === 'BACKTRACK') colorClass = 'text-on-primary-variant';
    else if (ev.type === 'QUEEN_PLACE') colorClass = 'text-primary-fixed';

    this.appendLogEntry(colorClass, `&gt; Step #${ev.stepIndex}: ${ev.description}`);
  }

  private appendLogEntry(colorClass: string, text: string): void {
    const line = document.createElement('div');
    line.className = `${colorClass} leading-snug`;
    line.innerHTML = text;
    this.logContainer.appendChild(line);
    this.logContainer.scrollTop = this.logContainer.scrollHeight;
  }

  private updateUI(state: ReturnType<typeof store.getState>): void {
    const btnRun = document.getElementById('btn-run');
    const runText = document.getElementById('run-text');
    const statusBadge = document.getElementById('engine-status-badge');

    if (!btnRun || !runText || !statusBadge) return;

    if (state.engineStatus === 'RUNNING') {
      statusBadge.innerHTML = `<span class="w-2 h-2 rounded-full bg-secondary animate-ping"></span>RUNNING...`;
      statusBadge.className = 'px-2 py-0.5 bg-secondary-fixed text-secondary border border-outline font-mono text-xs font-bold flex items-center gap-1.5';
      runText.innerText = 'PAUSE';
      btnRun.className = 'col-span-2 py-3 bg-secondary text-on-primary font-headline text-xs font-bold uppercase tracking-wider border-2 border-outline shadow-[3px_3px_0px_#1a1a1a] transition-none flex items-center justify-center gap-2 active:translate-x-0.5 active:translate-y-0.5';
    } else if (state.engineStatus === 'PAUSED') {
      statusBadge.innerHTML = `<span class="w-2 h-2 rounded-full bg-primary-fixed"></span>PAUSED`;
      statusBadge.className = 'px-2 py-0.5 bg-surface-container border border-outline font-mono text-xs font-bold text-on-surface flex items-center gap-1.5';
      runText.innerText = 'RESUME';
      btnRun.className = 'col-span-2 py-3 bg-primary text-on-primary font-headline text-xs font-bold uppercase tracking-wider hover:bg-primary-fixed hover:text-on-primary-container border-2 border-outline shadow-[3px_3px_0px_#1a1a1a] transition-none flex items-center justify-center gap-2 active:translate-x-0.5 active:translate-y-0.5';
    } else if (state.engineStatus === 'COMPLETED') {
      statusBadge.innerHTML = `<span class="w-2 h-2 rounded-full bg-[#10b981]"></span>COMPLETED`;
      statusBadge.className = 'px-2 py-0.5 bg-[#d1fae5] text-[#065f46] border border-outline font-mono text-xs font-bold flex items-center gap-1.5';
      runText.innerText = 'RUN SOLVER';
      btnRun.className = 'col-span-2 py-3 bg-primary text-on-primary font-headline text-xs font-bold uppercase tracking-wider hover:bg-primary-fixed hover:text-on-primary-container border-2 border-outline shadow-[3px_3px_0px_#1a1a1a] transition-none flex items-center justify-center gap-2 active:translate-x-0.5 active:translate-y-0.5';
    } else {
      statusBadge.innerHTML = `<span class="w-2 h-2 rounded-full bg-primary-fixed"></span>${state.engineStatus} / READY`;
      statusBadge.className = 'px-2 py-0.5 bg-surface-container border border-outline font-mono text-xs font-bold text-on-surface flex items-center gap-1.5';
      runText.innerText = 'RUN SOLVER';
      btnRun.className = 'col-span-2 py-3 bg-primary text-on-primary font-headline text-xs font-bold uppercase tracking-wider hover:bg-primary-fixed hover:text-on-primary-container border-2 border-outline shadow-[3px_3px_0px_#1a1a1a] transition-none flex items-center justify-center gap-2 active:translate-x-0.5 active:translate-y-0.5';
    }
  }
}
