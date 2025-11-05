# ASP Cranes CRM – Technical Onboarding Guide

This document provides a comprehensive, end-to-end technical overview of the ASP Cranes CRM platform. It explains the architecture, repository layout, code flows, module responsibilities, and development practices required to maintain and extend the system with confidence.

The tone is intentionally precise and instructive, targeted at experienced engineers onboarding to the codebase.

## 1. Project Overview

ASP Cranes CRM is a production-grade, containerized CRM platform focused on sales workflows: lead intake, customer management, quotations, equipment management, job scheduling, and analytics. It includes:

- A React + TypeScript frontend served via Vite.
- A Node.js + Express backend exposing a modular REST API over PostgreSQL.
- A templating and PDF generation pipeline for quotations and documents.
- Optional CrewAI cloud integration for agentic AI automations (lead processing, quotation suggestions, research).
- Nginx for edge routing (production) and a dockerized PostgreSQL database.

### High-level Architecture

- Nginx reverse-proxies requests to the frontend (port 3000) and backend API (port 3001).
- The frontend communicates with the backend via `/api/*` endpoints.
- The backend uses PostgreSQL for persistence and follows a layered approach: routes → services → repositories → database.
- Authentication is JWT-based; selected dev paths support a controlled bypass header for local testing.
- CrewAI cloud endpoints are proxied by the backend to securely integrate agent features without exposing credentials to the browser.

## 2. Repository Structure

Top-level tree with purpose notes. Detailed per-folder and per-file descriptions follow.

