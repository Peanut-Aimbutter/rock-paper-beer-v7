# 🍺 Rock Paper Beer - Local Multiplayer

A local-first Rock Paper Beer multiplayer game migrated from Base44 to a Node.js + React stack with offline development capabilities.

## Game Rules

```
🪨 Rock beats 🍺 Beer
🍺 Beer beats 📄 Paper  
📄 Paper beats 🪨 Rock
```

## Architecture

- **Backend**: Node.js + Express + Socket.IO + TypeScript
- **Frontend**: React + Vite + TypeScript + TailwindCSS
- **Game Logic**: Shared TypeScript package
- **Real-time**: WebSocket connections for multiplayer sync
- **Theme**: Retro GameBoy Pokémon style

## Prerequisites

- Node.js 18+ 
- npm (comes with Node.js)

## Installation

```bash
# Clone the repository
git clone <your-repo-url>
cd rock-paper-beer-local

# Install all dependencies
npm install
```

## Development

### Start both server and client:
```bash
npm run dev
```

This will start:
- Backend server on `http://localhost:3001`
- Frontend dev server on `http://localhost:5173`

### Individual servers:
```bash
# Backend only
npm run dev:server

# Frontend only  
npm run dev:client
```

### Testing:
```bash
# Run all tests
npm run test

# Run tests for specific package
npm run test --workspace=packages/game-logic
```

### Code quality:
```bash
# Lint all code
npm run lint

# Format all code
npm run format
```

## How to Play

1. **Create a Room**: Open the app, enter your name, click "Create Room"
2. **Share Link**: Copy the room code/URL and share with a friend
3. **Join Room**: Friend opens the link, enters their name
4. **Start Game**: Both players click "Start Round"
5. **Choose Move**: Select Rock, Paper, or Beer (choices are hidden until both submit)
6. **See Results**: Both moves revealed, winner determined
7. **Play Again**: Click "Play Again" for another round

## Project Structure

```
rock-paper-beer-local/
├── apps/
│   ├── server/           # Node.js backend
│   └── client/          # React frontend
├── packages/
│   └── game-logic/      # Shared game logic & types
├── docs/                # Documentation
├── package.json          # Root package (monorepo)
└── tsconfig.json        # TypeScript config
```

### Key Components

**Backend (`apps/server/`)**
- `src/index.ts` - Express server with Socket.IO
- `src/room-manager.ts` - In-memory room management

**Frontend (`apps/client/`)**
- `src/App.tsx` - Main app component
- `src/components/Lobby.tsx` - Room creation/joining
- `src/components/Game.tsx` - Game board and gameplay
- `src/contexts/SocketContext.tsx` - WebSocket connection

**Shared Logic (`packages/game-logic/`)**
- `src/types.ts` - TypeScript types (Player, Room, Round, etc.)
- `src/game-logic.ts` - Game rules and winner determination
- `src/room-logic.ts` - Room state management functions

## Features

- ✅ **Real-time Multiplayer**: WebSocket-based synchronization
- ✅ **Offline-First Development**: Works without internet after setup
- ✅ **Beautiful UI**: Retro GameBoy theme with animations
- ✅ **Shareable Rooms**: Room codes for easy sharing
- ✅ **Type-Safe**: Full TypeScript implementation
- ✅ **Tested Logic**: Comprehensive game logic tests
- ✅ **Mobile Responsive**: Works on all device sizes

## Base44 Migration

This project successfully migrates the Base44 version to local development:

**From Base44:**
- Built-in realtime database → Socket.IO + in-memory rooms
- React + TypeScript + TailwindCSS → Same stack
- URL-based room sharing → Same approach
- GameBoy Pokémon theme → Recreated

**Local Enhancements:**
- Full TypeScript coverage
- Comprehensive testing
- Offline development
- Monorepo structure
- Clean separation of concerns

## API Endpoints

- `GET /health` - Health check
- `GET /debug/rooms` - View all rooms (development only)

## WebSocket Events

**Client → Server:**
- `createRoom` - Create new room
- `joinRoom` - Join existing room  
- `startRound` - Start new round
- `submitMove` - Submit player move

**Server → Client:**
- `roomCreated` - Room created successfully
- `roomUpdated` - Room state changed
- `roundStarted` - New round started
- `moveSubmitted` - Player move submitted
- `roundFinished` - Round completed with results
- `playerDisconnected` - Opponent disconnected
- `error` - Error occurred

## Deployment

The project is structured for easy deployment to any Node.js hosting service:

1. **Frontend**: `npm run build` in `apps/client/`
2. **Backend**: Deploy `apps/server/` to Node.js host
3. **Environment**: Set `CLIENT_URL` for production

## Contributing

1. Follow existing code style
2. Add tests for new features
3. Update documentation
4. Keep the GameBoy theme consistent!

## License

ISC License