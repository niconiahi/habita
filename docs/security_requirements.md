# Documentación de Seguridad - Habita

Documento preparado para revisión de seguridad.

---

## 0) Arquitectura & Tecnologías

### Diagrama de Arquitectura

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              INTERNET                                        │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                         CADDY (Reverse Proxy)                                │
│                     Puertos: 80, 443 (TLS termination)                       │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
                    ┌───────────────┼───────────────┐
                    ▼               ▼               ▼
┌──────────────────────┐  ┌──────────────────┐  ┌──────────────────────┐
│    SVELTE APP        │  │    GO API        │  │    IMGPROXY          │
│  (SvelteKit/Node.js) │  │   (Middleware)   │  │ (Procesamiento img)  │
│   Puerto: 3000       │  │  Puerto: 8081    │  │   Puerto: 8080       │
└──────────────────────┘  └──────────────────┘  └──────────────────────┘
            │                     │
            ▼                     ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                           RED INTERNA (Docker)                               │
├──────────────────┬──────────────────┬──────────────────┬────────────────────┤
│   POSTGRESQL     │     VALKEY       │    NOMINATIM     │      PDF           │
│   + PostGIS      │  (Redis-compat)  │   (Geocoding)    │   (Playwright)     │
│  Puerto: 5432    │  Puerto: 6379    │  Puerto: 8090    │  Puerto: 8082      │
└──────────────────┴──────────────────┴──────────────────┴────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                    OBSERVABILIDAD (SigNoz Stack)                             │
├─────────────────┬─────────────────┬─────────────────┬───────────────────────┤
│   ClickHouse    │   OTel Collector │  Query Service  │    Frontend          │
│   (Analytics)   │   (Traces/Logs)  │  Puerto: 8080   │   Puerto: 3301       │
└─────────────────┴─────────────────┴─────────────────┴───────────────────────┘
```

### Stack Tecnológico

| Capa | Tecnología | Versión |
|------|------------|---------|
| **Frontend** | Svelte 5 + SvelteKit | 5.45.6 / 2.49.1 |
| **Estilos** | Tailwind CSS | 4.1.18 |
| **Backend Web** | Node.js (SvelteKit SSR) | 22 |
| **Backend API** | Go | 1.23.0 |
| **Base de datos** | PostgreSQL + PostGIS | 17 / 3.4 |
| **Cache/Sesiones** | Valkey (Redis-compatible) | 7.2 |
| **ORM** | Kysely | 0.28.8 |
| **Autenticación** | Better Auth | 1.4.17 |
| **Reverse Proxy** | Caddy | 2.8 |
| **Contenedores** | Docker Compose | - |
| **Observabilidad** | OpenTelemetry + SigNoz | - |
| **Package Manager** | Bun | - |
| **Lenguaje** | TypeScript | 5.9.3 |

---

## 1) Links + Accesos

### URLs

| Ambiente | URL | Propósito |
|----------|-----|-----------|
| **Producción** | `https://habita.rent` | Aplicación principal |
| **Desarrollo** | `https://dev.habita.rent` | Testing/staging |
| **API Go** | Puerto interno 8081 | Servicio de emails |
| **Admin Panel** | No existe panel separado | Admin integrado en `/admin/*` |

### Usuarios de Prueba

**Nota:** El sistema usa Google OAuth como único método de login. Para crear usuarios de prueba, se necesitan cuentas de Google.

| Rol | Permisos | Descripción |
|-----|----------|-------------|
| **landlord** | Full (CRUD todo) | Propietario - control total |
| **realtor** | Read/Write propiedades, contratos, inquilinos | Inmobiliaria |
| **manager** | Read/Write propiedades, contratos, inquilinos | Administrador de propiedades |
| **tenant** | Solo lectura | Inquilino |

**Acceso especial:** Existe una función `is_webmaster()` que verifica un user ID específico hardcodeado para acceso de superadmin.

---

