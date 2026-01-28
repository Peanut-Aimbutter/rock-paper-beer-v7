// Type definitions for game-logic module
export interface Player {
  id: string;
  name: string;
  avatar?: string;
  isReady: boolean;
}

export interface Round {
  roundNumber: number;
  moves: Record<string, string>;
  state: 'waiting' | 'finished';
  result?: RoundResult;
}

export interface RoundResult {
  winner: 'player1' | 'player2' | 'draw';
  player1Move: string;
  player2Move: string;
}

export interface Room {
  id: string;
  code: string;
  players: Player[];
  gamePhase: 'lobby' | 'round' | 'reveal';
  currentRound: number;
  rounds: Round[];
  createdAt: Date;
  updatedAt: Date;
}

export interface RoomManager {
  createRoom(playerId: string, playerName: string, avatar?: string): Room;
  getRoom(roomId: string): Room | null;
  getRoomByCode(code: string): Room | null;
  joinRoom(roomId: string, playerId: string, playerName: string, avatar?: string): Room;
  startNewRound(roomId: string): Room;
  submitMove(roomId: string, playerId: string, move: string): Room;
  removePlayerFromAllRooms(playerId: string): Room[];
}

export function decideWinner(moveA: string, moveB: string): RoundResult;
export function createRoom(playerId: string, playerName: string, avatar?: string): Room;
export function addPlayerToRoom(room: Room, playerId: string, playerName: string, avatar?: string): Room;
export function removePlayerFromRoom(room: Room, playerId: string): Room;
export function startNewRound(room: Room): Room;
export function submitMove(room: Room, playerId: string, move: string): Room;
export function getRandomMove(): string;
export function generateShortCode(): string;
