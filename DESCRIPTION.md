# PoC Home Lab de Redes (Fundamentals)
Kali (host) + QEMU/KVM (libvirt) + Ubuntu Server (VM) + red virtual NAT aislada

## Objetivo
Montar un laboratorio aislado, simple y repetible para practicar fundamentos de redes:
- IP/subred, gateway y rutas
- DNS (validación básica)
- Servicios mínimos (SSH y HTTP)
- Firewall básico (mínimo privilegio)
- Logging mínimo (evidencia, no “loggear todo”)

## Alcance
- 1 VM objetivo: Ubuntu Server
- 1 red virtual NAT del lab (libvirt)
- Validaciones rápidas con 1 comando por paso

## Paso 1: Preparar Kali para virtualización
### 1.1 Instalar QEMU/KVM + libvirt + herramientas
- Instalar paquetes: qemu-kvm, libvirt-daemon-system, libvirt-clients, virt-manager (o virt-install)
- Agregar tu usuario al grupo libvirt
- Cerrar sesión y volver a entrar

### 1.2 Comprobación (1 comando)
~~~bash
(lsmod | grep -q kvm && virsh -c qemu:///system list --all >/dev/null 2>&1 && echo "OK: KVM+libvirt") || echo "ERROR: KVM/libvirt"
~~~

## Paso 2: Configurar la red virtual aislada del laboratorio
### 2.1 Usar una red NAT de libvirt (recomendado)
- La VM queda en un segmento privado
- Evita exponer la VM directamente en la LAN real
- Permite conectividad controlada si se necesita (updates/repos)

### 2.2 Comprobación (1 comando)
~~~bash
virsh net-list --all
~~~

## Paso 3: Crear la VM Ubuntu Server
### 3.1 Descargar ISO de Ubuntu Server
- Descargar ISO oficial y guardarlo localmente (ej: ~/isos/ubuntu-server.iso)

### 3.2 Crear la VM conectada a la red NAT del lab
- Recursos sugeridos: 2 vCPU, 2–4 GB RAM, 20–40 GB disco qcow2
- Crear desde virt-manager (GUI) o virt-install (CLI)
- Asegurar que la NIC esté conectada a la red NAT del lab

### 3.3 Comprobación (1 comando)
~~~bash
virsh list --all
~~~

## Paso 4: Instalar Ubuntu Server y habilitar administración
### 4.1 Instalación
- Instalar Ubuntu Server dentro de la VM
- Durante la instalación, habilitar OpenSSH Server (administración remota)

### 4.2 Obtener la IP de la VM
- Identificar la IP asignada (para operar y validar desde Kali)

### 4.3 Comprobación (1 comando)
~~~bash
virsh domifaddr <NOMBRE_VM>
~~~

## Paso 5: Validar fundamentos de red dentro de Ubuntu
### 5.1 Revisar IP, rutas y DNS
- Confirmar IP asignada
- Confirmar ruta por defecto (gateway)
- Confirmar DNS (resolución)

### 5.2 Comprobación (1 comando)
~~~bash
ip -br a; echo "----"; ip r; echo "----"; (resolvectl status 2>/dev/null | sed -n '1,25p' || cat /etc/resolv.conf)
~~~

## Paso 6: Publicar servicios mínimos para pruebas
### 6.1 SSH (administración)
- Confirmar que el puerto 22 responde desde Kali

### 6.2 Comprobación (1 comando, desde Kali)
~~~bash
nc -vz <IP_UBUNTU> 22
~~~

### 6.3 HTTP básico (simular servicio)
- Instalar Nginx/Apache en Ubuntu y publicar una página simple (solo para PoC)

### 6.4 Comprobación (1 comando, desde Kali)
~~~bash
curl -I http://<IP_UBUNTU> 2>/dev/null | head -n 1
~~~

## Paso 7: Firewall básico (PoC)
### 7.1 Configurar UFW con mínimo privilegio
- Permitir solo lo necesario (por ejemplo 22/tcp y 80/tcp)
- Denegar el resto

### 7.2 Comprobación (1 comando, en Ubuntu)
~~~bash
sudo ufw status verbose
~~~

## Paso 8: Logging mínimo (solo evidencia)
### 8.1 Ver eventos recientes de SSH
- Validar trazabilidad para troubleshooting básico

### 8.2 Comprobación (1 comando, en Ubuntu)
~~~bash
sudo journalctl -u ssh --no-pager -n 20
~~~

### 8.3 Captura puntual de tráfico (breve)
- Evidenciar tráfico durante pruebas (SSH/HTTP) sin capturar “todo”

### 8.4 Comprobación (1 comando, en Ubuntu)
~~~bash
sudo timeout 8 tcpdump -ni any host <IP_KALI> and '(tcp port 22 or tcp port 80)'
~~~

## Paso 9: Validación final (demo rápida)
### 9.1 Verificar puertos expuestos desde Kali
- Confirmar que solo están abiertos los puertos esperados (22 y 80 si aplica)

### 9.2 Comprobación (1 comando, desde Kali)
~~~bash
nmap -Pn -sS -p 22,80,443 <IP_UBUNTU>
~~~

## Resultado esperado
- Ubuntu Server corriendo en QEMU/KVM dentro de una red NAT aislada del lab
- Fundamentos validados: IP/rutas/DNS, servicios mínimos (SSH/HTTP), firewall aplicado y evidencia mínima (logs/captura)
- PoC listo para explicar en una conversación o entrevista, sin volverse un proyecto enorme

