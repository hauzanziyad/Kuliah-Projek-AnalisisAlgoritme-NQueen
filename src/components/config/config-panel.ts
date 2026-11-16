import { store } from '../../state/app-state';
import { PointerToolMode, ProblemCategory } from '../../types/problem';
import { SolverRegistry } from '../../worker/solver-registry';

export class ConfigPanel {
  constructor() {
    this.initEventListeners();
    this.populateSolverSelect();
    store.subscribe(state => this.updateUI(state));
  }

  private populateSolverSelect(): void {
    const select = document.getElementById('algorithm-select') as HTMLSelectElement | null;
    if (!select) return;

    select.innerHTML = '';
    const solvers = SolverRegistry.getAllSolverInfos();
    solvers.forEach(s => {
      const opt = document.createElement('option');
      opt.value = s.id;
      opt.textContent = `${s.name} [${s.badge}]`;
      select.appendChild(opt);
    });

    select.addEventListener('change', () => {
      store.setState({ selectedSolverId: select.value });
    });
  }

  private initEventListeners(): void {
    // 1. Problem Mode Buttons
    const modeBtns = document.querySelectorAll<HTMLButtonElement>('.mode-btn');
    modeBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        const mode = btn.dataset.mode as ProblemCategory;
        if (mode) this.setProblemMode(mode);
      });
    });

    // 2. Dimension Stepper & Slider
    const slider = document.getElementById('n-slider') as HTMLInputElement | null;
    if (slider) {
      slider.addEventListener('input', () => {
        this.setDimension(parseInt(slider.value));
      });
    }

    const btnDecrease = document.getElementById('btn-n-minus');
    if (btnDecrease) {
      btnDecrease.addEventListener('click', () => {
        const curN = store.getState().config.n;
        if (curN > 4) this.setDimension(curN - 1);
      });
    }

    const btnIncrease = document.getElementById('btn-n-plus');
    if (btnIncrease) {
      btnIncrease.addEventListener('click', () => {
        const curN = store.getState().config.n;
        if (curN < 12) this.setDimension(curN + 1);
      });
    }

    // Direct N preset buttons (N=4, N=6, N=8, N=10, N=12)
    document.querySelectorAll<HTMLButtonElement>('.n-preset-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const val = parseInt(btn.dataset.n || '8');
        this.setDimension(val);
      });
    });

    // 3. Pointer Tool Buttons
    document.querySelectorAll<HTMLButtonElement>('.tool-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const tool = btn.dataset.tool as PointerToolMode;
        if (tool) this.setToolMode(tool);
      });
    });

    // 4. Action Buttons (Randomize, Reset All)
    const btnRandomize = document.getElementById('btn-randomize');
    if (btnRandomize) {
      btnRandomize.addEventListener('click', () => this.randomizeScenario());
    }

    const btnReset = document.getElementById('btn-reset');
    if (btnReset) {
      btnReset.addEventListener('click', () => this.resetBoard());
    }

    // 5. Sightlines & Occlusion Checkboxes
    const chkSightlines = document.getElementById('chk-sightlines') as HTMLInputElement | null;
    if (chkSightlines) {
      chkSightlines.addEventListener('change', () => {
        store.setState({ showSightlines: chkSightlines.checked });
      });
    }

    const chkWallOcclusion = document.getElementById('chk-wall-occlusion') as HTMLInputElement | null;
    if (chkWallOcclusion) {
      chkWallOcclusion.addEventListener('change', () => {
        store.setState({ wallOcclusionFilter: chkWallOcclusion.checked });
      });
    }
  }

  public setProblemMode(mode: ProblemCategory): void {
    const currentConfig = store.getState().config;
    store.setState({
      config: {
        ...currentConfig,
        category: mode
      }
    });
  }

  public setDimension(n: number): void {
    if (n < 4 || n > 12) return;
    const currentConfig = store.getState().config;

    // Filter obstacles inside bounds
    const lockedQueens = currentConfig.lockedQueens.filter(q => q.row < n && q.col < n);
    const holes = currentConfig.holes.filter(h => h.row < n && h.col < n);
    const walls = currentConfig.walls.filter(w => w.row < n && w.col < n);

    store.setState({
      config: {
        ...currentConfig,
        n,
        lockedQueens,
        holes,
        walls
      },
      currentBoardQueens: []
    });
  }

  public setToolMode(tool: PointerToolMode): void {
    store.setState({ activeTool: tool });
  }

  public resetBoard(): void {
    const currentConfig = store.getState().config;
    store.setState({
      config: {
        ...currentConfig,
        lockedQueens: [],
        holes: [],
        walls: []
      },
      currentBoardQueens: [],
      solutions: [],
      currentSolutionIndex: 0,
      metrics: null,
      eventLogs: []
    });
  }

  public randomizeScenario(): void {
    this.resetBoard();
    const state = store.getState();
    const n = state.config.n;
    const mode = state.config.category;

    const holes: Array<{ row: number; col: number }> = [];
    const walls: Array<{ row: number; col: number }> = [];
    const lockedQueens: Array<{ row: number; col: number }> = [];

    const totalCells = n * n;
    const count = Math.max(2, Math.floor(n / 2));

    const getRandomCoord = () => ({
      row: Math.floor(Math.random() * n),
      col: Math.floor(Math.random() * n)
    });

    if (mode === 'holes' || mode === 'normal') {
      for (let i = 0; i < count; i++) {
        holes.push(getRandomCoord());
      }
    }

    if (mode === 'walled' || mode === 'normal') {
      for (let i = 0; i < count; i++) {
        walls.push(getRandomCoord());
      }
    }

    if (mode === 'preplaced') {
      // Pick 2 non-conflicting queens
      lockedQueens.push({ row: 0, col: Math.floor(Math.random() * n) });
      lockedQueens.push({ row: 2, col: (lockedQueens[0].col + 2) % n });
    }

    store.setState({
      config: {
        ...state.config,
        holes,
        walls,
        lockedQueens
      }
    });
  }

  private updateUI(state: ReturnType<typeof store.getState>): void {
    // Mode Buttons active state
    document.querySelectorAll<HTMLButtonElement>('.mode-btn').forEach(btn => {
      const mode = btn.dataset.mode;
      const isSelected = mode === state.config.category;
      if (isSelected) {
        btn.classList.add('bg-primary-container', 'border-2', 'shadow-[2px_2px_0px_#1a1a1a]');
        btn.classList.remove('bg-surface-container-lowest', 'border');
      } else {
        btn.classList.remove('bg-primary-container', 'border-2', 'shadow-[2px_2px_0px_#1a1a1a]');
        btn.classList.add('bg-surface-container-lowest', 'border');
      }
    });

    // Dimension labels
    const n = state.config.n;
    const slider = document.getElementById('n-slider') as HTMLInputElement | null;
    if (slider) slider.value = n.toString();

    const dimBadge = document.getElementById('dimension-badge');
    if (dimBadge) dimBadge.innerText = `${n} × ${n} Grid`;

    const cellCount = document.getElementById('cell-count-text');
    if (cellCount) cellCount.innerText = `${n * n} Cells`;

    const statBoard = document.getElementById('stat-board-config');
    if (statBoard) statBoard.innerText = `N=${n} (${n * n} CELLS)`;

    // Tool Buttons active state
    document.querySelectorAll<HTMLButtonElement>('.tool-btn').forEach(btn => {
      const tool = btn.dataset.tool;
      const isSelected = tool === state.activeTool;
      if (isSelected) {
        btn.classList.add('bg-primary-container', 'border-2', 'shadow-[2px_2px_0px_#1a1a1a]');
        btn.classList.remove('bg-surface-container-lowest', 'border');
      } else {
        btn.classList.remove('bg-primary-container', 'border-2', 'shadow-[2px_2px_0px_#1a1a1a]');
        btn.classList.add('bg-surface-container-lowest', 'border');
      }
    });

    // Disable inputs while running
    const isRunning = state.engineStatus === 'RUNNING';
    document.querySelectorAll<HTMLButtonElement | HTMLInputElement | HTMLSelectElement>(
      '#problem-mode-group button, #n-slider, #tool-mode-group button, #algorithm-select, #btn-randomize, #btn-reset'
    ).forEach(el => {
      el.disabled = isRunning;
    });
  }
}
