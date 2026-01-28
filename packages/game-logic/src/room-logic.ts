import { Room, Player, Round, Move, RoundResult } from "./types.js";
import { v4 as uuidv4 } from "uuid";
import { decideWinner } from "./game-logic.js";

/**
 * Generate a short, user-friendly room code
 */
function generateShortCode(): string {
  return uuidv4().slice(0, 8).toUpperCase();
}

/**
 * Create a new room with default state
 */
export function createRoom(playerId: string, playerName: string, avatar?: string): Room {
  const roomId = uuidv4();
  const room: Room = {
    id: roomId,
    code: generateShortCode(), // Short 8-character code for easy sharing
    players: [
      {
        id: playerId,
        name: playerName,
        avatar,
        isReady: false,
      },
    ],
    gamePhase: "waiting",
    currentRound: 0,
    rounds: [],
    createdAt: new Date(),
    updatedAt: new Date(),
  };
  return room;
}

/**
 * Add a player to a room
 */
export function addPlayerToRoom(room: Room, playerId: string, playerName: string, avatar?: string): Room {
  if (room.players.length >= 2) {
    throw new Error("Room is full");
  }

  const newPlayer: Player = {
    id: playerId,
    name: playerName,
    avatar,
    isReady: false,
  };

  return {
    ...room,
    players: [...room.players, newPlayer],
    updatedAt: new Date(),
  };
}

/**
 * Remove a player from a room
 */
export function removePlayerFromRoom(room: Room, playerId: string): Room {
  const newPlayers = room.players.filter((p) => p.id !== playerId);

  return {
    ...room,
    players: newPlayers,
    updatedAt: new Date(),
  };
}

/**
 * Start a new round in the room
 */
export function startNewRound(room: Room): Room {
  const roundNumber = room.currentRound + 1;
  const newRound: Round = {
    roundNumber,
    moves: {}, // Using object instead of Map for Socket.IO serialization
    state: "waiting",
  };

  return {
    ...room,
    currentRound: roundNumber,
    rounds: [...room.rounds, newRound],
    gamePhase: "round",
    players: room.players.map((p) => ({ ...p, isReady: false })),
    updatedAt: new Date(),
  };
}

/**
 * Submit a player's move for the current round
 */
export function submitMove(room: Room, playerId: string, move: string): Room {
  if (room.gamePhase !== "round") {
    throw new Error("Cannot submit move - not in round phase");
  }

  const currentRound = room.rounds[room.rounds.length - 1];
  if (!currentRound) {
    throw new Error("No current round found");
  }

  if (currentRound.state !== "waiting") {
    throw new Error("Round has already finished");
  }

  // Using object spread instead of Map for Socket.IO serialization
  const updatedMoves: Record<string, Move> = {
    ...currentRound.moves,
    [playerId]: move as Move,
  };

  // Check if all players have submitted moves
  const allPlayersSubmitted = room.players.every((p) => playerId in updatedMoves || p.id in updatedMoves);

  let newGamePhase: Room['gamePhase'] = room.gamePhase;
  let updatedRoundState: Round['state'] = currentRound.state;
  let roundResult: RoundResult | undefined;

  if (allPlayersSubmitted && room.players.length === 2) {
    // Get the moves from both players
    const player1Move = updatedMoves[room.players[0].id];
    const player2Move = updatedMoves[room.players[1].id];

    if (player1Move && player2Move) {
      // Calculate the winner
      roundResult = decideWinner(player1Move, player2Move);
      updatedRoundState = "finished";
      newGamePhase = "reveal";
    }
  }

  const updatedRound: Round = {
    ...currentRound,
    moves: updatedMoves,
    state: updatedRoundState,
    result: roundResult,
  };

  return {
    ...room,
    rounds: [...room.rounds.slice(0, -1), updatedRound],
    gamePhase: newGamePhase,
    updatedAt: new Date(),
  };
}

/**
 * Get the current round of a room
 */
export function getCurrentRound(room: Room): Round | null {
  if (room.rounds.length === 0) {
    return null;
  }
  return room.rounds[room.rounds.length - 1];
}

/**
 * Check if a room can start a game
 */
export function canStartGame(room: Room): boolean {
  return room.players.length === 2 && room.players.every((p) => p.isReady);
}
