# SECURITY: CREDENTIALS & HARDENING

> [!CAUTION]
> This document contains a template for required secrets. Never commit real keys to a public repository. Use Environment Variables in production.

## 1. API Keys Template
To connect to the Supabase backend, the following variables must be configured in `js/supabase.js`:

| Key | Description | Environment Variable (Prod) |
|-----|-------------|----------------------------|
| `SUPABASE_URL` | The endpoint of your Supabase project. | `VITE_SUPABASE_URL` |
| `SUPABASE_KEY` | The `anon` or `service_role` public key. | `VITE_SUPABASE_ANON_KEY` |

## 2. Hardening Best Practices
- **Row Level Security (RLS)**: Ensure RLS is enabled in the Supabase Dashboard for the `incidencias` and `soc_tickets` tables.
- **Policies**:
  - `SELECT`: Allow authenticated users to read.
  - `INSERT`: Allow authenticated users to create.
  - `DELETE`: Restrict to users with the `admin` role metadata.
- **SSL**: All connections to the database must be over HTTPS.

## 3. Account Management
- Use **Supabase Auth** for managed user accounts.
- Password complexity should be enforced via the Supabase Auth settings panel.
