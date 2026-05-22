# OPERATIONAL: CHANGE MANAGEMENT

## 1. Updating the i18n Dictionary
To add or modify translations without a programmer:
1. Open `js/i18n.js`.
2. Locate the `translations` object for `es` (Spanish) or `en` (English).
3. Add a new key-value pair or update existing text.
4. **Important**: Ensure the keys match in both dictionaries to prevent UI errors.

## 2. Managing Static Data
Regions, Province, and Entity data are stored in the `js/data/` directory (or equivalent JSON files):
- To update the Entity list: Modify `data/entities.json` (if applicable).
- To add a new Region: Update the `DataManager` class in `js/data.js`.

## 3. Library (Biblioteca) Management
The Library links are stored in the `soc_library` table in Supabase:
- Additions and deletions can be performed directly through the **Biblioteca** tab in the UI by users with the appropriate permissions.
- No code change is required for content updates.

## 4. Change Request Process
1. **Identify**: User requests a new feature or reports a bug.
2. **Review**: SOC Manager approves the change based on strategic value.
3. **Develop**: Changes are implemented in a branch.
4. **QA**: Test in a staging environment (Vercel preview branch).
5. **Release**: Merge to `main` for production update.
