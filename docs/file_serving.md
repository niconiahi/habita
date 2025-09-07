# File Serving Architecture

This document outlines the file serving architecture for property-related documents in Memudo, using a dual-storage approach with PostgreSQL as the source of truth and Valkey (Redis-compatible) as a performance cache.

## URL Structure

Files are served at user-friendly URLs following this pattern:

```
memudo.rent/property/{property_id}/files/{basename}
```

Examples:
- `memudo.rent/property/1/files/contract.pdf`
- `memudo.rent/property/1/files/lease_agreement.pdf`
- `memudo.rent/property/1/files/inspection_report.pdf`

## Architecture Overview

### Data Flow

1. **Generation**: Action generates PDF → stores in DB → caches in KV → redirects to GET endpoint
2. **Serving**: GET endpoint checks KV cache → falls back to DB → returns file with download headers

### Storage Layers

- **PostgreSQL (DB)**: Source of truth for file metadata and binary data
- **Valkey (KV)**: High-performance cache for frequently accessed files
- **Future**: Object storage (S3/MinIO) for large file binary data

## Database Schema

```sql
-- File storage table
CREATE TABLE files (
  id SERIAL PRIMARY KEY,
  property_id INTEGER NOT NULL REFERENCES properties(id),
  basename VARCHAR(255) NOT NULL,
  mime_type VARCHAR(100) NOT NULL,
  file_size BIGINT NOT NULL,
  sha256 CHAR(64) NOT NULL,
  storage_key VARCHAR(500) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Ensure unique files per property/basename combination
  UNIQUE(property_id, basename, sha256)
);

-- Index for quick lookups
CREATE INDEX idx_files_property_basename ON files(property_id, basename, created_at DESC);
CREATE INDEX idx_files_storage_key ON files(storage_key);
```

## KV Store Schema

### Key Patterns

```
file:current:{property_id}:{basename} -> storage_key
file:blob:{sha256} -> binary_data
file:meta:{sha256} -> {mime_type, size, created_at}
```

### Example Keys

```
file:current:1:contract.pdf -> "prop:1:contract.pdf:a1b2c3d4..."
file:blob:a1b2c3d4... -> <PDF bytes>
file:meta:a1b2c3d4... -> {"mime":"application/pdf","size":52341,"created_at":"2024-01-15T10:30:00Z"}
```

## KV Communication Protocol

Since you're implementing KV communication by hand, here's the protocol specification:

### Redis Protocol (RESP)

Valkey uses the Redis Serialization Protocol (RESP). Basic commands:

#### SET Command
```
*3\r\n$3\r\nSET\r\n$3\r\nkey\r\n$5\r\nvalue\r\n
```

#### GET Command  
```
*2\r\n$3\r\nGET\r\n$3\r\nkey\r\n
```

#### Response Format
- Simple strings: `+OK\r\n`
- Bulk strings: `$6\r\nfoobar\r\n`
- Null: `$-1\r\n`

### TCP Connection

```typescript
// Connect to Valkey (default port 6379)
const socket = net.createConnection(6379, 'localhost');

// Send command
socket.write('*2\r\n$3\r\nGET\r\n$3\r\nkey\r\n');

// Handle response
socket.on('data', (data) => {
  // Parse RESP format
});
```

## Implementation Flow

### File Generation (POST Action)

1. **Generate Content**: Create HTML → render to PDF using Playwright
2. **Hash Content**: Generate SHA256 of PDF bytes for deduplication
3. **Store in DB**: 
   - Insert file record with metadata
   - Store binary data in `bytea` column
   - Generate unique `storage_key`
4. **Cache in KV**:
   - Store blob: `file:blob:{sha256}` → PDF bytes
   - Store pointer: `file:current:{property_id}:{basename}` → storage_key
5. **Redirect**: Return 302 to `/property/{id}/files/{basename}`

### File Serving (GET Loader)

