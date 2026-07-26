# 🚀 EndpointSys — High-Performance API Testing & Documentation Platform

![EndpointSys Logo](https://img.shields.io/badge/EndpointSys-v1.0%20Pro-0284c7?style=for-the-badge&logo=postman&logoColor=white)
![Stack](https://img.shields.io/badge/React_18-Vite-TailwindCSS-00D8FF?style=for-the-badge&logo=react)
![Database](https://img.shields.io/badge/Database-XAMPP_MySQL-4479A1?style=for-the-badge&logo=mysql&logoColor=white)
![Security](https://img.shields.io/badge/JWT-Staff_Roles_(Admin_/_Operador)-FF6C37?style=for-the-badge&logo=jsonwebtokens&logoColor=white)

**EndpointSys** is a modern, full-featured API Testing Workspace and Public Documentation Portal designed for developers, QA engineers, and operations teams. Built with React 18, Vite, Node.js Express, and XAMPP MySQL, it delivers Postman-grade API execution, dynamic script evaluation, secret masking, catalog reordering, and role-based staff access.

---

## 🌟 Key Features

- ⚡ **Multi-Tab Request Builder & Response Inspector**:
  - Full support for `GET`, `POST`, `PUT`, `DELETE`, `PATCH`, and custom HTTP methods.
  - Query parameters, custom request headers, Bearer Token / Basic Auth / API Key authentication, raw JSON, form-data, x-www-form-urlencoded, and GraphQL query editors.
  - Live response inspection with formatted JSON syntax tree, HTTP status codes, latency timings, and byte size.

- 🔒 **Secret & Sensitive Variable Masking**:
  - Mask sensitive credentials (API keys, bearer tokens, passwords) with `••••••••••••`.
  - 1-click **Eye toggle buttons (👁️ / 👁️‍🗨️)** to reveal or hide secret values on demand.
  - Amber lock 🔒 badges for instant visual identification of secret keys.

- 📜 **Postman-Style Script Engine (`pm.test` & `pm.environment.set`)**:
  - Execute pre-request and post-response test assertions.
  - Automatically persist script-set variables (e.g. `pm.environment.set("geotabSessionId", sessionId)`) back to the active environment and MySQL database in real time.

- 📂 **Collapsible & Reorderable API Collections**:
  - Reorder top-level collection cards via 1-click **Move Up ⬆️ / Move Down ⬇️** buttons or HTML5 **Drag-and-Drop ⠿**.
  - Persistent collection ordering and collapse/expand states saved directly to MySQL.

- 🛡️ **JWT Staff Authentication & Role-Based Access (RBAC)**:
  - Secure JWT authentication system signed with HS256 tokens.
  - Staff roles: **`admin`** (full editing & administrative rights) and **`operador`** (read and request execution access).

- 🗄️ **Permanent XAMPP MySQL Database (`endpointsys_db`)**:
  - Transactional NoSQL-style JSON storage over MySQL for collections, environments, execution logs, and user preferences.

---

## 🔐 Staff Credentials

On first run (empty `users` table) the backend creates a single `admin` account with a **random one-time password** that is printed **once** to the server console and must be changed on first login. No `operador` account is seeded — admins create staff from the UI.

- 🛡️ **admin** — full editing, reorder, environments, user management.
- 👤 **operador** — (created by an admin) run requests / view responses.

> Never commit a `.env` file. Copy `.env.example` to `.env` and fill in real values.

---

## 🛠️ Prerequisites & Installation

### Requirements:
1. **Node.js** (v18.0 or higher) & **npm**
2. **XAMPP Server** (MySQL running on port `3306`)

---

### Step 1: Start XAMPP MySQL Database
Make sure XAMPP MySQL service is running on `localhost:3306`.
- Open **XAMPP Control Panel** and click **Start** next to **MySQL**.
- *Alternative command line*:
  ```cmd
  C:\xampp\mysql_start.bat
  ```

---

### Step 2: Install Project Dependencies
Clone the repository and install all required Node modules:
```bash
git clone https://github.com/grachos/EnpointSys.git
cd EnpointSys
npm install
```

---

### Step 3: Start Backend API Server
Create a `.env` (copy from `.env.example`) and set at least `JWT_SECRET` and your DB credentials, then:
```bash
npm run server
```
*Output (first run)*:
```
EndpointSys backend listening on port 5000
==============================================================
  Default admin created. Username: admin
  One-time password: <random>
  You will be required to change it on first login.
==============================================================
EndpointSys MySQL schema initialised.
```

---

### Step 4: Start Frontend Application
In a separate terminal window, start the Vite frontend development server:
```bash
npm run dev
```
Open **[http://localhost:3000/](http://localhost:3000/)** in your browser!

---

## 🚀 Production Deployment (Linux VPS)

### A. MySQL — create a least-privilege database & user
```sql
CREATE DATABASE endpointsys_db CHARACTER SET utf8mb4;
CREATE USER 'endpointsys'@'localhost' IDENTIFIED BY '<strong-db-password>';
GRANT ALL PRIVILEGES ON endpointsys_db.* TO 'endpointsys'@'localhost';
FLUSH PRIVILEGES;
```

### B. Backend
```bash
cp .env.example .env
# Fill JWT_SECRET (>=32 chars), DOCS_TOKEN_SECRET, DB_*, CORS_ORIGIN, etc.
npm ci --omit=dev
# Run with a process manager so it survives reboots:
pm2 start server/index.js --name endpointsys-api
pm2 save && pm2 startup
```
The server now hardens itself on boot: `helmet`, per-IP rate limiting (300/min global, 10/15min on login), strict CORS allow-list, 2 MB body limit, env-only secrets, and per-user data isolation with composite primary keys.

### C. Frontend
```bash
npm ci --omit=dev
npm run build            # outputs dist/
```
Serve `dist/` with nginx and reverse-proxy `/api/*` to the backend so the front-end can use the relative `/api` base (no hardcoded `localhost`):

```nginx
server {
  listen 443 ssl http2;
  server_name endpointsys.example.com;
  root /var/www/endpointsys/dist;
  index index.html;

  location /api/ {
    proxy_pass http://127.0.0.1:5000;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
  }
  location / { try_files $uri /index.html; }
}
```
Set `CORS_ORIGIN=https://endpointsys.example.com` in `.env`. Put the backend behind the firewall (listen on `127.0.0.1` only) and terminate TLS at nginx.

### Security checklist before going live
- [ ] `JWT_SECRET` and `DOCS_TOKEN_SECRET` are long random values, not the default.
- [ ] DB user is scoped to `endpointsys_db` only; root is not used.
- [ ] `CORS_ORIGIN` lists only your real front-end origin(s).
- [ ] Backend not exposed directly to the internet (only via nginx `/api`).
- [ ] First-login password change completed for the seeded admin.
- [ ] `pm2` / systemd restart-on-failure and log rotation configured.

---

## 🚀 How to Push Changes to GitHub Repository

To push updates to your GitHub repository at `https://github.com/grachos/EnpointSys`:

```bash
# 1. Initialize git repository if not already initialized
git init

# 2. Add remote repository
git remote add origin https://github.com/grachos/EnpointSys.git

# 3. Stage all files
git add .

# 4. Commit changes
git commit -m "feat: Add JWT staff authentication, roles (admin/operador), XAMPP MySQL DB, and collection reordering"

# 5. Push to main branch
git branch -M main
git push -u origin main
```

---

## 📁 Repository Structure

```
EnpointSys/
├── server/
│   └── index.js              # Express REST API server & MySQL Database connection pool
├── src/
│   ├── components/
│   │   ├── Header.jsx        # Top navigation, JWT staff badge, theme & split controls
│   │   ├── Sidebar.jsx       # Tree view, collapsible/reorderable collections & history
│   │   ├── TabManager.jsx    # Open request tabs
│   │   ├── RequestBuilder/   # HTTP request builder (Params, Auth, Headers, Body, Scripts)
│   │   ├── ResponseViewer/   # Response inspector & test assertion logs
│   │   ├── Modals/
│   │   │   ├── LoginModal.jsx         # Staff JWT Login modal (Admin / Operador)
│   │   │   ├── EnvironmentModal.jsx   # Environment manager & secret variable toggles
│   │   │   ├── ImportExportModal.jsx  # Collection import/export & DB backup restore
│   │   │   ├── CodeSnippetModal.jsx   # Code snippet generator (curl, fetch, python, etc)
│   │   │   └── PublishDocsModal.jsx   # Published documentation portal generator
│   ├── services/
│   │   ├── dbService.js      # MySQL API client service
│   │   ├── httpExecutor.js   # HTTP Request execution engine
│   │   ├── scriptExecutor.js # pm.test and pm.environment JavaScript runner
│   │   ├── themeService.js    # Theme switcher (Dark, Light, System)
│   │   └── importExportService.js # Postman v2.1 & OpenAPI 3.0 converter
│   ├── types/
│   │   └── defaults.js       # Pre-configured sample environments & catalogs
│   ├── App.jsx               # Root Application state & MySQL synchronization
│   └── main.jsx              # Application entry point
├── package.json              # Project dependencies & npm scripts
├── vite.config.js            # Vite configuration
└── README.md                 # Project documentation
```

---

## 📄 License
Distributed under the **MIT License**. Created for high-speed API development and documentation.
