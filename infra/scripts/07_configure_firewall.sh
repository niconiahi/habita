#!/bin/bash
# scripts/07_configure_firewall.sh
# Description: Configure UFW firewall rules
# Run on: VPS as habita (with sudo)

set -e

echo "=== Configuring UFW Firewall ==="

# Default policies
sudo ufw default deny incoming
sudo ufw default allow outgoing

echo ""
echo "=== Adding Firewall Rules ==="

# Allow SSH (port 42069) - CRITICAL: must allow before enabling!
sudo ufw allow 42069/tcp comment 'SSH'

# Allow HTTP and HTTPS
sudo ufw allow 80/tcp comment 'HTTP'
sudo ufw allow 443/tcp comment 'HTTPS'
sudo ufw allow 443/udp comment 'HTTP/3'

echo ""
echo "=== Rules to be Applied ==="
sudo ufw show added

echo ""
echo "=== Enabling UFW ==="
echo "y" | sudo ufw enable

echo ""
echo "=== Firewall Status ==="
sudo ufw status verbose

echo ""
echo "✅ Firewall configured and active"
echo "   ✅ Port 42069 (SSH): OPEN"
echo "   ✅ Port 80 (HTTP): OPEN"
echo "   ✅ Port 443 (HTTPS): OPEN"
echo "   ❌ All other ports: BLOCKED"
