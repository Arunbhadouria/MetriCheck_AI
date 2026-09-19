# 🚀 MetriCheck AI — Cloud PaaS Deployment Guide (Approach 2)

This guide walks you through deploying the complete MetriCheck AI platform using free, managed cloud tiers:
- **Database**: [Neon.tech](https://neon.tech) (Serverless PostgreSQL)
- **Backend API & AI Service**: [Render.com](https://render.com) (or Railway.app)
- **Frontend PWA**: [Vercel](https://vercel.com) (Edge CDN with automatic SSL & PWA support)

---

## 📋 Architecture Overview

```
                                  ┌───────────────────────────┐
                                  │      Vercel (Frontend)    │
                                  │    metri-check.vercel.app │
                                  │  (Vite React PWA + HTTPS) │
                                  └─────────────┬─────────────┘
                                                │
                                                ▼  HTTPS API Requests
┌───────────────────────────┐     ┌───────────────────────────┐
│     Neon PostgreSQL       │◄────┤     Render (API Gateway)  │
│  (Managed Free Postgres)  │     │   metricheck-api.onrender │
└───────────────────────────┘     └─────────────┬─────────────┘
                                                │
                                                ▼ Internal / HTTPS
                                  ┌───────────────────────────┐
                                  │    Render (AI Service)    │
                                  │    metricheck-ai.onrender │
                                  │  (FastAPI + Gemini Flash) │
                                  └───────────────────────────┘
```

---

## Step 1: Create Free PostgreSQL Database on Neon (2 mins)

1. Go to **[https://neon.tech](https://neon.tech)** and sign in with GitHub.
2. Click **"Create Project"**:
   - **Name**: `metricheck-db`
   - **Region**: Choose closest (e.g. Singapore `ap-southeast-1` or Frankfurt `eu-central-1`)
3. Copy the **Connection String** from the dashboard. It looks like:
   ```text
   postgresql://metricheck_owner:password@ep-cool-frost-123456.ap-southeast-1.aws.neon.tech/metricheck-db?sslmode=require
   ```
4. Save this connection string; you will paste it into Render as `DATABASE_URL`.
   *(Note: The API automatically creates all required tables and handles SSL securely on its first boot!)*

---

## Step 2: Deploy Backend API & AI Service on Render (3 mins)

We have already configured `render.yaml` in the root of your repository for **1-click Blueprint deployment**:

### Option A: 1-Click Render Blueprint (Fastest)
1. Go to **[https://dashboard.render.com](https://dashboard.render.com)**.
2. Click **New +** $\rightarrow$ **Blueprint**.
3. Connect your GitHub repository: `Arunbhadouria/MetriCheck_AI`.
4. Render will read `render.yaml` and discover both services:
   - `metricheck-api` (Node.js Express)
   - `metricheck-ai` (Python FastAPI)
5. Fill in the required environment variables:
   - For `metricheck-api`:
     - `DATABASE_URL`: Paste your Neon connection string from Step 1.
   - For `metricheck-ai`:
     - `GEMINI_API_KEY`: Paste your Google AI Studio Gemini key (from https://aistudio.google.com).
6. Click **Apply**.
7. Once deployed, copy your API URL:
   `https://metricheck-api.onrender.com`

---

## Step 3: Deploy Frontend PWA on Vercel (2 mins)

1. Go to **[https://vercel.com](https://vercel.com)** and sign in with GitHub.
2. Click **"Add New..."** $\rightarrow$ **"Project"**.
3. Import your repository: `Arunbhadouria/MetriCheck_AI`.
4. In **Project Settings**:
   - **Framework Preset**: `Vite`
   - **Root Directory**: `./` (or `apps/web`)
   - **Build Command**: `npm run build:types && npm run build:rules && npm run build --workspace=apps/web`
   - **Output Directory**: `apps/web/dist`
5. Under **Environment Variables**, add:
   - **Key**: `VITE_API_BASE_URL`
   - **Value**: `https://metricheck-api.onrender.com/api/v1` *(replace with your Render API URL from Step 2)*
6. Click **Deploy**.

---

## Step 4: Verify & Install PWA on Mobile! 📱

1. Open your Vercel URL on your mobile phone:
   `https://your-app-name.vercel.app`
2. **Android**:
   - Tap the bottom banner **"📲 ऐप इंस्टॉल करें • Install"** or the 3 dots in Chrome $\rightarrow$ **"Install App"**.
   - An official MetriCheck AI app icon will appear on your home screen!
3. **iPhone (iOS)**:
   - Tap the **Share [↑]** button in Safari $\rightarrow$ **"Add to Home Screen"**.
4. Test scanning a product:
   - Citizen mode: `/consumer/scan`
   - Inspector mode: `/inspector/inspections/new`