## 2) Login & Roles

### Métodos de Login

| Método | Estado | Proveedor |
|--------|--------|-----------|
| **Google OAuth 2.0** | ✅ Activo | Google |
| Email/Password | ❌ No implementado | - |
| Apple | ❌ No implementado | - |
| Magic Links | ❌ No implementado | - |

### Configuración OAuth

```
Client ID: GOOGLE_CLIENT_ID (env var)
Client Secret: GOOGLE_CLIENT_SECRET (env var)
Redirect URL: https://dev.habita.rent/auth/google/callback
Prompt: "select_account" (siempre pide seleccionar cuenta)
```

### Manejo de Sesión

| Parámetro | Valor |
|-----------|-------|
| **Tipo** | Cookie HTTP-only |
| **Duración** | 30 días |
| **Refresh automático** | Después de 15 días de inactividad |
| **sameSite** | `none` (cross-site) |
| **secure** | `true` (HTTPS only) |
| **Almacenamiento** | PostgreSQL (tabla `session`) |

### Datos en Sesión

```typescript
// Datos disponibles en cada request
session: {
  id,
  userId,
  expiresAt,
  createdAt,
  updatedAt,
  activeOrganizationId,  // Organización activa
  activeTeamId           // Equipo activo
}

user: {
  id,
  email,
  name (encriptado/desencriptado),
  surname (encriptado/desencriptado)
}
```

### Sistema de Roles y Permisos

**Modelo de 2 capas:**

1. **Capa 1 - Permisos por Rol (Better Auth)**
   - Verifica: "¿Puede este ROL hacer esta ACCIÓN?"
   - Función: `auth.api.hasPermission()`

2. **Capa 2 - ACL por Recurso (tabla `property_access`)**
   - Verifica: "¿Está este USUARIO asignado a esta PROPIEDAD?"
   - Consulta directa a base de datos

**Ambas capas deben pasar para otorgar acceso.**

### Permisos por Rol

| Rol | organization | member | invitation | property | contract | tenant |
|-----|--------------|--------|------------|----------|----------|--------|
| **landlord** | update, delete | create, update, delete | create, cancel | read, write | read, write | read, write |
| **realtor** | update | - | - | read, write | read, write | read, write |
| **manager** | update | - | - | read, write | read, write | read, write |
| **tenant** | - | - | - | read | read | - |

### Tipos de Acceso a Propiedades

| Tipo | Valor | Descripción |
|------|-------|-------------|
| `LANDLORD` | 0 | Dueño de la propiedad |
| `MANAGER` | 1 | Administra la propiedad |
| `TENANT` | 2 | Alquila la propiedad |

---

## 3) Endpoints

### Endpoints Públicos

| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/health` | Health check |
| GET | `/auth/google` | Inicio de login OAuth |
| GET | `/auth/google/callback` | Callback OAuth |

### Endpoints Autenticados - Archivos

| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/files/[file_id]` | Descargar archivo por ID |

### Endpoints Autenticados - Pagos (Mercado Pago)

| Método | Ruta | Descripción |
|--------|------|-------------|
| POST | `/pay` | Crear preferencia de pago |
| GET | `/pay/success` | Callback de pago exitoso |
| GET | `/pay/failure` | Página de pago fallido |

### Endpoints Autenticados - Propiedades

| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/properties` | Listar propiedades accesibles |
| GET | `/properties/[property_id]/accept-invite` | Aceptar invitación |

### Endpoints Admin (requieren rol apropiado)

| Método | Ruta | Acción | Descripción |
|--------|------|--------|-------------|
| GET/POST | `/admin/candidates` | SET_TENANT | Gestión de candidatos |
| GET/POST | `/admin/contracts` | - | Listar contratos |
| POST | `/admin/contracts/new` | - | Crear contrato |
| POST | `/admin/contracts/[id]/edit` | - | Editar contrato |
| GET/POST | `/admin/properties` | - | Gestión propiedades |
| POST | `/admin/properties/new` | - | Crear propiedad |
| POST | `/admin/properties/[id]/edit` | - | Editar propiedad |
| POST | `/admin/properties/[id]/calendar` | - | Calendario propiedad |
| GET/POST | `/admin/realtor` | - | Gestión inmobiliaria |
| GET/POST | `/admin/tenants` | - | Gestión inquilinos |

### Endpoints Perfil

| Método | Ruta | Acción | Descripción |
|--------|------|--------|-------------|
| POST | `/profile` | CREATE_FILE | Subir archivos |
| POST | `/profile` | UPDATE_USER | Actualizar perfil |

### Endpoints Tasas (Admin)

| Método | Ruta | Descripción |
|--------|------|-------------|
| POST | `/rates` | Crear/actualizar tasas de cambio |

### API Go (Servicio de Email)

| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/health` | Health check |
| POST | `/send-email` | Enviar invitación calendario (ICS) |
| POST | `/send-landlord-invite` | Enviar invitación a propietario |

### Better Auth (rutas automáticas)

Better Auth expone automáticamente endpoints para:
- Gestión de sesiones
- Gestión de organizaciones
- Gestión de equipos
- Gestión de miembros
- Invitaciones

---

## 4) Hosting / Ambientes

### Infraestructura

| Componente | Tecnología |
|------------|------------|
| **Orquestación** | Docker Compose |
| **Reverse Proxy** | Caddy 2.8 (TLS automático) |
| **Contenedores** | Multi-stage builds |

### Ambientes

| Ambiente | Ubicación Config | Puerto Web |
|----------|------------------|------------|
| **Desarrollo** | `/infra/development/` | 5174 |
| **Producción** | `/infra/production/` | 3000 |

### Base de Datos

| Parámetro | Valor |
|-----------|-------|
| **Motor** | PostgreSQL 17 |
| **Extensión** | PostGIS 3.4 |
| **Puerto** | 5432 |
| **ORM** | Kysely |
| **Migraciones** | 17+ archivos TypeScript |

**Tablas principales:**
- `user`, `session`, `account`, `verification` (auth)
- `organization`, `member`, `team`, `team_member` (multi-tenancy)
- `property`, `property_access`, `contract`, `job`, `rate`, `receipt`, `payment`
- `room`, `map`, `notification`, `file_upload`

### Storage de Archivos

| Servicio | Uso |
|----------|-----|
| **Cloudflare R2** | Backups encriptados |
| **PostgreSQL** | Metadatos de archivos |

### Cifrado

| Tipo | Implementación |
|------|----------------|
| **En tránsito** | TLS via Caddy (HTTPS) |
| **En reposo - PII** | AES-256-GCM (campos: name, surname, phone, document) |
| **En reposo - Backups** | age encryption → Cloudflare R2 |
| **Secrets** | SOPS + age encryption |

### Backups

| Ambiente | Frecuencia | Retención | Destino |
|----------|------------|-----------|---------|
| **Desarrollo** | Diario 3 AM | 7 días | Local (gzip) |
| **Producción** | Diario 3 AM | - | R2 (encriptado) |

---

## 6) Docker - Infraestructura Detallada

### Puertos Expuestos al Host

⚠️ **Solo Caddy expone puertos al exterior.** Todos los demás servicios son internos.

| Servicio | Puerto Host | Puerto Container | Protocolo | Acceso |
|----------|-------------|------------------|-----------|--------|
| **caddy** | 80 | 80 | TCP | Público (redirect a 443) |
| **caddy** | 443 | 443 | TCP/UDP | Público (HTTPS + HTTP/3) |

### Servicios Docker - Producción

#### Stack Principal (`/infra/production/app/`)

