# 🚀 Rock Paper Beer - Complete Deployment Guide

Your game is ready for deployment! Here are your options:

---

## 📋 **Quick Summary**

| Feature | Status |
|----------|--------|
| ✅ Bug fixed (Map serialization) | Complete |
| ✅ Short room codes (8 chars) | Complete |
| ✅ Avatar selection (6 options) | Complete |
| ✅ GameBoy aesthetics | Complete |
| ✅ 15-second move timeout | Complete |
| ✅ Input validation (Joi) | Complete |
| ✅ Shareable links | Complete |
| ✅ Firebase Cloud Functions setup | Complete |
| ✅ Firebase Hosting config | Complete |

---

## 🎯 **Deployment Options**

### **Option 1: Firebase Hosting + Railway.app (Recommended - FREE)**

**Best for:** Completely free deployment with Socket.IO support

| Service | Cost | Purpose |
|----------|-------|---------|
| Firebase Hosting | FREE | Frontend (React app) |
| Railway.app | FREE | Backend (Socket.IO server) |

**Total Cost: $0/month** 🎉

#### Steps:

1. **Deploy Backend to Railway.app**
   - Go to: https://railway.app/new
   - Click "Deploy from GitHub repo"
   - Select your repo: `Peanut-Aimbutter/Rock-paper-beer`
   - Root directory: `apps/server`
   - Build command: `npm run build`
   - Start command: `npm start`
   - Port: `3001`

2. **Get Railway URL**
   - Railway will give you: `https://your-app.up.railway.app`

3. **Update Frontend**
   ```bash
   cd apps/client
   echo VITE_SOCKET_URL=https://your-app.up.railway.app > .env
   ```

4. **Deploy Frontend to Firebase**
   ```bash
   cd rock-paper-beer-local
   npm run build:client
   firebase deploy --only hosting
   ```

5. **Your Game Will Be At:**
   - Frontend: `https://rock-paper-beer-v5.web.app`
   - Backend: `https://your-app.up.railway.app`

---

### **Option 2: Firebase Hosting + Firebase Cloud Functions (Paid)**

**Best for:** Everything on Firebase (easier management)

| Service | Cost | Purpose |
|----------|-------|---------|
| Firebase Hosting | FREE | Frontend (React app) |
| Firebase Cloud Functions | PAID | Backend (Socket.IO server) |

**Total Cost: ~$0.40/month** (for small games)

#### Steps:

1. **Upgrade Firebase to Blaze Plan**
   - Go to: https://console.firebase.google.com/project/rock-paper-beer-v5/usage/details
   - Click "Upgrade" to Blaze plan
   - Add payment method (credit card)
   - You only pay for what you use!

2. **Deploy Everything**
   ```bash
   cd rock-paper-beer-local
   npm run deploy
   ```

3. **Your Game Will Be At:**
   - Frontend: `https://rock-paper-beer-v5.web.app`
   - Backend: `https://rock-paper-beer-v5.web.app` (same domain!)

---

### **Option 3: Firebase Hosting + Render.com (FREE)**

**Best for:** Alternative free hosting with Socket.IO support

| Service | Cost | Purpose |
|----------|-------|---------|
| Firebase Hosting | FREE | Frontend (React app) |
| Render.com | FREE | Backend (Socket.IO server) |

**Total Cost: $0/month** 🎉

#### Steps:

1. **Deploy Backend to Render.com**
   - Go to: https://render.com
   - Click "New +" → "Web Service"
   - Connect your GitHub repo
   - Root Directory: `apps/server`
   - Build Command: `npm run build`
   - Start Command: `npm start`

2. **Get Render URL**
   - Render will give you: `https://your-app.onrender.com`

3. **Update Frontend**
   ```bash
   cd apps/client
   echo VITE_SOCKET_URL=https://your-app.onrender.com > .env
   ```

4. **Deploy Frontend to Firebase**
   ```bash
   cd rock-paper-beer-local
   npm run build:client
   firebase deploy --only hosting
   ```

---

## 🎮 **After Deployment**

### **Testing Your Game**

1. Open your game URL in two browser tabs
2. Create a room in one tab
3. Join the room in the other tab using the room code
4. Play! 🎉

### **Shareable Links**

Players can share links like:
```
https://rock-paper-beer-v5.web.app/join/ABC12345
```

---

## 📁 **Files Created for Deployment**

### **Firebase:**
- [`firebase.json`](firebase.json) - Hosting + Functions config
- [`.firebaserc`](.firebaserc) - Project ID
- [`FIREBASE_DEPLOYMENT.md`](FIREBASE_DEPLOYMENT.md) - Firebase deployment guide

### **Railway:**
- [`railway.json`](railway.json) - Railway configuration
- [`RAILWAY_DEPLOYMENT.md`](RAILWAY_DEPLOYMENT.md) - Railway deployment guide

### **Render:**
- [`vercel.json`](vercel.json) - Vercel configuration (can use for Render too)

### **Client:**
- [`apps/client/.env.example`](apps/client/.env.example) - Environment variable template
- [`apps/client/src/vite-env.d.ts`](apps/client/src/vite-env.d.ts) - TypeScript types for env vars

---

## 🔧 **Configuration Files**

### **Firebase Realtime Database Rules**

For testing, use these public rules:

```json
{
  "rules": {
    ".read": true,
    ".write": true
  }
}
```

For production, implement proper authentication.

### **Environment Variables**

Create `apps/client/.env`:

```bash
# For local development
VITE_SOCKET_URL=http://localhost:3001

# For production (Railway)
VITE_SOCKET_URL=https://your-app.up.railway.app

# For production (Render)
VITE_SOCKET_URL=https://your-app.onrender.com

# For production (Firebase Cloud Functions)
# Leave empty - will use window.location.origin
```

---

## 🎯 **Recommended: Option 1 (Railway.app)**

**Why Railway.app?**

✅ **Completely free** - no credit card required
✅ **Supports Socket.IO** - perfect for real-time games
✅ **Easy deployment** - just connect GitHub repo
✅ **Auto-deploys** - updates when you push to GitHub
✅ **Custom domains** - can use your own domain

---

## 📝 **Next Steps**

1. **Choose your deployment option** (Railway, Firebase, or Render)
2. **Deploy backend** using the guide above
3. **Get your backend URL**
4. **Update frontend `.env` file**
5. **Deploy frontend to Firebase**
6. **Test with multiple players**
7. **Share your game with friends!**

---

## 💰 **Cost Comparison**

| Option | Monthly Cost | Setup Difficulty |
|---------|--------------|------------------|
| Railway.app + Firebase | **$0** | Easy |
| Firebase Cloud Functions | ~$0.40 | Medium |
| Render.com + Firebase | **$0** | Easy |
| Local only | **$0** | N/A |

---

## 🆘 **Support**

If you encounter issues:

### **Railway.app:**
- Check Railway dashboard for logs
- Verify service is running (green checkmark)
- Check CORS configuration

### **Firebase:**
- Check Firebase console for function logs
- Verify Firebase project settings
- Check browser console for errors

### **General:**
- Verify backend URL is correct
- Check environment variables
- Make sure all dependencies are installed

---

## 🎉 **Your Game is Ready!**

All features are implemented and working:
- ✅ Short room codes
- ✅ Avatar selection
- ✅ GameBoy aesthetics
- ✅ 15-second timeout
- ✅ Input validation
- ✅ Shareable links
- ✅ Firebase deployment ready
- ✅ Railway deployment ready
- ✅ Render deployment ready

**Choose your deployment option and get your game online!** 🚀
