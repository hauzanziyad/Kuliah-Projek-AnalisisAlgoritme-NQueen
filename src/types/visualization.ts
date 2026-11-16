import { BoardCoordinate } from './problem';

export type VizEventType =
  | 'KERNEL_INIT'
  | 'CHECK_CELL'
  | 'QUEEN_PLACE'
  | 'QUEEN_REMOVE'
  | 'CONFLICT_DETECTED'
  | 'VALID_POSITION'
  | 'BACKTRACK'
  | 'WALL_BLOCKED'
  | 'SOLUTION_FOUND'
  | 'INFO';

export interface VisualizationEvent {
  type: VizEventType;
  stepIndex: number;
  row?: number;
  col?: number;
  queenCoord?: BoardCoordinate;
  conflictWith?: BoardCoordinate;
  conflictType?: 'row' | 'col' | 'diag_main' | 'diag_anti' | 'obstacle';
  description: string;
  queensSnapshot?: BoardCoordinate[];
}

export type EngineStatus = 'IDLE' | 'RUNNING' | 'PAUSED' | 'COMPLETED' | 'STOPPED' | 'ERROR';