| Servicio | Imagen | Puerto Interno | Usuario | Memoria Límite | CPU Límite |
|----------|--------|----------------|---------|----------------|------------|
| **db** | `postgis/postgis:17-3.4` | 5432 | postgres (default) | 1G | 2.0 |
| **valkey** | `valkey/valkey:7.2` | 6379 | valkey (default) | 512M | 0.5 |
| **svelte** | `niconiahi/habita:svelte-${SHA}` | 3000 | appuser (10001) | 2G | 2.0 |

#### Gateway (`/infra/production/gateway/`)

| Servicio | Imagen | Puerto Interno | Usuario | Memoria Límite | CPU Límite |
|----------|--------|----------------|---------|----------------|------------|
| **caddy** | `caddy:2.8` | 80, 443 | root (default) | 256M | 1.0 |

#### API Go (`/infra/production/api/`)

| Servicio | Imagen | Puerto Interno | Usuario | Memoria Límite | CPU Límite |
|----------|--------|----------------|---------|----------------|------------|
| **go** | `niconiahi/habita:go-${SHA}` | 8081 | gopher (10001) | 512M | 1.0 |

#### Media (`/infra/production/media/`)

| Servicio | Imagen | Puerto Interno | Usuario | Memoria Límite | CPU Límite |
|----------|--------|----------------|---------|----------------|------------|
| **image** | `darthsim/imgproxy:v3.24.1` | 8080 | 1000:1000 | 512M | 2.0 |

#### PDF (`/infra/production/pdf/`)

| Servicio | Imagen | Puerto Interno | Usuario | Memoria Límite | CPU Límite |
|----------|--------|----------------|---------|----------------|------------|
| **pdf** | Custom (Playwright) | 8082 | node (default) | 1G | 1.0 |

#### Geocoding (`/infra/production/geo/`)

| Servicio | Imagen | Puerto Interno | Usuario | Memoria Límite | CPU Límite |
|----------|--------|----------------|---------|----------------|------------|
| **nominatim** | `mediagis/nominatim:4.4` | 8080 | postgres (default) | 2G | 1.0 |

#### Scheduler & Backups (`/infra/production/scheduler/`)

| Servicio | Imagen | Puerto Interno | Usuario | Memoria Límite | CPU Límite |
|----------|--------|----------------|---------|----------------|------------|
| **ofelia** | `mcuadros/ofelia:0.3.20` | - | root | 128M | 0.25 |
| **backup-worker** | `postgres:17-alpine` + age | - | backup (10001) | 256M | 0.5 |
| **backup-uploader** | `rclone/rclone:1.68` | - | root | 128M | 0.25 |

#### Status Page (`/infra/production/status/`)

| Servicio | Imagen | Puerto Interno | Usuario | Memoria Límite | CPU Límite |
|----------|--------|----------------|---------|----------------|------------|
| **gatus** | `twinproduction/gatus:v5.14.0` | 8080 | scratch | 128M | 0.25 |

### Nombres de Contenedor (para testing)

| Contenedor | Servicio | Accesible desde |
|------------|----------|-----------------|
| `app-db-1` | PostgreSQL | Red interna |
| `app-valkey-1` | Valkey/Redis | Red interna |
| `app-svelte-1` | SvelteKit App | Red interna |
| `api-go-1` | Go API | Red interna |
| `gateway-caddy-1` | Caddy | Host:80,443 |
| `media-image-1` | Imgproxy | Red interna |
| `geo-nominatim-1` | Nominatim | Red interna |
| `pdf-pdf-1` | PDF Service | Red interna |
| `status-gatus-1` | Status Page | Red interna |
| `scheduler-ofelia-1` | Cron Scheduler | Red interna |
| `scheduler-backup-worker-1` | Backup Worker | Red interna |
| `scheduler-backup-uploader-1` | R2 Uploader | Red interna |

### Red Docker

| Red | Tipo | Descripción |
|-----|------|-------------|
| `internal` | external: true | Red compartida entre todos los servicios |

