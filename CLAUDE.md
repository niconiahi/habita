# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Memudo** is a property management application built with React Router (v7) and PostgreSQL. It's a full-stack TypeScript application that handles property CRUD operations with location services via Nominatim.

## Development Environment

This project uses Docker Compose for development with multiple services:

### Starting Development Environment
```bash
# Start all services (app, database, Nominatim, Go service, Caddy)
npm run up

# Stop services
npm run down

# Nuclear option (removes volumes)
npm run down:nuclear
```

### Development Server
```bash
# Start React Router dev server (port 5173)
npm run dev
```

## Key Commands

### Build & Type Checking
```bash
# Production build
npm run build

# Type checking (includes React Router type generation)
npm run typecheck
```

### Code Quality
```bash
# Lint with Biome
npm run lint

# Auto-fix linting issues
npm run lint:fix

# Format code
npm run format
```

### Database Operations
```bash
# Generate TypeScript types from database schema
npm run db:types

# Run database migrations
npm run db:migrate

# Run database seeds
npm run db:seed

# Drop database volume
npm run db:drop
```

### Logging
```bash
# View database logs
npm run logs:db

# View app logs  
npm run logs:app

# View Nominatim logs
npm run logs:nominatim
```

## Architecture

### Tech Stack
- **Frontend**: React 19, React Router v7 with SSR
- **Backend**: Node.js with React Router
- **Database**: PostgreSQL with PostGIS extensions
- **ORM**: Kysely for type-safe SQL queries
- **Styling**: TailwindCSS v4
- **Location**: Nominatim for geocoding
- **Code Quality**: Biome for linting/formatting
- **Validation**: Valibot

### Project Structure
- `app/` - React Router application code
  - `routes/` - File-based routing with nested property routes
  - `lib/` - Shared utilities and server-side code
  - `components/` - React components
- `db/` - Database schema, migrations, seeds, and types
- `run/development/` - Docker configuration for development
- `docs/` - Project documentation

### Database
- Uses Kysely for type-safe queries
- Auto-generates TypeScript types from schema
- PostGIS enabled for location data
- Migrations and seeds managed via kysely-ctl

### Route Structure
The app follows RESTful routing for properties:
- `/` - Home page
- `/properties` - Property listing
- `/properties/new` - Create property form  
- `/properties/:id` - Property details
- `/properties/:id/edit` - Edit property form

## Development Notes

### Code Style
- Biome configured with 60 character line width
- Semicolons as needed
- 2-space indentation
- Strict TypeScript enabled

### Docker Services
- **app**: Main React Router application (port 5173)
- **db**: PostGIS database (port 5432)  
- **go**: Go service (port 8081)
- **caddy**: Reverse proxy (ports 80/443)
- **nominatim**: Location geocoding service (port 8080)

### Path Aliases
- `~/` maps to `./app/`