```
asp-cranes-structured/
├─ .env                               # Environment overrides (root-level, used by compose/dev tooling)
├─ .env.production                    # Production-oriented env overrides
├─ .git/                              # Git metadata
├─ .github/                           # GitHub workflows/config (if present)
├─ .gitignore                         # VCS ignore rules
├─ DATA_MAPPING_FIX.md                # Internal notes for data mapping adjustments
├─ SETUP_FINAL_TEMPLATE.md            # Internal setup notes for final template handling
├─ TEST_TEMPLATE_FIX.md               # Internal testing notes for template fixes
├─ docker-compose.yml                 # Defines services: postgres, backend, frontend, nginx
├─ nginx/
│  ├─ Dockerfile                      # Nginx image for production
│  └─ nginx.prod.conf                 # Reverse proxy and static routing configuration
└─ crm-app/
	├─ database/                       # SQL schema and migrations
	│  ├─ schema.sql                   # Base schema for initial bootstrap
	│  ├─ aspcranes_backup.sql         # Snapshot backup (reference only)
	│  └─ migrations/
	│     ├─ add_company_settings.sql  # Adds company settings table/fields
	│     ├─ add_final_template.sql    # Adds final template storage
	│     ├─ add_quotation_numbering.sql # Adds quotation numbering columns/indexes
	│     └─ add_terms_conditions.sql  # Adds T&C storage
	├─ backend/
	│  ├─ .dockerignore                # Build context exclusions
	│  ├─ .env                         # Backend service environment variables
	│  ├─ Dockerfile                   # Backend container image definition
	│  ├─ package.json                 # Backend dependencies and scripts
	│  ├─ package-lock.json            # Locked dependency tree
	│  ├─ tsconfig.json                # TS compiler config (where TS is used under services)
	│  ├─ scripts/                     # Local utility scripts
	│  │  ├─ repair-templates.mjs      # Fixes/stitches legacy templates to new format
	│  │  └─ test-job-apis.mjs         # Quick API probes for job endpoints
	│  └─ src/
	│     ├─ server.mjs                # Main Express application (primary entry point)
	│     ├─ secureServer.js           # Hardened server variant (optional/legacy)
	│     ├─ authMiddleware.mjs        # Root-level auth middleware (legacy compat)
	│     ├─ middleware/
	│     │  └─ authMiddleware.mjs     # Canonical JWT auth & optional dev bypass
	│     ├─ ai/
	│     │  ├─ AISystemManager.js     # Orchestration for on-prem AI workflows
	│     │  └─ SecureAISystemManager.js # Hardened AI system manager variant
	│     ├─ api/
	│     │  └─ healthRoutes.js        # /api/health endpoints
	│     ├─ config/
	│     │  └─ fixConfig.js           # Centralized config normalization/patches
	│     ├─ lib/
	│     │  ├─ browser-pg-promise.js  # Browser-safe stubs for pg-promise (SSR safety)
	│     │  ├─ browserCompat.js       # Runtime compatibility helpers
	│     │  ├─ clientEnv.js           # Client-side env resolution logic
	│     │  ├─ dbClient.js            # DB client bootstrap
	│     │  ├─ dbConnection.js        # Low-level DB connection (pg)
	│     │  ├─ modulePatcher.js       # Patches for module resolution
	│     │  ├─ pg-promise-server.js   # Node-side pg-promise setup
	│     │  └─ server-module-patch.js # Fallback/polyfills for server modules
	│     ├─ models/
	│     │  ├─ deal-schema.json       # JSON schemas used for validation/mapping
	│     │  ├─ equipment-schema.json
	│     │  ├─ leads-schema.json
	│     │  └─ quotations-schema.json
	│     ├─ routes/                    # Express routers (feature-scoped)
	│     │  ├─ activityRoutes.mjs
	│     │  ├─ aiRoutes.mjs
	│     │  ├─ authRoutes.mjs
	│     │  ├─ companySettingsRoutes.mjs
	│     │  ├─ configRoutes.mjs
	│     │  ├─ crewaiCloudRoutes.mjs
	│     │  ├─ customerRoutes.mjs
	│     │  ├─ dashboardRoutes.mjs
	│     │  ├─ databaseRoutes.mjs
	│     │  ├─ dbConfigRoutes.mjs
	│     │  ├─ dbRoutes.mjs
	│     │  ├─ dealsRoutes.mjs
	│     │  ├─ enhancedTemplateRoutes.mjs
	│     │  ├─ equipmentRoutes.mjs
	│     │  ├─ jobRoutes.mjs
	│     │  ├─ leadsRoutes.mjs
	│     │  ├─ mfaRoutes.mjs
	│     │  ├─ notificationRoutes.mjs
	│     │  ├─ operatorRoutes.mjs
	│     │  ├─ quotationPreviewRoutes.mjs
	│     │  ├─ quotationPrintRoutes.mjs
	│     │  ├─ quotationRoutes.mjs
	│     │  ├─ templateMaintenanceRoutes.mjs
	│     │  └─ userRoutes.mjs
	│     ├─ services/                  # Business logic and integrations
	│     │  ├─ activityService.js      # Activity feed operations
	│     │  ├─ AdvancedPDFGenerator.mjs# Higher-level PDF composition
	│     │  ├─ browser-pg-promise.js   # Browser adapter (shared lib re-export)
	│     │  ├─ CrewAICloudService.js   # CrewAI cloud REST client + signing
	│     │  ├─ dbClient.js             # DB helper (wrapper over lib/dbClient)
	│     │  ├─ EnhancedTemplateBuilder.mjs # Quotation template renderer
	│     │  ├─ HtmlGeneratorService.mjs# HTML generation for templates/PDF
	│     │  ├─ notificationEngine.js   # Notification pipeline/orchestrator
	│     │  ├─ notificationService.js  # Notification dispatch logic
	│     │  ├─ PdfService.mjs          # PDF rendering utilities
	│     │  ├─ TemplateService.mjs     # Template CRUD + rendering flows
	│     │  ├─ api/                    # TypeScript API service facades
	│     │  │  ├─ customerService.ts
	│     │  │  ├─ dealService.ts
	│     │  │  ├─ equipmentService.ts
	│     │  │  └─ leadService.ts
	│     │  ├─ mocks/                  # Mock repositories for dev/testing
	│     │  │  ├─ serviceRepository.ts
	│     │  │  └─ templateRepository.ts
	│     │  └─ postgres/               # Database repositories (Node)
	│     │     ├─ authRepository.js
	│     │     ├─ configRepository.js
	│     │     ├─ dealRepository.js
	│     │     ├─ equipmentRepository.js
	│     │     ├─ jobRepository.js
	│     │     ├─ leadRepository.js
	│     │     ├─ mfaRepository.js
	│     │     ├─ operatorRepository.js
	│     │     └─ templateRepository.js
	│     └─ utils/
	│        ├─ cleanupForProduction.js # Strips dev artifacts from output
	│        ├─ pdfGenerator.js         # PDF assembly helpers (low-level)
	│        └─ quotationTableBuilder.mjs # Builds tabular structures for PDFs
	└─ frontend/
		├─ .dockerignore                 # Frontend build context exclusions
		├─ .env                          # Frontend env
		├─ .env.production               # Production env
		├─ Dockerfile                    # Frontend container image definition
		├─ index.html                    # Vite HTML entry
		├─ package.json                  # Frontend dependencies and scripts
		├─ package-lock.json             # Locked dependency tree
		├─ postcss.config.js             # PostCSS pipeline
		├─ tailwind.config.js            # Tailwind setup
		├─ tsconfig*.json                # TS compiler configs
		├─ vite.config.ts                # Vite bundler config
		├─ public/
		│  ├─ asp-logo.jpg
		│  ├─ compat.js                  # Browser compat utilities
		│  └─ templates/
		│     └─ quotation_template.html # Default static quotation template
		└─ src/
			├─ main.tsx                   # Frontend entry point
			├─ App.tsx                    # App root component/router shell
			├─ index.css                  # Global styles
			├─ assets/
			│  └─ asp-logo.jpg
			├─ components/                # Feature and UI components
			│  ├─ auth/                   # Auth UI flows (login, MFA, guards)
			│  ├─ chat/                   # Floating chat widget
			│  ├─ common/                 # Shared UI primitives (cards, inputs)
			│  ├─ config/                 # UI for system and quotation config
			│  ├─ dashboard/              # Dashboard widgets and management UIs
			│  ├─ debug/                  # Debug scaffolding
			│  ├─ layout/                 # Header/Sidebar/AppShell
			│  ├─ quotations/             # Template builder & quotation UIs
			│  ├─ templates/              # Template editor & preview modals
			│  └─ ui/                     # Headless UI wrappers (shadcn-like)
			├─ hooks/                     # Custom React hooks
			├─ lib/                       # Frontend API client and helpers
			├─ pages/                     # Route-level pages
			├─ plugins/                   # Module resolution shims
			├─ services/                  # API services and domain helpers
			├─ shims/                     # Node module shims for browser
			├─ store/                     # Global state stores
			├─ types/                     # Shared TypeScript types/interfaces
			└─ utils/                     # Client utilities (formatters, renderers)
```

