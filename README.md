<div align="center">

# 🎬 Social CaptionFlow — AI Video Subtitles & Multi-Lingual Caption Generator

<p align="center">
  <strong>Modern full-stack AI media intelligence platform converting audio and video into timestamped captions, social media hooks, and multi-lingual translations (including Hinglish).</strong>
</p>

<p align="center">
  <a href="#-overview">Overview</a> •
  <a href="#-key-features">Key Features</a> •
  <a href="#-tech-stack--architecture">Tech Stack</a> •
  <a href="#-project-structure">Project Structure</a> •
  <a href="#-getting-started">Getting Started</a>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Category-AI%20Audio%20%26%20Video%20Intelligence-7c3aed?style=for-the-badge" alt="Category: AI Audio & Video Intelligence" />
  <img src="https://img.shields.io/badge/Tech%20Stack-Next.js%20%7C%20TypeScript%20%7C%20Tailwind%20CSS-10b981?style=for-the-badge" alt="Tech Stack: Next.js | TypeScript | Tailwind CSS" />
  <img src="https://img.shields.io/badge/Status-Production%20Ready-8b5cf6?style=for-the-badge" alt="Status: Production Ready" />
  <img src="https://img.shields.io/badge/License-MIT-f59e0b?style=for-the-badge" alt="License: MIT" />
</p>

</div>

---

## 📌 Overview

**Social CaptionFlow** automates the labor-intensive process of creating high-converting captions, viral social snippets, and translated subtitles for digital creators. Combining an ultra-responsive Next.js 16 frontend with a high-throughput Python FastAPI backend, it provides speech-to-text transcription via Whisper AI, LLM-powered summarization, and smart multi-lingual translation pipelines.

---

## ✨ Key Features

- 🎙️ **Speech-to-Text via Whisper**: Accurate local and cloud audio transcription powered by OpenAI Whisper and FFmpeg chunking.
- 🌐 **Hinglish & Multi-Lingual Translation**: Smart transliteration and translation layer supporting regional nuances and code-switching.
- ⚡ **Dual AI Engine Support**: Seamless fallback between Groq fast inference and Google Gemini multi-modal processing.
- 📱 **Next.js 16 Full-Stack Interface**: Clean dashboard built with React 19, Tailwind CSS v4, and Lucide React.
- ✂️ **Audio/Video Preprocessing**: Automated FFmpeg-based audio stripping, segment chunking, and file validation.

---

## 🛠️ Tech Stack & Architecture

| Layer | Technologies |
|---|---|
| **Frontend Web App** | Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS v4, Lucide React |
| **Backend Microservice** | Python 3.10+, FastAPI, Uvicorn (ASGI) |
| **Audio Processing** | OpenAI Whisper, FFmpeg (`imageio-ffmpeg`), NumPy |
| **AI & LLM Services** | Groq API, Google Gemini API |

---

## 📂 Project Structure

```text
Social-CaptionFlow-NextJS/
├── backend/
│   ├── app/                    # FastAPI application, routers & services
│   ├── requirements.txt        # Python backend dependencies
│   ├── run.py                  # Uvicorn entry script
│   ├── test_groq.py            # Groq integration test suite
│   ├── test_translate_service.py
│   └── verify_backend.py       # End-to-end verification script
├── frontend/
│   ├── app/                    # Next.js 16 app directory
│   ├── components/             # Reusable UI widgets & caption editors
│   ├── package.json
│   └── tsconfig.json
└── README.md
```

---

## 🚀 Getting Started

### Prerequisites
- [Node.js](https://nodejs.org/) (v18+)
- [Python](https://www.python.org/) (v3.10+)
- [FFmpeg](https://ffmpeg.org/) (or installed via imageio-ffmpeg)

### 1. Setup Backend (FastAPI)
```bash
cd backend

# Create virtual environment
python -m venv venv
# Windows:
venv\Scripts\activate
# Linux/macOS:
# source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Configure .env:
# GROQ_API_KEY=your_groq_key
# GEMINI_API_KEY=your_gemini_key

# Run FastAPI server
python run.py
```
*FastAPI runs on `http://localhost:8000` with interactive docs at `http://localhost:8000/docs`.*

### 2. Setup Frontend (Next.js)
```bash
cd ../frontend
npm install
npm run dev
```
*Next.js application runs on `http://localhost:3000`.*

---

## 👤 Author
- **Nikhil** ([GitHub](https://github.com/nikhilcodeworks))

---

## 📜 License

Distributed under the **MIT License**. See `LICENSE` for more information.
