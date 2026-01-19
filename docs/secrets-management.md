# Secrets Management

This project uses **sops + age** to encrypt secrets. Encrypted files (`.env.enc`) are safe to commit to git. Plaintext files (`.env`) are gitignored.

## TL;DR

```bash
# Edit secrets
just secrets-edit                           # development
just --set env production secrets-edit      # production

# After editing plaintext .env manually
just secrets-encrypt                        # development
just --set env production secrets-encrypt   # production

# On a new machine (after copying your private key)
just secrets-decrypt                        # development
just --set env production secrets-decrypt   # production
```

---

## How It Works

```
┌─────────────────┐     encrypt      ┌─────────────────┐
│  .env           │ ───────────────► │  .env.enc       │
│  (plaintext)    │                  │  (encrypted)    │
│  GITIGNORED     │ ◄─────────────── │  COMMITTED      │
└─────────────────┘     decrypt      └─────────────────┘
```

- **age** is the encryption tool (like GPG, but simple)
- **sops** wraps age to encrypt individual values in files (keys stay readable, values encrypted)
- Your **private key** (`~/.config/sops/age/keys.txt`) is the only thing that can decrypt

---

## File Locations

| File | Purpose | In Git? |
|------|---------|---------|
| `infra/development/.env` | Plaintext dev secrets | ❌ No |
| `infra/development/.env.enc` | Encrypted dev secrets | ✅ Yes |
| `infra/production/.env` | Plaintext prod secrets | ❌ No |
| `infra/production/.env.enc` | Encrypted prod secrets | ✅ Yes |
| `.sops.yaml` | Encryption config | ✅ Yes |
| `~/.config/sops/age/keys.txt` | Your private key | ❌ Never |

---

## Daily Workflow

### Editing Secrets

**Option 1: Edit encrypted file directly** (recommended)
```bash
just secrets-edit
```
This decrypts → opens in `$EDITOR` → re-encrypts on save.

**Option 2: Edit plaintext, then encrypt**
```bash
vim infra/development/.env
just secrets-encrypt
```

### After Changing Secrets

Always commit the updated `.env.enc`:
```bash
git add infra/development/.env.enc
git commit -m "chore: update dev secrets"
```

---

## Setting Up a New Machine

### 1. Install tools

**macOS:**
```bash
brew install sops age
```

**Linux:**
```bash
# age
curl -LO https://github.com/FiloSottile/age/releases/download/v1.2.0/age-v1.2.0-linux-amd64.tar.gz
tar xzf age-v1.2.0-linux-amd64.tar.gz
sudo mv age/age age/age-keygen /usr/local/bin/

# sops
curl -LO https://github.com/getsops/sops/releases/download/v3.9.0/sops-v3.9.0.linux.amd64
chmod +x sops-v3.9.0.linux.amd64
sudo mv sops-v3.9.0.linux.amd64 /usr/local/bin/sops
```

### 2. Copy your private key

Get your key from KeePassXC and save it:
```bash
mkdir -p ~/.config/sops/age
nano ~/.config/sops/age/keys.txt
# Paste the full content (including the "AGE-SECRET-KEY-..." line)
chmod 600 ~/.config/sops/age/keys.txt
```

### 3. Decrypt secrets

```bash
just secrets-decrypt
just --set env production secrets-decrypt
```

---

## Production Server Setup

On your production VPS:

```bash
# 1. SSH into server
ssh user@your-server

# 2. Clone repo (encrypted secrets come with it)
git clone git@github.com:you/habita.git
cd habita

# 3. Install sops + age (see above)

# 4. Copy private key (from KeePassXC)
mkdir -p ~/.config/sops/age
nano ~/.config/sops/age/keys.txt
chmod 600 ~/.config/sops/age/keys.txt

# 5. Decrypt production secrets
just --set env production secrets-decrypt

# 6. Start services
just --set env production up
```

---

## Disaster Recovery

### Lost your private key?

**You're locked out.** The encrypted files cannot be decrypted without the private key. This is by design.

**Prevention:**
- Store key in KeePassXC
- Keep an offline backup (USB drive, printed paper in safe)
- Consider storing in a second password manager

### Compromised private key?

1. Generate new key: `age-keygen -o new-keys.txt`
2. Decrypt all secrets with old key
3. Update `.sops.yaml` with new public key
4. Re-encrypt all secrets: `just secrets-encrypt`
5. Rotate all actual secrets (DB passwords, API keys, etc.)
6. Delete old key

### Corrupted `.env.enc` file?

Restore from git:
```bash
git checkout HEAD -- infra/development/.env.enc
just secrets-decrypt
```

---

## Adding a Team Member

If you need to give someone else access:

### Option 1: Share the same key (simple, less secure)
Send them the private key securely (Signal, in-person, etc.)

### Option 2: Multiple keys (more secure)
1. They generate their own key: `just secrets-keygen`
2. They send you their **public** key (safe to share)
3. You add their public key to `.sops.yaml`:
   ```yaml
   creation_rules:
     - path_regex: infra/development/\.env(\.enc)?$
       age: >-
         age1yourkey...,
         age1theirkey...
   ```
4. Re-encrypt: `just secrets-encrypt`
5. Commit updated `.sops.yaml` and `.env.enc`

Now both keys can decrypt.

---

## Troubleshooting

### "no matching creation rules found"

The file path doesn't match any regex in `.sops.yaml`. Check:
- You're in the repo root
- The path regex matches your file

### "could not decrypt data key"

Wrong private key or key not found. Check:
- `~/.config/sops/age/keys.txt` exists
- It contains the correct private key
- File permissions: `chmod 600 ~/.config/sops/age/keys.txt`

### "MAC mismatch"

The encrypted file was corrupted or tampered with. Restore from git:
```bash
git checkout HEAD -- infra/development/.env.enc
```

---

## Security Notes

1. **Never commit plaintext `.env` files** — they're gitignored, but double-check before pushing
2. **Private key = keys to the kingdom** — treat it like a password
3. **Rotate secrets periodically** — especially after team members leave
4. **Different keys for prod** — consider using a separate key for production (update `.sops.yaml` with different keys per path)

---

## Quick Reference

| Command | Description |
|---------|-------------|
| `just secrets-keygen` | Generate new age key |
| `just secrets-encrypt` | Encrypt `.env` → `.env.enc` |
| `just secrets-decrypt` | Decrypt `.env.enc` → `.env` |
| `just secrets-edit` | Edit encrypted file directly |
| `just secrets-pubkey` | Show your public key |

Add `--set env production` for production files.
