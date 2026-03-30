#!/bin/bash
# scripts/05_move_ssh_keys.sh
# Description: Move SSH keys from root to deployment user
# Run on: VPS as root

set -e

DEPLOY_USER="habita"

echo "=== Moving SSH Keys from Root to $DEPLOY_USER ==="

# Create .ssh directory for deployment user
mkdir -p /home/$DEPLOY_USER/.ssh
chmod 700 /home/$DEPLOY_USER/.ssh

# Move authorized_keys from root to deployment user
if [ -f /root/.ssh/authorized_keys ]; then
    mv /root/.ssh/authorized_keys /home/$DEPLOY_USER/.ssh/authorized_keys
    echo "✅ Moved authorized_keys"
else
    echo "⚠️  No authorized_keys found in /root/.ssh/"
fi

# Set proper ownership and permissions
chown -R $DEPLOY_USER:$DEPLOY_USER /home/$DEPLOY_USER/.ssh
chmod 600 /home/$DEPLOY_USER/.ssh/authorized_keys

echo ""
echo "=== Verification ==="
echo "Root .ssh directory:"
ls -la /root/.ssh/ || echo "Empty or doesn't exist"

echo ""
echo "Deployment user .ssh directory:"
ls -la /home/$DEPLOY_USER/.ssh/

echo ""
echo "✅ SSH keys moved successfully"
echo "⚠️  IMPORTANT: Test SSH as $DEPLOY_USER before disabling root!"
