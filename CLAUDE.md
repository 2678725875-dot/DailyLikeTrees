# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

DailyLikeTrees is a multi-platform focus/productivity app inspired by the Forest app. Users set a focus timer → complete it → plant a tree in their isometric "Focus Forest." Current phase: desktop Web MVP.

**Tech stack:** Vue 3 Composition API + TypeScript + Vite (frontend), FastAPI + SQLite3 (backend), PixiJS 7.4.3 for isometric forest rendering, Web Audio API for ambient audio mixing.

## Development Commands

All frontend commands run from `frontend/`. The backend runs from `backend/`.

```bash
# Frontend
cd frontend
npm run dev              # Start Vite dev server (http://localhost:5173)
npm run build            # Type-check + production build
npx vue-tsc --noEmit    # TypeScript check only (no emit)

# Backend
cd backend
uvicorn app.main:app --reload   # Start FastAPI (http://localhost:8000)
# Swagger docs at http://localhost:8000/docs
```

Both servers must be running for full functionality. The frontend dev server proxies to `localhost:8000` for API calls (configured in `api.ts` with hardcoded baseURL).

## Architecture

### Frontend (`frontend/src/`)

**Router** (`router/index.ts`): Hash-based routing (`createWebHashHistory`) — required for PWA compatibility. Two routes: `/` (HomeView) and `/forest` (ForestViewPage, lazy-loaded).

**Pinia Stores** (5 modules, all use the composable pattern — `ref` + `computed` + functions inside `defineStore`):
| Store | Key State | Notes |
|-------|-----------|-------|
| `timer.ts` | mode, status, targetSeconds, elapsedSeconds | State machine: idle→running→paused→completed. Auto-completes on reaching target for countdown/countup. `complete()` calls POST `/api/sessions`. Sessions under 30s are silently discarded. |
| `todos.ts` | items[] | Full CRUD with optimistic updates + revert on error. |
| `forest.ts` | trees[], terrain, weather, timeFilter, forceRefresh | `fetchTrees()` loads trees for current filter. `refreshAnimation()` forces re-animation on re-click. |
| `audio.ts` | masterVolume, isMuted, bgmEnabled, ambianceEnabled | UI-level audio state. The actual Web Audio API lives in the composable. |
| `settings.ts` | theme ('light'\|'dark') | Loads from localStorage first, then syncs backend. Watch persists theme to both. |

**Key Composables:**
- `useAudioEngine.ts` — Singleton Web Audio API engine. `init()` must be called from a user gesture (browser autoplay policy). Plays ambiance layers simultaneously via looping `AudioBufferSourceNode`s. Handles missing audio files gracefully (returns null, no crash).

**Key Components:**
- `CircularTimer.vue` — SVG ring with `createSVGPoint()` + `getScreenCTM().inverse()` for accurate drag coordinate mapping. Drag activates only when click distance from center is 85-145px (center is reserved for TreePreview). Uses `setPointerCapture` for reliable drag. Snaps to preset durations (15/25/30/45/60/90/120 min).
- `IsometricGrid.vue` — PixiJS v7 canvas rendering the isometric forest. See "PixiJS v7 Critical Notes" below.
- `BackgroundForest.vue` — Fixed-position forest at low opacity (0.22) on the home page. Has a contrast veil layer and CSS-animated weather overlay for visual separation from main UI.

### Backend (`backend/app/`)

Four ORM models: `FocusSession`, `PlantedTree`, `Todo`, `UserSetting`. SQLite with `check_same_thread: false` for FastAPI async compatibility.

**Core transaction** (`services/session_service.py`):
1. Insert `FocusSession` → flush to get ID
2. Calculate growth stage from `actual_seconds / 60` (0-14min→seed, 15-29→sprout, 30-59→sapling, 60+→mature)
3. Assign grid position (sequential, row by row, 8 cols)
4. Insert `PlantedTree` with computed time_filter_key (server-side today→`2026-06-15`, week→`2026-W24`, month→`2026-06`, total→`total`)

