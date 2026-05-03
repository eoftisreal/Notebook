# Sumit Kumar Sharma — Personal Portfolio

A modern personal portfolio website featuring a **glassmorphism** design with light/dark themes, an integrated live weather widget, and an interactive PDF tool — all in a single-page static site.

🔗 **Live:** [coinrx.me](https://coinrx.me)

---

## ✨ Features

- **Glassmorphism UI** — frosted-glass panels, glowing background orbs, and smooth animations
- **Light / Dark Theme** — toggle with one click; preference saved in `localStorage`
- **3D Parallax Effects** — background orbs and hero elements respond to mouse movement
- **Live Weather Widget** — displays real-time weather in the navbar via the OpenWeatherMap API, with city search and geolocation support
- **Interactive PDF Tool** — upload a PDF to rotate, resize, and combine pages using [pdf-lib](https://pdf-lib.js.org/), entirely client-side
- **Responsive Design** — adapts to desktop, tablet, and mobile viewports

## 🛠️ Tech Stack

| Layer | Technologies |
|-------|-------------|
| Markup | HTML5 |
| Styling | CSS3 (custom properties, grid, flexbox, `backdrop-filter`) |
| Scripting | Vanilla JavaScript (ES6+) |
| PDF Processing | [pdf-lib](https://pdf-lib.js.org/) (loaded from CDN) |
| Weather Data | [OpenWeatherMap API](https://openweathermap.org/api) |
| Hosting | GitHub Pages with custom domain |

## 📁 Project Structure

```
.
├── index.html          # Main HTML page
├── style.css           # All styles (light/dark themes, glassmorphism, responsive)
├── script.js           # Theme toggle, parallax, weather widget, PDF tool logic
├── images/             # Weather icons and UI assets
├── package.json        # Dependency metadata (pdf-lib)
├── CNAME               # Custom domain configuration (coinrx.me)
├── server.py           # Link resolver & bypass backend (v1)
├── server_v2.py        # Enhanced link resolver & bypass backend (v2 — see below)
├── requirements.txt    # Python dependencies for the backend
└── README.md
```

---

## 🔗 Link Resolver & By-passer Backend (v2)

`server_v2.py` is an enhanced Flask backend that automates the process of
scanning download pages, clicking through verification/bypass steps, and
resolving the final media URL.  It is a drop-in upgrade for `server.py` with
the following improvements.

### ✨ What's new in v2

| Area | Improvement |
|------|-------------|
| **Configuration** | Dataclass-backed config saved to `resolver_config.json`; update at runtime via `POST /api/config` |
| **Logging** | Colour-coded console output + rotating file log (`logs/resolver_v2.log`) |
| **Retries** | Configurable automatic retries for transient Selenium failures |
| **Dynamic domain detection** | No hard-coded CDN URLs — the pepe-redirect domain is discovered from the page itself |
| **Multiple verification paths** | Handles all known bypass step labels (configurable) |
| **Batch processing** | `POST /api/batch` resolves the same button indices across a list of URLs |
| **Result export** | `POST /api/export` returns results as JSON, CSV, or TXT |
| **Session history** | `GET /api/history` returns the last 200 resolved results |
| **Progress streaming** | `GET /api/progress/<job_id>` streams live status via Server-Sent Events |
| **URL validation** | Rejects malformed URLs before spinning up a browser |
| **Health check** | `GET /api/health` for monitoring/readiness probes |
| **Type hints & docstrings** | Full type annotations throughout |

### 🚀 Running the v2 server

```bash
# 1. Install dependencies
pip install -r requirements.txt

# 2. Start the server (defaults: port 3000, headless Chrome)
python server_v2.py

# Optional environment variables
PORT=5000        python server_v2.py   # custom port
FLASK_DEBUG=1    python server_v2.py   # debug/hot-reload mode
HEADLESS=0       python server_v2.py   # headed Chrome (useful for local debugging)
CHROME_BIN=/usr/bin/chromium-browser python server_v2.py
CHROMEDRIVER_PATH=/usr/bin/chromedriver python server_v2.py
```

### 📡 API Reference (v2)

#### Unchanged endpoints (improved internals)

| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/api/scan` | Scan a URL for download buttons |
| `POST` | `/api/resolve` | Resolve selected buttons on a URL |

#### New endpoints

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/health` | Health / readiness check |
| `GET` | `/api/config` | Get current runtime configuration |
| `POST` | `/api/config` | Update runtime configuration (persisted to JSON) |
| `POST` | `/api/batch` | Resolve buttons across multiple URLs |
| `GET` | `/api/history?limit=50` | Session history of resolved results |
| `POST` | `/api/export` | Export results as JSON, CSV, or TXT |
| `GET` | `/api/progress/<job_id>` | Server-Sent Events stream for a job |

#### Example: scan + resolve

```bash
# Scan a page
curl -X POST http://localhost:3000/api/scan \
  -H 'Content-Type: application/json' \
  -d '{"url": "https://example.com/episode-1"}'

# Resolve button 0
curl -X POST http://localhost:3000/api/resolve \
  -H 'Content-Type: application/json' \
  -d '{"url": "https://example.com/episode-1", "indices": [0]}'
```

#### Example: batch processing

```bash
curl -X POST http://localhost:3000/api/batch \
  -H 'Content-Type: application/json' \
  -d '{
    "urls": [
      "https://example.com/episode-1",
      "https://example.com/episode-2"
    ],
    "indices": [0]
  }'
```

#### Example: export results as CSV

```bash
curl -X POST http://localhost:3000/api/export \
  -H 'Content-Type: application/json' \
  -d '{"format": "csv", "results": [{"index":0,"text":"Download Links","status":"success","url":"https://..."}]}'
```

#### Example: update config at runtime

```bash
curl -X POST http://localhost:3000/api/config \
  -H 'Content-Type: application/json' \
  -d '{"max_retries": 5, "post_click_delay": 7.0, "headless": false}'
```

## 🚀 Getting Started

No build step is required — this is a static site.

1. **Clone the repository**

   ```bash
   git clone https://github.com/eoftisreal/eoftisreal.github.io.git
   cd eoftisreal.github.io
   ```

2. **Open in a browser**

   Open `index.html` directly, or serve it locally:

   ```bash
   npx serve .
   ```

3. **Deploy**

   Push to the `main` branch — GitHub Pages will publish the site automatically.

## 📄 License

This project is open source. Feel free to fork and adapt it for your own portfolio.