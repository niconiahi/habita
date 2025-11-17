#!/bin/bash
# scripts/complete_vps_setup.sh
# Description: Complete VPS setup script (run via Digital Ocean console as root)
# This combines all steps 3-7 into one script

set -e

DEPLOY_USER="habita"
DEPLOY_DIR="/opt/habita"
VPS_IP="209.38.143.22"

echo "=========================================="
echo "Habita VPS Security Setup"
echo "=========================================="
echo ""

# Step 1: System updates and package installation
echo "=== Step 1/6: Updating System ==="
apt-get update -qq
apt-get upgrade -y
apt-get install -y curl git ufw make

# Step 2: Install Docker
echo ""
echo "=== Step 2/6: Installing Docker ==="
if ! command -v docker &> /dev/null; then
    curl -fsSL https://get.docker.com | sh
    systemctl enable docker
    systemctl start docker
fi
docker --version
docker compose version

# Step 3: Create deployment user
echo ""
echo "=== Step 3/6: Creating Deployment User ==="
if ! id "$DEPLOY_USER" &>/dev/null; then
    useradd -m -s /bin/bash "$DEPLOY_USER"
fi
usermod -aG docker "$DEPLOY_USER"

# Configure limited sudo
cat > /etc/sudoers.d/$DEPLOY_USER << 'EOF'
habita ALL=(ALL) NOPASSWD: /usr/bin/docker, /usr/bin/systemctl
EOF
chmod 0440 /etc/sudoers.d/$DEPLOY_USER
visudo -c

# Create deployment directory
mkdir -p "$DEPLOY_DIR"
chown -R $DEPLOY_USER:$DEPLOY_USER "$DEPLOY_DIR"

# Step 4: Move SSH keys
echo ""
echo "=== Step 4/6: Configuring SSH Keys ==="
mkdir -p /home/$DEPLOY_USER/.ssh
mv /root/.ssh/authorized_keys /home/$DEPLOY_USER/.ssh/authorized_keys 2>/dev/null || true
chown -R $DEPLOY_USER:$DEPLOY_USER /home/$DEPLOY_USER/.ssh
chmod 700 /home/$DEPLOY_USER/.ssh
chmod 600 /home/$DEPLOY_USER/.ssh/authorized_keys

# Step 5: Secure SSH configuration
echo ""
echo "=== Step 5/6: Hardening SSH ==="
cp /etc/ssh/sshd_config /etc/ssh/sshd_config.backup
sed -i 's/^#\?PasswordAuthentication.*/PasswordAuthentication no/' /etc/ssh/sshd_config
sed -i 's/^#\?PermitRootLogin.*/PermitRootLogin no/' /etc/ssh/sshd_config
sed -i 's/^#\?PubkeyAuthentication.*/PubkeyAuthentication yes/' /etc/ssh/sshd_config
systemctl restart sshd

# Step 6: Configure firewall
echo ""
echo "=== Step 6/6: Configuring Firewall ==="
ufw default deny incoming
ufw default allow outgoing
ufw allow 22/tcp comment 'SSH'
ufw allow 80/tcp comment 'HTTP'
ufw allow 443/tcp comment 'HTTPS'
ufw allow 443/udp comment 'HTTP/3'
echo "y" | ufw enable

echo ""
echo "=========================================="
echo "✅ VPS Setup Complete!"
echo "=========================================="
echo ""
echo "Configuration Summary:"
echo "  Deployment user: $DEPLOY_USER"
echo "  Deploy directory: $DEPLOY_DIR"
echo "  Docker: Installed"
echo "  Firewall: Active (ports 22, 80, 443)"
echo "  SSH: Key-only authentication"
echo "  Root SSH: Disabled"
echo ""
echo "Next steps:"
echo "  1. Test SSH: ssh -i ~/.ssh/habita $DEPLOY_USER@$VPS_IP"
echo "  2. Clone repo: cd $DEPLOY_DIR && git clone <repo-url> ."
echo "  3. Configure .env.production"
echo "  4. Deploy application"
echo ""
