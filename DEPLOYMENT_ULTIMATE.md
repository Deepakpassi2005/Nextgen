# 🏆 Ultimate Deployment Roadmap: Asset-Manager & NextGen

This document provides an exhaustive, step-by-step technical guide for deploying the full stack. Follow each section precisely to ensure a successful launch.

---

## 📑 Table of Contents
1. [Prerequisites](#-prerequisites)
2. [Database Setup (MongoDB Atlas)](#1-database-setup-mongodb-atlas)
3. [Firebase Setup (Cloud Messaging)](#2-firebase-setup-cloud-messaging)
4. [Backend Deployment (Render)](#3-backend-deployment-render)
5. [Frontend Deployment (Vercel)](#4-frontend-deployment-vercel)
6. [Mobile App Build (NextGen - Google Play)](#5-mobile-app-build-nextgen---google-play)
7. [Post-Deployment Checklist](#-post-deployment-checklist)

---

## 🛠 Prerequisites
- GitHub repository with the latest code.
- Accounts on: [Render](https://render.com), [Vercel](https://vercel.com), [MongoDB Atlas](https://www.mongodb.com/cloud/atlas), [Expo](https://expo.dev), and [Google Play Console](https://play.google.com/console).

---

## 1. Database Setup (MongoDB Atlas)
1. Log in to [MongoDB Atlas](https://www.mongodb.com/).
2. Create a new **Shared Cluster** (Free).
3. Create a **Database User** (with read/write access).
4. In **Network Access**, add `0.0.0.0/0` (Allow all IP addresses for Render).
5. Click **Connect** > **Connect your application** and copy the **Connection String (URI)**.
   - *Example:* `mongodb+srv://<user>:<password>@cluster0.abcde.mongodb.net/asset-manager?retryWrites=true&w=majority`

---

## 2. Firebase Setup (Cloud Messaging)
1. Go to the [Firebase Console](https://console.firebase.google.com/).
2. Create/Open your project (`nextgen-app-f6e4e`).
3. **Download Admin SDK Key:**
   - Go to **Project Settings** > **Service accounts**.
   - Click **Generate new private key**.
   - Save the JSON file. You will need the `project_id`, `client_email`, and `private_key` for Render.
4. **Download Android Config:**
   - Go to **Project Settings** > **General**.
   - Download `google-services.json` and ensure it is placed in `/NextGen/google-services.json`.

---

## 3. Backend Deployment (Render)

### Step 1: Create Web Service
- Link your GitHub repo to Render.
- **Name:** `asset-manager-backend`
- **Root Directory:** `backend`
- **Runtime:** `Node`
- **Build Command:** `npm ci --include=dev && npm run build`
- **Start Command:** `npm start` (Runs `node dist/index.js`)

### Step 2: Environment Variables (CRITICAL)
| Category | Variable | Recommended Value |
| :--- | :--- | :--- |
| **Core** | `NODE_ENV` | `production` |
| | `MONGO_URI` | *Your MongoDB URI from Step 1* |
| | `JWT_SECRET` | *A secure random string* |
| | `SESSION_SECRET` | *Another secure random string* |
| | `FRONTEND_URL` | *Your Vercel URL (e.g., https://app.vercel.app)* |
| | `SERVE_FRONTEND` | `false` |
| **Email** | `SMTP_HOST` | `smtp.gmail.com` |
| | `SMTP_PORT` | `587` |
| | `SMTP_USER` | *Your Gmail/Email* |
| | `SMTP_PASS` | *Your App Password* |
| **Geo** | `SCHOOL_LAT` | `15.39585` |
| | `SCHOOL_LNG` | `73.81568` |
| | `PUNCH_RADIUS` | `2000` |
| **FCM** | `FCM_PROJECT_ID` | *From Step 2 JSON* |
| | `FCM_CLIENT_EMAIL`| *From Step 2 JSON* |
| | `FCM_PRIVATE_KEY` | *From Step 2 JSON (Keep in quotes!)* |

---

## 4. Frontend Deployment (Vercel)

### Step 1: Create Project
- Link GitHub repo to Vercel.
- **Root Directory:** `frontend`
- **Framework Preset:** `Vite`

### Step 2: Environment Variables
Add a single variable:
- **Key:** `VITE_API_URL`
- **Value:** `https://your-backend.onrender.com` (Your Render URL)

---

## 5. Mobile App Build (NextGen - Google Play)

### Step 1: Sync Production URL
In `NextGen/src/config.ts`, verify this line:
```typescript
const PRODUCTION_API_URL = process.env.EXPO_PUBLIC_API_URL || 'https://your-backend.onrender.com/api';
```

### Step 2: EAS Build
In the `NextGen` folder:
1. Install EAS CLI: `npm install -g eas-cli`
2. Log in: `eas login`
3. Configure: `eas build:configure` (Select Android)
4. Build: `eas build --platform android --profile production`
5. Download the `.aab` file from the link provided in the terminal.

### Step 3: Google Play Console Release
1. Create a new app in [Google Play Console](https://play.google.com/console/).
2. Navigate to **Release** > **Production**.
3. Create a **New Release** and upload the `.aab` file.
4. Fill in the **Store Listing**, **Privacy Policy**, and **App Content** forms.
5. Review and Release!

---

## ✅ Post-Deployment Checklist
1. **Health Check:** Visit `https://your-backend.onrender.com/api/health` (if implemented) or check Render logs to ensure no crashes.
2. **CORS Check:** Log into the Frontend and attempt to fetch data. If blocked, verify `FRONTEND_URL` in Render matches *exactly*.
3. **Login Check:** Ensure `JWT_SECRET` is the same across all backend instances if scaling.
4. **Push Check:** Verify notifications by sending a test notice from the Admin panel.

---

**Congratulations! Your Asset-Manager ecosystem is now live and professionally deployed.**
