# Habita Production Infrastructure
#
# Manages: Hetzner VPS, Cloudflare DNS, R2 backup bucket
# Usage: tofu plan / tofu apply

# --- Hetzner ---

resource "hcloud_ssh_key" "deploy" {
  name       = "habita-deploy"
  public_key = var.ssh_public_key
}

resource "hcloud_server" "habita" {
  name        = "habita-prod"
  server_type = var.server_type
  image       = "ubuntu-24.04"
  location    = var.server_location
  ssh_keys    = [hcloud_ssh_key.deploy.id]

  labels = {
    project     = "habita"
    environment = "production"
  }
}

resource "hcloud_firewall" "habita" {
  name = "habita-prod"

  rule {
    direction = "in"
    protocol  = "tcp"
    port      = "22"
    source_ips = ["0.0.0.0/0", "::/0"]
  }

  rule {
    direction = "in"
    protocol  = "tcp"
    port      = "80"
    source_ips = ["0.0.0.0/0", "::/0"]
  }

  rule {
    direction = "in"
    protocol  = "tcp"
    port      = "443"
    source_ips = ["0.0.0.0/0", "::/0"]
  }

  rule {
    direction = "in"
    protocol  = "udp"
    port      = "443"
    source_ips = ["0.0.0.0/0", "::/0"]
  }
}

resource "hcloud_firewall_attachment" "habita" {
  firewall_id = hcloud_firewall.habita.id
  server_ids  = [hcloud_server.habita.id]
}

# --- Cloudflare DNS ---

resource "cloudflare_record" "habita" {
  zone_id = var.cloudflare_zone_id
  name    = "habita.rent"
  type    = "A"
  content = hcloud_server.habita.ipv4_address
  proxied = false
}

resource "cloudflare_record" "www" {
  zone_id = var.cloudflare_zone_id
  name    = "www"
  type    = "A"
  content = hcloud_server.habita.ipv4_address
  proxied = false
}

resource "cloudflare_record" "status" {
  zone_id = var.cloudflare_zone_id
  name    = "status"
  type    = "A"
  content = hcloud_server.habita.ipv4_address
  proxied = false
}

# --- Cloudflare R2 ---

resource "cloudflare_r2_bucket" "backups" {
  account_id = var.cloudflare_account_id
  name       = "habita-backup"
  location   = "EEUR"
}