### Per-folder and key file responsibilities

The notes below connect filenames to their runtime roles and cross-module dependencies. Where relevant, excerpts are provided to anchor behaviors to code.

#### docker-compose.yml
- Defines four services: `postgres`, `backend`, `frontend`, `nginx`.
- Injects environment variables (DB credentials, JWT secrets, CrewAI tokens) and service wiring.
- Exposes ports: 5432 (DB), 3001 (API), 3000 (Frontend), 80 (Nginx).

#### nginx/
- `nginx.prod.conf`: Routes `/api/*` to the backend; serves frontend assets; sets basic headers and gzip.

#### crm-app/database/
- `schema.sql`: Initial tables and relations.
- `migrations/*.sql`: Lineage of structural changes (company settings, quotation numbering, etc.).

#### crm-app/backend/src/server.mjs (Entry Point)
- Boots Express, applies security middleware (helmet, cors, rate limit, compression), and mounts all routers under `/api`.
- Enables CORS with `Authorization` and `x-bypass-auth` headers.
- Integrates all route modules (auth, leads, deals, quotations, equipment, dashboard, AI, CrewAI cloud, etc.).

Key excerpt:

```js
import authRoutes from './routes/authRoutes.mjs';
import quotationRoutes from './routes/quotationRoutes.mjs';
import aiRoutes from './routes/aiRoutes.mjs';
import crewaiCloudRoutes from './routes/crewaiCloudRoutes.mjs';
// ...
app.use('/api/auth', authRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/crewai-cloud', crewaiCloudRoutes);
app.use('/api/quotations', quotationRoutes);
```

