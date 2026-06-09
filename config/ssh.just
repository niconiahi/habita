# Remote server access via SSH

host := "habita"

# SSH into the server, or run a command remotely (e.g., just ssh run "docker ps")
[no-cd]
run *args:
  {{ if args == '' { 'ssh -t ' + host + ' "cd /opt/habita && exec $SHELL -l"' } else { 'ssh ' + host + ' ' + quote('cd /opt/habita && ' + args) } }}
