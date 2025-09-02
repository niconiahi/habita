# Building Docker Images in CI

## Overview

The typical CI/CD pipeline for containerized applications follows this flow:

1. **Test** (lint, typecheck, unit tests)
2. **Build Images** (Docker build + push to registry)
3. **Deploy** (Kamal pulls images and deploys)

## GitHub Actions Example

```yaml
name: Deploy
on:
  push:
    branches: [main]

jobs:
  build-and-deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      # Build and push images
      - name: Build middleware image
        run: |
          docker build -f Dockerfile.middleware -t ghcr.io/yourorg/memudo-middleware:${{ github.sha }} .
          docker push ghcr.io/yourorg/memudo-middleware:${{ github.sha }}
          
      - name: Build app image  
        run: |
          docker build -f Dockerfile.app -t ghcr.io/yourorg/memudo-app:${{ github.sha }} .
          docker push ghcr.io/yourorg/memudo-app:${{ github.sha }}
      
      # Deploy with Kamal
      - name: Deploy with Kamal
        run: |
          kamal deploy --version=${{ github.sha }}
```

## Kamal Configuration

```yaml
# config/deploy.yml  
image: ghcr.io/yourorg/memudo-app
```

## Manual Image Building Commands

### Local Development
```bash
# Build from Dockerfile
docker build -t your-image-name .

# Build with specific Dockerfile
docker build -f path/to/Dockerfile -t your-image-name .

# Build and tag for registry
docker build -t your-registry.com/your-image:latest .
```

### Push to Registry
```bash
# Tag for registry
docker tag your-image your-registry.com/your-image:latest

# Login and push
docker login your-registry.com
docker push your-registry.com/your-image:latest
```

### For This Project
```bash
# Build Go middleware
docker build -f Dockerfile.middleware -t memudo-middleware .

# Build Node app  
docker build -f Dockerfile.app -t memudo-app .

# Push both
docker push your-registry.com/memudo-middleware:latest
docker push your-registry.com/memudo-app:latest
```

## Benefits

- **Every commit** = new images built automatically
- **Kamal** pulls the right image version
- **Zero manual image building**
- **Separate services** can be deployed independently

## Common Registries

- Docker Hub
- GitHub Container Registry (ghcr.io)
- AWS ECR
- Google Container Registry (gcr.io)