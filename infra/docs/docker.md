# Docker in Habita

This document teaches Docker from zero using our actual infrastructure as examples. Every concept is explained in full, including how concepts connect to each other.

## What is Docker?

Docker packages your application and everything it needs (Node.js, PostgreSQL, system libraries) into an isolated unit called a **container**. Think of it like a lightweight virtual machine — your app runs inside it with its own filesystem, network, and processes, completely isolated from your host machine.

**Why we use it:** Without Docker, every developer would need to manually install PostgreSQL 17, PostGIS, Valkey, Node.js 22, Go 1.23, Caddy, Nominatim, etc. — all at the exact right versions. Docker eliminates "works on my machine" problems.

Docker is not a virtual machine. A VM emulates an entire computer with its own kernel. Docker containers share the host's kernel and only isolate the userspace (filesystem, processes, network). This makes containers start in milliseconds (not minutes), use much less memory, and have near-zero performance overhead.

---

## Images

An **image** is a frozen, read-only snapshot of a filesystem. It contains an operating system, your application code, its dependencies, and configuration — everything needed to run the app.

### Where images come from

Images come from two places:

1. **Registries** — Remote repositories where pre-built images are stored. Docker Hub is the default public registry. When you write `image: postgis/postgis:17-3.4` in a compose file, Docker downloads that image from Docker Hub.

2. **Dockerfiles** — You build your own images from a recipe file. Our SvelteKit and Go apps have custom Dockerfiles because they contain our code.

### Image naming

Images follow the pattern `registry/name:tag`:

```
postgis/postgis:17-3.4
│       │       │
│       │       └── Tag (version). "latest" if omitted, but never rely on "latest"
│       └── Image name
└── Organization (or Docker Hub username)

node:22-slim
│    │
│    └── Tag: Node 22, slim variant (smaller, fewer system packages)
└── Official image (no organization prefix)

mcr.microsoft.com/playwright:v1.58.2-noble
│                  │          │
│                  │          └── Tag
│                  └── Image name
└── Registry (Microsoft Container Registry, not Docker Hub)
```

Tags are **not** automatically updated. `node:22-slim` pointed to Node 22.1.0 when we first pulled it. It might point to 22.5.0 on Docker Hub today, but our local copy doesn't change unless we explicitly pull again. This is why `pull: false` in our dev compose files makes builds faster — it skips checking the registry every time.

### Layers

An image is not one big file — it's a stack of **layers**. Each instruction in a Dockerfile creates a new layer on top of the previous ones:

```
Layer 4: COPY . .                    (your code — ~5MB)
Layer 3: RUN pnpm install           (node_modules — ~200MB)
Layer 2: RUN corepack enable        (pnpm binary — ~10MB)
Layer 1: FROM node:22-slim          (Debian + Node.js — ~200MB)
```

Layers are:
- **Read-only** — Once built, a layer never changes
- **Shared** — If two images use the same base (`node:22-slim`), they share that layer on disk. You don't store it twice.
- **Cached** — Docker only rebuilds a layer if its input changed. If `package.json` hasn't changed, layer 3 is reused from cache, saving minutes on each build.

This is why Dockerfiles copy `package.json` **before** copying the rest of the code:

```dockerfile
COPY package.json pnpm-lock.yaml ./    # Layer 3: changes rarely
RUN pnpm install                       # Layer 4: cached if package.json unchanged
COPY . .                               # Layer 5: changes on every code edit
```

If we did `COPY . .` first, **every** code change would invalidate the dependency install cache, because Docker invalidates a layer and all layers after it when the input changes.

**How layers connect to containers:** When a container starts, Docker adds a thin **writable layer** on top of the image's read-only layers. Any files the container writes go into this writable layer. When the container is removed, the writable layer is deleted — but the image layers remain unchanged. This is why containers are ephemeral and volumes exist (to persist data outside the writable layer).

---

## Containers

A **container** is a running instance of an image. The image is the blueprint; the container is the building.

### Container lifecycle

A container moves through these states:

```
Created → Running → Paused → Running → Stopped → Removed
                                  │
                                  └→ (crash) → Restarting → Running
```

- **Created** — Container exists but hasn't started yet (`docker create`)
- **Running** — The main process (PID 1) is executing
- **Paused** — Process is frozen in memory (rarely used)
- **Stopped** — Process exited (normally or crashed). Container still exists on disk with its writable layer intact — you can restart it or inspect its files
- **Removed** — Container is deleted. Writable layer is gone. Any data not in a volume is lost forever.

### PID 1 and signals

Every container has a **main process** — the one defined by `CMD` or `ENTRYPOINT` in the Dockerfile. This process runs as PID 1 (the first process, like `init` on Linux).

PID 1 has special behavior:
- When Docker stops a container, it sends **SIGTERM** to PID 1. This is a polite "please shut down" signal.
- If PID 1 doesn't exit within 10 seconds, Docker sends **SIGKILL** — an immediate, forceful kill.
- If PID 1 exits (normally or from a crash), the **entire container stops**. Even if other processes were running inside.

This is why the main process matters. In our SvelteKit container, PID 1 is the Node.js dev server. If it crashes, the container stops, Docker marks it as exited, and the healthcheck starts failing.

**How PID 1 connects to healthchecks:** The healthcheck runs as a separate process inside the container. It can detect when PID 1 is alive but not functioning correctly (e.g., Node.js is running but the HTTP server crashed internally). This is more sophisticated than just checking if PID 1 exists.

### Restart policies

What happens when PID 1 exits? The restart policy decides:

```yaml
services:
  clickhouse:
    restart: on-failure    # Restart only if the process exits with a non-zero code
```

Options:
- `no` (default) — Don't restart. Container stays stopped. Used for one-off tasks.
- `on-failure` — Restart only on crashes (non-zero exit code). Used for services that might occasionally crash but shouldn't loop.
- `always` — Restart no matter what, even after `docker stop` (restarts on Docker daemon startup). Used for production services.
- `unless-stopped` — Like `always`, but doesn't restart if you manually stopped it.

