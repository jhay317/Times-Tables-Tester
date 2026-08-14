# 🌌 Math Galaxy Explorer & Times Tables Practice

[![pipeline status](https://gitlab.com/jhay317/Times-Tables-Tester/badges/master/pipeline.svg)](https://gitlab.com/jhay317/Times-Tables-Tester/-/commits/master)
[![license](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)

An engaging, gamified times tables and division practice ecosystem designed to help students master basic multiplication and division. The project offers three distinct interfaces tailored to different practice needs: an immersive Space-themed Web Game, a desktop Tkinter graphical application, and a lightweight Command-Line Interface (CLI).

---

## 🚀 Features

### 1. Math Galaxy Explorer (Web App)
A fully interactive, premium retro-space-themed web game:
- **Mission Modes**: Practice both **Multiplication** (✖) and **Division** (➗).
- **Co-Pilots (Avatars)**: Select a partner (Cosmo the Astro Dog, Nova the Cosmic Cat, Pip the Calc Bot, or Stella the Star Pixie) who reacts and encourages you during gameplay.
- **Progressive Maps**: Fly through a system of planets representing times tables from **2 through 12**.
- **Configurable Timer & Level Locking**: Choose a mission time limit (60s, 90s, 120s, 180s, or disable the timer). Once a level is completed, it is locked (🔒) to encourage mastering the other levels.
- **Engagement Mechanics**: Score multipliers, high score logging, sound toggles, and hot streaks with fire animations!
- **Interactive Mistakes Visualizer**: When a student gets an answer wrong, a modal appears displaying a grid of stars representing the multiplication grouping (e.g., $6 \times 4$ shows 6 rows of 4 stars) to help them understand the mathematical grouping visually.
- **Touch-Friendly Numpad**: On-screen numpad support for easy practice on tablets and mobile devices.

### 2. Desktop GUI (`times_tables_gui.py`)
A fast, simple Tkinter desktop app:
- Solicits practice levels from 2 to 12.
- Presents 20 timed questions per session.
- **Customizable Timer & Level Locking**: Allows configuring a custom timer limit (60s or more, or 0 to disable) and locks completed tables.
- Displays immediate statistics and records loaded from your local storage.

### 3. Command Line Interface (`times_tables.py`)
A keyboard-driven terminal version:
- Best for quick developer testing or fast keyboard-based practice.
- Provides interactive menus to practice or inspect statistical tables directly in the terminal.
- **Interactive Timer Settings & Table Locking**: Allows users to configure/disable the practice timer and prevents re-playing completed levels.

---

## 🛠️ Technology Stack

- **Frontend**: Vanilla HTML5, CSS3 (featuring HSL variables, glassmorphism, responsive grid layouts, custom keyframe animations, and a canvas-based space particle engine), and Modern JavaScript.
- **Backend / API**: Headless Python HTTP server (`server.py`) using the standard library `http.server`. It hosts the frontend, automatically handles port conflicts, and exposes a JSON endpoint (`/api/stats`) to read/write stats.
- **Data Storage**: Progress is stored locally in `results.json` to preserve accomplishments, attempts, successes, failures, and record times.
- **Testing**: Python `pytest` suite for standard business logic verification.

---

## 📂 Project Structure

```text
├── index.html           # Main markup structure for the Web Game
├── style.css            # Dark mode glassmorphism UI styles & animations
├── app.js               # Web game mechanics, timer, audio, and API interactions
├── server.py            # Local Python server hosting Web assets & persistence API
├── times_tables.py      # Terminal (CLI) times tables practice script
├── times_tables_gui.py  # Tkinter desktop desktop app
├── test_time_tables.py  # Automated tests checking math generation and file storage
├── Dockerfile           # Minimal Python image containerization configuration
├── requirements.txt     # Developer dependencies
├── ruff.toml            # Python linting and formatting configuration
├── .gitignore           # File exclusion mapping
├── .gitlab-ci.yml       # Automated GitLab CI/CD runner pipelines
└── LICENSE              # MIT License terms
```

---

## ⚙️ Running Locally

First, ensure you have Python 3.12+ installed.

### 1. Web Application (Recommended)
You can serve the web game by launching the built-in server. This automatically detects open sockets, maps to an unused port starting at `8080`, and pops open your default web browser.

```bash
python server.py
```

*Arguments:*
- `--host`: Binds a specific IP (default `127.0.0.1`).
- `--port`: Binds a specific port (default `8080`).
- `--no-browser`: Stops the server from launching the web browser automatically (useful in CI or headless Docker).

### 2. Tkinter Desktop GUI
Launch the desktop version:
```bash
python times_tables_gui.py
```

### 3. Terminal CLI Practice
Run the interactive CLI version:
```bash
python times_tables.py
```

---

## 🐋 Docker Containerization

To package and run the web game inside a lightweight Docker container:

1. **Build the image**:
   ```bash
   docker build -t math-galaxy-explorer .
   ```

2. **Run the container**:
   ```bash
   docker run -p 8080:8080 math-galaxy-explorer
   ```
   Now visit `http://localhost:8080` in your web browser.

---

## ⚡ Cloudflare Pages Deployment

This project is fully ready to deploy to **Cloudflare Pages** with Cloudflare Functions handling the `/api/stats` endpoint.

### 1. Local Development with Wrangler
Preview the web application and Cloudflare Pages Functions locally using Cloudflare Wrangler:

```bash
npx wrangler pages dev .
```
Or using npm:
```bash
npm run dev
```

### 2. Deploy to Cloudflare Pages
Deploy directly from your command line:

```bash
npx wrangler pages deploy .
```
Or using npm:
```bash
npm run deploy
```

Alternatively, connect your Git repository (GitHub / GitLab) in the [Cloudflare Dashboard](https://dash.cloudflare.com/), select **Cloudflare Pages**, set the build output directory to `/` (or `.`), and leave the build command blank.

### 3. Optional: Persistent Cloud Storage with Workers KV
By default, player statistics fall back gracefully to `localStorage` in the browser. To persist statistics across devices and users using Cloudflare's global edge network:
1. Create a KV Namespace in the Cloudflare Dashboard under **Workers & Pages > KV**.
2. Name the KV namespace (e.g. `STATS_KV`).
3. Bind the KV namespace to your Pages project in **Settings > Functions > KV namespace bindings** with the Variable name `STATS_KV`.
4. (Optional) For Wrangler deployments, uncomment the `[[kv_namespaces]]` block in `wrangler.toml` with your KV namespace ID.

---

## 🧪 Testing & Linting

### Setup Dependencies
Install developer dependencies listed in `requirements.txt`:
```bash
pip install -r requirements.txt
```

### Run Tests
The project features a full testing suite leveraging `pytest` to test the CLI practice, statistical logs, and mocking systems. Run it with:
```bash
pytest
```

### Code Style Checking
Run `ruff` to ensure compliance with Python coding standards:
```bash
ruff check .
```

---

## 🦊 GitLab CI/CD

This repository includes a configured `.gitlab-ci.yml` pipeline that triggers on commits. It checks:
1. **Lint Stage**: Scans Python files for syntax, styling, and standard compliance using `ruff`.
2. **Test Stage**: Spins up a test executor environment to run unit tests with `pytest`.
