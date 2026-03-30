#!/bin/bash
# scripts/03_initial_server_setup.sh
# Description: Initial server configuration and package installation
# Run on: VPS as root

set -e

echo "=== Updating System Packages ==="
apt-get update
apt-get upgrade -y

echo ""
echo "=== Installing Essential Packages ==="
apt-get install -y curl git ufw make

echo ""
echo "=== Installing Docker ==="
if ! command -v docker &> /dev/null; then
    curl -fsSL https://get.docker.com | sh
    systemctl enable docker
    systemctl start docker
    echo "✅ Docker installed"
else
    echo "✅ Docker already installed"
fi

echo ""
echo "=== Verifying Docker Installation ==="
docker --version
docker compose version

echo ""
echo "✅ Initial server setup complete"