Most of our services don't set a restart policy (defaulting to `no`) because in development, we want to see crashes immediately rather than having Docker silently restart things.

### Users and security

By default, processes inside a container run as **root**. This is a security risk — if an attacker breaks out of the container, they have root access to the host.

Our Dockerfiles create non-root users:

```dockerfile
# In the SvelteKit Dockerfile
RUN addgroup --system appgroup && adduser --system --ingroup appgroup appuser
USER appuser
```

```dockerfile
# In the Go Dockerfile
RUN addgroup -S gopher && adduser -S gopher -G gopher
USER gopher
```

After `USER appuser`, all subsequent commands (`CMD`, `ENTRYPOINT`, `RUN`) execute as that user. The process can't modify system files, install packages, or do anything that requires root.

**Exception:** Our imgproxy service runs as root because it needs to run `update-ca-certificates` at startup to trust our development TLS certificates. This is a development-only tradeoff — production images should always run as non-root.

**How users connect to volumes:** File permissions matter. If a volume was created by a root process, a non-root user might not be able to write to it. This is a common source of "permission denied" errors in containers.

---

## Dockerfile instructions

A Dockerfile is a sequence of instructions that build an image layer by layer. Here's every instruction we use, explained in depth.

### FROM — Choose a base image

```dockerfile
FROM node:22-slim AS runtime
```

Every Dockerfile starts with `FROM`. It sets the base image — the starting filesystem that all subsequent instructions modify.

- `node:22-slim` — Debian-based image with Node.js 22 pre-installed. The `slim` variant excludes build tools and man pages (~200MB instead of ~900MB).
- `AS runtime` — Names this stage for reference in multi-stage builds.

You can have multiple `FROM` instructions — each one starts a new **stage** (see Multi-stage builds below).

### RUN — Execute a command during build

```dockerfile
RUN corepack enable && corepack prepare pnpm@latest --activate
RUN pnpm install --frozen-lockfile
```

`RUN` executes a command inside the image being built and saves the result as a new layer. The command runs once during `docker build` — not when the container starts.

Chaining commands with `&&` keeps them in a single layer:

```dockerfile
# One layer (good — smaller image)
RUN apt-get update && apt-get install -y curl && rm -rf /var/lib/apt/lists/*

# Three layers (wasteful — the apt cache from layer 1 persists in the image even though layer 3 deletes it)
RUN apt-get update
RUN apt-get install -y curl
RUN rm -rf /var/lib/apt/lists/*
```

**Why this matters for layers:** Each layer is immutable. Deleting a file in a later layer doesn't actually shrink the image — the file still exists in the earlier layer. It's just hidden. Chaining commands in a single `RUN` ensures cleanup happens in the same layer as the creation.

### COPY — Add files from the build context

```dockerfile
COPY package.json pnpm-lock.yaml ./
COPY . .
COPY --from=builder /app/build ./build
```

`COPY` adds files from the **build context** (the directory you specified) into the image.

- `COPY package.json pnpm-lock.yaml ./` — Copies specific files. Used to enable layer caching (copy dependency manifests first, install, then copy everything else).
- `COPY . .` — Copies everything from the build context (respecting `.dockerignore`).
- `COPY --from=builder /app/build ./build` — Copies from a different stage, not from the build context. This is how multi-stage builds transfer artifacts between stages.

**How COPY connects to .dockerignore:** Every file in the build context is sent to the Docker daemon before the build starts. `.dockerignore` prevents unnecessary files (node_modules, .git, docs) from being sent. Without it, `COPY . .` would include everything, making the build slow and the image bloated.

### WORKDIR — Set the working directory

```dockerfile
WORKDIR /app
```

All subsequent `RUN`, `COPY`, `CMD`, and `ENTRYPOINT` commands run relative to this directory. If the directory doesn't exist, Docker creates it.

### CMD — Default command when the container starts

```dockerfile
CMD ["pnpm", "run", "dev", "--", "--host", "0.0.0.0", "--port", "5174"]
CMD ["node", "build"]
```

`CMD` defines what runs when the container starts. It has two forms:

- **Exec form** (array): `CMD ["node", "build"]` — Runs `node` directly as PID 1. Signals (SIGTERM) reach it correctly. Always prefer this.
- **Shell form** (string): `CMD node build` — Wraps in `/bin/sh -c`, meaning `sh` is PID 1, not `node`. Signals go to `sh`, which may not forward them. Avoid this.

`CMD` can be overridden at runtime. When you do `docker compose run svelte pnpm kysely migrate:latest`, the `pnpm kysely migrate:latest` replaces the `CMD`.

### ENTRYPOINT — Fixed command prefix

```dockerfile
ENTRYPOINT ["/middleware"]
```

Similar to `CMD`, but cannot be overridden by arguments at runtime. Instead, runtime arguments are **appended** to the entrypoint:

```
ENTRYPOINT ["/middleware"]
docker run myimage --port 8080
# Executes: /middleware --port 8080
```

**ENTRYPOINT vs CMD:**
- `ENTRYPOINT` — "This container always runs this program." Used when the container **is** the program (like our Go middleware).
- `CMD` — "This is the default, but you can override it." Used for containers that might run different commands (like our svelte container, which runs dev server normally but migrations during deploy).

When both are set, `CMD` provides default arguments to `ENTRYPOINT`:

```dockerfile
ENTRYPOINT ["node"]
CMD ["build"]
# Default: node build
# Override: docker run myimage server.js → node server.js
```

### ARG — Build-time variables

```dockerfile
ARG COMMIT_SHA
RUN echo $COMMIT_SHA > /app/version.txt
```

`ARG` defines a variable available only during `docker build` — it doesn't exist when the container runs. Passed via `docker build --build-arg COMMIT_SHA=abc123`.

We use `COMMIT_SHA` to embed the git commit into the production image so we know exactly which code is deployed.

**ARG vs ENV:** `ARG` exists only during build. `ENV` persists into the running container. An `ARG` can set an `ENV`:

