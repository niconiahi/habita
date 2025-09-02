# Docker Images vs Volume Mounts

Understanding the fundamental difference between "baking code into images" vs using volume mounts is crucial for effective containerization.

## The Core Difference

### Volume Mounts: "Window Into Your Room"
```
Your Laptop Folder    Docker Container
┌─────────────────┐   ┌──────────────┐
│  src/           │◄──┤ /app/src/    │
│  ├─ app.js      │   │ ├─ app.js    │ ← Same file!
│  └─ routes.js   │   │ └─ routes.js │ ← Same file!
└─────────────────┘   └──────────────┘
```

**How it works:**
- Docker container has a "window" into your laptop's filesystem
- Changes on laptop → instantly reflected in container
- Perfect for development with hot reload

**Example:**
```yaml
# docker-compose.yml
services:
  app:
    build: .
    volumes:
      - ./:/app  # Live mount of current directory
```

### Baked Into Image: "Photo of Your Room"
```
Your Laptop Folder    Docker Image
┌─────────────────┐   ┌──────────────┐
│  src/           │   │ /app/src/    │
│  ├─ app.js      │   │ ├─ app.js    │ ← Frozen copy!
│  └─ routes.js   │   │ └─ routes.js │ ← Frozen copy!
└─────────────────┘   └──────────────┘
```

**How it works:**
- Code is copied INTO the image during build
- Code is "frozen" at build time
- Container runs exact code version from when image was built
- Perfect for consistent production deployments

**Example:**
```dockerfile
FROM node:20-alpine
COPY . /app/  # ← Code becomes PART of the image
WORKDIR /app
CMD ["npm", "start"]
```

## When to Use Each Approach

### Development: Volume Mounts ✅
**Benefits:**
- Instant code changes (hot reload works)
- No rebuilding needed
- Fast iteration cycle

**Trade-offs:**
- Depends on host filesystem
- Less consistent across different machines
- Can't easily share exact environment

### Production: Baked-In Images ✅
**Benefits:**
- Consistent across all servers
- Immutable deployments
- No external file system dependencies
- Version control through image tags
- Easy rollbacks

**Trade-offs:**
- Need to rebuild for any change
- Slower development iteration

## Real-World Example

### The Problem with Wrong Approach

**Using production Dockerfile for development:**
```bash
# Make a code change
vim src/app.js

# Nothing happens - need to rebuild! 😫
docker-compose build  # 30+ seconds
docker-compose up
# Finally see your change...
```

**Using volume mounts in production:**
```bash
# Deployed to server
# Code depends on server's filesystem
# Inconsistent environments
# Hard to track exact deployed version
```

## Best of Both Worlds: Multi-Stage Solution

```dockerfile
# Development target - no source code copied
FROM node:20 as development
WORKDIR /app
COPY package*.json ./
RUN npm install
CMD ["npm", "run", "dev"]  # Will use volume-mounted code

# Production target - source code baked in
FROM node:20 as production  
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .  # ← Bake source code into image
CMD ["npm", "start"]
```

**Usage:**
```yaml
# docker-compose.yml (development)
services:
  app:
    build:
      target: development  # Use development stage
    volumes:
      - ./:/app  # Mount live code
```

```bash
# Production deployment
docker build --target production -t myapp:v1.0 .
```

## Current Project Analysis

**memudo currently uses:**

**Development (docker-compose):**
- Volume mounts for live code changes
- External service images (postgis, caddy)

**Production (Dockerfile):**  
- Multi-stage build with baked-in code
- Optimized for deployment consistency

This hybrid approach gives us:
- ✅ Fast development iteration  
- ✅ Consistent production deployments
- ✅ Clear separation of concerns

## Key Takeaways

1. **Volume mounts** = Live, changing code (development)
2. **Baked-in images** = Frozen, consistent code (production)  
3. **Multi-stage builds** = Best of both worlds
4. **Choose based on environment needs** - speed vs consistency
5. **Use proper tooling** - docker-compose for dev, Kamal/Kubernetes for prod

The goal is **consistency across environments** while maintaining **developer productivity**.

## Multi-Stage Builds: The Size and Security Story

### Why Two Images Instead of One?

**Single Stage Approach:**
```dockerfile
FROM golang:1.22-alpine
WORKDIR /app
COPY . .
RUN go build -o proxy main.go
EXPOSE 8081
CMD ["./proxy"]
```

