#!/bin/bash
# scripts/04_create_deployment_user.sh
# Description: Create deployment user with limited privileges
# Run on: VPS as root

set -e

DEPLOY_USER="habita"
DEPLOY_DIR="/opt/habita"

echo "=== Creating User: $DEPLOY_USER ==="
if id "$DEPLOY_USER" &>/dev/null; then
    echo "User $DEPLOY_USER already exists"
else
    useradd -m -s /bin/bash "$DEPLOY_USER"
    echo "✅ User $DEPLOY_USER created"
fi

echo ""
echo "=== Adding $DEPLOY_USER to Docker Group ==="
usermod -aG docker "$DEPLOY_USER"

echo ""
echo "=== Configuring Limited Sudo Access ==="
cat > /etc/sudoers.d/$DEPLOY_USER << 'EOF'
# Allow habita to run docker and systemctl without password
habita ALL=(ALL) NOPASSWD: /usr/bin/docker, /usr/bin/systemctl
EOF

chmod 0440 /etc/sudoers.d/$DEPLOY_USER
visudo -c

echo ""
echo "=== Creating Deployment Directory ==="
mkdir -p "$DEPLOY_DIR"
chown -R $DEPLOY_USER:$DEPLOY_USER "$DEPLOY_DIR"

echo ""
echo "=== Verification ==="
id "$DEPLOY_USER"
ls -ld "$DEPLOY_DIR"

echo ""
echo "✅ Deployment user configured"
echo "   User: $DEPLOY_USER"
echo "   Sudo: docker, systemctl only"
echo "   Deploy directory: $DEPLOY_DIR"
