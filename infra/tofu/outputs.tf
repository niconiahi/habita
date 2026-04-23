output "server_ip" {
  description = "Production server public IP"
  value       = hcloud_server.habita.ipv4_address
}

output "server_status" {
  description = "Server status"
  value       = hcloud_server.habita.status
}
