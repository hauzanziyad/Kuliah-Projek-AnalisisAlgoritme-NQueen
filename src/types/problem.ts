export type ProblemCategory = 'normal' | 'preplaced' | 'holes' | 'walled';

export interface BoardCoordinate {
  row: number;
  col: number;
}

export interface BoardConfiguration {
  category: ProblemCategory;
  n: number; // 4 to 12
  lockedQueens: BoardCoordinate[];
  holes: BoardCoordinate[];
  walls: BoardCoordinate[];
}

export type PointerToolMode = 'queen' | 'locked' | 'hole' | 'wall' | 'clear';

export interface CellState {
  row: number;
  col: number;
  type: 'empty' | 'queen' | 'locked' | 'hole' | 'wall';
  isThreatened?: boolean;
  isSafe?: boolean;
  isInspected?: boolean;
  hasConflict?: boolean;
}
