import express from "express";
import cors from "cors";
import { createServer } from "http";
import { Server as SocketIOServer } from "socket.io";
import Joi from "joi";
import { RoomManager } from "./room-manager.js";
import { GameEvent, Room, getRandomMove } from "@rock-paper-beer/game-logic";

const PORT = process.env.PORT || 3001;
const MOVE_TIMEOUT_MS = 15000; // 15 seconds to make a move

const app = express();
const server = createServer(app);
const io = new SocketIOServer(server, {
  cors: {
    origin: [
      "http://localhost:5173",
      "http://localhost:5174",
      "http://localhost:5175",
      "http://localhost:5176",
    ],
    methods: ["GET", "POST"],
  },
});

// Middleware
app.use(cors());
app.use(express.json());

// Serve static files from client build in production
app.use(express.static('../../apps/client/dist'));

// Fallback to index.html for SPA routing
app.get('*', (req, res) => {
  res.sendFile('../../apps/client/dist/index.html');
});

// Validation schemas
const schemas = {
  createRoom: Joi.object({
    playerName: Joi.string().min(1).max(20).required(),
    avatar: Joi.string().optional(),
  }),
  joinRoom: Joi.object({
    roomId: Joi.string().optional(),
    roomCode: Joi.string().max(8).optional(),
    playerName: Joi.string().min(1).max(20).required(),
    avatar: Joi.string().optional(),
  }).or('roomId', 'roomCode'),
  submitMove: Joi.object({
    roomId: Joi.string().required(),
    move: Joi.string().valid('rock', 'paper', 'beer').required(),
  }),
  startRound: Joi.object({
    roomId: Joi.string().required(),
  }),
  getRoom: Joi.object({
    roomId: Joi.string().required(),
  }),
};

// Track active round timeouts
const roundTimeouts = new Map<string, NodeJS.Timeout>();

