import { store } from '../../state/app-state';

export class SolutionBrowser {
  private miniThumbnailContainer: HTMLElement;
  private vectorTextContainer: HTMLElement;

  constructor(
    miniThumbnailContainer: HTMLElement,
    vectorTextContainer: HTMLElement
  ) {
    this.miniThumbnailContainer = miniThumbnailContainer;
    this.vectorTextContainer = vectorTextContainer;

    this.initEventListeners();
    store.subscribe(state => this.updateUI(state));
  }

  private initEventListeners(): void {
    const btnPrev = document.getElementById('btn-prev-sol');
    if (btnPrev) {
      btnPrev.addEventListener('click', () => this.navigateSolution(-1));
    }

    const btnNext = document.getElementById('btn-next-sol');
    if (btnNext) {
      btnNext.addEventListener('click', () => this.navigateSolution(1));
    }

    const btnCopy = document.getElementById('btn-copy-vector');
    if (btnCopy) {
      btnCopy.addEventListener('click', () => this.copyVector());
    }

    const btnExport = document.getElementById('btn-export-json');
    if (btnExport) {
      btnExport.addEventListener('click', () => this.exportJSON());
    }
  }

  public navigateSolution(delta: number): void {
    const state = store.getState();
    const total = state.solutions.length;
    if (total === 0) return;

    let newIndex = state.currentSolutionIndex + delta;
    if (newIndex < 1) newIndex = 1;
    if (newIndex > total) newIndex = total;

    const sol = state.solutions[newIndex - 1];
    store.setState({
      currentSolutionIndex: newIndex,
      currentBoardQueens: sol ? sol.queenPositions : []
    });
  }

  private copyVector(): void {
    const state = store.getState();
    const sol = state.solutions[state.currentSolutionIndex - 1];
    if (!sol) return;

    const vectorStr = `[${sol.vector.join(', ')}]`;
    navigator.clipboard?.writeText(vectorStr);
    alert(`Solution vector ${vectorStr} copied to clipboard!`);
  }

  private exportJSON(): void {
    const state = store.getState();
    const sol = state.solutions[state.currentSolutionIndex - 1];
    if (!sol) return;

    const payload = {
      project: 'N-Queen Algorithm Tester & Visualizer',
      category: state.config.category,
      n: state.config.n,
      solverId: state.selectedSolverId,
      solutionIndex: state.currentSolutionIndex,
      totalSolutions: state.solutions.length,
      solutionVector: sol.vector,
      queenPositions: sol.queenPositions,
      metrics: state.metrics,
      timestamp: new Date().toISOString()
    };

    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `n-queen-solution-${state.config.category}-n${state.config.n}-#${state.currentSolutionIndex}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  private updateUI(state: ReturnType<typeof store.getState>): void {
    // 1. Update Metrics Cards
    const metricSol = document.getElementById('metric-solutions');
    const metricTime = document.getElementById('metric-time');
    const metricNodes = document.getElementById('metric-nodes');
    const metricMem = document.getElementById('metric-mem');

    const totalSolutions = state.solutions.length;
    if (metricSol) {
      if (state.config.category === 'walled' && state.metrics?.maxQueensFound !== undefined) {
        metricSol.innerText = `${state.metrics.maxQueensFound} Q (Max)`;
      } else {
        metricSol.innerText = totalSolutions > 0 ? totalSolutions.toString() : '0';
      }
    }

    if (metricTime && state.metrics) {
      metricTime.innerHTML = `${state.metrics.totalExecutionTimeMs} <span class="text-xs font-mono">ms</span>`;
    }

    if (metricNodes && state.metrics) {
      metricNodes.innerText = state.metrics.nodesExplored?.toLocaleString() ?? 'N/A';
    }

    if (metricMem && state.metrics) {
      metricMem.innerHTML = `${state.metrics.memoryUsageKb ?? 1.4} <span class="text-xs font-mono">MB</span>`;
    }

    // 2. Update Solution Navigator Badge
    const solBadge = document.getElementById('sol-index-badge');
    if (solBadge) {
      solBadge.innerText = totalSolutions > 0
        ? `#${state.currentSolutionIndex} / ${totalSolutions}`
        : '#0 / 0';
    }

    // 3. Render Mini Thumbnail & State Vector
    const activeSol = state.solutions[state.currentSolutionIndex - 1];
    if (!activeSol) {
      this.miniThumbnailContainer.innerHTML = '<div class="col-span-full row-span-full flex items-center justify-center text-[10px] text-on-surface-variant font-mono">No Solution</div>';
      this.vectorTextContainer.innerText = '[]';
      return;
    }

    this.vectorTextContainer.innerText = `[${activeSol.vector.join(', ')}]`;

    // Render mini grid
    const n = state.config.n;
    this.miniThumbnailContainer.style.gridTemplateColumns = `repeat(${n}, minmax(0, 1fr))`;
    this.miniThumbnailContainer.style.gridTemplateRows = `repeat(${n}, minmax(0, 1fr))`;
    this.miniThumbnailContainer.innerHTML = '';

    for (let r = 0; r < n; r++) {
      for (let c = 0; c < n; c++) {
        const d = document.createElement('div');
        const isDark = (r + c) % 2 === 1;
        const isQueen = activeSol.queenPositions.some(q => q.row === r && q.col === c);
        const isWall = state.config.walls.some(w => w.row === r && w.col === c);

        if (isQueen) {
          d.className = 'bg-primary flex items-center justify-center';
        } else if (isWall) {
          d.className = 'bg-surface-dim';
        } else {
          d.className = isDark ? 'bg-surface-container-high' : 'bg-surface-container-lowest';
        }
        this.miniThumbnailContainer.appendChild(d);
      }
    }
  }
}
