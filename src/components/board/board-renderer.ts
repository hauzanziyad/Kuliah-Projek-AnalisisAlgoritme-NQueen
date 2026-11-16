import { store } from '../../state/app-state';
import { BoardCoordinate } from '../../types/problem';
import { ProblemValidator } from '../../core/validator';

export class BoardRenderer {
  private container: HTMLElement;
  private colLabelsContainer: HTMLElement;
  private rowLabelsContainer: HTMLElement;

  constructor(
    container: HTMLElement,
    colLabelsContainer: HTMLElement,
    rowLabelsContainer: HTMLElement
  ) {
    this.container = container;
    this.colLabelsContainer = colLabelsContainer;
    this.rowLabelsContainer = rowLabelsContainer;

    store.subscribe(() => {
      this.render();
    });
  }

  public render(): void {
    const state = store.getState();
    const n = state.config.n;
    const alphabet = 'ABCDEFGHIJKL'.split('');

    // 1. Render Column Labels
    this.colLabelsContainer.style.gridTemplateColumns = `repeat(${n}, minmax(0, 1fr))`;
    this.colLabelsContainer.innerHTML = '';
    for (let c = 0; c < n; c++) {
      const span = document.createElement('span');
      span.textContent = alphabet[c];
      span.className = 'text-center font-mono text-xs font-bold text-on-surface-variant tracking-wider';
      this.colLabelsContainer.appendChild(span);
    }

    // 2. Render Row Labels
    this.rowLabelsContainer.style.gridTemplateRows = `repeat(${n}, minmax(0, 1fr))`;
    this.rowLabelsContainer.innerHTML = '';
    for (let r = n; r >= 1; r--) {
      const span = document.createElement('span');
      span.textContent = r.toString();
      span.className = 'text-right font-mono text-xs font-bold text-on-surface-variant flex items-center justify-end';
      this.rowLabelsContainer.appendChild(span);
    }

    // 3. Compute Threat Matrix if sightlines are enabled
    let threatMatrix: boolean[][] = [];
    if (state.showSightlines) {
      const allActiveQueens = [...state.config.lockedQueens, ...state.currentBoardQueens];
      threatMatrix = ProblemValidator.calculateThreatMatrix(
        allActiveQueens,
        n,
        state.wallOcclusionFilter ? state.config.walls : []
      );
    }

    // 4. Render Board Grid
    this.container.style.gridTemplateColumns = `repeat(${n}, minmax(0, 1fr))`;
    this.container.style.gridTemplateRows = `repeat(${n}, minmax(0, 1fr))`;
    this.container.innerHTML = '';

    for (let r = 0; r < n; r++) {
      for (let c = 0; c < n; c++) {
        const cell = document.createElement('div');
        const isDarkSquare = (r + c) % 2 === 1;
        const cellName = `${alphabet[c]}${n - r}`;

        // Base cell classes
        cell.className = `cell relative flex items-center justify-center cursor-pointer select-none transition-colors border border-outline/30 ${
          isDarkSquare ? 'bg-surface-container-high' : 'bg-surface-container-lowest'
        } hover:bg-primary-container/40`;
        cell.dataset.row = r.toString();
        cell.dataset.col = c.toString();

        // Check if there is an item on this cell
        const isLockedQueen = state.config.lockedQueens.some(q => q.row === r && q.col === c);
        const isBoardQueen = state.currentBoardQueens.some(q => q.row === r && q.col === c);
        const isHole = state.config.holes.some(h => h.row === r && h.col === c);
        const isWall = state.config.walls.some(w => w.row === r && w.col === c);
        const isThreatened = threatMatrix[r] && threatMatrix[r][c];

        if (isLockedQueen) {
          cell.innerHTML = `
            <div class="w-9 h-9 bg-tertiary-container border-2 border-outline flex items-center justify-center shadow-[2px_2px_0px_#1a1a1a] z-10 relative">
              <span class="text-xl font-bold font-serif text-on-tertiary-container">♛</span>
              <span class="material-symbols-outlined text-[11px] absolute -top-1.5 -right-1.5 bg-tertiary text-on-tertiary px-0.5 border border-outline">lock</span>
            </div>`;
        } else if (isBoardQueen) {
          cell.innerHTML = `
            <div class="w-9 h-9 bg-primary-fixed border-2 border-outline flex items-center justify-center shadow-[2px_2px_0px_#1a1a1a] z-10 transition-transform hover:scale-110">
              <span class="text-xl font-bold font-serif text-on-primary-container">♛</span>
            </div>`;
        } else if (isHole) {
          cell.innerHTML = `
            <div class="w-full h-full bg-secondary-fixed/50 flex items-center justify-center border border-secondary relative overflow-hidden">
              <span class="text-secondary font-mono font-bold text-[10px]">✕ HOLE</span>
            </div>`;
        } else if (isWall) {
          cell.innerHTML = `
            <div class="w-full h-full bg-surface-dim flex flex-col items-center justify-center border-2 border-outline">
              <span class="material-symbols-outlined text-[18px] text-on-surface">bricks</span>
            </div>`;
        } else if (isThreatened && !isLockedQueen && !isBoardQueen) {
          cell.classList.add('bg-secondary/15');
          cell.innerHTML = `<span class="w-1.5 h-1.5 bg-secondary rounded-full"></span>`;
        }

        // Hover events
        cell.addEventListener('mouseenter', () => {
          let typeDesc = 'EMPTY CELL';
          if (isLockedQueen) typeDesc = 'LOCKED QUEEN';
          else if (isBoardQueen) typeDesc = 'QUEEN';
          else if (isHole) typeDesc = 'FORBIDDEN HOLE';
          else if (isWall) typeDesc = 'BARRIER WALL';
          else if (isThreatened) typeDesc = 'THREATENED RAY';

          const hoverCoordEl = document.getElementById('hover-coord');
          const cellStatePreviewEl = document.getElementById('cell-state-preview');
          if (hoverCoordEl) hoverCoordEl.innerText = `Cell: ${cellName} [R:${r}, C:${c}]`;
          if (cellStatePreviewEl) cellStatePreviewEl.innerText = `TYPE: ${typeDesc}`;
        });

        // Click event
        cell.addEventListener('click', () => {
          this.handleCellClick(r, c);
        });

        this.container.appendChild(cell);
      }
    }

    // Update counters in UI
    const totalQueens = state.config.lockedQueens.length + state.currentBoardQueens.length;
    const queensPlacedBadge = document.getElementById('queens-placed-badge');
    if (queensPlacedBadge) {
      queensPlacedBadge.innerText = `${totalQueens} / ${n} Queens`;
    }

    const statObstacles = document.getElementById('stat-obstacles');
    if (statObstacles) {
      statObstacles.innerText = `${state.config.holes.length} HOLES, ${state.config.walls.length} WALLS`;
    }
  }