```dockerfile
ARG VERSION
ENV APP_VERSION=$VERSION    # Available during build AND at runtime
```

### ENV — Runtime environment variables

```dockerfile
ENV PORT=8082
ENV PLAYWRIGHT_BROWSERS_PATH=/ms-playwright
```

Sets environment variables that persist into the running container. Processes inside the container can read them (e.g., `process.env.PORT` in Node.js).

**How ENV connects to compose environment:** Both set environment variables inside the container, but compose `environment:` overrides Dockerfile `ENV`. The precedence order is:

1. `docker compose run -e VAR=value` (highest)
2. Compose file `environment:` section
3. Compose file `env_file:` directive
4. Dockerfile `ENV` instruction (lowest)

### EXPOSE — Document which ports the container listens on

```dockerfile
EXPOSE 3000
```

`EXPOSE` does almost nothing at runtime — it's **documentation** that tells other developers which port the app listens on. It doesn't actually publish the port. You still need `ports:` in the compose file to make the port reachable.

The one thing `EXPOSE` does: if you use `docker run -P` (uppercase P), Docker auto-maps all `EXPOSE`d ports to random host ports. We don't use this.

---

## Build context

When you run `docker build`, Docker sends a copy of a directory to the Docker daemon. This copy is the **build context**. `COPY` instructions can only access files within this context.

```yaml
build:
  context: ../../../apps/web         # This entire directory becomes the build context
  dockerfile: apps/web/config/Dockerfile
```

**The path is relative to the compose file**, not the project root. Since our compose file is at `infra/app/docker-compose.dev.yml`, `../../apps/web` resolves to `apps/web/` from the repo root.

### .dockerignore

Before sending the build context, Docker reads `.dockerignore` and excludes matching files. Our `apps/web/config/.dockerignore` excludes:

```
node_modules       # 200MB+ — installed inside the container via RUN pnpm install
.svelte-kit        # Generated files — rebuilt during build
build              # Previous build output
.git               # Git history — not needed in the image
docs               # Documentation
e2e                # Test files
```

Without `.dockerignore`, sending the build context would take 10+ seconds instead of <1 second.

**How build context connects to COPY:** `COPY . .` copies everything in the build context (minus `.dockerignore` exclusions) into the image. If your build context is too large, builds are slow. If `.dockerignore` is missing something, your image bloats with unnecessary files.

---

## Multi-stage builds

A Dockerfile can have multiple `FROM` instructions, each starting a new **stage**. Only the final stage becomes the image. Earlier stages are discarded — but you can copy files from them.

Our SvelteKit Dockerfile has 5 stages:

```
Stage 1 (runtime)  → Base: node:22-slim + pnpm
Stage 2 (deps)     → Installs node_modules
Stage 3 (dev)      → Development image (target: dev in compose)
Stage 4 (builder)  → Builds production bundle
Stage 5 (production) → Final image with only build output
```

```
Development build (target: dev):
┌─────────┐
│ Stage 1  │ → node + pnpm (200MB)
│ Stage 3  │ → USER appuser, CMD dev server
└─────────┘
Total: ~210MB (code is bind-mounted at runtime, not in the image)

Production build (no target):
┌─────────┐
│ Stage 1  │ → node + pnpm
│ Stage 2  │ → pnpm install (node_modules)
│ Stage 4  │ → COPY code, build
│ Stage 5  │ → COPY --from=builder build output only
└─────────┘
Total: ~250MB (node_modules and source code are NOT in the final image)
```

Without multi-stage builds, the production image would include: Go compiler, build tools, source code, dev dependencies, and test files — easily 1GB+. Multi-stage builds keep it under 250MB.

**How multi-stage connects to compose `target`:**

```yaml
build:
  target: dev    # Stop at stage 3, discard stages 4 and 5
```

In development, we target `dev` (stage 3). This stage doesn't install dependencies or copy code — it relies on volume mounts instead. In production, we omit `target` so Docker builds all stages up to the last one.

---

## Networks

Every container has its own **network namespace** — an isolated network stack with its own IP address, routing table, and port space. By default, containers cannot communicate with each other. Networks connect them.

### Network types

Docker has several network drivers:

**bridge** (default) — Creates an isolated virtual network on the host. Containers on the same bridge network can communicate. Containers on different bridge networks cannot. This is what we use.

```
Host machine
├── Bridge network "internal"
│   ├── svelte (172.18.0.2)
│   ├── db (172.18.0.3)
│   ├── kv (172.18.0.4)
│   ├── caddy (172.18.0.5)
│   ├── go (172.18.0.6)
│   └── redpanda (172.18.0.7)
│
│   ├── telemetry-db (ClickHouse)
│   ├── otel-collector
│   └── observability-ui
│
└── Host network (your machine: 192.168.1.x)
```

**host** — Container uses the host's network directly. No isolation, no port mapping needed. Fast but insecure. We don't use this.

**none** — Container has no network at all. Used for security-sensitive workloads that should never touch the network. We don't use this.

### DNS — How containers find each other

Docker runs a built-in **DNS server** inside each network. When `svelte` connects to `db:5432`, Docker's DNS resolves `db` to the container's IP address on the shared network (e.g., `172.18.0.3`).

The DNS name is the **service name** from the compose file:

```yaml
services:
  db:        # Other containers reach this as "db"
  svelte:    # Other containers reach this as "svelte"
  kv:        # Other containers reach this as "kv"
```

This is why our `DATABASE_URL` uses `db` as the hostname:

```yaml
DATABASE_URL: postgres://${POSTGRES_USER}:${POSTGRES_PASSWORD}@db:5432/${POSTGRES_DB}
#                                                               ^^
#                                                               Docker DNS resolves this
```

If the database container is restarted and gets a new IP, the DNS record updates automatically. You never hardcode container IPs.

**How DNS connects to networks:** DNS only works within a network. All services — including observability (`telemetry-db`, `otel-collector`, `observability-ui`) — are on the `internal` network, so any service can send telemetry directly to `otel-collector:4318`.

