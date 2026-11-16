import { BoardConfiguration, BoardCoordinate, PointerToolMode, ProblemCategory } from '../types/problem';
import { SolverMetrics, Solution } from '../types/solver';
import { EngineStatus, VisualizationEvent } from '../types/visualization';

export type ActiveTab = 'visualizer' | 'comparison' | 'benchmark' | 'docs';

export interface AppState {
  currentTab: ActiveTab;
  theme: 'light' | 'dark';
  config: BoardConfiguration;
  activeTool: PointerToolMode;
  selectedSolverId: string;
  engineStatus: EngineStatus;
  debugMode: boolean;
  stepDelayMs: number;
  showSightlines: boolean;
  wallOcclusionFilter: boolean;
  
  // Placed queens on current board (during manual edit or debug inspection)
  currentBoardQueens: BoardCoordinate[];
  hoveredCell: { row: number; col: number; name: string } | null;
  
  // Results
  solutions: Solution[];
  currentSolutionIndex: number;
  metrics: SolverMetrics | null;
  
  // Debug Step Stream
  eventLogs: VisualizationEvent[];
  currentStepIndex: number;
}

type Listener<T> = (state: T) => void;

class StateStore {
  private state: AppState = {
    currentTab: 'visualizer',
    theme: (localStorage.getItem('theme') as 'light' | 'dark') || 'light',
    config: {
      category: 'normal',
      n: 8,
      lockedQueens: [],
      holes: [],
      walls: []
    },
    activeTool: 'queen',
    selectedSolverId: 'backtracking',
    engineStatus: 'IDLE',
    debugMode: true,
    stepDelayMs: 50,
    showSightlines: true,
    wallOcclusionFilter: true,
    currentBoardQueens: [],
    hoveredCell: null,
    solutions: [],
    currentSolutionIndex: 0,
    metrics: null,
    eventLogs: [],
    currentStepIndex: 0
  };

  private listeners: Set<Listener<AppState>> = new Set();

  public getState(): AppState {
    return { ...this.state };
  }

  public setState(updater: Partial<AppState> | ((prev: AppState) => Partial<AppState>)): void {
    const updates = typeof updater === 'function' ? updater(this.state) : updater;
    this.state = { ...this.state, ...updates };
    this.notify();
  }

  public subscribe(listener: Listener<AppState>): () => void {
    this.listeners.add(listener);
    listener(this.getState());
    return () => this.listeners.delete(listener);
  }

  private notify(): void {
    const currentState = this.getState();
    this.listeners.forEach(fn => fn(currentState));
  }
}

export const store = new StateStore();
