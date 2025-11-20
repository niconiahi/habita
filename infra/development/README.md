# Habita Development Environment

## First-Time Setup

### 1. Install Development CA Certificate

To avoid SSL certificate warnings in your browser, install the project's development CA:

```bash
cd infra/development
./setup-ca.sh
```

This is a **one-time setup** per machine. You'll be prompted for your password to install the certificate in your system's trust store.

### 2. Start Services

```bash
# From project root
docker compose up -d
```

That's it! Access the app at: **https://dev.habita.rent**

## What's Included

The development environment includes:
- **App** - React Router application (port 5173)
- **Database** - PostgreSQL with PostGIS (port 5432)
- **Valkey** - Redis-compatible cache (port 6379)
- **Imgproxy** - Image processing service
- **Caddy** - Reverse proxy with HTTPS
- **Nominatim** - Geocoding service (port 8080)
- **Go Service** - Backend API (port 8081)

## SSL Certificates

### Project CA
- **Certificate**: `certs/habita.pem` (committed to git)
- **Private Key**: `certs/habita-key.pem` (gitignored)

### Server Certificate
- **Certificate**: `certs/dev.habita.rent.pem` (committed to git)
- **Private Key**: `certs/dev.habita.rent-key.pem` (gitignored)

The private keys are **not committed** to git for security. They are automatically generated and shared via team communication (or regenerated on each machine).

## Useful Commands

```bash
# View logs
docker compose logs -f

# View specific service logs
docker compose logs -f app

# Restart a service
docker compose restart app

# Stop all services
docker compose down

# Rebuild and restart
docker compose up -d --build
```

## Troubleshooting

### Browser Shows Certificate Warning

Run the setup script again:
```bash
cd infra/development
./setup-ca.sh
```

### Images Not Loading

Check imgproxy logs:
```bash
docker compose logs image
```

The CA certificate should be installed in the imgproxy container automatically.

### Database Connection Issues

Check if PostgreSQL is running:
```bash
docker compose ps db
```

## Team Members

When a new team member joins:
1. Clone the repository
2. Copy `.env.example` to `.env` (if exists)
3. Run `./infra/development/setup-ca.sh`
4. Run `docker compose up -d`

No additional setup required!
