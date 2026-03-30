#!/bin/bash
# scripts/01_generate_ssh_keys.sh
# Description: Generate SSH key pair for VPS access
# Run on: Local machine

set -e

SSH_KEY_PATH="$HOME/.ssh/habita"

echo "=== Generating SSH Key Pair ==="
ssh-keygen -t ed25519 -f "$SSH_KEY_PATH" -N ""

echo ""
echo "=== Setting Correct Permissions ==="
chmod 600 "$SSH_KEY_PATH"
chmod 644 "$SSH_KEY_PATH.pub"

echo ""
echo "=== Your Public Key (add this to VPS) ==="
cat "$SSH_KEY_PATH.pub"

echo ""
echo "✅ SSH key pair created at: $SSH_KEY_PATH"
echo "📋 Copy the public key above and add it to your VPS"