**Topología:**
```
INTERNET
    │
    ▼
┌─────────────────────────────────────────────────────────────────┐
│  HOST (VPS)                                                      │
│  ├── Puerto 22: SSH (único acceso administrativo)               │
│  ├── Puerto 80: Caddy → redirect HTTPS                          │
│  └── Puerto 443: Caddy → TLS termination                        │
└─────────────────────────────────────────────────────────────────┘
    │
    ▼ (docker network: internal)
┌─────────────────────────────────────────────────────────────────┐
│  CADDY (reverse proxy)                                           │
│  ├── habita.rent → svelte:3000                                  │
│  ├── habita.rent/image/* → image:8080                           │
│  ├── habita.rent/nominatim/* → nominatim:8080                   │
│  └── status.habita.rent → gatus:8080                            │
└─────────────────────────────────────────────────────────────────┘
    │
    ▼
┌─────────────────────────────────────────────────────────────────┐
│  SERVICIOS INTERNOS (sin exposición directa)                     │
│  ├── svelte:3000 (app)                                          │
│  ├── go:8081 (email API - NO expuesto a Caddy)                  │
│  ├── db:5432 (PostgreSQL)                                        │
│  ├── valkey:6379 (Redis)                                        │
│  ├── image:8080 (imgproxy)                                       │
│  ├── nominatim:8080 (geocoding)                                  │
│  ├── pdf:8082 (PDF generation)                                   │
│  └── gatus:8080 (status page)                                    │
└─────────────────────────────────────────────────────────────────┘
```

### Volúmenes Persistentes

| Volumen | Servicio | Contenido | Sensibilidad |
|---------|----------|-----------|--------------|
| `db` | PostgreSQL | Datos de base de datos | 🔴 Alta |
| `kv` | Valkey | Cache y sesiones | 🟡 Media |
| `backups` (external) | backup-worker | Backups encriptados | 🔴 Alta |
| `caddy_data` | Caddy | Certificados TLS | 🔴 Alta |
| `caddy_config` | Caddy | Configuración | 🟡 Media |
| `nominatim` | Nominatim | Datos geográficos Argentina | 🟢 Baja |

### Cron Jobs Programados (Ofelia)

| Job | Schedule | Contenedor | Comando |
|-----|----------|------------|---------|
| `create-escalation-jobs` | Cada minuto | app-svelte-1 | `bun run create_escalation_jobs.script.ts` |
| `process-jobs` | Cada minuto | app-svelte-1 | `bun run process_jobs.script.ts` |
| `backup-db` | 3:00 AM diario | scheduler-backup-worker-1 | `pg_dump \| gzip \| age encrypt` |
| `backup-upload` | X:15 cada hora | scheduler-backup-uploader-1 | `rclone sync → R2` |
| `backup-monitor` | 6:00 AM diario | scheduler-backup-uploader-1 | Verificar backup reciente |

### Health Checks Internos

| Endpoint | Servicio | Intervalo | Timeout |
|----------|----------|-----------|---------|
| `http://app-svelte-1:3000/health` | Web App | 30s | 10s |
| `tcp://app-db-1:5432` | PostgreSQL | 10s | 5s |
| `tcp://app-valkey-1:6379` | Valkey | 10s | 3s |
| `http://api-go-1:8081/health` | Go API | 10s | 3s |
| `http://media-image-1:8080/health` | Imgproxy | 10s | 5s |
| `http://geo-nominatim-1:8080/status` | Nominatim | 60s | 10s |
| `http://pdf:8082/health` | PDF Service | 10s | 5s |

### Dockerfile Security

| Imagen | Base | Usuario Non-Root | UID |
|--------|------|------------------|-----|
| **svelte** | `node:22-slim` | ✅ appuser | 10001 |
| **go** | `alpine:3.20` | ✅ gopher | 10001 |
| **backup-worker** | `postgres:17-alpine` | ✅ backup | 10001 |
| **imgproxy** | darthsim/imgproxy | ✅ (user: 1000:1000) | 1000 |
| **caddy** | caddy:2.8 | ❌ root | - |
| **ofelia** | mcuadros/ofelia | ❌ root (necesita docker.sock) | - |

