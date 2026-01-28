"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.io = exports.api = void 0;
const functions = __importStar(require("firebase-functions"));
const admin = __importStar(require("firebase-admin"));
const socket_io_1 = require("socket.io");
const http_1 = require("http");
const game_logic_1 = require("../game-logic");
// Initialize Firebase Admin
admin.initializeApp();
const db = admin.database();
// Create HTTP server for Socket.IO
const httpServer = (0, http_1.createServer)();
// Configure Socket.IO with Firebase Cloud Functions
const io = new socket_io_1.Server(httpServer, {
    cors: {
        origin: ['https://rock-paper-beer-v5.web.app', 'https://rock-paper-beer-v5.firebaseapp.com', 'http://localhost:5173'],
        methods: ['GET', 'POST'],
        credentials: true,
    },
    transports: ['websocket', 'polling'],
});
exports.io = io;
// Constants
const MOVE_TIMEOUT_MS = 15000; // 15 seconds to make a move
const ROOMS_REF = '/rooms';
// Track active round timeouts
const roundTimeouts = new Map();
// Helper function to get room from Firebase
async function getRoomFromFirebase(roomId) {
    const snapshot = await db.ref(`${ROOMS_REF}/${roomId}`).once('value');
    const data = snapshot.val();
    if (!data)
        return null;
    // Convert Firebase data back to Room object
    return {
        id: data.id,
        code: data.code,
        players: data.players || [],
        rounds: data.rounds || [],
        gamePhase: data.gamePhase || 'lobby',
        currentRound: data.currentRound || 0,
        createdAt: new Date(data.createdAt),
        updatedAt: new Date(data.updatedAt),
    };
}
// Helper function to save room to Firebase
async function saveRoomToFirebase(room) {
    await db.ref(`${ROOMS_REF}/${room.id}`).set({
        id: room.id,
        code: room.code,
        players: room.players,
        rounds: room.rounds,
        gamePhase: room.gamePhase,
        createdAt: room.createdAt.toISOString(),
        updatedAt: room.updatedAt.toISOString(),
    });
}
// Helper function to auto-submit random moves for players who timeout
async function handleMoveTimeout(roomId) {
    const room = await getRoomFromFirebase(roomId);
    if (!room || room.gamePhase !== 'round')
        return;
    const currentRound = room.rounds[room.rounds.length - 1];
    if (!currentRound || currentRound.state !== 'waiting')
        return;
    // Find players who haven't submitted moves
    for (const player of room.players) {
        if (!(player.id in currentRound.moves)) {
            console.log(`Timeout: Auto-submitting random move for ${player.name} in room ${roomId}`);
            try {
                const randomMove = (0, game_logic_1.getRandomMove)();
                const updatedRoom = (0, game_logic_1.submitMove)(room, player.id, randomMove);
                await saveRoomToFirebase(updatedRoom);
                io.to(updatedRoom.id).emit('moveSubmitted', { room: updatedRoom, timeout: true, playerId: player.id });
                // Check if round is now finished
                const newRound = updatedRoom.rounds[updatedRoom.rounds.length - 1];
                if (newRound && newRound.state === 'finished') {
                    io.to(updatedRoom.id).emit('roundFinished', { room: updatedRoom });
                    console.log(`Round finished in room ${roomId} (after timeout)`);
                }
            }
            catch (error) {
                console.error(`Error auto-submitting move: ${error}`);
            }
        }
    }
}
// Socket.IO connection handling
io.on('connection', (socket) => {
    console.log(`User connected: ${socket.id}`);
    // Create a new room
    socket.on('createRoom', async (data) => {
        try {
            const room = (0, game_logic_1.createRoom)(socket.id, data.playerName, data.avatar);
            await saveRoomToFirebase(room);
            socket.join(room.id);
            socket.emit('roomCreated', { room });
            socket.emit('roomUpdated', { room });
            console.log(`Room created: ${room.code} (${room.id}) by ${data.playerName}`);
        }
        catch (error) {
            socket.emit('error', {
                message: error instanceof Error ? error.message : 'Failed to create room',
            });
        }
    });
    // Get room data
    socket.on('getRoom', async (data) => {
        try {
            const room = await getRoomFromFirebase(data.roomId);
            if (!room) {
                socket.emit('error', { message: 'Room not found' });
                return;
            }
            socket.emit('roomData', { room });
        }
        catch (error) {
            socket.emit('error', {
                message: error instanceof Error ? error.message : 'Failed to get room',
            });
        }
    });
    // Join an existing room (supports both room ID and short code)
    socket.on('joinRoom', async (data) => {
        try {
            let room = null;
            // Support joining by short code
            if (data.roomCode) {
                const roomsSnapshot = await db.ref(ROOMS_REF).once('value');
                const rooms = roomsSnapshot.val();
                if (rooms) {
                    const normalizedCode = data.roomCode.toUpperCase();
                    for (const roomId in rooms) {
                        if (rooms[roomId].code === normalizedCode) {
                            room = await getRoomFromFirebase(roomId);
                            break;
                        }
                    }
                }
                if (!room) {
                    socket.emit('error', { message: 'Room not found with that code' });
                    return;
                }
            }
            else if (data.roomId) {
                room = await getRoomFromFirebase(data.roomId);
            }
            else {
                socket.emit('error', { message: 'Room ID or code required' });
                return;
            }
            if (!room) {
                socket.emit('error', { message: 'Room not found' });
                return;
            }
            const updatedRoom = (0, game_logic_1.addPlayerToRoom)(room, socket.id, data.playerName, data.avatar);
            await saveRoomToFirebase(updatedRoom);
            socket.join(updatedRoom.id);
            // Broadcast updated room state to all players
            io.to(updatedRoom.id).emit('roomUpdated', { room: updatedRoom });
            console.log(`Player ${data.playerName} joined room ${updatedRoom.code} (${updatedRoom.id})`);
        }
        catch (error) {
            socket.emit('error', {
                message: error instanceof Error ? error.message : 'Failed to join room',
            });
        }
    });
    // Start a new round
    socket.on('startRound', async (data) => {
        try {
            const room = await getRoomFromFirebase(data.roomId);
            if (!room) {
                socket.emit('error', { message: 'Room not found' });
                return;
            }
            if (room.players.length < 2) {
                socket.emit('error', { message: 'Not enough players to start a round' });
                return;
            }
            const updatedRoom = (0, game_logic_1.startNewRound)(room);
            await saveRoomToFirebase(updatedRoom);
            // Clear any existing timeout for this room
            const existingTimeout = roundTimeouts.get(updatedRoom.id);
            if (existingTimeout) {
                clearTimeout(existingTimeout);
            }
            // Set timeout for auto-submitting moves
            const timeout = setTimeout(() => {
                handleMoveTimeout(updatedRoom.id);
                roundTimeouts.delete(updatedRoom.id);
            }, MOVE_TIMEOUT_MS);
            roundTimeouts.set(updatedRoom.id, timeout);
            // Broadcast to all players in the room
            io.to(updatedRoom.id).emit('roundStarted', { room: updatedRoom, timeoutMs: MOVE_TIMEOUT_MS });
            io.to(updatedRoom.id).emit('roomUpdated', { room: updatedRoom });
        }
        catch (error) {
            socket.emit('error', {
                message: error instanceof Error ? error.message : 'Failed to start round',
            });
        }
    });
    // Submit a move
    socket.on('submitMove', async (data) => {
        try {
            const room = await getRoomFromFirebase(data.roomId);
            if (!room) {
                socket.emit('error', { message: 'Room not found' });
                return;
            }
            const updatedRoom = (0, game_logic_1.submitMove)(room, socket.id, data.move);
            await saveRoomToFirebase(updatedRoom);
            io.to(updatedRoom.id).emit('moveSubmitted', { room: updatedRoom });
            // If all players have submitted, reveal results and clear timeout
            const currentRound = updatedRoom.rounds[updatedRoom.rounds.length - 1];
            if (currentRound && currentRound.state === 'finished') {
                // Clear the timeout since round is complete
                const existingTimeout = roundTimeouts.get(updatedRoom.id);
                if (existingTimeout) {
                    clearTimeout(existingTimeout);
                    roundTimeouts.delete(updatedRoom.id);
                }
                // Calculate and broadcast results
                io.to(updatedRoom.id).emit('roundFinished', { room: updatedRoom });
                console.log(`Round finished in room ${data.roomId}`);
            }
        }
        catch (error) {
            socket.emit('error', {
                message: error instanceof Error ? error.message : 'Failed to submit move',
            });
        }
    });
    // Handle disconnection
    socket.on('disconnect', async () => {
        console.log(`User disconnected: ${socket.id}`);
        // Find all rooms this player is in
        const roomsSnapshot = await db.ref(ROOMS_REF).once('value');
        const rooms = roomsSnapshot.val();
        if (rooms) {
            for (const roomId in rooms) {
                const roomData = rooms[roomId];
                const playerIndex = roomData.players.findIndex((p) => p.id === socket.id);
                if (playerIndex !== -1) {
                    const room = {
                        id: roomData.id,
                        code: roomData.code,
                        players: roomData.players,
                        rounds: roomData.rounds,
                        gamePhase: roomData.gamePhase,
                        currentRound: roomData.currentRound || 0,
                        createdAt: new Date(roomData.createdAt),
                        updatedAt: new Date(roomData.updatedAt),
                    };
                    const updatedRoom = (0, game_logic_1.removePlayerFromRoom)(room, socket.id);
                    // Clear any timeouts for rooms where a player disconnected
                    const existingTimeout = roundTimeouts.get(room.id);
                    if (existingTimeout) {
                        clearTimeout(existingTimeout);
                        roundTimeouts.delete(room.id);
                    }
                    // If room is empty, delete it
                    if (updatedRoom.players.length === 0) {
                        await db.ref(`${ROOMS_REF}/${room.id}`).remove();
                        console.log(`Deleted empty room: ${room.id}`);
                    }
                    else {
                        await saveRoomToFirebase(updatedRoom);
                        io.to(room.id).emit('playerDisconnected', { playerId: socket.id, room: updatedRoom });
                    }
                }
            }
        }
    });
});
// Export the Socket.IO server as a Cloud Function
exports.api = functions.https.onRequest((req, res) => {
    // This is a workaround to keep the Socket.IO server alive
    // The actual Socket.IO connection is handled by the io instance above
    res.status(200).send('Socket.IO server is running');
});
//# sourceMappingURL=index.js.map