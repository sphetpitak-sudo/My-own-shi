<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

---

# StudyHub — Student Planner

## Overview
StudyHub is a student homework/task planner web app. Originally started as "Piggy" (expense tracker), pivoted to "StudyHub" (student planner) on 2026-08-25.

**Stack:** Next.js 16.3.2 (App Router, TypeScript, Tailwind v4) + Supabase (DB + Auth) + Vercel (hosting) — all free

## Key Files

### Core
- `app/layout.tsx` — Root layout, title "StudyHub", K2D font (Thai + Latin)
- `app/page.tsx` — Renders AuthForm (login page)
- `app/dashboard/page.tsx` — Renders Dashboard
- `middleware.ts` — Auth proxy (session refresh + code exchange + redirects)
- `app/globals.css` — Design system (tokens, layout, components, animations, mobile)

### Components
- `components/Dashboard.tsx` — Main shell: sidebar + bottom nav + topbar + tab switching + Supabase realtime
- `components/AuthForm.tsx` — Login/signup with email + Google OAuth + forgot password
- `components/StudyDashboard.tsx` — Overview tab: stats cards, upcoming deadlines, subject breakdown
- `components/StudyStreaks.tsx` — Study streaks: current/best streak, weekly/today stats
- `components/StudyCharts.tsx` — Charts (Recharts): weekly bar + status pie
- `components/PomodoroTimer.tsx` — Pomodoro 25/5 timer with SVG circle + session counter
- `components/AssignmentTemplates.tsx` — 7 quick templates (Report, Math, Lab, Reading, Group, Present, Notes)
- `components/SubjectForm.tsx` — Create/edit subjects with name + color picker
- `components/SubjectList.tsx` — Subject grid cards with edit/delete
- `components/AssignmentForm.tsx` — Create/edit assignments (title, description, subject, due date, priority, estimated time, template prefill)
- `components/AssignmentList.tsx` — Searchable/filterable list with swipe-to-delete, status cycling
- `components/CalendarView.tsx` — Monthly calendar with assignment dots + "Today" button
- `components/ExportCSV.tsx` — Download assignments as CSV
- `components/Settings.tsx` — Profile, password change, delete account
- `components/Toast.tsx` — Toast notifications (pause hover, dismiss, max 3)
- `components/LangToggle.tsx` — TH/EN toggle
- `components/ThemeToggle.tsx` — Light/dark toggle

### Lib
- `lib/types.ts` — Subject, Assignment interfaces
- `lib/utils.ts` — getLocalDate(), getLocalDateOffset(), daysBetween()
- `lib/theme/index.tsx` — ThemeProvider with localStorage + prefers-color-scheme
- `lib/i18n/index.tsx` — LangProvider + browser language detection
- `lib/i18n/th.json` — Thai translations (~100 keys)
- `lib/i18n/en.json` — English translations (~100 keys)
- `lib/supabase/client.ts` — Browser Supabase client
- `lib/supabase/server.ts` — Server Supabase client

### Database
- `supabase/studyhub-setup.sql` — subjects + assignments tables with RLS + indexes (safe re-run)

### API
- `app/api/delete-account/route.ts` — Delete all user data + auth user

### Config
- `public/manifest.json` — PWA manifest
- `middleware.ts` — Auth middleware (was proxy.ts, renamed)
- `.env.local` — Supabase URL + publishable key (gitignored)

## Supabase Config
- **URL:** `https://klozqgayqzisxecaibls.supabase.co`
- **Publishable key:** `sb_publishable_cwjtsjK0eh2R5499yZGnuQ_6WR6aEwU`
- **Site URL:** `https://my-own-shi.vercel.app`
- **Redirect URLs:** `https://my-own-shi.vercel.app/**`
- **Google OAuth callback:** `https://klozqgayqzisxecaibls.supabase.co/auth/v1/callback`

## Vercel Env Vars
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
- `SUPABASE_SERVICE_ROLE_KEY` (optional, for full delete account)

## Database Schema

### subjects
| Column | Type | Notes |
|--------|------|-------|
| id | UUID | PK |
| user_id | UUID | FK → auth.users |
| name | TEXT | e.g. "คณิตศาสตร์" |
| color | TEXT | hex color, e.g. "#4F7CFF" |
| icon | TEXT | always "BookOpen" |
| is_default | BOOLEAN | true for predefined subjects |
| sort_order | INTEGER | for future drag reorder |
| created_at | TIMESTAMPTZ | |

### assignments
| Column | Type | Notes |
|--------|------|-------|
| id | UUID | PK |
| user_id | UUID | FK → auth.users |
| subject_id | UUID | FK → subjects (nullable) |
| title | TEXT | assignment name |
| description | TEXT | optional details |
| due_date | DATE | nullable |
| priority | TEXT | 'low' / 'medium' / 'high' |
| status | TEXT | 'pending' / 'in_progress' / 'done' |
| estimated_minutes | INTEGER | nullable, for time tracking |
| created_at | TIMESTAMPTZ | |
| updated_at | TIMESTAMPTZ | |

## Features
1. **Auth** — email/password + Google OAuth + forgot password
2. **Subjects** — customizable with color (predefined defaults: Math, Science, English, Thai, Social Studies)
3. **Assignments** — title, subject, due date, priority, status, estimated time
4. **StudyDashboard** — stats (pending/completed/overdue), upcoming deadlines, subject breakdown
5. **Calendar** — monthly view with assignment dots + "Today" button
6. **Pomodoro Timer** — 25/5 min with notifications + session counter
7. **Study Streaks** — current/best streak, weekly/today stats
8. **Quick Templates** — 7 presets that pre-fill the assignment form
9. **Study Charts** — weekly bar chart + status pie chart (Recharts)
10. **Export CSV** — download assignments as spreadsheet
11. **Search/Filter** — by title/subject + status filter
12. **Swipe-to-delete** — mobile gesture on assignments
13. **Dark mode** — with localStorage persistence
14. **i18n** — Thai/English with browser auto-detection
15. **PWA** — installable on mobile
16. **Realtime** — Supabase realtime subscriptions

## Mobile UI
- **Bottom nav:** 5 items (ภาพรวม, วิชา, งาน, ปฏิทิน, ตั้งค่า)
- **Sidebar:** hidden on mobile, slide-in with overlay
- **Touch targets:** min 44px on coarse pointer devices
- **Category chips:** horizontally scrollable on mobile
- **Action buttons:** always visible on mobile (not just hover)
- **Theme transition:** 0.2s ease on color/background changes
- **Tab animation:** fade-slide on tab switch

## Git Repo
- **Remote:** `github.com:sphetpitak-sudo/My-own-shi`
- **SSH key:** `~/.ssh/id_ed25519` (must `eval "$(ssh-agent -s)" && ssh-add` before push)
- **Production URL:** `https://my-own-shi.vercel.app`

## Commands
- `npm run dev` — start dev server
- `npm run build` — production build
- `git add . && git commit -m "msg" && git push origin main` — deploy

## Notes
- User is Thai, communicates in Thai/English mix
- All emoji replaced with lucide-react SVG icons
- `middleware.ts` handles auth (not `proxy.ts` which was renamed)
- Local date helpers in `lib/utils.ts` (not `toISOString().slice(0,10)` which uses UTC)
