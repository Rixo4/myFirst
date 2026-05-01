# Nexus AI — Adaptive Research Ecosystem

Nexus AI is a next-generation research platform that adapts to your expertise level. It leverages multiple AI agents to synthesize technical papers, detect contradictions in research, and build a personalized knowledge graph of your learning journey.

![Nexus AI Banner](src/assets/hero.png)

## 🚀 Key Features

- **Adaptive Research Assistant**: Uses Gemini 1.5 Flash to generate insights tailored to your interaction history and precision score.
- **Multi-Agent Pipeline**: Autonomous agents handle planning, retrieval, analysis, and synthesis.
- **Neural Profiles**: A Supabase-backed persistent profile that learns your preferences, expertise, and technical depth over time.
- **Living Knowledge Graph**: Visualize relationships between research entities and explore adjacent concepts.
- **Smart Document Analysis**: Upload PDFs, DOCX, or TXT files for instant AI-powered summaries and contextual Q&A.
- **Live Web Intelligence**: Real-time search bypassing SEO spam to find papers, patents, and technical blogs.

## 🛠 Tech Stack

- **Frontend**: React, Vite, Lucide Icons, React Router
- **Backend**: Node.js, Express, Multer
- **Database**: Supabase (Auth + PostgreSQL with RLS)
- **AI Models**: Google Gemini 1.5 Flash, Pollinations AI (Fallback), Serper (Google Search API)

## 📦 Getting Started

### 1. Clone & Install
```bash
git clone https://github.com/iknothingreal/NEXUS-AI.git
cd NEXUS-AI
npm install
cd server && npm install
```

### 2. Database Setup
Run the `supabase-one-shot.sql` script in your Supabase SQL Editor to initialize the `profiles` table and necessary triggers.

### 3. Environment Variables
Create a `.env` in the root and `server/` directory:

**Root `.env`:**
```env
VITE_SUPABASE_URL=your_url
VITE_SUPABASE_ANON_KEY=your_key
VITE_BACKEND_URL=http://localhost:5002
```

**Server `.env`:**
```env
GEMINI_API_KEY=your_gemini_key
SERPER_API_KEY=your_serper_key
VITE_SUPABASE_URL=your_url
VITE_SUPABASE_ANON_KEY=your_key
PORT=5002
```

### 4. Run Development
**Terminal 1 (Backend):**
```bash
cd server
npm start
```

**Terminal 2 (Frontend):**
```bash
npm run dev
```

## 📄 License
ISC License. Built for the future of decentralized research.
