# TrajectX — Student Journey Manager

## Architecture & Technology Stack
- **Framework:** TanStack Start (Vite + React 19 + TypeScript)
- **Database:** MongoDB Atlas (Database: `trajectx` on multi-cloud cluster)
- **Authentication:** Custom JWT sessions with bcryptjs password hashing and instant login shortcuts
- **Design System:** Kraft Studios visual design (`kraftstudios.site`) with Lenis smooth scroll, warm sand, vermilion, ink, and slate palette
- **Typography:** IBM Plex Sans (UI), IBM Plex Mono (data/tabular), Instrument Serif (display headings)

## Workspace Navigation & Access Control
- Management application lives under `/app/*` inside the `_authenticated` layout.
- Modular sections route through `app.m.$section.tsx` rendering dedicated modules (`courses`, `academics`, `tests`, `attendance`, `readiness`, `applications`, `fees`, `analytics`, `notifications`, `settings`).
- Sensitive operations (`convert_lead`, `move_student_stage`) are verified on the server in `src/server/rpc.ts`.
- Sidebar visibility is managed via `SECTION_ACCESS` in `src/lib/roles.ts`.
