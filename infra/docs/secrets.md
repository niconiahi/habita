# Secrets Management

Habita uses [SOPS](https://github.com/getsops/sops) with [age](https://github.com/FiloSottile/age) encryption for secrets management.

## How It Works

```
┌─────────────────┐     git push     ┌─────────────────┐
│  .env (plain)   │ ───encrypt────►  │  .env.enc       │ ──────────►  Git
│  (never commit) │                  │  (committed)    │
└─────────────────┘                  └─────────────────┘
                                            │
                                            │ git pull
                                            ▼
                                     ┌─────────────────┐
                                     │  VPS decrypts   │
                                     │  with age key   │
                                     └─────────────────┘
```

- `.env` — plaintext secrets, **never committed**
- `.env.enc` — encrypted secrets, safe to commit
- Private key lives at `~/.config/sops/age/keys.txt` on your machine and the VPS

## Workflow

### Adding or Changing Secrets

```bash
# 1. Edit the plaintext file locally
vim infra/production/.env

# 2. Encrypt it
just secrets encrypt production

# 3. Commit and push
git add infra/production/.env.enc
git commit -m "update: add NEW_SECRET"
git push
```

### Applying Secrets to Production

```bash
# SSH into VPS
ssh user@habita.rent

# Pull latest code and apply secrets
cd /opt/habita
git pull
just secrets apply
```

The `secrets apply` command decrypts the secrets AND recreates the affected services (svelte, go) so they pick up the new env vars.

## Available Commands

| Command | Description |
|---------|-------------|
| `just secrets keygen` | Generate a new age key (one-time setup) |
| `just secrets encrypt [env]` | Encrypt `.env` → `.env.enc` |
| `just secrets decrypt [env]` | Decrypt `.env.enc` → `.env` |
| `just secrets apply` | Decrypt AND recreate services |
| `just secrets pubkey` | Show your public key |

Environment auto-detects: `development` locally, `production` on the VPS. Pass an explicit target to override (e.g., `just secrets encrypt production`).

## First-Time Setup

### On Your Machine

```bash
# Generate an age key
just secrets keygen

# Add your public key to .sops.yaml
# (ask team for existing .sops.yaml or create one)
```

### On the VPS

```bash
# Copy the age key (securely, e.g., via SSH)
mkdir -p ~/.config/sops/age
# paste key into ~/.config/sops/age/keys.txt
chmod 600 ~/.config/sops/age/keys.txt
```

## Security Notes

1. **Never commit `.env` files** — only `.env.enc`
2. **CI has no access to secrets** — decryption is manual, intentional
3. **One key per environment** — dev and prod can have different age keys
4. **Rotate secrets by re-encrypting** — edit `.env`, run `secrets encrypt`, commit
