# 🔧 **VERCEL ENVIRONMENT VARIABLE SETUP**

## **After Railway Backend is Deployed:**

### **Step 1: Get Your Railway Backend URL**
- Go to your Railway dashboard
- Copy the URL (e.g., `https://trading-bot-backend-production-xxxx.up.railway.app`)

### **Step 2: Set Environment Variable in Vercel**
1. Go to your Vercel project: https://vercel.com/amaddox123-gmailcoms-projects/reverse-inheritance-trading-bot
2. Click **"Settings"** tab
3. Click **"Environment Variables"** in the left sidebar
4. Click **"Add New"**
5. Set:
   - **Name**: `NEXT_PUBLIC_BACKEND_URL`
   - **Value**: `https://your-railway-url.up.railway.app` (replace with your actual Railway URL)
   - **Environment**: Select **Production** (and **Preview** if desired)
6. Click **"Save"**

### **Step 3: Redeploy Frontend**
1. Go to **"Deployments"** tab
2. Click **"Redeploy"** on the latest deployment
3. Wait for deployment to complete

### **Step 4: Test the Connection**
1. Visit your Vercel frontend URL
2. Open browser developer tools (F12)
3. Check console for any connection errors
4. Try connecting a wallet and starting the bot

## **Your Current Setup:**
- **Frontend**: ✅ Deployed on Vercel
- **Backend**: ⏳ Deploying to Railway
- **Connection**: ⏳ Waiting for Railway URL

## **Next Steps:**
1. Deploy backend to Railway
2. Set environment variable in Vercel
3. Test the complete system
4. Start trading! 🚀
