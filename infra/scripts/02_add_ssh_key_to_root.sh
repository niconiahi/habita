#!/bin/bash
# scripts/02_add_ssh_key_to_root.sh
# Description: Copy SSH public key to VPS root user
# Run on: Local machine

set -e

VPS_IP="209.38.143.22"
SSH_KEY_PATH="$HOME/.ssh/habita"

echo "=== Adding SSH key to VPS root user ==="
ssh root@$VPS_IP "mkdir -p ~/.ssh && chmod 700 ~/.ssh"
cat "$SSH_KEY_PATH.pub" | ssh root@$VPS_IP "cat >> ~/.ssh/authorized_keys && chmod 600 ~/.ssh/authorized_keys"

echo ""
echo "=== Testing SSH Connection ==="
ssh -i "$SSH_KEY_PATH" root@$VPS_IP "echo 'SSH key authentication works!' && uname -a"

echo ""
echo "✅ SSH key added successfully"
