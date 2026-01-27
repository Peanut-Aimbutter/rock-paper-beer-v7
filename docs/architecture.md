# Architecture Overview

## System Architecture

Rock Paper Beer follows a clean monorepo architecture with clear separation of concerns:

```
┌─────────────────┐    WebSocket    ┌─────────────────┐
│   Frontend     │ ◄──────────────► │    Backend      │
│   (React)      │                 │   (Express)     │
│                │                 │                 │
│ - UI/UX        │                 │ - Room Mgmt     │
│ - Game State   │                 │ - Game Logic    │
│ - Socket.IO    │                 │ - Socket.IO     │
└─────────────────┘                 └─────────────────┘
        ▲                                   ▲
        │                                   │
        │                                   │
┌─────────────────┐              ┌─────────────────┐
│ Shared Types   │              │  In-Memory     │
│ & Game Logic   │ ◄────────────►│    Rooms       │
│                │              │                 │
│ - TypeScript   │              │ - Room State    │
│ - Validation   │              │ - Player Data   │
│ - Rules Engine │              │ - Round History│
└─────────────────┘              └─────────────────┘
```

## Components

### Frontend (apps/client/)

**Technology Stack:**
- React 18 with TypeScript
- Vite for development and building
- Socket.IO Client for real-time communication
- React Router for navigation
- Custom CSS with GameBoy theme

**Key Components:**
- `App.tsx` - Main application with routing
- `Lobby.tsx` - Room creation and joining interface
- `Game.tsx` - Game board, move selection, results
- `SocketContext.tsx` - WebSocket connection provider

**State Management:**
- React hooks (useState, useEffect)
- Context API for WebSocket connection
- Server-side authoritative state

### Backend (apps/server/)

**Technology Stack:**
- Node.js with Express
- Socket.IO for real-time communication
- TypeScript for type safety
- In-memory room storage (no external DB required)

**Key Components:**
- `index.ts` - Express server with Socket.IO handlers
- `room-manager.ts` - Room lifecycle and player management
- Health check and debug endpoints

**Room Management:**
- UUID-based room IDs
- 2-player maximum per room
- Automatic cleanup of empty rooms
- Real-time state broadcasting

### Shared Logic (packages/game-logic/)

**Core Functions:**
- `types.ts` - All TypeScript interfaces and enums
- `game-logic.ts` - Winner determination, move validation
- `room-logic.ts` - Room state management functions

**Game Rules:**
- Rock beats Beer
- Beer beats Paper  
- Paper beats Rock
- Draw detection and round management

## Data Flow

### Game Lifecycle

1. **Room Creation**
   ```
   Client → createRoom → Server → RoomManager → createRoom() → Room
   Server ← roomCreated ← emit ← Room
   ```

2. **Player Joins**
   ```
   Client → joinRoom → Server → RoomManager → addPlayerToRoom() → Room
   Server ← roomUpdated ← broadcast ← Room
   ```

3. **Round Start**
   ```
   Client → startRound → Server → RoomManager → startNewRound() → Room
   Server ← roundStarted ← broadcast ← Room
   ```

4. **Move Submission**
   ```
   Client → submitMove → Server → RoomManager → submitMove() → Room
   Server ← moveSubmitted ← broadcast ← Room
   ```

5. **Round Complete**
   ```
   RoomManager ← all moves submitted → decideWinner() → Result
   Server ← roundFinished ← broadcast ← Room + Result
   ```

### State Management

**Authoritative State:** Server-side RoomManager
- Single source of truth
- Prevents cheating and race conditions
- Handles concurrent moves properly

**Client State:** Derived from server events
- UI updates based on WebSocket events
- Local optimistic updates where appropriate
- Always syncs with server state

## WebSocket Events

### Client → Server
- `createRoom` - Create new game room
- `joinRoom` - Join existing room
- `startRound` - Begin new round
- `submitMove` - Submit player choice

### Server → Client
- `roomCreated` - Room created successfully
- `roomUpdated` - Room state changed
- `roundStarted` - New round initiated
- `moveSubmitted` - Player move registered
- `roundFinished` - Round completed with results
- `playerDisconnected` - Opponent left game
- `error` - Error message

## Security Considerations

**Current Implementation:**
- Room IDs are UUIDs (not guessable)
- Server validates all moves
- No client-side authority over game state
- Input validation on all parameters

**Future Enhancements:**
- Rate limiting
- Room expiration
- Player authentication
- Sanitization of player names

## Offline Development

The architecture supports offline-first development:

- No external database required
- All development servers run locally
- Dependencies cached locally after npm install
- WebSocket connections work over localhost
- Full feature set available without internet

## Scalability Considerations

**Current Limitations:**
- In-memory storage (single server)
- No persistence across restarts
- No load balancing

**Future Scaling Options:**
- Redis for shared state
- Database persistence
- Horizontal scaling with Socket.IO adapters
- CDN for static assets

## Testing Strategy

**Unit Tests:** Game logic package
- Move validation
- Winner determination
- Room state management

**Integration Tests:** API endpoints
- Room creation/joining
- WebSocket event flow
- Error handling

**E2E Tests:** Full game flow
- Multiplayer gameplay
- UI interactions
- Real-time synchronization