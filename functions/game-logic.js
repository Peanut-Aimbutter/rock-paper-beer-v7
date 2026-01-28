// Game logic for Firebase Cloud Functions
const { v4: uuidv4 } = require("uuid");

// Game move types
const MOVES = ['rock', 'paper', 'beer'];

// Room/game state
class Room {
  constructor(id, code, players, gamePhase = 'waiting') {
    this.id = id;
    this.code = code;
    this.players = players;
    this.gamePhase = gamePhase;
    this.currentRound = 0;
    this.rounds = [];
    this.createdAt = new Date();
    this.updatedAt = new Date();
  }
}

// Individual round
class Round {
  constructor(roundNumber) {
    this.roundNumber = roundNumber;
    this.moves = {}; // playerId -> move
    this.state = 'waiting';
  }
}

// RoomResult
class RoundResult {
  constructor(winner, player1Move, player2Move) {
    this.winner = winner;
    this.player1Move = player1Move;
    this.player2Move = player2Move;
  }
}

// Game logic functions
function decideWinner(moveA, moveB) {
  if (moveA === moveB) {
    return new RoundResult('draw', moveA, moveB);
  }

  const winsAgainst = {
    rock: 'beer',
    beer: 'paper',
    paper: 'rock',
  };

  if (winsAgainst[moveA] === moveB) {
    return new RoundResult('player1', moveA, moveB);
  }

  return new RoundResult('player2', moveA, moveB);
}

function generateShortCode() {
  return uuidv4().slice(0, 8).toUpperCase();
}

function createRoom(playerId, playerName, avatar) {
  const roomId = uuidv4();
  const room = new Room(roomId, generateShortCode(), [{
    id: playerId,
    name: playerName,
    avatar,
    isReady: false,
  }]);
  return room;
}

function addPlayerToRoom(room, playerId, playerName, avatar) {
  if (room.players.length >= 2) {
    throw new Error("Room is full");
  }

  room.players.push({
    id: playerId,
    name: playerName,
    avatar,
    isReady: false,
  });

  room.updatedAt = new Date();
  return room;
}

function startNewRound(room) {
  const roundNumber = room.currentRound + 1;
  const newRound = new Round(roundNumber);

  room.currentRound = roundNumber;
  room.rounds.push(newRound);
  room.gamePhase = "round";
  room.players.forEach(p => p.isReady = false);
  room.updatedAt = new Date();

  return room;
}

function submitMove(room, playerId, move) {
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

  currentRound.moves[playerId] = move;

  // Check if all players have submitted moves
  const allPlayersSubmitted = room.players.every(p => p.id in currentRound.moves);

  if (allPlayersSubmitted && room.players.length === 2) {
    const player1Move = currentRound.moves[room.players[0].id];
    const player2Move = currentRound.moves[room.players[1].id];

    if (player1Move && player2Move) {
      const result = decideWinner(player1Move, player2Move);
      currentRound.result = result;
      currentRound.state = "finished";
      room.gamePhase = "reveal";
    }
  }

  room.updatedAt = new Date();
  return room;
}

// Room manager
class RoomManager {
  constructor() {
    this.rooms = new Map();
  }

  createRoom(playerId, playerName, avatar) {
    const room = createRoom(playerId, playerName, avatar);
    this.rooms.set(room.id, room);
    return room;
  }

  getRoom(roomId) {
    return this.rooms.get(roomId) || null;
  }

  getRoomByCode(code) {
    const normalizedCode = code.toUpperCase();
    for (const room of this.rooms.values()) {
      if (room.code === normalizedCode) {
        return room;
      }
    }
    return null;
  }

  joinRoom(roomId, playerId, playerName, avatar) {
    const room = this.getRoom(roomId);
    if (!room) {
      throw new Error("Room not found");
    }

    const updatedRoom = addPlayerToRoom(room, playerId, playerName, avatar);
    this.rooms.set(roomId, updatedRoom);
    return updatedRoom;
  }

  startNewRound(roomId) {
    const room = this.getRoom(roomId);
    if (!room) {
      throw new Error("Room not found");
    }

    if (room.players.length < 2) {
      throw new Error("Not enough players to start a round");
    }

    return startNewRound(room);
  }

  submitMove(roomId, playerId, move) {
    const room = this.getRoom(roomId);
    if (!room) {
      throw new Error("Room not found");
    }

    return submitMove(room, playerId, move);
  }

  removePlayerFromAllRooms(playerId) {
    const affectedRooms = [];

    for (const [roomId, room] of this.rooms.entries()) {
      if (room.players.some(p => p.id === playerId)) {
        room.players = room.players.filter(p => p.id !== playerId);

        if (room.players.length === 0) {
          this.rooms.delete(roomId);
        } else {
          room.updatedAt = new Date();
          affectedRooms.push(room);
        }
      }
    }

    return affectedRooms;
  }
}

module.exports = {
  Room,
  Player: class {
    constructor(id, name, avatar) {
      this.id = id;
      this.name = name;
      this.avatar = avatar;
      this.isReady = false;
    }
  },
  Round,
  RoundResult,
  RoomManager,
  decideWinner,
  createRoom,
  addPlayerToRoom,
  removePlayerFromRoom,
  startNewRound,
  submitMove,
  getRandomMove: () => MOVES[Math.floor(Math.random() * MOVES.length)],
  generateShortCode,
};