### Montajes Sensibles

| Contenedor | Montaje | Permisos | Riesgo |
|------------|---------|----------|--------|
| **ofelia** | `/var/run/docker.sock` | ro | 🔴 Alto - Acceso a Docker API |
| **backup-uploader** | `./rclone.conf` | ro | 🔴 Alto - Credenciales R2 |
| **caddy** | `./Caddyfile` | ro | 🟡 Medio - Config proxy |
| **gatus** | `./config.yaml` | ro | 🟢 Bajo - Solo endpoints |

### Caddy - Security Headers

```
Strict-Transport-Security: max-age=31536000; includeSubDomains; preload
X-Content-Type-Options: nosniff
X-Frame-Options: SAMEORIGIN
X-XSS-Protection: 1; mode=block
Referrer-Policy: strict-origin-when-cross-origin
```

### Test de Acceso Esperado

| Test | Esperado | Descripción |
|------|----------|-------------|
| `curl http://IP:5432` | ❌ Connection refused | PostgreSQL NO expuesto |
| `curl http://IP:6379` | ❌ Connection refused | Valkey NO expuesto |
| `curl http://IP:3000` | ❌ Connection refused | Svelte NO expuesto directo |
| `curl http://IP:8081` | ❌ Connection refused | Go API NO expuesto |
| `curl http://IP:8080` | ❌ Connection refused | Imgproxy NO expuesto |
| `curl http://IP:80` | ✅ Redirect 301 → HTTPS | Caddy responde |
| `curl https://IP:443` | ✅ Certificate error (IP) | Caddy responde |
| `curl https://habita.rent` | ✅ 200 OK | App funciona |
| `ssh user@IP -p 22` | ✅ Con clave SSH | Único acceso admin |

---

## 5) Terceros

### Servicios Externos

| Servicio | Proveedor | Propósito | Variables de Entorno |
|----------|-----------|-----------|---------------------|
| **Autenticación OAuth** | Google | Login social | `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` |
| **Pagos** | Mercado Pago | Procesamiento de pagos | `MERCADO_PAGO_ACCESS_TOKEN`, `MERCADO_PAGO_CLIENT_ID`, `MERCADO_PAGO_CLIENT_SECRET` |
| **Email SMTP** | Gmail | Envío de emails/calendarios | `SMTP_USER`, `SMTP_PASS` (smtp.gmail.com:587) |
| **Object Storage** | Cloudflare R2 | Backups | `R2_BACKUP_ACCESS_KEY_ID`, `R2_BACKUP_SECRET_ACCESS_KEY`, `R2_BACKUP_ENDPOINT` |
| **Observabilidad** | SigNoz (self-hosted) | Traces y logs | `OTEL_EXPORTER_OTLP_ENDPOINT` |

### Servicios Self-Hosted

| Servicio | Imagen | Propósito |
|----------|--------|-----------|
| **Valkey** | valkey/valkey:7.2 | Cache y sesiones (Redis-compatible) |
| **Imgproxy** | darthsim/imgproxy:v3.24.1 | Optimización de imágenes |
| **Nominatim** | mediagis/nominatim:4.4 | Geocoding (Argentina) |
| **Ofelia** | mcuadros/ofelia:v0.3.12 | Cron scheduler |
| **PDF Service** | Custom (Playwright) | Generación de PDFs |

### Variables de Entorno Críticas

