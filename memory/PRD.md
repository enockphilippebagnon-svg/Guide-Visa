# Guide Visa — PRD

## Problem
Guide Visa is a PWA edited by **Digitalk Afrique** (Côte d'Ivoire, digitalkafrique@gmail.com, +225 01 42 07 32 07) that helps Africans (students, workers, families) simulate their immigration procedure to Canada, France or Germany — step-by-step, with real costs shown in the user's local currency, anti-scam alerts, a document safe, useful links library and community forum.

## Personas
- Kofi, 22, Bénin — student, XOF, wants Canada studies path.
- Aminata, 35, Sénégal — fonctionnaire, family to France.
- Jean, 48, Côte d'Ivoire — parent, son to Germany.

## Stack (implemented)
- Frontend: React 19 + React Router + Tailwind + Shadcn primitives + Framer/Lucide + Sonner toasts.
- Backend: FastAPI + Motor (MongoDB) + PyJWT + bcrypt + httpx.
- Auth: JWT httpOnly cookies + Authorization Bearer header fallback (localStorage) for cross-site preview environments.

## Implemented (Feb 2026)
- Landing page with hero, features, footer (Digitalk Afrique branding).
- JWT auth (register, login, me, logout) with **pays_origine** required → devise_preferee auto-detected (XOF / XAF / EUR / CAD / etc. across 38 countries).
- Admin seeded on startup: admin@digitalkafrique.com / Admin@GuideVisa2025.
- Home: welcome banner + country cards (CA/FR/DE) with hero photos + motif picker + anti-scam banner + user's simulations list.
- Simulator wizard: profile form → animated eligibility gauge /100 → detailed simulation.
- Simulation detail: 7 steps per motif with dual currency (official + local FCFA/EUR), delays, official links, per-step explanations.
- Document safe: upload (base64, 10 MB cap), 5 categories, delete, dossier % complete bar.
- Useful links library: 12 seeded links, category filter, search, click counter.
- Forum: 10 categories, create topic modal, topic detail with replies, view counter.
- Profile page: identity + currency preference.
- Admin panel: 4 KPI dashboard, users CRUD (suspend/delete), links CRUD, forum moderation.
- Currency conversion via Frankfurter API with hardcoded fallback rates.

## Added (Feb 2026 — v3.6)
- **PWA offline mode**: manifest.json + service-worker.js registered in index.js; caches `/api/pays`, `/api/simulations/pays`, `/api/simulations/donnees/*`, `/api/simulations/mes`, `/api/simulations/{id}`, `/api/liens`, `/api/forum/*`, `/api/documents`, `/api/auth/me`. Cache-first for images/fonts. Yellow "Mode hors ligne" banner in Layout when navigator.onLine === false.
- **Anti-scam comparator** (`/app/anti-arnaque`): pick pays + motif, enter suspected amount + currency → backend `POST /api/anti-arnaque/comparer` returns SAFE/SUSPECT/ARNAQUE verdict with ratio, cost breakdown in user's currency, colored alert card. Added tab in bottom-nav ("Arnaque") + CTA banner on Home + CTA on Simulation detail.
- **AI Document Analyzer** (Gemini 2.5 Flash via Emergent LLM Universal Key): 
  - `POST /api/documents/{id}/analyser` sends the image (base64) to Gemini with a French prompt → returns `{type_detecte, est_conforme, score_qualite, probleme[], manque[], recommandations[], verdict_court}` as strict JSON.
  - **Dossier checklist** `GET /api/simulations/{id}/verifier-dossier`: matches uploaded docs against required documents per procedure (Passeport, DLI, IELTS, etc. — hardcoded in `DOCUMENTS_REQUIS` for CA/FR/DE × etudes/travail/famille). Returns present/missing checklist with progression %.
  - Frontend: "IA" pill button on every image doc in `/app/documents` opens `<AIAnalyzer/>` modal with live analysis + traffic-light verdict. `SimulationDetail` shows the checklist card with progression + CTA to complete dossier.

## Backlog (P1/P2)
- P1: PWA manifest + service worker + IndexedDB offline caching.
- P1: Password reset flow (playbook stored — not wired into UI yet).
- P1: 2FA TOTP for admin.
- P2: Push notifications (Firebase FCM), Email (Resend).
- P2: Russia country added to simulator.
- P2: Reputation badges & likes on forum replies.
- P2: Signalements + bannissements.
- P2: Backup/export ZIP of the dossier.

## Added (Feb 2026, v3.7)
- **Audit IA multi-docs** : `POST /api/simulations/{id}/auditer-tout` audite chaque doc image via Gemini + agrège en rapport {score_global, verdict, couleur, points forts, points faibles, docs manquants, doc-by-doc analysis}. Frontend AuditReport modal avec bouton "Analyser tout mon dossier" dans SimulationDetail, téléchargement du rapport en HTML (imprimable en PDF via navigateur).
- **Rappels expiration** : `date_expiration` optionnelle sur upload document, `GET /api/documents/rappels?jours=90` retourne les docs expirant avec urgence (expire/critique/attention). Bannière rappels sur Home + badge coloré par doc.
- **Nettoyage complet** : suppression de tous les emojis (drapeaux, 👋🎉🚨💡💱📁💰⚠️✅ etc.) et tirets cadratins (—) dans les 71 fichiers backend+frontend. Design plus sobre et professionnel.
