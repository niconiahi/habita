# File encryption at rest

## The problem we're solving

Habita stores sensitive documents — DNI copies, income proofs, contract PDFs, signed contracts, payment receipts, property photos. These are stored as `bytea` in PostgreSQL. If an attacker ever gains access to a database dump or backup, all file content would be readable in plain binary. Encryption at rest ensures that even with full database access, file content is unintelligible without the encryption key.

## How it works

All files are encrypted with **AES-256-GCM** before being written to the database, and decrypted when served to authenticated users. The encryption key is a 32-byte hex string stored in the `ENCRYPTION_KEY` environment variable — the same key already used for PII encryption (user name, surname, phone, document number).

### Encryption format

Each encrypted blob is a single Buffer with this layout:

```
[ IV (12 bytes) | encrypted content (N bytes) | auth tag (16 bytes) ]
```

- **IV (Initialization Vector)**: Random 12 bytes generated per encryption. Ensures the same file encrypted twice produces different ciphertext.
- **Encrypted content**: The AES-256-GCM ciphertext.
- **Auth tag**: 16-byte authentication tag. GCM mode provides authenticated encryption — if anyone tampers with the ciphertext, decryption fails. This means an attacker cannot modify stored files undetected.

### Key functions

Both live in `src/lib/server/encryption.ts`:

- `encrypt_buffer(plaintext: Buffer): Buffer` — encrypts raw binary content
- `decrypt_buffer(ciphertext: Buffer): Buffer` — decrypts back to original content

These are the Buffer equivalents of the existing `encrypt(string): string` and `decrypt(string): string` used for PII fields.

## What gets encrypted

Every `insertInto("file")` in the codebase encrypts content before storing. The full list:

| File                                                                    | What it stores                             |
| ----------------------------------------------------------------------- | ------------------------------------------ |
| `src/lib/server/upsert_file.ts`                                         | Generic file upload (dedup + insert)       |
| `src/lib/seeder/upload_file.ts`                                         | Seed data files                            |
| `src/routes/profile/actions/create_file.server.ts`                      | User profile documents (DNI, income proof) |
| `src/routes/admin/.../edit/actions/create_file.server.ts`               | Contract files                             |
| `src/routes/admin/.../edit/actions/create_pdf.server.ts`                | Generated contract PDFs                    |
| `src/routes/admin/.../edit/actions/create_contract_item_file.server.ts` | Contract item attachments                  |
| `src/routes/admin/.../tenant/actions/upload_receipt.server.ts`          | Payment receipts                           |
| `src/routes/webhooks/digital_signature/signing/+server.ts`              | Digitally signed PDF contracts             |

## Decryption on read

File serving happens in `src/routes/files/[file_id]/+server.ts`. The flow:

1. Check Redis cache (`file:{id}`) — if cached, serve directly (cache stores already-decrypted content in base64)
2. If cache miss, read encrypted content from database
3. Decrypt with `decrypt_buffer`
4. Cache the decrypted content in Redis for subsequent requests
5. Serve to the authenticated user

Redis holds plaintext because it's internal (same docker network, no public access). The tradeoff is: decrypt once on cache miss, serve fast on cache hits.

## Hash deduplication

Files are deduplicated by SHA-256 hash computed on the **plaintext content before encryption**. This means:

- Two identical files uploaded at different times share the same hash and reuse the same database row
- The stored encrypted blob differs per upload (different random IV), but the hash check happens before encryption
- Deduplication works correctly because the hash is computed on the original content

## What this protects against

- **Database dump**: An attacker with a raw SQL dump sees encrypted blobs, not files
- **Leaked backup**: Database backups are also age-encrypted before upload to Cloudflare R2, so this is a second layer
- **Compromised DB host**: Direct access to PostgreSQL data directory yields encrypted content
- **Tampered files**: GCM auth tag ensures any modification to stored content is detected on decrypt

## What this does NOT protect against

- **Compromised application server**: If the attacker has access to the running Node.js process, they have the `ENCRYPTION_KEY` in memory
- **Compromised Redis**: Cache stores decrypted content (mitigated by Redis being internal-only)
- **Key compromise**: If `ENCRYPTION_KEY` leaks, all files are decryptable. Key rotation requires re-encrypting all files.

## Key management

- Key stored in `ENCRYPTION_KEY` env var (64 hex characters = 32 bytes)
- Same key for PII fields and file content
- Encrypted at rest in git via SOPS + age (`infra/production/.env.enc`)
- On the VPS, decrypted `.env` is read by the svelte container at startup