### Network aliases

A container can have additional DNS names beyond its service name:

```yaml
caddy:
  networks:
    internal:
      aliases:
        - dev.habita.rent    # Other containers can reach caddy as "dev.habita.rent"
```

We use this so imgproxy can fetch images from `https://dev.habita.rent/files/...` — even though it's container-to-container communication, the hostname matches the TLS certificate.

### External networks

```yaml
networks:
  internal:
    external: true    # This network was created OUTSIDE of this compose file
```

By default, each compose file creates its own isolated network (`<project>_default`). Services in different compose files can't see each other.

We have 9 compose files (app, api, gateway, broker, etc.) that all need to communicate. Instead of each creating its own network, they all join one shared **external** network called `internal`, created by `just infra-setup`:

```bash
docker network create internal
```

**How external networks connect to projects:** Without the shared `internal` network, the `app` project's `svelte` service couldn't reach the `api` project's `go` service — they'd be on separate `app_default` and `api_default` networks. The external network flattens all services onto one plane.

### Port mapping vs network communication

There are two ways to reach a container:

1. **Port mapping** (host → container) — For reaching a service from your machine:
   ```yaml
   ports:
     - "5432:5432"    # host_port:container_port
   ```
   Your machine connects to `localhost:5432`, which Docker routes to the container's port 5432.

2. **Network DNS** (container → container) — For services talking to each other:
   ```
   svelte connects to db:5432
   ```
   No port mapping needed. Containers on the same network reach each other directly by name and internal port.

Port mapping is **only needed for access from outside Docker** — your browser, your terminal, database GUIs, etc. Container-to-container communication doesn't need it.

```yaml
# This service is reachable from your machine AND from other containers
db:
  ports:
    - "5432:5432"

# This service is reachable ONLY from other containers (no ports: section)
redpanda:
  # other containers reach it at redpanda:9092
  # your machine CANNOT reach it directly
```

### TCP and UDP

```yaml
caddy:
  ports:
    - "443:443/tcp"    # HTTPS over TCP
    - "443:443/udp"    # HTTP/3 (QUIC) over UDP
```

Ports default to TCP. HTTP/3 uses UDP, so Caddy maps port 443 for both protocols.

---

## Volumes

Containers are **ephemeral** — when you remove one, everything inside it disappears. This includes database files, uploaded images, cache data, and node_modules. Volumes store data **outside** the container's writable layer so it persists.

### How volumes work internally

Remember that an image is a stack of read-only layers, and a container adds a writable layer on top:

```
┌─────────────────────────┐
│  Writable layer         │ ← Container writes here. Deleted when container is removed.
├─────────────────────────┤
│  Image layer 4 (code)   │ ← Read-only
│  Image layer 3 (deps)   │ ← Read-only
│  Image layer 2 (pnpm)   │ ← Read-only
│  Image layer 1 (node)   │ ← Read-only
└─────────────────────────┘
```

A volume **bypasses** the writable layer. It's a directory on the host's filesystem that is mounted directly into the container:

```
┌─────────────────────────┐
│  Writable layer         │
├─────────────────────────┤      ┌──────────────────────┐
│  /var/lib/postgresql ────────> │ Volume: db           │ ← Lives on host, survives
│                         │      │ /var/lib/docker/      │    container removal
├─────────────────────────┤      │  volumes/db/_data/   │
│  Image layers (ro)      │      └──────────────────────┘
└─────────────────────────┘
```

### Named volumes

```yaml
volumes:
  - db:/var/lib/postgresql/data
```

Docker manages the storage location (somewhere under `/var/lib/docker/volumes/`). You reference it by name (`db`). Named volumes:

- Persist across container restarts and removal
- Can be shared between containers
- Are listed in `docker volume ls`
- Are deleted with `docker volume rm db` or `docker compose down -v`

Our named volumes:

| Volume | Used by | Purpose |
|---|---|---|
| `db` | db | PostgreSQL data files |
| `kv` | kv | Redis cache data |
| `deps` | svelte, consumer, test | Shared node_modules |
| `backups` | db | Database backup files (external volume) |
| `broker` | redpanda | Kafka message data |
| `nominatim` | nominatim | OpenStreetMap geocoding data |

### Bind mounts

```yaml
volumes:
  - ../../../apps/web:/app:delegated
```

Bind mounts map a **specific host directory** into the container. Unlike named volumes, you control exactly where the data lives.

We use bind mounts for development — your source code on the host is mapped into the container, so edits appear instantly:

```
Your machine                     Container
/Users/you/habita/apps/web  →    /app
    └── src/routes/              └── src/routes/
        └── +page.svelte             └── +page.svelte (same file!)
```

The `:delegated` flag is a macOS performance optimization. macOS has slow filesystem sharing with Docker — `delegated` allows Docker to cache writes and sync them later, making file operations much faster at the cost of brief inconsistency (milliseconds).

Other flags:
- `:consistent` (default) — Host and container always see the same data. Slowest on macOS.
- `:cached` — Container may see stale host data briefly. Faster reads.
- `:delegated` — Host may see stale container data briefly. Fastest for write-heavy workloads (like npm install).
- `:ro` — Read-only. Container cannot modify these files.

### Read-only mounts

```yaml
volumes:
  - ./certs/dev.habita.rent.pem:/etc/caddy/certs/dev.habita.rent.pem:ro
  - /var/run/docker.sock:/var/run/docker.sock:ro
```

The `:ro` flag prevents the container from modifying the mounted file. Used for:
- **TLS certificates** — Caddy reads them but shouldn't modify them
- **Config files** — Ofelia reads its job config but shouldn't change it
- **Docker socket** — Ofelia needs to trigger commands in other containers but shouldn't be able to modify Docker's runtime

### External volumes

```yaml
volumes:
  backups:
    external: true    # Created outside of this compose file
```

Like external networks, external volumes are created once and shared across compose files. Our `backups` volume is created by `just infra-setup` and used by the database service and the backup scheduler.

