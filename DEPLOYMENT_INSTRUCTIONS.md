# 🚀 **DEPLOYMENT INSTRUCTIONS - TRADING BOT**

## ✅ **GITHUB REPOSITORIES CREATED**

### **Backend Repository**
- **URL**: https://github.com/puppetortega11/trading-bot-backend
- **Status**: ✅ Pushed and ready for deployment
- **Branch**: `main`

### **Frontend Repository**  
- **URL**: https://github.com/puppetortega11/trading-bot-frontend
- **Status**: ✅ Pushed and ready for deployment
- **Branch**: `main`

---

## 🚂 **RAILWAY DEPLOYMENT (Backend)**

### **Step 1: Deploy to Railway**
1. Go to [railway.app](https://railway.app)
2. Sign in with your GitHub account
3. Click **"New Project"**
4. Select **"Deploy from GitHub repo"**
5. Choose: `puppetortega11/trading-bot-backend`
6. Railway will automatically detect the `railway.toml` configuration
7. Click **"Deploy"**

### **Step 2: Get Backend URL**
- After deployment, Railway will provide a URL like: `https://trading-bot-backend-production-xxxx.up.railway.app`
- **Save this URL** - you'll need it for the frontend

### **Step 3: Environment Variables (if needed)**
- `PORT`: Railway will set this automatically
- `SOLANA_RPC_URL`: Defaults to devnet (can be changed in Railway dashboard)

---

## ⚡ **VERCEL DEPLOYMENT (Frontend)**

### **Step 1: Deploy to Vercel**
1. Go to [vercel.com](https://vercel.com)
2. Sign in with your GitHub account
3. Click **"New Project"**
4. Select: `puppetortega11/trading-bot-frontend`
5. Vercel will automatically detect it's a static site
6. Click **"Deploy"**

### **Step 2: Set Environment Variable**
1. In Vercel dashboard, go to your project
2. Click **"Settings"** tab
3. Click **"Environment Variables"**
4. Add new variable:
   - **Name**: `NEXT_PUBLIC_BACKEND_URL`
   - **Value**: Your Railway backend URL (from Step 2 above)
   - **Environment**: Production (and Preview if desired)
5. Click **"Save"**
6. Go to **"Deployments"** and click **"Redeploy"** on the latest deployment

---

## 🔗 **CONNECTING FRONTEND TO BACKEND**

### **Update Frontend Configuration**
The frontend needs to know your backend URL. Update the `index.html` file:

```javascript
// Replace this line in index.html:
const BACKEND_URL = 'http://localhost:8000';

// With your Railway URL:
const BACKEND_URL = 'https://your-railway-url.up.railway.app';
```

### **Or Use Environment Variable (Recommended)**
The frontend will automatically use the `NEXT_PUBLIC_BACKEND_URL` environment variable if set in Vercel.

---

## 🧪 **TESTING YOUR DEPLOYMENT**

### **Backend Health Check**
Visit: `https://your-railway-url.up.railway.app/health`
- Should return: `{"status":"healthy","timestamp":"...","version":"2.0.0"}`

### **Frontend Interface**
Visit your Vercel URL
- Should show the trading bot interface
- Wallet connection should work
- Bot controls should be functional

---

## 🎯 **READY TO TRADE!**

Once both deployments are complete:

1. **Connect your Solana wallet** (Phantom/Solflare)
2. **Select a trading strategy** (momentum/market_making/dip_buy)
3. **Start the bot** and watch it trade!
4. **Monitor your P&L** in real-time

---

## 📊 **DEPLOYMENT CHECKLIST**

- [ ] Backend deployed to Railway
- [ ] Frontend deployed to Vercel  
- [ ] Environment variable set in Vercel
- [ ] Backend health check passes
- [ ] Frontend loads correctly
- [ ] Wallet connection works
- [ ] Bot can start/stop
- [ ] Trading simulation runs

---

## 🆘 **TROUBLESHOOTING**

### **Backend Issues**
- Check Railway logs in the dashboard
- Verify `railway.toml` configuration
- Ensure all dependencies are in `package.json`

### **Frontend Issues**  
- Check Vercel build logs
- Verify environment variable is set
- Check browser console for errors
- Ensure backend URL is correct

### **Connection Issues**
- Verify CORS is enabled in backend
- Check that both services are running
- Test backend health endpoint directly

---

## 🎉 **SUCCESS!**

Your trading bot is now live and ready for production trading! 🚀

**Backend**: https://your-railway-url.up.railway.app
**Frontend**: https://your-netlify-url.netlify.app
