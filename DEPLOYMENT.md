# Nexus AI Deployment Guide

## 1. Install dependencies

From the repo root:

```bash
npm install
cd server
npm install
cd ..
```

## 2. Run the database SQL

Open your Supabase project, go to SQL Editor, paste the contents of `supabase-one-shot.sql`, and run it once.

This creates `public.profiles`, row-level security policies, an `updated_at` trigger, and an auth trigger that creates a profile row whenever a user signs up.

## 3. Configure environment variables

Frontend variables:

```bash
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_BACKEND_URL=https://your-backend-url
```

Backend variables:

```bash
GEMINI_API_KEY=your_gemini_api_key
SERPER_API_KEY=your_serper_api_key
PORT=5001
```

Keep `.env` and `server/.env` out of git. They are already ignored.

## 4. Local development

Run the backend:

```bash
cd server
npm start
```

In another terminal, run the frontend:

```bash
npm run dev
```

The app defaults to `http://localhost:5001` for backend calls if `VITE_BACKEND_URL` is not set.

## 5. Deploy backend

Use Render, Railway, Fly.io, or any Node host.

Recommended settings:

```text
Root directory: server
Build command: npm install
Start command: npm start
Environment: GEMINI_API_KEY, SERPER_API_KEY, PORT
```

After deploy, copy the backend URL.

## 6. Deploy frontend

Use Vercel or Netlify.

Recommended settings:

```text
Build command: npm run build
Publish directory: dist
Environment: VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY, VITE_BACKEND_URL
```

Set `VITE_BACKEND_URL` to the deployed backend URL from step 5.

## 7. Supabase auth redirects

In Supabase Dashboard > Authentication > URL Configuration:

```text
Site URL: https://your-frontend-url
Redirect URLs:
https://your-frontend-url/**
http://localhost:5173/**
```

Enable the GitHub and Google providers only after their OAuth client IDs/secrets are configured in Supabase.

## 8. Final checks

```bash
npm run lint
npm run build
```

Open the deployed frontend, create an account, and confirm the Dashboard loads with a profile.
