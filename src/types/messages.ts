import { LogMessage } from '@aspen.cloud/agent-typings';
import { Game, BoardLocation } from './game';

export interface GameStartedMessage extends LogMessage {
  type: 'GAME_STARTED';
  game: Game;
}

export interface TurnCardActionParams {
  gameId: string;
}

export interface TurnCardMessage extends LogMessage {
  type: 'TURN_CARD';
  gameId: string;
}

export interface MoveCardActionParams {
  gameId: string;
  from: BoardLocation;
  fromIndex: number;
  to: BoardLocation;
  toIndex: number;
}

export interface MoveCardMessage extends LogMessage {
  type: 'MOVE_CARD';
  gameId: string;
  from: BoardLocation;
  fromIndex?: number;
  to: BoardLocation;
  toIndex?: number;
}
