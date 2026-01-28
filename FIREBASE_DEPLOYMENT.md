# Firebase Deployment Guide

This guide will help you deploy your Rock Paper Beer game to Firebase Hosting and Cloud Functions.

## Prerequisites

1. **Node.js 20+** installed
2. **Firebase CLI** installed: `npm install -g firebase-tools`
3. **Firebase account** with a project created

## Setup Steps

### 1. Login to Firebase

```bash
firebase login
```

This will open a browser window for you to authenticate.

### 2. Initialize Firebase (if not already done)

```bash
cd rock-paper-beer-local
firebase init
```

Select:
- **Hosting**: Configure files for Firebase Hosting
- **Functions**: Configure Cloud Functions
- **Use an existing project**: Select `rock-paper-beer-v5`
- **Public directory**: `apps/client/dist`
- **Configure as single-page app**: Yes
- **Set up automatic builds**: No

### 3. Build the Client

```bash
cd rock-paper-beer-local
npm run build:client
```

This will build the React app and place it in `apps/client/dist`.

### 4. Build the Functions

```bash
cd rock-paper-beer-local/functions
npm run build
```

This will compile the TypeScript functions to `functions/lib`.

### 5. Deploy to Firebase

```bash
cd rock-paper-beer-local
firebase deploy
```

This will deploy:
- **Hosting**: Your React frontend
- **Functions**: Your Socket.IO backend

## Your Game Will Be Live At:

- **Frontend**: `https://rock-paper-beer-v5.web.app`
- **Functions**: `https://rock-paper-beer-v5.web.app/socket.io/`

## Testing

1. Open `https://rock-paper-beer-v5.web.app` in two browser tabs
2. Create a room in one tab
3. Join the room in the other tab using the room code
4. Play the game!

## Local Development

To run the game locally:

### Option 1: Run both client and server locally

```bash
# Terminal 1: Start the server
cd rock-paper-beer-local/apps/server
npm run dev

# Terminal 2: Start the client
cd rock-paper-beer-local/apps/client
npm run dev
```

### Option 2: Use Firebase emulators

```bash
cd rock-paper-beer-local
firebase emulators:start
```

This will run:
- Hosting emulator at `http://localhost:5000`
- Functions emulator at `http://localhost:5001`

## Environment Variables

For local development, create a `.env` file in `apps/client/`:

```bash
cd apps/client
cp .env.example .env
```

Edit `.env` to set your local server URL:

```
VITE_SOCKET_URL=http://localhost:3001
```

For production, leave `VITE_SOCKET_URL` empty (it will use `window.location.origin`).

## Firebase Realtime Database

The game uses Firebase Realtime Database to store room state. The database structure is:

```
/rooms
  /{roomId}
    id: string
    code: string
    players: Player[]
    rounds: Round[]
    gamePhase: 'lobby' | 'round' | 'reveal'
    currentRound: number
    createdAt: string (ISO date)
    updatedAt: string (ISO date)
```

## Troubleshooting

### "Functions deployment failed"

Make sure you've built the functions:

```bash
cd functions
npm run build
```

### "Hosting deployment failed"

Make sure you've built the client:

```bash
npm run build:client
```

### "Socket connection failed"

Check that:
1. Functions are deployed: `firebase functions:list`
2. Firebase Hosting rewrites are configured correctly in `firebase.json`
3. CORS is enabled in `functions/src/index.ts`

### "Room not found"

Make sure:
1. Firebase Realtime Database is enabled in your Firebase console
2. Database rules allow read/write access (for testing, use public rules)

## Database Rules

For testing, use these public rules in Firebase Console → Realtime Database → Rules:

```json
{
  "rules": {
    ".read": true,
    ".write": true
  }
}
```

For production, implement proper authentication and security rules.

## Cost

- **Firebase Hosting**: Free (up to 10GB/month)
- **Cloud Functions**: Free tier includes 2M invocations/month
- **Realtime Database**: Free tier includes 1GB stored, 10GB/month downloaded

This should be more than enough for a small multiplayer game!

## Next Steps

1. Deploy to Firebase using the steps above
2. Test the game with multiple players
3. Share the link with friends!
4. Consider adding authentication for production use
5. Implement proper database security rules

## Support

If you encounter issues:
1. Check Firebase console for function logs
2. Check browser console for client errors
3. Verify Firebase project settings
4. Ensure all dependencies are installed: `npm install`