**Multi-Stage Approach:**
```dockerfile
FROM golang:1.22-alpine AS build
WORKDIR /src
COPY run/main.go ./
RUN CGO_ENABLED=0 GOOS=linux GOARCH=amd64 go build -o /out/proxy main.go

FROM alpine:3.20
RUN apk add --no-cache curl
RUN adduser -D -u 10001 app
USER app
COPY --from=build /out/proxy /proxy
EXPOSE 8081
ENTRYPOINT ["/proxy"]
```

### The Math Behind Multi-Stage

**Image Size Comparison:**
- `golang:1.22-alpine`: ~350MB
- `alpine:3.20` + binary: ~15MB
- **Savings: ~335MB per image (95% reduction)**

### Why This Matters in Production

**1. Container Registry Costs**
- Pushing/pulling 15MB instead of 350MB
- Faster deployments across multiple environments
- Reduced bandwidth costs in cloud environments

**2. Attack Surface Reduction**
- No Go compiler in production container
- No build tools or development dependencies
- Fewer packages to scan for security vulnerabilities
- Minimal runtime environment

**3. Performance Benefits**
- Faster container startup times
- Reduced memory footprint
- Faster horizontal scaling

**4. Security Hardening**
```dockerfile
RUN adduser -D -u 10001 app  # Create non-root user
USER app                     # Run as non-privileged user
```
- Principle of least privilege
- If container is compromised, attacker doesn't get root access
- UID 10001 is common practice for application users

### When to Skip Multi-Stage

**Use single stage for:**
- Local development and debugging
- Prototyping and experimentation
- When you need build tools in production (edge cases)

**Use multi-stage for:**
- Production deployments
- CI/CD pipelines
- Any environment where size and security matter

### Even More Optimization

**Ultra-minimal approach:**
```dockerfile
FROM golang:1.22-alpine AS build
# ... build steps ...

FROM scratch  # Truly empty base image
COPY --from=build /out/proxy /proxy
EXPOSE 8081
ENTRYPOINT ["/proxy"]
```

**Result:** ~10MB total image size (just your binary)

**Trade-off:** No shell, no debugging tools, no package manager - pure runtime only.

## Docker COPY: Build Context vs WORKDIR

Understanding the difference between build context and container working directory is crucial for correct COPY commands.

### The Two Path Contexts

**Build Context (Source Paths):**
```bash
docker build -f run/development/go/Dockerfile .
#                                            ↑ This dot is your build context
```

**Container WORKDIR (Destination Paths):**
```dockerfile
WORKDIR /src  # Sets container's working directory
```

### COPY Command Breakdown

```dockerfile
FROM golang:1.22-alpine AS build
WORKDIR /src                     # Container working dir = /src
COPY run/main.go .              # Source: build context, Dest: WORKDIR
#    ↑                   ↑
#    │                   └── Destination: current WORKDIR (/src)
#    └── Source: relative to build context (repo root)
```

**What actually happens:**
1. Docker looks for `run/main.go` relative to build context (repo root)
2. Copies it to `.` which means current WORKDIR (`/src`)
3. File ends up at `/src/main.go` inside container

### Common Path Mistakes

**❌ Wrong - absolute path in source:**
```dockerfile
COPY /run/main.go .  # Looks for /run at filesystem root (doesn't exist)
```

**✅ Correct - relative to build context:**
```dockerfile
COPY run/main.go .   # Looks for run/main.go in build context
```

**❌ Wrong - absolute destination when you want WORKDIR:**
```dockerfile
COPY run/main.go /src/main.go  # Works but unnecessarily verbose
```

**✅ Correct - use WORKDIR:**
```dockerfile
WORKDIR /src
COPY run/main.go .             # Cleaner, uses established WORKDIR
```

### Real-World Example

**Directory structure:**
```
memudo/                        ← Build context root
├── run/
│   └── main.go               ← Source file
└── run/development/go/
    └── Dockerfile            ← Dockerfile location
```

**Build command:**
```bash
cd memudo/
docker build -f run/development/go/Dockerfile .
```

**COPY behavior:**
```dockerfile
WORKDIR /src                  # Container: /src becomes working directory
COPY run/main.go .           # Copies memudo/run/main.go → container:/src/main.go
```

### Key Takeaways

1. **Source paths** in COPY are always relative to **build context** (not Dockerfile location)
2. **Destination paths** in COPY are relative to **current WORKDIR** 
3. **Build context** is set by the final argument in `docker build`
4. **WORKDIR** affects where files land inside the container
5. Use relative paths for sources, leverage WORKDIR for destinations