### Shared volumes between services

```yaml
services:
  svelte:
    volumes:
      - deps:/app/node_modules
  consumer:
    volumes:
      - deps:/app/node_modules
  test:
    volumes:
      - deps:/app/node_modules
```

The `deps` volume is shared by three services. When `svelte` runs `pnpm install`, the node_modules are written to the `deps` volume. The `consumer` and `test` services immediately see the installed packages without reinstalling.

**How volumes connect to the container lifecycle:**
- `docker compose down` — Stops and removes containers. Volumes remain.
- `docker compose down -v` — Stops containers AND deletes volumes. All data is gone.
- `docker volume rm db` — Deletes a specific volume.
- `just db reset` uses `down -v` to wipe the database volume, then starts fresh with migrations and seeds.

**How volumes connect to images:** A volume mount **overrides** whatever is in the image at that path. If the image has files at `/app/node_modules`, mounting a volume there hides the image's files and shows the volume's content instead. This is why our `dev` stage doesn't run `pnpm install` — the `deps` volume provides node_modules at runtime.

---

## Healthchecks

A healthcheck is a command that Docker runs periodically **inside** the container to determine if the service is working correctly.

### Why healthchecks exist

A running process doesn't mean a working service. The Node.js process could be alive but stuck in an infinite loop. PostgreSQL could be running but not accepting connections yet. A healthcheck tests the actual behavior, not just process existence.

### Healthcheck states

A container with a healthcheck goes through these states:

```
starting → healthy → unhealthy
              ↑          │
              └──────────┘  (if a subsequent check passes)
```

- **starting** — The container just started. Healthchecks are running but failures don't count yet (controlled by `start_period`).
- **healthy** — The healthcheck command returned exit code 0.
- **unhealthy** — The healthcheck command failed `retries` times in a row.

### Configuration explained

```yaml
healthcheck:
  test: ["CMD-SHELL", "pg_isready -U postgres"]
  interval: 10s        # Run the check every 10 seconds
  timeout: 5s          # If the check takes longer than 5s, consider it failed
  retries: 5           # Mark unhealthy after 5 consecutive failures
  start_period: 30s    # Grace period — failures during this window don't count
```

- **interval** — How often to check. Too frequent wastes CPU. Too infrequent means slow failure detection.
- **timeout** — How long to wait for the check to complete. If the service is hanging, the check will time out.
- **retries** — How many consecutive failures before marking unhealthy. Prevents a single network hiccup from triggering unhealthy status.
- **start_period** — Grace period after container start. Services like PostgreSQL and Nominatim need time to initialize (Nominatim can take minutes to import map data). Failures during this period are ignored.

### Test command formats

```yaml
# Shell form — runs inside /bin/sh, can use pipes, environment variables, etc.
test: ["CMD-SHELL", "pg_isready -U postgres"]
test: ["CMD-SHELL", "curl -f http://localhost:8081/health"]
test: ["CMD-SHELL", "wget --spider http://localhost:8080/status"]

# Exec form — runs the command directly, no shell
test: ["CMD", "valkey-cli", "ping"]
```

`CMD-SHELL` is more flexible (supports shell features) but slightly slower (spawns a shell process). `CMD` is faster but can't use pipes or shell syntax.

### Our healthchecks and what they test

| Service | Check | What it verifies |
|---|---|---|
| db | `pg_isready` | PostgreSQL is accepting connections |
| kv | `valkey-cli ping` | Redis responds with PONG |
| svelte | `curl https://localhost:5174/health` | HTTP server is responding |
| go | `curl http://localhost:8081/health` | Go API is responding |
| caddy | `pidof caddy` | Caddy process exists (minimal check) |
| redpanda | `rpk cluster health` | Kafka cluster is operational |
| nominatim | `curl http://localhost:8080/status` | Geocoder is ready |
| otel-collector | `wget http://localhost:13133/` | OpenTelemetry pipeline is running |

**How healthchecks connect to depends_on:** The `depends_on` directive uses healthcheck status to order startup:

```yaml
svelte:
  depends_on:
    db:
      condition: service_healthy      # Wait until db's healthcheck passes
    kv:
      condition: service_healthy      # Wait until kv's healthcheck passes
```

Without healthchecks, `depends_on` only waits for the container to **start** — not be ready. PostgreSQL takes 2-3 seconds to initialize after the container starts. If svelte tries to connect during those 2-3 seconds, it crashes.

**How healthchecks connect to restart policies:** When a container becomes unhealthy, Docker does NOT automatically restart it (this surprises many people). The restart policy only triggers when PID 1 **exits**. An unhealthy container with a running PID 1 stays running. Orchestrators like Docker Swarm or Kubernetes do restart unhealthy containers, but plain Docker Compose does not.

---

## Environment variables

Environment variables configure containers at runtime — database credentials, API keys, feature flags, URLs to other services.

### Sources (in order of precedence, highest first)

1. **`docker compose run -e VAR=value`** — Set per-command
2. **compose `environment:` section** — Hardcoded in the compose file
3. **compose `env_file:` directive** — Read from a file
4. **Dockerfile `ENV`** — Baked into the image

Higher precedence sources override lower ones. This means a compose file can override Dockerfile defaults, and a command-line flag can override everything.

### Variable interpolation in compose files

```yaml
environment:
  DATABASE_URL: postgres://${POSTGRES_USER}:${POSTGRES_PASSWORD}@db:5432/${POSTGRES_DB}
```

`${POSTGRES_USER}` is resolved by Docker Compose (not by the container). Compose reads these values from a `.env` file in the same directory as the compose file, or from your shell's environment.

Our `.env` files (`infra/.env.dev` and `infra/.env.prod`) contain all secrets — database credentials, API keys, OAuth tokens, encryption keys. The production file is encrypted with SOPS and never committed to git in plaintext.

### The env_file directive

```yaml
services:
  svelte:
    env_file:
      - ../../../.env    # Load all variables from this file
```

