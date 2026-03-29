# 🚀 Easy-Peasy Deployment Guide!

Welcome! This guide will help you put your school app on the internet so everyone can use it. Just follow these simple steps!

---

## 🏗️ PART 1: The Brain (Backend)
*We'll use a website called **Render** to run the "brain" of our app.*

### Step 1: Tell Render about your code
1. Go to [Render.com](https://dashboard.render.com/) and log in.
2. Click the big blue **"New +"** button and pick **"Web Service"**.
3. Choose your GitHub project from the list.

### Step 2: Fill in the boxes
- **Name:** `my-cool-school-brain`
- **Root Directory:** `backend`
- **Build Command:** `npm ci --include=dev && npm run build`
- **Start Command:** `npm start`

### Step 3: Add the Secret Ingredients (Environment Variables)
*Click "Advanced" and then "Add Environment Variable" for each one below:*

| What to name it (Key) | What to put inside (Value) |
| :--- | :--- |
| `MONGO_URI` | 🔑 Paste your MongoDB link here |
| `FRONTEND_URL` | 🏠 Paste your Vercel link here (get this in Part 2!) |
| `JWT_SECRET` | 🤫 Type a secret password (like `SuperSecret123!`) |
| `NODE_ENV` | `production` |
| `SERVE_FRONTEND` | `false` |

---

## 🎨 PART 2: The Face (Frontend)
*We'll use **Vercel** to show the pretty parts of our app.*

### Step 1: Give your code to Vercel
1. Go to [Vercel.com](https://vercel.com/) and log in.
2. Click **"Add New..."** then **"Project"**.
3. Pick your GitHub project.

### Step 2: Settings
- **Framework:** Pick `Vite`.
- **Root Directory:** `frontend`.

### Step 3: Connect to the Brain
*Find "Environment Variables" and add this:*
| What to name it | What to put inside |
| :--- | :--- |
| `VITE_API_URL` | 🧠 Paste your Render link (the one from Part 1!) |

---

## 📱 PART 3: The Phone App (NextGen)
*Time to get it on the Google Play Store!*

### Step 1: Fix the link
- Open the file `NextGen/src/config.ts`.
- Find `PRODUCTION_API_URL` and put your **Render link** there.

### Step 2: Build the App
1. Open your computer's terminal (the black box for typing).
2. Type this and press Enter:
   ```bash
   cd NextGen
   eas build --platform android --profile production
   ```
3. Wait for it to finish and download the file it gives you.

### Step 3: Send to Google
1. Go to the [Google Play Console](https://play.google.com/console/).
2. Click **"Create App"**.
3. Upload that file you just downloaded.
4. 🎉 You're done! Now Google will check it and it'll be live!

---

## ⚡ EXTRA POWERS (Optional)
*Once you're a pro, you can add these to make your app even cooler!*

### 📧 Email Powers
Add these to Render to send real emails:
- `SMTP_HOST`: `smtp.gmail.com`
- `SMTP_USER`: 📪 Your email
- `SMTP_PASS`: 🔑 Your special App Password

### 🔔 Notification Powers
Add these to Render for phone alerts:
- `FCM_PROJECT_ID`: 🆔 Your Firebase ID
- `FCM_CLIENT_EMAIL`: 📧 Your Firebase Email
- `FCM_PRIVATE_KEY`: 🔑 Your Firebase Secret Key

---

## 💡 Pro-Tips for Success!
- **Double Check:** Make sure you copy links exactly (don't forget the `https://`).
- **Wait a Bit:** It takes about 5 minutes for Render and Vercel to start up the first time.
- **Ask for Help:** If you see a red error, read it! It usually tells you what's missing.

**Great job! You just deployed a professional app! 🌟**
