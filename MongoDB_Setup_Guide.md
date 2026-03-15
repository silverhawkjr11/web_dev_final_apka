# MongoDB Atlas Setup Guide

## Quick Cloud Database Setup (5 minutes)

1. **Create Free Account**: 
   - Go to https://www.mongodb.com/cloud/atlas
   - Click "Start free" and create account

2. **Create Cluster**:
   - Choose "M0 Sandbox" (FREE)
   - Select any region close to you
   - Click "Create Cluster"

3. **Get Connection String**:
   - Click "Connect" on your cluster
   - Choose "Connect your application"
   - Copy the connection string (looks like):
   ```
   mongodb+srv://username:<password>@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority
   ```

4. **Update Your Server Config**:
   - Open: `server/.env`
   - Replace the MONGODB_URI line with your connection string
   - Replace `<password>` with your actual password

5. **Restart Server**:
   ```bash
   cd server
   npm run dev
   ```

## Connection String Format:
```env
MONGODB_URI=mongodb+srv://yourusername:yourpassword@cluster0.xxxxx.mongodb.net/apka-travel?retryWrites=true&w=majority
```

**✅ This will fix your registration immediately!**