Different from `environment:` — `env_file` loads an entire file of `KEY=VALUE` pairs. `environment:` sets individual variables. Both can be used together (individual `environment:` entries override `env_file` values).

**How environment variables connect to networks:** The service names used in URLs (like `db` in `DATABASE_URL`) are resolved by Docker's DNS within the network. If you change a service name in the compose file, you must also update all environment variables that reference it.

---

## Labels

Labels are key-value metadata attached to containers, images, volumes, or networks. They have no effect on container behavior — they're purely informational, used for filtering and organization.

```yaml
labels:
  habita.role: database
  habita.role: cache
  habita.role: app
```

### How we use labels

Our `just` recipes use labels to find containers without knowing their Docker Compose-generated names:

```bash
# Find the database container by role, regardless of its name
docker ps -qf "label=habita.role=database" | head -1
```

This returns the container ID. The alternative would be hardcoding `storage-db-1`, which breaks if the project name or instance number changes.

### Label conventions

Labels use reverse-DNS naming (`habita.role`) to avoid conflicts with labels from other tools. Docker's own labels use `com.docker.*`, and compose uses `com.docker.compose.*`.

---

## Resource limits

```yaml
deploy:
  resources:
    limits:
      memory: 512M
    reservations:
      memory: 256M
```

### Memory limits

- **limits.memory** — Hard cap. If the container tries to use more, the Linux kernel's **OOM killer** (Out Of Memory) terminates the process. The container shows as "exited" with exit code 137 (128 + signal 9 = SIGKILL).

- **reservations.memory** — Soft guarantee. Docker ensures this much memory is available when scheduling the container. Other containers can't starve it below this amount.

The gap between reservation and limit is "burst" capacity — the container normally uses 256M but can spike to 512M during heavy loads.

### Our resource allocation

| Service | Limit | Reservation | Why |
|---|---|---|---|
| db | 512M | 256M | PostgreSQL with PostGIS |
| kv | 256M | 128M | In-memory cache |
| svelte | 1G | 512M | Node.js dev server + hot reload |
| consumer | 512M | 256M | Message processing |
| go | 256M | 128M | Compiled binary, very efficient |
| nominatim | 4G | 2G | Loads all of Argentina's map data |
| pdf | 1G | 512M | Headless browser for PDF generation |
| caddy | 128M | 64M | Lightweight reverse proxy |
| gatus | 128M | 64M | Simple status page |

**How resource limits connect to healthchecks:** If a container hits its memory limit and gets OOM-killed, the healthcheck fails (the process is dead). If `restart: on-failure` is set, Docker restarts the container. Without it, the container stays dead and the healthcheck shows unhealthy.

### Shared memory (shm_size)

```yaml
nominatim:
  shm_size: 2gb
```

Docker containers get 64MB of shared memory (`/dev/shm`) by default. PostgreSQL (used internally by Nominatim) uses shared memory heavily. Without increasing it, PostgreSQL crashes with "could not resize shared memory segment" errors.

---

## Docker socket

```yaml
ofelia:
  volumes:
    - /var/run/docker.sock:/var/run/docker.sock:ro
```

The Docker socket (`/var/run/docker.sock`) is the API endpoint that the Docker daemon listens on. Mounting it into a container gives that container full control over Docker — it can start, stop, inspect, and remove any container on the host.

Our scheduler (Ofelia) needs this because it runs commands **inside other containers**:

```ini
[job-exec "create-escalation-jobs"]
schedule = 0 * * * * *
container = app-svelte-1
command = pnpm exec tsx src/lib/server/jobs/escalation.script.ts
```

Ofelia uses the Docker API (via the socket) to execute commands inside `app-svelte-1`, similar to `docker exec`.

**Security implication:** A container with access to the Docker socket effectively has root access to the host. It can mount the host filesystem, start privileged containers, or modify any running container. We mount it read-only (`:ro`) to limit Ofelia to read operations and command execution, but this is still a significant trust boundary. Only give Docker socket access to containers you trust completely.

---

## Logging

Every process running in a container has stdout and stderr. Docker captures these streams and stores them via a **logging driver**.

### Default logging (json-file)

By default, Docker writes logs as JSON lines to files on disk:

```
/var/lib/docker/containers/<container-id>/<container-id>-json.log
```

These files grow indefinitely unless you set limits:

```yaml
nominatim:
  logging:
    options:
      max-size: "50m"     # Rotate when the log file reaches 50MB
      max-file: "3"       # Keep at most 3 rotated files
```

Without `max-size`, a verbose service can fill the disk. Our Nominatim service generates a lot of output during map imports, so we cap it at 50MB x 3 files = 150MB max.

### Viewing logs

```bash
just logs svelte          # Follow logs in real-time
docker logs app-svelte-1  # View all stored logs for a specific container
```

**How logging connects to PID 1:** Docker only captures stdout/stderr from PID 1 and its children. If a process writes to a log file instead of stdout, `docker logs` won't show it. This is why Docker best practice is to log to stdout/stderr, not files.

---

## Docker Compose details

### Profiles

```yaml
services:
  test:
    profiles:
      - test    # Only starts when you explicitly activate the "test" profile
```

Our `test` service (Playwright) has a `test` profile. It doesn't start with `docker compose up` — you need `docker compose --profile test up` or `docker compose run test`. This prevents the test container from consuming resources during normal development.

**How profiles connect to depends_on:** If service B depends on service A, and service A has a profile, starting B will NOT automatically start A unless the profile is active. You must explicitly activate the profile.

### Services vs containers

A **service** is a definition in the compose file. A **container** is a running instance of a service. Normally there's one container per service, but you can scale:

```bash
docker compose up -d --scale svelte=3    # Run 3 instances of the svelte service
```

We don't use scaling in development. In production, scaling is handled differently (separate VPS instances, not Docker Compose scaling).

### Compose file resolution

When Docker Compose starts, it:

1. Reads the compose file (`-f` flag or default `docker-compose.yml`)
2. Reads `.env` in the same directory as the compose file
3. Interpolates `${VARIABLES}` in the compose file
4. Validates the configuration
5. Creates networks, volumes, and containers

