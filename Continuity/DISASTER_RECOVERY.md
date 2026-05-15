# CONTINUITY: DISASTER RECOVERY PLAN

## 1. Risk Assessment
| Risk | Impact | Mitigation Strategy |
|------|--------|---------------------|
| Database Downtime | Critical | Supabase managed high-availability (multi-region). |
| Data Deletion (Accidental) | High | Daily logical backups via Supabase dashboard. |
| CDN Failure | Medium | Self-host critical libraries if CDN availability drops. |

## 2. Backup Strategy
- **Automated**: Supabase performs daily backups of the PostgreSQL database.
- **Manual**: Periodically export the `incidencias` and `soc_tickets` tables to JSON/CSV from the Supabase dashboard.

## 3. Recovery Procedures (RTO < 30 min)
In the event of total system failure:
1. **Frontend**: Re-deploy the latest stable commit from GitHub to Vercel.
2. **Database**: 
   - Restore the latest backup from the Supabase "Backups" tab.
   - Re-link the API keys in `js/supabase.js` if the project URL changed.
3. **Validation**: Test the login flow and data persistence in Tab 1 and Tab 3.

## 4. Emergency Contacts
- **Primary Dev**: [Contact Name/Email]
- **SOC Manager**: [Contact Name/Email]
- **Supabase Support**: https://supabase.com/support
