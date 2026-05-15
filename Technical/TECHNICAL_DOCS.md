# TECHNICAL DOCUMENTATION: IBBS Platform

## 1. Technology Stack
- **Frontend**: Vanilla HTML5, CSS3 (Custom Design System), and JavaScript (ES6+).
- **Backend-as-a-Service**: [Supabase](https://supabase.com/) (PostgreSQL + Auth).
- **Data Visualization**: [Chart.js](https://www.chartjs.org/) for interactive dashboards.
- **Exports**: [xlsx-js-style](https://github.com/gitbrent/xlsx-js-style) for styled Excel reports.
- **Typography**: [Inter](https://fonts.google.com/specimen/Inter) (Body) and [Montserrat](https://fonts.google.com/specimen/Montserrat) (Headers).

## 2. Architecture Overview
IBBS follows a modular Tab-based architecture managed by `js/app.js`.

### Core Components:
- **`app.js`**: Central router. Handles navigation between tabs and global initializers (Theme, Language, Auth).
- **`store.js`**: Data abstraction layer. Manages all CRUD operations with Supabase.
- **`i18n.js`**: Custom Internationalization engine. Uses `data-i18n` attributes for static text and `I18n.translate()` for dynamic content.
- **`tabX.js`**: Individual module logic (e.g., `tab1.js` for Entity Creation, `tabDashboard.js` for KPI rendering).

## 3. Database Schema (Supabase)
The system uses two primary collections in the database:
- **`incidencias`**: General tickets for Entidades.
- **`soc_tickets`**: Technical tickets for SOC Nodos.

## 4. Internationalization System
The `I18n` class manages language state:
- **Dictionary**: Located in `js/i18n.js` with `es` and `en` mappings.
- **Mechanism**: `I18n.toggleLanguage()` triggers a `langChanged` window event, which all active tabs listen to for UI refreshing.

## 5. Security & Authentication
- Managed via `js/auth.js`.
- Session persistence handled through `supabase.auth`.
- Role-based UI logic: Admin-only actions (Delete, Export) are restricted based on user role metadata.

## 6. CSS Design System
- **Variables**: Defined in `:root` and `body.dark-mode` within `css/main.css`.
- **Naming Convention**: Utility-first approach mixed with semantic component classes (e.g., `.btn-primary`, `.card-grid`).