#### crm-app/backend/src/middleware/authMiddleware.mjs
- Implements JWT authentication. Looks for `Authorization: Bearer <token>`.
- Controlled dev bypass for localhost or with header `x-bypass-auth: development-only-123`.
- Exposes `authenticateToken` and `optionalAuth` for routes that can accept anonymous reads.

```js
const authHeader = req.headers['authorization'];
const token = authHeader && authHeader.split(' ')[1];
const decoded = jwt.verify(token, JWT_SECRET);
```

#### crm-app/backend/src/routes/*
- Each file defines a cohesive router. Notable endpoints:
  - `authRoutes.mjs`: `/login`, `/register`, `/validate`, `/verify-token`, `GET /sales-agents`, `GET /profile`.
  - `quotationRoutes.mjs`: CRUD + print initiation; uses DB `quotation_number` (not generated) and sets cache headers.
  - `quotationPreviewRoutes.mjs` and `quotationPrintRoutes.mjs`: Preview/PDF generation built on template services.
  - `enhancedTemplateRoutes.mjs`: Sample data endpoints and rendering helpers for the template builder.
  - `crewaiCloudRoutes.mjs`: Bridges to CrewAI cloud (`/chat`, `/leads/process`, `/quotations/generate`, webhooks, metrics).
  - `aiRoutes.mjs`: On-prem AI system surface; protected by `authenticateToken`.

#### crm-app/backend/src/services/*
- `EnhancedTemplateBuilder.mjs`: Core renderer that replaces `{{placeholders}}` in HTML templates with quotation/customer/equipment data. Emits structures consumed by `PdfService`.
- `AdvancedPDFGenerator.mjs` + `PdfService.mjs` + `HtmlGeneratorService.mjs`: A layered approach to HTML→PDF creation, table building, and asset embedding.
- `TemplateService.mjs`: CRUD and orchestration around templates (default, company-specific). Used by routes.
- `CrewAICloudService.js`: Encapsulates CrewAI REST calls, webhook signature verification, and API token usage from env.
- `postgres/*.js`: Repositories that execute SQL for each domain (auth, lead, deal, equipment, jobs, etc.). These form the persistence layer used by services.

#### crm-app/backend/src/lib/*
- Setup code for DB connections (`pg`/`pg-promise`), module patching, and browser-safe shims shared by both server and frontend build tooling.

#### crm-app/frontend (Vite + React + TS)
- `src/main.tsx`, `src/App.tsx`: Bootstraps the SPA, mounts the router/layout.
- `components/quotations/*`: Quotation UIs including the Enhanced Template Builder (visual editor, live preview, printing). These call backend template and quotation endpoints.
- `lib/apiClient.ts` + `services/*`: Axios-based API clients with token management, config, and feature-specific services.
- `store/*`: Small state containers for auth and configuration.
- `types/*`: Domain model types shared across the UI.
- `utils/*`: Formatters, template renderers, session storage helpers, and debug tools.

## 3. Code Flow & Execution Lifecycle

This section maps runtime control from process start through request handling and shutdown.

### Backend Lifecycle

1. Container starts `node src/server.mjs`.
2. `server.mjs` loads environment, initializes Express, applies middleware:
	- `helmet`, `cors` (with `Authorization`, `x-bypass-auth`), `morgan`, `compression`, `cookieParser`, and a rate limiter.