```bash
# Base de datos
POSTGRES_HOST, POSTGRES_USER, POSTGRES_PASSWORD, POSTGRES_DB

# Redis
REDIS_URL

# Auth
BETTER_AUTH_URL, BETTER_AUTH_SECRET
GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET

# Pagos
MERCADO_PAGO_ACCESS_TOKEN, MERCADO_PAGO_TEST_ACCESS_TOKEN
MERCADO_PAGO_CLIENT_ID, MERCADO_PAGO_CLIENT_SECRET

# Email
SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS

# Imágenes
IMGPROXY_KEY, IMGPROXY_SALT

# Observabilidad
OTEL_EXPORTER_OTLP_ENDPOINT, OTEL_SERVICE_NAME, OTEL_ENVIRONMENT

# Encriptación
ENCRYPTION_KEY

# Cloud Storage
R2_BACKUP_ACCESS_KEY_ID, R2_BACKUP_SECRET_ACCESS_KEY
R2_BACKUP_ENDPOINT, CLOUDFLARE_ACCOUNT_ID
```

---

## Archivos Clave para Revisión

### Aplicación

| Archivo | Propósito |
|---------|-----------|
| `/apps/web/src/lib/server/auth.ts` | Configuración Better Auth, roles, permisos |
| `/apps/web/src/hooks.server.ts` | Middleware de sesión |
| `/apps/web/src/lib/server/property_access.ts` | Control de acceso 2 capas |
| `/apps/web/src/lib/server/encryption.ts` | Encriptación PII |
| `/apps/web/src/lib/auth-client.ts` | Cliente auth (browser) |
| `/apps/web/db/migrations/` | Schema de base de datos |

### Infraestructura Docker

| Archivo | Propósito |
|---------|-----------|
| `/infra/production/gateway/Caddyfile` | Configuración reverse proxy, headers, rutas |
| `/infra/production/gateway/docker-compose.yml` | Puertos expuestos (80, 443) |
| `/infra/production/app/docker-compose.yml` | DB, Valkey, Svelte - servicios core |
| `/infra/production/api/docker-compose.yml` | Go API service |
| `/infra/production/scheduler/docker-compose.yml` | Ofelia, backup workers |
| `/infra/production/scheduler/ofelia.ini` | Cron jobs programados |
| `/infra/production/status/config.yaml` | Endpoints monitoreados por Gatus |
| `/apps/web/Dockerfile` | Build de imagen Svelte (multi-stage) |
| `/apps/go/Dockerfile` | Build de imagen Go |

---

## Notas de Seguridad Observadas

### Aplicación
1. **PII encriptado**: Nombres, apellidos, teléfonos y documentos se encriptan con AES-256-GCM
2. **Cookies seguras**: `sameSite=none`, `secure=true`, HTTP-only
3. **Sesiones con tracking**: Se registra IP y user-agent
4. **Doble capa de autorización**: Rol + asignación específica a recurso
5. **Secrets encriptados**: SOPS + age para manejo de secrets
6. **TLS automático**: Caddy maneja certificados con Let's Encrypt
7. **Backups encriptados**: age encryption antes de subir a R2

### Docker / Infraestructura
8. **Solo puertos 80/443 expuestos**: Todos los servicios son internos via red Docker
9. **Usuarios non-root**: Svelte (10001), Go (10001), backup-worker (10001), imgproxy (1000)
10. **Límites de recursos**: Todos los contenedores tienen memory/CPU limits
11. **Health checks**: Todos los servicios tienen healthcheck configurado
12. **Volúmenes mínimos**: Solo montajes necesarios, mayoría read-only
13. **Security headers**: HSTS, X-Frame-Options, X-Content-Type-Options via Caddy
14. **Docker socket read-only**: Ofelia tiene acceso solo lectura al socket

### Puntos de Atención para Pentest
- ⚠️ **Ofelia con docker.sock**: Aunque es read-only, tiene acceso a Docker API
- ⚠️ **Caddy como root**: Necesario para bind en puertos privilegiados (80, 443)
- ⚠️ **rclone.conf montado**: Contiene credenciales R2 para backups
- ⚠️ **Go API no expuesto a Caddy**: Solo accesible internamente, verificar que no haya bypass
