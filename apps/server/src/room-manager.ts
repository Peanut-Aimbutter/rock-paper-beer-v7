import {
  Room,
  Player,
  createRoom,
  addPlayerToRoom,
  removePlayerFromRoom,
  startNewRound,
  submitMove as submitGameMove,
  getCurrentRound,
} from "@rock-paper-beer/game-logic";

export class RoomManager {
  private rooms = new Map<string, Room>();

  /**
   * Create a new room
   */
  createRoom(playerId: string, playerName: string): Room {
    const room = createRoom(playerId, playerName);
    this.rooms.set(room.id, room);
    return room;
  }

  /**
   * Get a room by ID
   */
  getRoom(roomId: string): Room | null {
    return this.rooms.get(roomId) || null;
  }

  /**
   * Join an existing room
   */
  joinRoom(roomId: string, playerId: string, playerName: string): Room {
    const room = this.getRoom(roomId);
    if (!room) {
      throw new Error("Room not found");
    }

    const updatedRoom = addPlayerToRoom(room, playerId, playerName);
    this.rooms.set(roomId, updatedRoom);
    return updatedRoom;
  }

  /**
   * Remove a player from all rooms they're in
   */
  removePlayerFromAllRooms(playerId: string): Room[] {
    const affectedRooms: Room[] = [];

    for (const [roomId, room] of this.rooms.entries()) {
      if (room.players.some((p) => p.id === playerId)) {
        const updatedRoom = removePlayerFromRoom(room, playerId);

        // If room is empty, delete it
        if (updatedRoom.players.length === 0) {
          this.rooms.delete(roomId);
        } else {
          this.rooms.set(roomId, updatedRoom);
          affectedRooms.push(updatedRoom);
        }
      }
    }

    return affectedRooms;
  }

  /**
   * Start a new round in a room
   */
  startNewRound(roomId: string): Room {
    const room = this.getRoom(roomId);
    if (!room) {
      throw new Error("Room not found");
    }

    if (room.players.length < 2) {
      throw new Error("Not enough players to start a round");
    }

    const updatedRoom = startNewRound(room);
    this.rooms.set(roomId, updatedRoom);
    return updatedRoom;
  }

  /**
   * Submit a move for a player
   */
  submitMove(roomId: string, playerId: string, move: string): Room {
    const room = this.getRoom(roomId);
    if (!room) {
      throw new Error("Room not found");
    }

    const updatedRoom = submitGameMove(room, playerId, move);
    this.rooms.set(roomId, updatedRoom);
    return updatedRoom;
  }

  /**
   * Get all rooms (for debugging)
   */
  getAllRooms(): Room[] {
    return Array.from(this.rooms.values());
  }

  /**
   * Clean up old rooms (could be called periodically)
   */
  cleanup(): void {
    const now = Date.now();
    const TIMEOUT = 24 * 60 * 60 * 1000; // 24 hours

    for (const [roomId, room] of this.rooms.entries()) {
      if (now - room.updatedAt.getTime() > TIMEOUT) {
        this.rooms.delete(roomId);
        console.log(`Cleaned up old room: ${roomId}`);
      }
    }
  }

  /**
   * Clear all rooms (for debugging)
   */
  clearAllRooms(): void {
    this.rooms.clear();
  }
}
