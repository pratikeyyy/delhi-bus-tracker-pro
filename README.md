# 🚌 Delhi Bus Tracker Pro

A demo bus-tracking web app for Delhi — route search, bus discovery, ETA,
a live map (Leaflet / OpenStreetMap), an analytics dashboard, browser
notifications, demo login, 4 languages (English, Hindi, Urdu, Punjabi) and
PWA support.

**Live demo:** https://pratikeyyy.github.io/delhi-bus-tracker-pro/

> **⚠️ Demo data — simulated.** Bus positions, ETAs, routes, speeds and
> driver names are simulated sample data (see `js/data.js`,
> `js/enhanced-delhi-data.js` and the mock data in `server.js`). This app is
> **not** connected to any live Delhi Transport Corporation feed, and the
> buses, ETAs and "live" movement on the map are generated in the browser /
> server for demonstration only.

## What the code actually does

- **Frontend (static, works on GitHub Pages):** `delhi-advanced.html` is the
  main app — Leaflet map with simulated bus markers, route/stop search, ETA
  and fare display from the bundled sample data, analytics dashboard
  (`js/analytics-dashboard.js`), browser notifications
  (`js/notifications.js`), a client-side demo login whose profile and
  favourites live in `localStorage` (`js/user-auth.js`), and 4-language UI
  (`js/i18n.js`). `demo.html` / `frontend.html` are alternate demo pages.
- **Backend (optional, Node.js):** `server.js` serves the same static files
  plus a mock JSON API (`/api/health`, `/api/buses/locations`, `/api/routes`,
  `/api/stops`, `/api/buses/stats`) and Socket.IO updates that move the
  simulated buses every 5 seconds. It needs **no database** — it generates
  its data in memory. The `routes/` and `models/` (Mongoose) files in the
  repo are **not wired into `server.js`**; they are unfinished scaffolding,
  not running endpoints.
- **PWA:** `manifest.json` + `sw.js` (installable, cached static assets).

## What it does NOT do (despite older claims)

No SMS gateway, no Firebase push notifications, no real GPS feed, no
payment / revenue tracking, no GDPR compliance work, and no real user
accounts — login is a browser-local demo. Do not present it as a production
transit system.

## Run locally

```bash
npm install
npm start        # http://localhost:3000  -> opens the app
```

No `.env` file is needed. Copy `.env.example` to `.env` only if you want to
change `PORT` or `ALLOWED_ORIGINS`.

## Deploy (free tiers)

- **Frontend (live now):** GitHub Pages — the workflow in
  `.github/workflows/github-pages.yml` publishes the static files on every
  push to `master`.
- **Backend (optional):** Render free tier — `render.yaml` is included
  (build `npm install`, start `node server.js`, binds `0.0.0.0:$PORT`).
  Needs a Render account; not yet deployed.

## Project structure

```
├── delhi-advanced.html   # main app
├── frontend.html / demo.html / index.html / login.html
├── js/                   # app, live-tracking (simulated), data, i18n, auth, analytics
├── css/ icons/           # styles, PWA icons
├── server.js             # Node/Express + Socket.IO mock API & static server
├── netlify/functions/    # serverless wrapper for Netlify (optional)
├── routes/ models/ services/ middleware/   # unwired scaffolding, not used by server.js
└── render.yaml  netlify.toml  .github/workflows/github-pages.yml
```

## License

MIT