3. All route modules are mounted under `/api`. Route guards use `authenticateToken` where appropriate.
4. For a typical secured API call (e.g., `GET /api/quotations`):
	- CORS check → `authenticateToken` verifies the JWT.
	- Route handler calls a service (e.g., quotation listing) which calls a repository under `services/postgres/*`.
	- The repository executes SQL via `lib/dbConnection.js` or `lib/pg-promise-server.js` and returns entities.
	- The route normalizes payloads and sets cache headers before responding JSON.
5. For PDF/Preview:
	- Route builds a data model → `EnhancedTemplateBuilder` replaces placeholders in HTML → `PdfService` converts to PDF.
6. For CrewAI calls:
	- `/api/crewai-cloud/*` proxies to CrewAI endpoints via `CrewAICloudService.js`.
	- Webhooks hit `/api/crewai-cloud/webhook`, with signature verification before internal processing.

### Frontend Lifecycle

1. Container starts Vite preview/serve. `src/main.tsx` renders `<App />`.
2. Auth flow:
	- `components/auth/LoginForm.tsx` calls `authService.ts` → `POST /api/auth/login`.
	- `jwtService.ts`/`tokenManager.ts` persist tokens; `apiClient.ts` attaches `Authorization: Bearer <token>` to subsequent requests.
3. Feature pages (`pages/*.tsx`) and components (`components/*`) call `services/api/*Service.ts` to interact with backend resources.
4. Quotation template builder (`components/quotations/EnhancedTemplateBuilder.tsx`) hits `/api/templates/enhanced/*` for sample data and preview, then `/api/quotations/print` for PDFs.

### Data Flow: Inputs → Transformations → Outputs

- Inputs: HTTP requests with JSON bodies; JWT for auth; query params for pagination/filtering; template HTML from DB or `public/templates`.
- Transformations: Validation in routes; business logic in services; SQL in repositories; rendering in template/PDF services.
- Outputs: JSON payloads to UI; PDF streams for print; HTML previews for builder; webhook acknowledgments to CrewAI.

## 4. Detailed Module Explanations

### Authentication (authMiddleware.mjs + authRoutes.mjs)
- Responsibility: Verify JWTs for protected endpoints, provide login/registration/token validation.
- Algorithm: Extract bearer token → `jwt.verify` with `JWT_SECRET` → set `req.user` → proceed or return `401/403`.
- Integration: Mounted via `server.mjs`; used by most routes. Dev bypass strictly limited to non-production.

```js
// middleware/authMiddleware.mjs
export const authenticateToken = (req, res, next) => {
  const token = (req.headers['authorization']||'').split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Access token required' });
  try { req.user = jwt.verify(token, JWT_SECRET); return next(); }
  catch { return res.status(403).json({ error: 'Invalid or expired token' }); }
};
```

### Quotation Pipeline (quotationRoutes.mjs + EnhancedTemplateBuilder.mjs + PdfService.mjs)
- Responsibility: Persist quotation data, render previews, generate PDFs.
- Flow: Route loads quotation + relations → `EnhancedTemplateBuilder` replaces placeholders → `HtmlGeneratorService`/`PdfService` produce output. Cache headers are set to avoid stale ETags masking updates.
- Pitfalls: Always use DB `quotation_number`. Avoid generating synthetic numbers in routes/services.

### CrewAI Integration (crewaiCloudRoutes.mjs + CrewAICloudService.js + aiRoutes.mjs)
- Responsibility: Provide stable API surface for AI automations, proxying to CrewAI cloud with server-side tokens.
- Workflows: `/chat`, `/leads/process`, `/quotations/generate`, `/intelligence/research-company`, metrics, and webhooks.
- Security: Webhook signature verification and server-side storage of CrewAI API tokens via env.