Our `dco` wrapper automates steps 1-2 by selecting the right compose file and env file based on the current environment (development vs production).

---

## Our architecture

```
                    Internet
                       │
                   ┌───┴───┐
                   │ Caddy  │  (TLS termination, routing)
                   │ :443   │
                   └───┬───┘
                       │
          ┌────────────┼────────────┐
          │            │            │
    ┌─────┴─────┐ ┌───┴───┐ ┌─────┴─────┐
    │  SvelteKit│ │imgproxy│ │ Nominatim │
    │  :5174    │ │ :8080  │ │  :8080    │
    └─────┬─────┘ └───────┘ └───────────┘
          │
    ┌─────┼──────────┬──────────┐
    │     │          │          │
┌───┴──┐ ┌┴───────┐ ┌┴────────┐┌┴─────────┐
│ DB   │ │ Valkey │ │ Go API  ││ Redpanda  │
│:5432 │ │ :6379  │ │ :8081   ││  :9092    │
└──────┘ └────────┘ └─────────┘└─────┬─────┘
                                     │
                               ┌─────┴─────┐
                               │ Consumer   │
                               │ (async)    │
                               └────────────┘
```

**Request flow:**
1. Browser hits `https://dev.habita.rent`
2. **Caddy** terminates TLS and routes:
   - `/image/*` → **imgproxy** (image resizing/format conversion)
   - `/nominatim/*` → **Nominatim** (geocoding)
   - Everything else → **SvelteKit**
3. **SvelteKit** queries **PostgreSQL** and **Valkey** (cache)
4. **SvelteKit** calls **Go API** for middleware operations
5. **SvelteKit** publishes events to **Redpanda** (Kafka-compatible broker)
6. **Consumer** processes events asynchronously (emails, notifications)

**Supporting services:**
- **Ofelia** (scheduler) — Runs cron jobs inside other containers (backups, escalation checks)
- **PDF service** — Generates contract PDFs using Playwright
- **Gatus** (status page) — Monitors service health
- **Observability** (telemetry-db + otel-collector + observability-ui) — Traces, metrics, and logs via OpenTelemetry → ClickHouse

**How everything connects:**
All services join the `internal` network, created once by `just infra-setup`. Caddy is the only service with ports mapped to the host (80, 443) — everything else communicates container-to-container via DNS on the `internal` network. The observability stack lives on the same network, so any service can send telemetry to `otel-collector:4318`.

---

## `just` — Our task runner

`just` recipes wrap `docker compose`. This is the only interface you should use:

```
you → just → docker compose → Docker engine → containers
```

See the CLI skill (`.claude/skills/cli/SKILL.md`) for the full recipe reference.

Common examples:

```bash
just up                         # Start everything
just down                       # Stop everything
just logs svelte                # Follow svelte logs
just db reset                   # Wipe and rebuild database
just db migrate                 # Run pending migrations
just db types                   # Regenerate DB types
just lint format                # Run Prettier
just lint types                 # Run TypeScript checks
just test e2e                   # Run Playwright tests
just deploy push app api        # Deploy to production
```

---

## Docker Compose subcommands

These are the most common subcommands, using our infrastructure as examples.

### Command structure

Every `docker compose` command follows this structure:

```
docker compose [compose-options] <subcommand> [subcommand-flags] <service> [service-args]
│              │                 │             │                  │         │
│              │                 │             │                  │         └── Passed to the container
│              │                 │             │                  └── Which service to target
│              │                 │             └── Modify the subcommand behavior
│              │                 └── What action to take
│              └── Which project, which file
└── The tool
```

**Flag ordering matters.** Flags belong to the section they follow:

```bash
# CORRECT — --rm modifies "run", -e modifies "run", pnpm is the container command
docker compose run --rm -e FOO=bar svelte pnpm install

# BROKEN — Docker thinks "--rm" is a command to run inside the container
docker compose run svelte --rm pnpm install
```

### `up` — Start services

```bash
docker compose -p app -f ... up -d
docker compose -p app -f ... up -d svelte    # Start only svelte (and its dependencies)
```

- `-d` (detached) — Run in the background. Without it, logs stream to your terminal and Ctrl+C stops everything.
- Creates containers from images (or builds them if needed), starts them, connects them to networks.
- If containers already exist and nothing changed, `up` does nothing (idempotent).
- If the compose file changed, `up` recreates only the affected containers.

### `down` — Stop and remove

```bash
docker compose -p app -f ... down        # Stop containers, remove containers, remove default network
docker compose -p app -f ... down -v     # Also delete named volumes (DATABASE DATA!)
docker compose -p app -f ... down --rmi all  # Also delete images
```

`down` is destructive — it removes containers (not just stops them). The containers' writable layers are gone. Only volumes and images survive (unless you pass `-v` or `--rmi`).

**`down` vs `stop`:**
- `stop` — Sends SIGTERM, waits, then SIGKILL. Containers still exist on disk. `start` brings them back.
- `down` — Stops AND removes. Containers are deleted. `up` creates new ones.

### `run` — One-off commands

```bash
docker compose -p app -f ... run --rm svelte pnpm kysely migrate:latest
```

Creates a **new** temporary container from the service's image configuration (volumes, networks, environment), runs the command, and exits.

- `--rm` — Delete the container after it exits. Without this, stopped containers pile up.
- The new container gets the same volumes, network, and environment as the service definition.
- It does NOT get the same port mappings (to avoid conflicts with the running service).

**`run` vs `exec`:**
- `run` creates a **new** container. Works even if the service isn't running.
- `exec` runs inside an **existing** container. The service must already be running.

```bash
# Run a migration (service doesn't need to be running)
docker compose run --rm svelte pnpm kysely migrate:latest

# Open a shell in the RUNNING database container
docker compose exec db psql -U postgres -d habita
```

### `exec` — Run in an existing container