**Trees API**: `GET /api/trees?filter=today|week|month|total` — The router converts named filters to actual date-based DB keys before querying. Frontend MUST call with named filters, not raw dates.

## PixiJS v7 Critical Notes

**This project uses pixi.js ^7.4.3, NOT v8.** The v8 API is completely different and will fail silently or throw.

| v7 (correct) | v8 (wrong, don't use) |
|---|---|
| `new PIXI.Application({ view: canvas })` synchronous constructor | `new PIXI.Application()` then `await app.init()` |
| `g.beginFill(color, alpha)` / `g.endFill()` | `g.fill({ color, alpha })` |
| `g.lineStyle(width, color, alpha)` | `g.stroke({ width, color })` |
| `g.drawCircle(x, y, r)` | Same, but fill/stroke setup differs |
| `g.moveTo()` / `g.lineTo()` | `g.moveTo()` / `g.lineTo()` (same) |

**Isometric coordinate system** (`utils/isometric.ts`):
- Grid→screen: `sx = (gx - gy) * (tileWidth/2) + offsetX`, `sy = (gx + gy) * (tileHeight/2) + offsetY`
- Depth sort: `depthSortKey(gx, gy) = gx + gy` (higher renders later = in front)
- Cube faces: top (brightest), left (medium), right (darkest)

**Architecture constraint:** `gridGraphics` has camera transform applied (`gridGraphics.x = camX`, `gridGraphics.y = camY`, `gridGraphics.scale.set(zoomLevel)`). `weatherGraphics` MUST stay at (0,0) in screen space — it covers the full viewport. Camera pan/zoom only affects grid + trees.

**Canvas sizing:** The PixiJS Application reads `containerRef.value.clientWidth` on mount and resize. The container must have a real width before initialization.

**Weather effects:**
- Rain is drawn as thin lines directly on `weatherGraphics` in screen coordinates (no camera offset!)
- Lightning uses exponential decay: `alpha *= Math.pow(0.015, dt)`
- Splash particles spawn when raindrops reach screen bottom
- Sunny sparkles use life-cycle animation (fade in → sustain → fade out)
- Zoom wheel uses `e.deltaY` with factor 0.92/1.08, clamped to 0.5–3.0

## Theme System

CSS custom properties on `[data-theme="dark"]` / `[data-theme="light"]` (or `:root` default light). The `settingsStore.applyTheme()` sets `document.documentElement.setAttribute('data-theme', t)`. All components use `var(--color-*)` tokens.

## Common Pitfalls

1. **`getGrowthStage` must be imported** in any component that uses it. CircularTimer.vue's celebration watch calls it but the import was historically missing — this causes a runtime ReferenceError that silently breaks the completion flow.

2. **Do NOT add CSS to `#app` element.** The `#app` div must not have `display: flex` or `align-items: center` — this constrains the AppShell width and collapses the entire layout to mobile proportions. Centering is handled by `.main-content` inside AppShell.

3. **Do NOT add global `button:active { transform: scale() }`** — it conflicts with per-component button transforms. Each component manages its own button press micro-interactions.

4. **The frontend randomizes tree positions on render.** The backend stores `grid_x`/`grid_y` but the frontend ignores them and assigns random positions via Fisher-Yates shuffle. Only non-water tiles are valid. Positions are reassigned on terrain change or force-refresh.

5. **Terrain random seed** is generated on every mount (`Math.random() * 1000`), influencing peak positions, creek paths, and noise offsets. This means each visit to `/forest` produces different terrain layout.

6. **Audio files are placeholders** — they don't exist yet. The engine silently handles 404s. Don't report missing audio as errors.

7. **Tree growth animation** uses PixiJS ticker with ease-out cubic. Duration 700ms/tree, 55ms stagger. `forceRefresh` prop → `startGrowthAnimation()` called for all trees. Without `forceRefresh`, only new trees animate.
