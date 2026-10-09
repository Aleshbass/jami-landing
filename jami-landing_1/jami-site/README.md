# Jami landing page

Static site for https://myjami.app, deployed on Vercel (project: jami-landing, root directory: jami-landing_1/jami-site).

- `index.html` — home page
- `providers.html` — For local providers (served at /providers)
- `privacy.html`, `terms.html`, `acceptable-use.html` — policy pages
- `styles.css` — all styles
- `main.js` — page motion, nav, FAQ
- `chat.js` — the "Try Jami" demo chat (opens from any element with `data-try`)
- `assets/` — images and icons
- `vercel.json` — any path not in this folder is served from the jami-app project

New commits build a preview on Vercel; production is promoted manually after a check.
