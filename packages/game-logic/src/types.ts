// Game move types
export type Move = 'rock' | 'paper' | 'beer';

// Player representation
export interface Player {
  id: string;
  name: string;
  avatar?: string; // SVG avatar string or image URL
  isReady: boolean;
}

// Room/game state
export interface Room {
  id: string;
  code: string; // Short 8-character code for easy sharing
  players: Player[];
  gamePhase: 'waiting' | 'playing' | 'round' | 'reveal' | 'finished';
  currentRound: number;
  rounds: Round[];
  createdAt: Date;
  updatedAt: Date;
}

// Individual round - using Record instead of Map for Socket.IO serialization
export interface Round {
  roundNumber: number;
  moves: Record<string, Move>; // playerId -> move (serializable)
  result?: RoundResult;
  state: 'waiting' | 'playing' | 'finished';
}

// Round result
export interface RoundResult {
  winner: 'player1' | 'player2' | 'draw';
  player1Move: Move;
  player2Move: Move;
}

// Game events for WebSocket
export type GameEvent = 
  | { type: 'playerJoined'; player: Player }
  | { type: 'playerLeft'; playerId: string }
  | { type: 'gameStarted' }
  | { type: 'moveSubmitted'; playerId: string }
  | { type: 'roundRevealed'; result: RoundResult }
  | { type: 'gameFinished'; winner: string }
  | { type: 'roomState'; room: Room };

// Move display info
export interface MoveDisplay {
  move: Move;
  emoji: string;
  label: string;
}

// Game configuration
export const GAME_CONFIG = {
  MAX_PLAYERS: 2,
  WINNING_SCORE: 3, // First to X rounds wins
  ROUND_TIMEOUT: 30000, // 30 seconds per round
} as const;

// Move display mapping
export const MOVE_DISPLAY: Record<Move, MoveDisplay> = {
  rock: { move: 'rock', emoji: '🪨', label: 'Rock' },
  paper: { move: 'paper', emoji: '📄', label: 'Paper' },
  beer: { move: 'beer', emoji: '🍺', label: 'Beer' },
} as const;