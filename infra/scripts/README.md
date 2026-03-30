# VPS Setup Scripts

This directory contains scripts for setting up a secure VPS for Habita production deployment.

## Usage

All scripts can be run with `bash script_name.sh` (no need to make them executable).

## Scripts Overview

### Local Machine Scripts

**01_generate_ssh_keys.sh**
- Generates SSH key pair (`~/.ssh/habita`)
- Run on: Local machine
- Usage: `bash 01_generate_ssh_keys.sh`

**02_add_ssh_key_to_root.sh**
- Adds your public key to VPS root user
- Run on: Local machine
- Usage: `bash 02_add_ssh_key_to_root.sh`
- Note: Edit VPS_IP variable if different from 209.38.143.22

### VPS Scripts (Run as root)

**03_initial_server_setup.sh**
- Updates system packages
- Installs Docker and UFW
- Run on: VPS as root
- Usage: `ssh root@VPS_IP < 03_initial_server_setup.sh`

**04_create_deployment_user.sh**
- Creates `habita` user with limited sudo
- Adds to docker group
- Creates `/opt/habita` directory
- Run on: VPS as root
- Usage: `ssh root@VPS_IP < 04_create_deployment_user.sh`

**05_move_ssh_keys.sh**
- Moves SSH keys from root to habita user
- Run on: VPS as root
- Usage: `ssh root@VPS_IP < 05_move_ssh_keys.sh`
- ⚠️ Test SSH as habita before proceeding!

**06_secure_ssh_config.sh**
- Changes SSH port to 42069 (non-standard for security)
- Disables password authentication
- Disables root SSH login
- Run on: VPS as root
- Usage: `ssh root@VPS_IP < 06_secure_ssh_config.sh`
- ⚠️ Only run after verifying habita SSH works!

### VPS Scripts (Run as habita)

**07_configure_firewall.sh**
- Configures UFW firewall
- Opens ports 42069 (SSH), 80, 443
- Run on: VPS as habita
- Usage: `ssh -i ~/.ssh/habita -p 42069 habita@VPS_IP < 07_configure_firewall.sh`

### All-in-One Script

**complete_vps_setup.sh**
- Combines steps 3-7 into one script
- Run via Digital Ocean console as root
- Ideal for fresh VPS setup

## Recommended Workflow

### Option 1: Step-by-step (Recommended for learning)

```bash
# On local machine
bash scripts/01_generate_ssh_keys.sh

# Add public key to VPS (via Digital Ocean dashboard or script)
bash scripts/02_add_ssh_key_to_root.sh

# On VPS as root
ssh root@209.38.143.22 < scripts/03_initial_server_setup.sh
ssh root@209.38.143.22 < scripts/04_create_deployment_user.sh
ssh root@209.38.143.22 < scripts/05_move_ssh_keys.sh

# Test SSH as habita
ssh -i ~/.ssh/habita habita@209.38.143.22

# Back on VPS as root (only if test above works!)
# NOTE: This changes SSH port to 42069
ssh root@209.38.143.22 < scripts/06_secure_ssh_config.sh

# On VPS as habita (note: use port 42069 after running 06_secure_ssh_config.sh)
ssh -i ~/.ssh/habita -p 42069 habita@209.38.143.22 < scripts/07_configure_firewall.sh
```

### Option 2: All-in-one (Quick setup)

Via Digital Ocean console as root:
```bash
curl -fsSL https://raw.githubusercontent.com/niconiahi/habita/main/scripts/complete_vps_setup.sh | bash
```

Or copy/paste the contents of `complete_vps_setup.sh` into the console.

## Important Notes

1. **Always test SSH as habita** after moving keys (step 5) and before disabling root (step 6)
2. Keep a console session open when disabling root SSH
3. Scripts are idempotent - safe to run multiple times
4. Edit VPS_IP in scripts if using different IP

## Security

These scripts implement:
- SSH on non-standard port 42069 (reduces bot scanning)
- SSH key-only authentication (no passwords)
- Root SSH access disabled
- Non-root deployment user with limited sudo
- UFW firewall (ports 42069, 80, 443 only)
- Principle of least privilege

## Documentation

See [`../docs/setup_production_environment.md`](../docs/setup_production_environment.md) for the full production setup guide.
