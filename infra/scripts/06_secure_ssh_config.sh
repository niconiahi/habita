#!/bin/bash
# scripts/06_secure_ssh_config.sh
# Description: Harden SSH configuration
# Run on: VPS as root
# IMPORTANT: Only run after verifying habita user SSH works!

set -e

SSH_CONFIG="/etc/ssh/sshd_config"

echo "=== Backing Up SSH Config ==="
cp "$SSH_CONFIG" "${SSH_CONFIG}.backup.$(date +%Y%m%d)"

echo ""
echo "=== Configuring SSH Security ==="

# Disable password authentication
sed -i 's/^#\?PasswordAuthentication.*/PasswordAuthentication no/' "$SSH_CONFIG"

# Disable root login (use habita user instead)
sed -i 's/^#\?PermitRootLogin.*/PermitRootLogin no/' "$SSH_CONFIG"

# Ensure public key authentication is enabled
sed -i 's/^#\?PubkeyAuthentication.*/PubkeyAuthentication yes/' "$SSH_CONFIG"

echo ""
echo "=== Verifying SSH Config Syntax ==="
sshd -t

echo ""
echo "=== Current SSH Security Settings ==="
grep -E "^(PasswordAuthentication|PermitRootLogin|PubkeyAuthentication)" "$SSH_CONFIG"

echo ""
echo "=== Restarting SSH Service ==="
systemctl restart sshd

echo ""
echo "✅ SSH security configured"
echo "   ❌ Password authentication: DISABLED"
echo "   ❌ Root SSH login: DISABLED"
echo "   ✅ SSH key authentication: ENABLED"
echo ""
echo "⚠️  IMPORTANT: Keep your current SSH session open!"
echo "⚠️  Test SSH as habita in a new terminal before closing this session!"