```bash
docker compose -p app -f ... exec db psql -U postgres -d habita
docker compose -p app -f ... exec -it svelte sh    # Interactive shell
```

- `-it` — Interactive terminal. `-i` keeps stdin open, `-t` allocates a pseudo-TTY. Needed for interactive programs like `sh`, `psql`, etc.
- The command runs as the same user as PID 1 (unless you pass `-u root`).

### `logs` — View output

```bash
docker compose -p app -f ... logs svelte         # Dump existing logs
docker compose -p app -f ... logs -f svelte       # Follow (stream) new logs
docker compose -p app -f ... logs -f --tail 100   # Follow, starting from last 100 lines
docker compose -p app -f ... logs                  # All services in this project
```

### `build` — Build images

```bash
docker compose -p app -f ... build svelte           # Build using cached layers
docker compose -p app -f ... build --no-cache svelte # Rebuild from scratch
```

`--no-cache` is useful when:
- A base image was updated on the registry
- A `RUN apt-get install` is stale
- Layer caching produced a corrupted result (rare)

### `ps` — List containers

```bash
docker compose -p app -f ... ps
```

Shows: container name, command, state (Up/Exited), health status, and port mappings.

### `restart` vs `up -d --force-recreate`

```bash
docker compose -p app -f ... restart svelte
docker compose -p app -f ... up -d --force-recreate svelte
```

- **restart** — Sends SIGTERM to PID 1, waits for exit, starts the same container again. Same image, same configuration. Fast. Use when: the app crashed, or you want to pick up code changes (with bind mounts).

- **force-recreate** — Removes the container and creates a new one. New writable layer. Use when: you changed the compose file, environment variables, image, or anything in the service definition.

---

## Development workflow

### First time setup

```bash
just infra-setup                # Create shared network and volumes (one-time)
just up                         # Start all services
```

`just up` starts services in dependency order, waiting for the database to be healthy before starting the app.

### Daily development

Your code is **bind-mounted** into the svelte container. When you edit a file on your host, SvelteKit's dev server sees the change and hot-reloads. You don't need to restart anything.

```bash
# Check if everything is running
just status

# Something broken? Check logs
just logs svelte
just logs db

# Added a new npm package?
just deps                       # Reinstalls node_modules inside the container

# Changed the Dockerfile?
just rebuild app svelte          # Rebuild the image from scratch
just reload app svelte           # Recreate the container with the new image
```

### Database changes

```bash
just db make add_phone_to_users  # Create migration file
# Edit the migration in apps/web/db/migrations/
just db migrate                  # Run it
just db types                    # Regenerate TypeScript types
```

If something goes wrong:

```bash
just db reset                    # Nuclear option: wipe everything and start fresh
```

### When port conflicts happen

If you see "port is already allocated", another process (or container from another project) is using that port:

```bash
# Find what's using port 5432
docker ps --format "table {{.Names}}\t{{.Ports}}" | grep 5432

# Stop the conflicting container
docker stop <container-name>
```

### Production deploys

```bash
just deploy push app api         # Build, push images, deploy
just deploy rollback             # Undo the last deploy
just deploy rollback 3 app       # Rollback 3 commits, redeploy app only
```

The deploy recipe handles: secret decryption, image building, pushing to registry, running migrations, health verification, and webhook notifications.

---

## Glossary

| Term | Meaning |
|---|---|
| **Image** | Frozen, read-only snapshot of a filesystem. Built from a Dockerfile or pulled from a registry. Made of layers. |
| **Container** | Running instance of an image with a writable layer on top. Has its own PID namespace, network, and filesystem. |
| **Layer** | A single step in an image build. Read-only and shared between images. Cached for fast rebuilds. |
| **Volume** | Persistent storage outside the container's writable layer. Survives container removal. |
| **Bind mount** | Maps a specific host directory into a container. Used for live code editing in development. |
| **Named volume** | Docker-managed storage referenced by name. Location is abstracted. |
| **External volume** | A volume created outside compose, shared across multiple compose files. |
| **Network** | Virtual network connecting containers. Provides DNS-based service discovery. |
| **Bridge network** | Default network type. Isolated virtual network on the host. |
| **External network** | A network created outside compose, shared across multiple compose files. |
| **DNS** | Docker's built-in name resolution within a network. Service name → container IP. |
| **Port mapping** | Connects a host port to a container port. Only needed for access from outside Docker. |
| **Compose** | Tool for defining and running multi-container applications via YAML. |
| **Project** | A named group of services from one compose file. Prefixes container names. |
| **Stack** | Same as project in our terminology. |
| **Service** | A definition in a compose file. Becomes one or more containers. |
| **Profile** | A label on services to conditionally include them (e.g., `test` profile). |
| **Build context** | The directory sent to Docker when building an image. Filtered by `.dockerignore`. |
| **Stage** | A section of a Dockerfile starting with `FROM`. Multi-stage builds use multiple stages. |
| **Target** | The stage to build up to. `target: dev` stops before production stages. |
| **Healthcheck** | A command Docker runs periodically to verify a service is functioning. |
| **depends_on** | Startup ordering. With `condition: service_healthy`, waits for healthcheck to pass. |
| **PID 1** | The main process in a container. If it exits, the container stops. Receives SIGTERM on shutdown. |
| **SIGTERM** | Polite shutdown signal. The process should clean up and exit. |
| **SIGKILL** | Forceful kill signal. Cannot be caught. Sent after SIGTERM timeout. |
| **OOM killer** | Linux kernel mechanism that terminates processes exceeding memory limits. Exit code 137. |
| **Detached** | Running in the background (`-d` flag). Logs go to Docker's logging driver, not your terminal. |
| **Docker socket** | The API endpoint (`/var/run/docker.sock`) for controlling Docker. Mounting it gives full Docker access. |
| **Logging driver** | How Docker stores container output. Default is `json-file` with optional size rotation. |
| **.dockerignore** | Excludes files from the build context, like `.gitignore` for Docker. |
| **Restart policy** | What Docker does when PID 1 exits: nothing, restart on failure, or always restart. |
