# Docker Setup para sa Student Information System

## Mga Kailangan
- Docker
- Docker Compose

## Paano Gamitin

### I-start ang lahat ng services (Frontend at Backend)
```bash
cd docker-setup
docker-compose up
```

### I-start sa background
```bash
docker-compose up -d
```

### I-stop ang services
```bash
docker-compose down
```

### I-rebuild ang images (kung may changes sa dependencies)
```bash
docker-compose up --build
```

### Tignan ang logs
```bash
# Lahat ng services
docker-compose logs -f

# Backend lang
docker-compose logs -f backend

# Frontend lang
docker-compose logs -f frontend
```

## Ports
- **Frontend**: http://localhost:5173
- **Backend**: http://localhost:3000

## Development Mode
- Naka-setup na ang volume mounting, so any changes sa code mo ay automatic na makikita
- Hindi kailangan mag-rebuild ng container para sa code changes
- Gamit ang `npm run dev` para sa hot-reload

## Notes
- Magkaibang images ang frontend at backend
- Naka-configure na para sa development (hindi build)
- May automatic restart kung mag-crash ang services