1. **Authorization**: Verify user can access property
2. **Cache Lookup**: Check `file:current:{property_id}:{basename}` in KV
3. **DB Fallback**: If cache miss, query latest file from DB and repair cache
4. **Blob Retrieval**: 
   - Try KV: `file:blob:{sha256}`
   - Fallback to DB: `files.bytes` column
5. **Response Headers**:
   ```
   Content-Type: application/pdf
   Content-Disposition: attachment; filename="{basename}"
   ETag: "{sha256}"
   Content-Length: {file_size}
   Cache-Control: private, max-age=300
   Last-Modified: {created_at}
   ```

## File Versioning Strategy

### Current Implementation
- Each `basename` per property has a "current" version
- Historical versions preserved in DB
- KV cache points to current version

### Future Versioning URLs
```
/property/1/files/contract.pdf           # Current version
/property/1/files/contract.pdf?v=123     # Specific version by ID
/property/1/files/contract.pdf?t=latest  # Explicit latest
```

## Security Considerations

### Access Control
- All file access requires property authorization
- Use session-based auth before serving files
- Consider IP allowlisting for sensitive properties

### Cache Headers
```
Cache-Control: private, max-age=300
```
- `private`: Prevent proxy caching
- `max-age=300`: Allow browser cache for 5 minutes
- For highly sensitive: `no-store, no-cache`

### Signed URLs (Future)
For shareable links without auth:
```
/property/1/files/contract.pdf?sig=abc123&exp=1642781234
```

## Performance Optimization

### KV Cache Strategy
- **Hot Path**: KV → immediate response
- **Warm Path**: DB → async KV update
- **Cold Path**: DB → synchronous KV update

### Binary Storage Evolution
1. **Phase 1**: All in PostgreSQL `bytea`
2. **Phase 2**: Large files → object storage, metadata in DB
3. **Phase 3**: CDN integration for public files

### Cache Warming
- Pre-populate KV on file creation
- Async repair missing cache entries
- Monitor cache hit rates

## Error Handling

### Common Scenarios
- **404**: File not found in DB
- **403**: Unauthorized property access  
- **500**: KV connection failure (fallback to DB)
- **502**: Corrupt file data (log + regenerate)

### Fallback Chain
1. KV cache hit → serve immediately
2. KV miss → DB lookup → async cache repair
3. DB miss → 404 response
4. KV error → serve from DB + log error

## Monitoring & Metrics

### Key Metrics
- Cache hit rate: `kv_hits / (kv_hits + kv_misses)`
- File generation time: P50/P95/P99
- Storage usage: DB vs KV size growth
- Download frequency per file type

### Alerting
- KV connection failures
- High DB query times
- File generation errors
- Storage capacity thresholds

## Configuration

### Environment Variables
```bash
# Database
DATABASE_URL=postgresql://user:pass@localhost:5432/memudo

# KV Store
VALKEY_HOST=localhost
VALKEY_PORT=6379
VALKEY_PASSWORD=optional

# File serving
FILE_CACHE_TTL=300
MAX_FILE_SIZE_MB=50
ALLOWED_MIME_TYPES=application/pdf,image/png,image/jpeg
```

### Docker Compose Integration
```yaml
services:
  valkey:
    image: valkey/valkey:7.2
    ports:
      - "6379:6379"
    volumes:
      - valkey_data:/data
    command: valkey-server --appendonly yes
```

## Migration Path

### Phase 1: Basic Implementation
- [x] PostgreSQL file storage
- [ ] KV cache layer
- [ ] File serving endpoints
- [ ] Basic versioning

### Phase 2: Optimization  
- [ ] Object storage migration
- [ ] CDN integration
- [ ] Advanced caching strategies
- [ ] Performance monitoring

### Phase 3: Advanced Features
- [ ] Signed URLs
- [ ] File collaboration
- [ ] Version comparison
- [ ] Audit logging