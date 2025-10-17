# Repository Structure

This document describes the standardized directory structure for the Habita project, a full-stack application with a React Router frontend, Go backend, and PostgreSQL database.

## Overview

The repository follows a clean, service-oriented structure that separates concerns while maintaining clarity and scalability:

```
habita/
├── web/                              # React Router frontend application
├── server/                           # Go backend service
├── deployments/                      # Infrastructure and deployment configs
├── db/                               # Database migrations, seeds, and types
├── docs/                             # Project documentation
├── rules/                            # Development guidelines
├── public/                           # Static assets
├── types/                            # Shared TypeScript type definitions
├── mdx/                              # MDX content files
└── [config files]                    # Root-level configuration files
```

## Directory Structure

### `web/`
**Purpose:** React Router frontend application (SSR-enabled)

**Contents:**
```
web/
├── routes/           # Application routes
├── components/       # React components
├── lib/              # Utilities and helpers
├── root.tsx          # App root component
└── routes.ts         # Route configuration
```

**Key technologies:**
- React Router v7 (with SSR)
- Bun runtime
- TailwindCSS
- Valibot (validation)

---

### `server/`
**Purpose:** Go backend service providing APIs and background services

**Contents:**
```
server/
├── cmd/
│   └── webserver/
│       └── main.go         # HTTP server entry point
└── internal/
    ├── smtp/
    │   └── smtp.go         # Email service (calendar invites)
    └── telemetry/          # (Future) Observability service
```

**Structure conventions:**
- `cmd/webserver/` - Main HTTP server binary following Go standard layout
- `internal/` - Private packages that cannot be imported externally (Go convention)
- Each service (smtp, telemetry, etc.) gets its own package under `internal/`

**Key technologies:**
- Go 1.22+
- Standard library HTTP server
- SMTP for email functionality

**Why `internal/`?**
In Go, the `internal/` directory is special - code under it can only be imported by code in the same parent directory. This enforces encapsulation and prevents external dependencies on your private APIs.

---

### `deployments/`
**Purpose:** Infrastructure as code and deployment configurations

**Contents:**
```
deployments/
├── development/
│   ├── docker-compose.yml      # Local dev environment
│   ├── Caddyfile               # Reverse proxy config
│   ├── *.pem                   # Local SSL certificates
│   └── dockerfiles/
│       ├── server.Dockerfile   # Go service container
│       └── web.Dockerfile      # Frontend dev container
└── production/
    └── web.Dockerfile          # Production-optimized frontend build
```

**Environment-specific configs:**
- `development/` - Local development with hot-reloading, verbose logging
- `production/` - Optimized builds, minimal images, health checks

**Services in docker-compose:**
- `db` - PostGIS-enabled PostgreSQL
- `valkey` - Redis-compatible cache
- `app` - React Router dev server
- `go` - Backend HTTP server
- `caddy` - Reverse proxy with HTTPS
- `nominatim` - OpenStreetMap geocoding service

---

### `db/`
**Purpose:** Database schema, migrations, seeds, and type generation

**Contents:**
```
db/
├── migrations/           # Kysely SQL migrations
├── seeds/                # Database seed data
├── files/                # SQL utility files
├── types.ts              # Generated TypeScript types
├── dialect.ts            # Database dialect config
├── query_builder.ts      # Kysely query builder setup
└── generate_types.mjs    # Type generation script
```

**Key technologies:**
- Kysely (type-safe SQL query builder)
- PostgreSQL with PostGIS extension
- TypeScript type generation from schema

---

### `docs/`
**Purpose:** Project documentation

**Contents:**
- Architecture decisions
- API documentation
- Development guides
- This structure document

---

### `rules/`
**Purpose:** Enforced development guidelines

**Contents:**
- `code_style.md` - Naming conventions (snake_case, function keyword)
- `authentication.md` - Auth patterns (explicit checks, no middleware)
- `runtime.md` - Runtime preferences (Bun for Node APIs)

**Why separate rules?**
These are referenced in `CLAUDE.md` and must be read before any code changes, ensuring consistency.

---

### Root Configuration Files

```
├── go.mod                    # Go module definition
├── package.json              # Node dependencies and scripts
├── react-router.config.ts    # React Router configuration
├── kysely.config.ts          # Database configuration
├── tsconfig.json             # TypeScript configuration
├── vite.config.ts            # Vite bundler configuration
├── biome.json                # Linter/formatter configuration
├── .env                      # Environment variables
└── .env.template             # Template for required env vars
```

## Design Rationale

### Why this structure?

1. **Clear service boundaries**
   - `web/` and `server/` are independent services with different tech stacks
   - Each can be developed, tested, and deployed independently

2. **Go standard layout**
   - `cmd/` for executables (allows multiple binaries: webserver, worker, migrate)
   - `internal/` for private packages (Go compiler-enforced encapsulation)
   - Familiar to Go developers, scales well

3. **Infrastructure separation**
   - `deployments/` consolidates all ops concerns (Docker, K8s, Terraform in future)
   - Environment-specific configs are clearly separated
   - Easy to add staging, production, etc.

4. **Database as first-class concern**
   - `db/` holds migrations, seeds, and generated types
   - Shared by both web and server services
   - Type generation keeps TypeScript in sync with schema

### What changed from previous structure?

**Old structure:**
```
run/                      # Unclear purpose
├── main.go               # Entry point at wrong level
├── smtp/
│   └── smtp.go
└── development/
    ├── docker-compose.yml
    └── go/Dockerfile
    └── app/Dockerfile

app/                      # Generic name
└── [frontend code]
```

**Issues:**
- `run/` was ambiguous (runtime? scripts? deployment?)
- Go code wasn't following standard layout
- Deployment files mixed with source code
- `app/` could mean anything (frontend? backend? both?)

**New structure:**
```
server/                   # Clear: this is the backend
├── cmd/webserver/        # Clear: HTTP server entry point
└── internal/smtp/        # Clear: private SMTP service

web/                      # Clear: this is the frontend

deployments/              # Clear: infrastructure configs
├── development/
└── production/
```

**Benefits:**
- Obvious what each directory contains
- Follows language/framework conventions
- Scales to additional services (worker, scheduler, etc.)
- New developers can navigate immediately

## Future Growth

This structure accommodates planned expansions:

### Telemetry service
```
server/internal/telemetry/
├── metrics.go
├── tracing.go
└── logging.go
```

### Additional binaries
```
server/cmd/
├── webserver/    # HTTP API server
├── worker/       # Background job processor
└── migrate/      # Database migration tool
```

### Multiple environments
```
deployments/
├── development/
├── staging/
└── production/
```

### Shared libraries (if needed)
```
server/pkg/           # Public packages (can be imported externally)
├── models/
└── utils/
```

Note: Only create `pkg/` if you need to share code with external Go projects. For now, `internal/` is sufficient.

## Migration Notes

When restructuring from old to new layout:

1. **Go imports** - Update `go.mod` module path and all imports
2. **Docker build contexts** - Update paths in Dockerfiles and docker-compose
3. **npm scripts** - Update paths in package.json (especially docker-compose references)
4. **React Router config** - Update app root path in react-router.config.ts
5. **TypeScript paths** - Update import paths if using path aliases

See migration plan in separate documentation for step-by-step guide.

## References

- [Go Standard Layout](https://github.com/golang-standards/project-layout)
- [Monorepo Best Practices](https://monorepo.tools/)
- [React Router Documentation](https://reactrouter.com/)
- [Twelve-Factor App](https://12factor.net/)