### Repositories (services/postgres/*.js)
- Responsibility: Encapsulate SQL. Each domain (lead, deal, equipment, operator, template) has a repository.
- Pattern: Thin data mappers returning JS objects to services. Keep SQL versioned via `crm-app/database/migrations`.

### Frontend Services and Clients (src/lib, src/services)
- Responsibility: Centralize API calls and token management to simplify components.
- Example: `lib/apiClient.ts` configures Axios with base URL and auth headers; `services/api/*` exposes feature-specific methods.

## 5. Setup & Environment (Concise)

Prerequisites: Docker & Docker Compose installed.

One-line run:

```bash
docker-compose up -d --build
```

Frontend: http://localhost:3000 • API: http://localhost:3001 • Nginx: http://localhost:80

## 6. Development Guidelines

### Coding Conventions
- JavaScript/TypeScript with ES modules. Prefer async/await, early returns, and small pure functions.
- Keep route handlers thin; place business logic in services; keep SQL in repositories.
- Use schema/types in `frontend/src/types` and backend JSON schemas for validation consistency.

### Extending Modules
- New API feature:
  1) Add repository method in `services/postgres/*`.
  2) Add a service function to orchestrate business rules.
  3) Add a route in `src/routes/*` guarded by `authenticateToken` when needed.
  4) Update frontend `services/api/*Service.ts` and types.
- New template feature:
  - Extend `EnhancedTemplateBuilder.mjs` placeholder mapping; add safe defaults and unit tests where possible.

### Best Practices
- Do not bypass authentication outside local development.
- Prefer strong cache-busting or `no-store` headers for mutable resources.
- Log with context (route, entity id, user id) but avoid secrets.
- Keep migrations idempotent and reviewed; never edit applied migration files.

### Common Pitfalls & Troubleshooting
- Seeing stale quotation numbers: ensure cache headers are set and browser dev tools disable cache.
- PDF rendering differences: verify HTML from `HtmlGeneratorService` and fonts are embedded.
- CORS failures: confirm `FRONTEND_ORIGIN` and allowed headers in `server.mjs`.
- CrewAI errors: verify `CREWAI_API_URL`/tokens and webhook signature config in `CrewAICloudService.js`.

## 7. System Diagram

```
						+-----------------+
						|     Browser     |
						|  (React SPA)    |
						+--------+--------+
									|
									| HTTP (TLS via Nginx)
									v
						  +------+------+
						  |   Nginx     |
						  |  Reverse    |
						  |   Proxy     |
						  +--+-------+--+
							  |       |
	  Static assets     |       |   /api/*
		(port 3000)      |       |
							  v       v
					+-------+--+  +--+--------+
					| Frontend |  |  Backend  |
					|  Vite    |  |  Express  |
					+----------+  +-----------+
											  |
											  | SQL (pg)
											  v
									  +-----+------+
									  | PostgreSQL |
									  +------------+

	CrewAI Cloud Integration
					^
					| HTTPS (server-side)
					+-----------------------------+
					|  CrewAICloudService.js      |
					+-----------------------------+
```

## 8. Contribution Workflow

### Branching Strategy
- `master` is protected and always deployable.
- Use feature branches: `feature/<short-desc>`, `fix/<short-desc>`, `chore/<short-desc>`.

### Commit Messages
- Conventional style:
  - `feat(quotations): add bulk export`
  - `fix(auth): handle token refresh race`
  - `chore(db): reindex quotations table`

### Pull Requests
- Include a clear problem statement, approach, and testing notes.
- Link to any related tickets; add screenshots for UI changes.
- Request at least one reviewer; ensure CI passes.

### Safe Change Process
1) Write or update unit/integration tests when changing public behavior.
2) Validate locally with `docker-compose up -d --build`.
3) Verify database migrations against a fresh DB.
4) For API changes, update frontend `services/api/*` and corresponding types.

---

If you need deeper domain context (quotation numbering, PDF specifics, or CrewAI workflow design), review service and route files referenced above and the migration history in `crm-app/database/migrations`.
