# Remote server access via SSH

host := "habita"

# SSH into the server, or run a command remotely (e.g., just ssh "docker ps")
[no-cd]
run *args:
  #!/usr/bin/env bash
  if [[ -z "{{args}}" ]]; then
    ssh {{host}}
  else
    ssh {{host}} "{{args}}"
  fi
