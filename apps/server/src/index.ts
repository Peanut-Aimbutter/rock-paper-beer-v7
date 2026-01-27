import express from "express";
import cors from "cors";
import { createServer } from "http";
import { Server as SocketIOServer } from "socket.io";
import { RoomManager } from "./room-manager";
import { GameEvent, Room } from "@rock-paper-beer/game-logic";

const PORT = process.env.PORT || 3001;

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

// Socket.IO connection handling
io.on("connection", (socket) => {
  console.log(`User connected: ${socket.id}`);

  // Create a new room
  socket.on("createRoom", ({ playerName }) => {
    try {
      const room = roomManager.createRoom(socket.id, playerName);
      socket.join(room.id);
      socket.emit("roomCreated", { room });
      // Also emit roomUpdated so the Game component gets the room state
      socket.emit("roomUpdated", { room });
      console.log(`Room created: ${room.id} by ${playerName}`);
    } catch (error) {
      socket.emit("error", {
        message: error instanceof Error ? error.message : "Failed to create room",
      });
    }
  });

  // Get room data
  socket.on("getRoom", ({ roomId }) => {
    try {
      const room = roomManager.getRoom(roomId);
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

  // Join an existing room
  socket.on("joinRoom", ({ roomId, playerName }) => {
    try {
      const room = roomManager.joinRoom(roomId, socket.id, playerName);
      socket.join(room.id);

      // Broadcast updated room state to all players
      io.to(room.id).emit("roomUpdated", { room });

      console.log(`Player ${playerName} joined room ${roomId}`);
    } catch (error) {
      socket.emit("error", {
        message: error instanceof Error ? error.message : "Failed to join room",
      });
    }
  });

  // Start a new round
  socket.on("startRound", ({ roomId }) => {
    try {
      const room = roomManager.startNewRound(roomId);

      // Broadcast to all players in the room
      io.to(room.id).emit("roundStarted", { room });

      // Also emit roomUpdated for consistency
      io.to(room.id).emit("roomUpdated", { room });
    } catch (error) {
      socket.emit("error", {
        message: error instanceof Error ? error.message : "Failed to start round",
      });
    }
  });

  // Submit a move
  socket.on("submitMove", ({ roomId, move }) => {
    try {
      const room = roomManager.submitMove(roomId, socket.id, move);
      io.to(room.id).emit("moveSubmitted", { room });

      // If all players have submitted, reveal results
      const currentRound = room.rounds[room.rounds.length - 1];
      if (currentRound && currentRound.state === "finished") {
        // Calculate and broadcast results
        io.to(room.id).emit("roundFinished", { room });
        console.log(`Round finished in room ${roomId}`);
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
      io.to(room.id).emit("playerDisconnected", { playerId: socket.id, room });
    });
  });
});

// Start server
server.listen(PORT, () => {
  console.log(`🍺 Rock Paper Beer server running on port ${PORT}`);
  console.log(`🎮 Client URL should be: ${process.env.CLIENT_URL || "http://localhost:5173"}`);
});
