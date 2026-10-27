# 🚀 Production Deployment Guide: Render (Backend) + Vercel (Frontend)

This guide walks you through deploying **Social CaptionFlow** to production in under 5 minutes:
- **Backend (FastAPI + FFmpeg + Groq)** ➔ [Render.com](https://render.com)
- **Frontend (Next.js 16)** ➔ [Vercel.com](https://vercel.com)

---

## 🟢 Part 1: Deploy Backend to Render

### Option A: 1-Click Blueprint (Recommended)
1. Go to [Render Dashboard](https://dashboard.render.com/) and click **New +** ➔ **Blueprint**.
2. Connect your GitHub repository: `Social-CaptionFlow-NextJS`.
3. Render will automatically detect [`render.yaml`](./render.yaml) and configure:
   - Root directory: `backend`
   - Build Command: `chmod +x build.sh && ./build.sh`
   - Start Command: `python run.py`
4. Enter your environment variables when prompted:
   - `GROQ_API_KEY`: Your Groq API key (`gsk_...`)
   - `GEMINI_API_KEY`: Your Gemini API key (optional backup)
5. Click **Apply**.

---

### Option B: Manual Web Service
1. Click **New +** ➔ **Web Service**.
2. Select your repository `Social-CaptionFlow-NextJS`.
3. Fill in the following details:
   - **Name:** `social-captionflow-backend` (or your choice)
   - **Language / Runtime:** `Python 3`
   - **Region:** `Oregon (US West)` or `Frankfurt (EU)`
   - **Branch:** `main`
   - **Root Directory:** `backend`
   - **Build Command:** `chmod +x build.sh && ./build.sh`
   - **Start Command:** `python run.py`
   - **Instance Type:** `Free` (512 MB RAM, 0.1 CPU)
4. Add the following **Environment Variables** in Render:

| Key | Value | Notes |
| :--- | :--- | :--- |
| `GROQ_API_KEY` | `gsk_...` | **Required** for instant cloud transcription & 0% local RAM load |
| `GEMINI_API_KEY` | `AQ...` | Translation fallback |
| `GROQ_WHISPER_MODEL` | `whisper-large-v3-turbo` | Highest speed model |
| `CORS_ORIGINS` | `*` | Or set to your Vercel URL (e.g. `https://my-app.vercel.app`) |
| `WHISPER_MODEL` | `tiny` | Default local fallback model |
| `MAX_VIDEO_DURATION_SECONDS` | `180` | 3 minutes maximum |
| `MAX_VIDEO_SIZE_MB` | `100` | 100 MB maximum |

5. Click **Deploy Web Service**.
6. Once deployed, copy your backend URL (e.g. `https://social-captionflow-backend.onrender.com`).

---

## 🔺 Part 2: Deploy Frontend to Vercel

1. Go to [Vercel Dashboard](https://vercel.com/) and click **Add New...** ➔ **Project**.
2. Import your GitHub repository: `Social-CaptionFlow-NextJS`.
3. In the **Configure Project** screen:
   - **Project Name:** `social-captionflow` (or any name)
   - **Framework Preset:** `Next.js`
   - **Root Directory:** Click **Edit** and choose `frontend` ⚠️ *(CRITICAL STEP)*
4. Under **Environment Variables**, add:

| Key | Value |
| :--- | :--- |
| `NEXT_PUBLIC_API_URL` | `https://social-captionflow-backend.onrender.com` *(Your Render backend URL from Part 1, without trailing slash)* |

5. Click **Deploy**.
6. Vercel will build the Next.js project and provide your live production URL (e.g., `https://social-captionflow.vercel.app`).

---

## 🔄 Part 3: Connect & Test

1. Open your live Vercel website in the browser.
2. If your Render backend was sleeping, the website will display a friendly *"Waking up server..."* status on the top right.
3. Upload any MP4/MOV video (under 3 minutes & under 100MB).
4. Click **Generate Subtitles** — Groq will process the audio in 1-2 seconds and display live synchronized subtitles!
