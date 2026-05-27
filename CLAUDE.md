# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

IBBS (Incident Back-office & Billing System) is a vanilla JS/HTML/CSS SOC incident management platform backed by Supabase (PostgreSQL + Auth). No build step — the app runs directly from `index.html`. Deployment is via Vercel (static hosting, output dir `./`).

## Running Locally

Open `index.html` directly in Chrome/Edge, or serve with any HTTP server:
```
python -m http.server 8080
# or use VS Code Live Server extension
```

There is no build step, no bundler, no test framework.

## Architecture

### Entry & Routing

[js/app.js](js/app.js) is the central router and initializer. On load it:
1. Checks auth via [js/auth.js](js/auth.js) (redirects to `login.html` if no session)
2. Loads static entity data via [js/data.js](js/data.js) from `data/ENTIDADES.json`, `data/ax.json`, `data/tx.json`
3. Loads user permissions from Supabase via [js/permissions.js](js/permissions.js)
4. Initializes tab modules based on permission grants

### Tab Modules

Each tab is a self-contained module. The naming is intentional:

| File | Tab Name | Purpose |
|---|---|---|
| [js/tab1.js](js/tab1.js) | Entidades — Create | Create entity (school/hospital/etc.) incident |
| [js/tab2.js](js/tab2.js) | Entidades — Registry | Read-only table of entity incidents |
| [js/tab6.js](js/tab6.js) | Entidades — Tickets | Full ticket lifecycle: classification, notes, O&M, timeline |
| [js/tab3.js](js/tab3.js) | SOC Nodos — Create | Create SOC network node incident |
| [js/tab4.js](js/tab4.js) | SOC Nodos — Registry | Read-only table of SOC incidents |
| [js/tab5.js](js/tab5.js) | Library | Link/resource management |
| [js/tabDashboard.js](js/tabDashboard.js) | Dashboard | KPI cards, Chart.js charts, activity table |
| [js/tabAdmin.js](js/tabAdmin.js) | Admin | User/permission management (admin only) |

**tab6.js is the most complex module** (1,453 lines) — it handles the full detail view for entity tickets including SOC notes, O&M scheduling, follow-up ticket numbers (CC/TT/WO), and an activity timeline/audit trail.

### Persistence Layer

[js/store.js](js/store.js) is the sole Supabase interface. It exposes CRUD functions and handles camelCase ↔ snake_case mapping between JS and the database. All database operations go through this file.

**Database tables:**
- `tickets_entidades` — entity incidents (tabs 1, 2, 6)
- `tickets_soc` — SOC node incidents (tabs 3, 4)
- `enlaces` — library links (tab 5)
- `user_permissions` — per-user RBAC settings (tabAdmin)

Schema is at [supabase/schema.sql](supabase/schema.sql).

### Permissions

[js/permissions.js](js/permissions.js) implements granular RBAC with four presets: `admin`, `editor`, `tecnico`, `viewer`. Permissions control tab visibility, field editability, and region-based data filtering. Permissions are stored in the `user_permissions` Supabase table and loaded at startup.

### Static Data & Cascade Filters

[js/data.js](js/data.js) loads entity geography data (Region → Province → Locality → Entity) from `data/ENTIDADES.json` and provides cascade filter utilities used by tabs 1 and 6. SOC node data comes from `data/ax.json` and `data/tx.json`.

### i18n

[js/i18n.js](js/i18n.js) provides bilingual support (Spanish/English) via dynamic text replacement. Language preference is persisted to localStorage.

### Exports

[js/exporter.js](js/exporter.js) generates styled Excel files using `xlsx-js-style` (loaded via CDN). The only npm dependency (`xlsx`) in [package.json](package.json) is for local tooling; the CDN version is what the browser uses.

## CSS Design System

[css/main.css](css/main.css) is the sole stylesheet (~2,000 lines). It uses CSS custom properties for a corporate blue/white theme with full dark mode support. Typography: Inter (body), Montserrat (headers), both from Google Fonts.

## Key Conventions

- **No framework**: All DOM manipulation is vanilla JS (`document.querySelector`, `addEventListener`, etc.)
- **No build/transpile**: ES6+ features used directly; requires a modern browser
- **Supabase client**: Initialized in [js/supabase.js](js/supabase.js); keys are the public anon key (safe for client-side)
- **Toasts**: All user feedback uses [js/toast.js](js/toast.js) — do not use `alert()`
- **Icons**: Unicode emojis only — no icon library
- **Real-time**: Badge counts refresh every 30 seconds via polling (no WebSocket subscription)
