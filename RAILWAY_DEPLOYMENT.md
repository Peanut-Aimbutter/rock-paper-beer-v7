# Railway.app Deployment Guide

This guide will help you deploy your Rock Paper Beer backend to Railway.app (completely free).

## Why Railway.app?

✅ **Completely free** - no credit card required
✅ **Supports Socket.IO** - perfect for real-time games
✅ **Easy deployment** - just connect your GitHub repo
✅ **Auto-deploys** - updates when you push to GitHub
✅ **Custom domains** - can use your own domain

---

## Step 1: Push to GitHub

First, push your code to GitHub (if not already done):

```bash
cd rock-paper-beer-local
git add .
git commit -m "Add Firebase deployment and Railway configs"
git push origin main
```

---

## Step 2: Deploy to Railway.app (Web Interface)

### Option A: Deploy from GitHub (Recommended)

1. **Go to Railway.app**: https://railway.app/new
2. **Click "Deploy from GitHub repo"**
3. **Select your repository**: `Peanut-Aimbutter/Rock-paper-beer` (or your repo name)
4. **Select branch**: `main` or `master`
5. **Configure deployment**:
   - **Root directory**: `apps/server`
   - **Build command**: `npm run build`
   - **Start command**: `npm start`
   - **Port**: `3001`
6. **Click "Deploy"**

Railway will:
- Clone your repo
- Install dependencies
- Build your server
- Start it on a free URL like: `https://rock-paper-beer-server.up.railway.app`

### Option B: Manual Deployment

1. **Go to Railway.app**: https://railway.app/new
2. **Click "New Project"**
3. **Select "Empty Project"**
4. **Click "New Service"**
5. **Select "Dockerfile"** or "Nixpacks"**
6. **Upload your code** or connect GitHub repo

---

## Step 3: Get Your Railway URL

After deployment, Railway will give you a URL like:
```
https://your-app-name.up.railway.app
```

Copy this URL - you'll need it for the next step.

---

## Step 4: Update Frontend to Connect to Railway

Create a `.env` file in `apps/client/`:

```bash
cd apps/client
notepad .env
```

Add this line (replace with your Railway URL):
```
VITE_SOCKET_URL=https://your-app-name.up.railway.app
```

---

## Step 5: Deploy Frontend to Firebase

```bash
cd rock-paper-beer-local
npm run build:client
firebase deploy --only hosting
```

---

## Step 6: Test Your Game

1. Open `https://rock-paper-beer-v5.web.app` in two browser tabs
2. Create a room in one tab
3. Join the room in the other tab
4. Play! 🎮

---

## Railway Configuration (Optional)

If you need to configure Railway settings:

### Environment Variables

Go to your Railway project → Settings → Variables:

```
NODE_ENV=production
PORT=3001
```

### Domains

Go to your Railway project → Settings → Domains:

You can add a custom domain like:
```
game.yourdomain.com
```

---

## Troubleshooting

### "Connection failed"

Make sure:
1. Railway service is running (green checkmark in Railway dashboard)
2. CORS is configured in `apps/server/src/index.ts`
3. Your Railway URL is correct in `.env` file

### "Room not found"

Make sure:
1. Both players are connected to the same Railway URL
2. Room code is correct (case-insensitive)

### "Deployment failed"

Check:
1. Build logs in Railway dashboard
2. Server logs for errors
3. Dependencies are installed correctly

---

## Cost

Railway.app is **completely free** for small projects:

- **$5/month free credit** (renews monthly)
- **512MB RAM** per service
- **Unlimited projects**
- **Unlimited deployments**

This is more than enough for a multiplayer game! 🎉

---

## Next Steps

1. Deploy backend to Railway.app using steps above
2. Get your Railway URL
3. Update frontend `.env` file
4. Deploy frontend to Firebase
5. Test with multiple players
6. Share your game with friends!

---

## Support

If you encounter issues:
1. Check Railway dashboard for logs
2. Check browser console for errors
3. Verify Railway URL is correct
4. Make sure CORS is configured properly

---

## Alternative: Render.com

If Railway doesn't work for you, try Render.com:

1. Go to: https://render.com
2. Click "New +"
3. Select "Web Service"
4. Connect your GitHub repo
5. Configure:
   - Root Directory: `apps/server`
   - Build Command: `npm run build`
   - Start Command: `npm start`
6. Deploy!

Render is also **completely free** and supports Socket.IO.
