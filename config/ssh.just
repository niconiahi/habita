# Remote server access via SSH

host := "habita"

# SSH into the server, or run a command remotely (e.g., just ssh "docker ps")
[no-cd]
run *args:
  #!/usr/bin/env bash
  if [[ -z "{{args}}" ]]; then
    ssh -t {{host}} "cd /opt/habita && exec \$SHELL -l"
  else
    ssh {{host}} "cd /opt/habita && {{args}}"
  fi
