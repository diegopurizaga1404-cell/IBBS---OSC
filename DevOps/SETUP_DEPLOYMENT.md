# DEVOPS: SETUP & DEPLOYMENT GUIDE

## 1. Local Development Setup
1. **Clone the repository**:
   ```bash
   git clone <repository-url>
   ```
2. **Open the project**: Simply open `index.html` in a modern browser (Chrome/Edge recommended).
3. **Configuration**:
   - Ensure `js/supabase.js` has the correct API keys for your development environment.

## 2. GitHub Workflow
- Use a **feature-branch** workflow:
  1. `git checkout -b feature/new-module`
  2. Commit changes with descriptive messages.
  3. `git push origin feature/new-module`
  4. Create a Pull Request (PR) for review.

## 3. Production Deployment (Vercel)
The IBBS platform is optimized for [Vercel](https://vercel.com/):
1. Connect your GitHub repository to Vercel.
2. Set the **Framework Preset** to `Other` (Vanilla HTML).
3. Configure the **Build Command** to: `(None)`.
4. Configure the **Output Directory** to: `./`.
5. Deploy.

## 4. Automatic Updates
- Every push to the `main` branch will trigger an automatic build and deployment via Vercel.
- Verify status in the Vercel Dashboard or through the GitHub PR status checks.