  private handleCellClick(r: number, c: number): void {
    const state = store.getState();
    if (state.engineStatus === 'RUNNING') return; // Jangan ubah board saat running

    const tool = state.activeTool;
    const config = { ...state.config };
    let currentBoardQueens = [...state.currentBoardQueens];
    let lockedQueens = [...config.lockedQueens];
    let holes = [...config.holes];
    let walls = [...config.walls];

    // Helper remove at (r, c)
    const removeAllAt = () => {
      currentBoardQueens = currentBoardQueens.filter(q => !(q.row === r && q.col === c));
      lockedQueens = lockedQueens.filter(q => !(q.row === r && q.col === c));
      holes = holes.filter(h => !(h.row === r && h.col === c));
      walls = walls.filter(w => !(w.row === r && w.col === c));
    };

    if (tool === 'clear') {
      removeAllAt();
    } else if (tool === 'queen') {
      const exists = currentBoardQueens.some(q => q.row === r && q.col === c);
      removeAllAt();
      if (!exists) {
        currentBoardQueens.push({ row: r, col: c });
      }
    } else if (tool === 'locked') {
      const exists = lockedQueens.some(q => q.row === r && q.col === c);
      removeAllAt();
      if (!exists) {
        lockedQueens.push({ row: r, col: c });
      }
    } else if (tool === 'hole') {
      const exists = holes.some(h => h.row === r && h.col === c);
      removeAllAt();
      if (!exists) {
        holes.push({ row: r, col: c });
      }
    } else if (tool === 'wall') {
      const exists = walls.some(w => w.row === r && w.col === c);
      removeAllAt();
      if (!exists) {
        walls.push({ row: r, col: c });
      }
    }

    config.lockedQueens = lockedQueens;
    config.holes = holes;
    config.walls = walls;

    store.setState({
      config,
      currentBoardQueens
    });
  }
}
