# Triad Roleplay — Система наград (Reward System)

A Next.js web app for managing a roleplay community's reward system, including characters, familiars, shops, alchemy, and more.

## Tech Stack

- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS + shadcn/ui (Radix UI)
- **Auth & Database**: Firebase (Firestore, Realtime Database, Auth)
- **Media Storage**: ImageKit (server-side upload via server actions)
- **State Management**: React Context (UserProvider), TanStack Query

## Project Structure

```
src/
  app/           # Next.js App Router pages and API routes
  actions/       # Server actions (e.g., image upload via ImageKit)
  components/    # React components (dashboard, UI, auth, providers)
  hooks/         # Custom React hooks
  lib/           # Utility libraries (firebase, env, data, types)
```

## Running the App

The app runs in **production mode** in Replit (not dev mode). This is required because the `user-provider.tsx` client component is very large, and the uncompressed dev-mode chunk (~8.9 MB) times out through Replit's proxy.

**Workflow**: `npm run start` (runs `next start -p 5000 -H 0.0.0.0`)

After any code change, rebuild before restarting:
```
npm run build
```
Then restart the "Start application" workflow.

## Environment Variables

The following are set in `.env` (non-sensitive public keys):
- `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME`
- `NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET`
- `NEXT_PUBLIC_IMAGEKIT_PUBLIC_KEY`
- `IMAGEKIT_URL_ENDPOINT`

Sensitive keys are in Replit Secrets:
- `IMAGEKIT_PRIVATE_KEY`

Not yet configured (app will work without them, but some features may be limited):
- `FIREBASE_ADMIN_JSON` — for Firebase Admin SDK (server-side)
- `SUPABASE_URL` + `SUPABASE_SERVICE_ROLE_KEY` — for Supabase admin features

## Replit Configuration

- Port: **5000** (required for Replit webview)
- Host: **0.0.0.0** (required for Replit proxy)
- `allowedDevOrigins`: `*.replit.dev`, `*.replit.app`, `*.riker.replit.dev`
- Webpack `chunkLoadTimeout`: 120000ms

## Fonts

Fonts are loaded via `next/font/google` (NOT manual `<link>` tags). This is critical — manual `<link>` tags in the `<head>` caused a React hydration error (#418) because Next.js renders metadata (title, description) between the link tags on the server, but the React virtual DOM places them in a different order on the client.

- `Playfair_Display` → CSS variable `--font-headline` → Tailwind class `font-headline`
- `PT_Sans` → CSS variable `--font-body` → Tailwind class `font-body`

Both variables are applied on the `<html>` element in `layout.tsx`.