// Simple health check endpoint
app.get("/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// Debug endpoint to view all rooms (for development)
app.get("/debug/rooms", (req, res) => {
  res.json({
    rooms: roomManager.getAllRooms(),
    count: roomManager.getAllRooms().length,
  });
});

// Debug endpoint to clear all rooms (for development)
app.delete("/debug/rooms", (req, res) => {
  roomManager.clearAllRooms();
  res.json({ message: "All rooms cleared" });
});

// Initialize room manager
const roomManager = new RoomManager();

// Helper function to validate input
function validateInput<T>(schema: Joi.ObjectSchema, data: unknown): { value: T; error?: string } {
  const { value, error } = schema.validate(data);
  if (error) {
    return { value: data as T, error: error.details[0].message };
  }
  return { value };
}

// Helper function to auto-submit random moves for players who timeout
function handleMoveTimeout(roomId: string) {
  const room = roomManager.getRoom(roomId);
  if (!room || room.gamePhase !== "round") return;

  const currentRound = room.rounds[room.rounds.length - 1];
  if (!currentRound || currentRound.state !== "waiting") return;

  // Find players who haven't submitted moves
  for (const player of room.players) {
    if (!(player.id in currentRound.moves)) {
      console.log(`Timeout: Auto-submitting random move for ${player.name} in room ${roomId}`);
      try {
        const randomMove = getRandomMove();
        const updatedRoom = roomManager.submitMove(roomId, player.id, randomMove);
        io.to(updatedRoom.id).emit("moveSubmitted", { room: updatedRoom, timeout: true, playerId: player.id });

        // Check if round is now finished
        const newRound = updatedRoom.rounds[updatedRoom.rounds.length - 1];
        if (newRound && newRound.state === "finished") {
          io.to(updatedRoom.id).emit("roundFinished", { room: updatedRoom });
          console.log(`Round finished in room ${roomId} (after timeout)`);
        }
      } catch (error) {
        console.error(`Error auto-submitting move: ${error}`);
      }
    }
  }
}

// Socket.IO connection handling
io.on("connection", (socket) => {
  console.log(`User connected: ${socket.id}`);

  // Create a new room
  socket.on("createRoom", (data) => {
    const { value, error } = validateInput<{ playerName: string; avatar?: string }>(schemas.createRoom, data);
    if (error) {
      socket.emit("error", { message: error });
      return;
    }

    try {
      const room = roomManager.createRoom(socket.id, value.playerName, value.avatar);
      socket.join(room.id);
      socket.emit("roomCreated", { room });
      // Also emit roomUpdated so the Game component gets the room state
      socket.emit("roomUpdated", { room });
      console.log(`Room created: ${room.code} (${room.id}) by ${value.playerName}`);
    } catch (error) {
      socket.emit("error", {
        message: error instanceof Error ? error.message : "Failed to create room",
      });
    }
  });

  // Get room data
  socket.on("getRoom", (data) => {
    const { value, error } = validateInput<{ roomId: string }>(schemas.getRoom, data);
    if (error) {
      socket.emit("error", { message: error });
      return;
    }

    try {
      const room = roomManager.getRoom(value.roomId);
      if (!room) {
        socket.emit("error", { message: "Room not found" });
        return;
      }
      socket.emit("roomData", { room });
    } catch (error) {
      socket.emit("error", {
        message: error instanceof Error ? error.message : "Failed to get room",
      });
    }
  });

  // Join an existing room (supports both room ID and short code)
  socket.on("joinRoom", (data) => {
    const { value, error } = validateInput<{ roomId?: string; roomCode?: string; playerName: string; avatar?: string }>(schemas.joinRoom, data);
    if (error) {
      socket.emit("error", { message: error });
      return;
    }

    try {
      // Support joining by either room ID or short code
      let room;
      if (value.roomCode) {
        const foundRoom = roomManager.getRoomByCode(value.roomCode);
        if (!foundRoom) {
          socket.emit("error", { message: "Room not found with that code" });
          return;
        }
        room = roomManager.joinRoom(foundRoom.id, socket.id, value.playerName, value.avatar);
      } else if (value.roomId) {
        room = roomManager.joinRoom(value.roomId, socket.id, value.playerName, value.avatar);
      } else {
        socket.emit("error", { message: "Room ID or code required" });
        return;
      }
      
      socket.join(room.id);

      // Broadcast updated room state to all players
      io.to(room.id).emit("roomUpdated", { room });

      console.log(`Player ${value.playerName} joined room ${room.code} (${room.id})`);
    } catch (error) {
      socket.emit("error", {
        message: error instanceof Error ? error.message : "Failed to join room",
      });
    }
  });

  // Start a new round
  socket.on("startRound", (data) => {
    const { value, error } = validateInput<{ roomId: string }>(schemas.startRound, data);
    if (error) {
      socket.emit("error", { message: error });
      return;
    }

    try {
      const room = roomManager.startNewRound(value.roomId);

      // Clear any existing timeout for this room
      const existingTimeout = roundTimeouts.get(room.id);
      if (existingTimeout) {
        clearTimeout(existingTimeout);
      }

      // Set timeout for auto-submitting moves
      const timeout = setTimeout(() => {
        handleMoveTimeout(room.id);
        roundTimeouts.delete(room.id);
      }, MOVE_TIMEOUT_MS);
      roundTimeouts.set(room.id, timeout);

      // Broadcast to all players in the room
      io.to(room.id).emit("roundStarted", { room, timeoutMs: MOVE_TIMEOUT_MS });

      // Also emit roomUpdated for consistency
      io.to(room.id).emit("roomUpdated", { room });
    } catch (error) {
      socket.emit("error", {
        message: error instanceof Error ? error.message : "Failed to start round",
      });
    }
  });

  // Submit a move
  socket.on("submitMove", (data) => {
    const { value, error } = validateInput<{ roomId: string; move: string }>(schemas.submitMove, data);
    if (error) {
      socket.emit("error", { message: error });
      return;
    }

    try {
      const room = roomManager.submitMove(value.roomId, socket.id, value.move);
      io.to(room.id).emit("moveSubmitted", { room });

      // If all players have submitted, reveal results and clear timeout
      const currentRound = room.rounds[room.rounds.length - 1];
      if (currentRound && currentRound.state === "finished") {
        // Clear the timeout since round is complete
        const existingTimeout = roundTimeouts.get(room.id);
        if (existingTimeout) {
          clearTimeout(existingTimeout);
          roundTimeouts.delete(room.id);
        }

        // Calculate and broadcast results
        io.to(room.id).emit("roundFinished", { room });
        console.log(`Round finished in room ${value.roomId}`);
      }
    } catch (error) {
      socket.emit("error", {
        message: error instanceof Error ? error.message : "Failed to submit move",
      });
    }
  });

  // Handle disconnection
  socket.on("disconnect", () => {
    console.log(`User disconnected: ${socket.id}`);
    const affectedRooms = roomManager.removePlayerFromAllRooms(socket.id);

    // Notify remaining players in affected rooms
    affectedRooms.forEach((room) => {
      // Clear any timeouts for rooms where a player disconnected
      const existingTimeout = roundTimeouts.get(room.id);
      if (existingTimeout) {
        clearTimeout(existingTimeout);
        roundTimeouts.delete(room.id);
      }

      io.to(room.id).emit("playerDisconnected", { playerId: socket.id, room });
    });
  });
});

// Start server
server.listen(PORT, () => {
  console.log(`🍺 Rock Paper Beer server running on port ${PORT}`);
  console.log(`🎮 Client URL should be: ${process.env.CLIENT_URL || "http://localhost:5173"}`);
});
