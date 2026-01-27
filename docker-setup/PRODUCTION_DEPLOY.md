# Production Deployment Guide

## 🚀 Production Build Setup Complete!

Your Docker setup has been converted to production mode with the following improvements:

### ✅ What Changed:

#### Backend:
- ✅ Multi-stage build for smaller image size
- ✅ Production dependencies only (`npm ci --only=production`)
- ✅ Non-root user (nodejs:nodejs) for security
- ✅ Health check endpoint (`/api/auth/health`)
- ✅ Proper signal handling with dumb-init
- ✅ Persistent uploads directory with proper permissions

#### Frontend:
- ✅ Vite production build (`npm run build`)
- ✅ Nginx web server (lightweight, fast)
- ✅ Static file caching (1 year for assets)
- ✅ Gzip compression enabled
- ✅ Security headers configured
- ✅ React Router support (SPA routing)
- ✅ Health check endpoint (`/health`)
- ✅ Non-root user for security

#### Docker Compose:
- ✅ Production environment variables
- ✅ Service health checks with dependencies
- ✅ Persistent volumes for data
- ✅ Single network for all services
- ✅ Automatic restart policies

---

## 📦 Deployment Steps

### 1. Stop Current Development Containers

```bash
cd docker-setup
docker-compose down
```

### 2. Build Production Images

```bash
# Build without cache for fresh build
docker-compose build --no-cache

# Or build with cache (faster)
docker-compose build
```

### 3. Start Production Containers

```bash
docker-compose up -d
```

### 4. Verify Services

```bash
# Check container status
docker-compose ps

# Check backend health
curl http://localhost:3000/api/auth/health

# Check frontend health
curl http://localhost/health

# View logs
docker-compose logs -f
```

### 5. Monitor Logs

```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f backend
docker-compose logs -f frontend
docker-compose logs -f mongo
```

---

## 🔧 Environment Configuration

### Backend Environment Variables

Edit `backend/.env.local` or add to docker-compose.yml:

```env
NODE_ENV=production
PORT=3000
MONGODB_URI=mongodb://admin:admin123@mongo:27017/student_info_tmc?authSource=admin
JWT_SECRET=your-super-secret-jwt-key-change-this
JWT_EXPIRES_IN=7d
COOKIE_EXPIRES_DAYS=7
```

**⚠️ IMPORTANT:** Change default passwords and secrets in production!

---

## 🌐 Cloudflare Tunnel Configuration

### Update Your Cloudflare Tunnel Config

Since the ports changed:
- Frontend: `5173` → `80`
- Backend: `3000` → `3000` (same)

#### Option 1: Update Tunnel Config

```yaml
tunnel: your-tunnel-id
credentials-file: /path/to/credentials.json

ingress:
  # Frontend (now on port 80)
  - hostname: web.markemilcajesdacoylo.online
    service: http://localhost:80
  
  # Backend (still on port 3000)
  - hostname: back.markemilcajesdacoylo.online
    service: http://localhost:3000
  
  - service: http_status:404
```

#### Option 2: Keep Port 5173 (Map 5173→80)

Update docker-compose.yml frontend ports:
```yaml
ports:
  - "5173:80"  # Map external 5173 to internal 80
```

---

## 🔍 Health Checks

### Backend Health Check
```bash
curl http://localhost:3000/api/auth/health
# Response: {"status":"ok","timestamp":"2026-01-26T..."}
```

### Frontend Health Check
```bash
curl http://localhost/health
# Response: healthy
```

### MongoDB Health Check
```bash
docker exec mongo_db mongosh --eval "db.adminCommand('ping')"
```

---

## 📊 Production Optimization Features

### Frontend (Nginx):
- **Gzip Compression**: Reduces file sizes by ~70%
- **Static Asset Caching**: 1-year cache for JS/CSS/images
- **Security Headers**: XSS protection, frame options, etc.
- **SPA Routing**: All routes serve index.html (React Router)

### Backend:
- **No Dev Dependencies**: Smaller image, faster startup
- **Non-root User**: Security best practice
- **Process Manager**: dumb-init for proper signal handling
- **Health Monitoring**: Docker auto-restart on failure

### Database:
- **Persistent Volume**: Data survives container restart
- **Health Checks**: Auto-restart on failure
- **Optimized Settings**: Production-ready MongoDB config

---

## 🛠️ Maintenance Commands

### Restart Services
```bash
# All services
docker-compose restart

# Specific service
docker-compose restart backend
docker-compose restart frontend
```

### Update Code and Rebuild
```bash
# Pull latest code
git pull

# Rebuild and restart
docker-compose up -d --build
```

### View Resource Usage
```bash
docker stats
```

### Clean Up Old Images
```bash
# Remove unused images
docker image prune -a

# Remove unused volumes
docker volume prune
```

### Backup Database
```bash
# Create backup
docker exec mongo_db mongodump --out /data/backup

# Copy backup to host
docker cp mongo_db:/data/backup ./backup_$(date +%Y%m%d)
```

---

## 🔒 Security Checklist

- [ ] Change MongoDB admin password
- [ ] Update JWT_SECRET in .env.local
- [ ] Enable firewall (only allow 80, 443, SSH)
- [ ] Set up SSL certificates (Let's Encrypt via Cloudflare)
- [ ] Restrict MongoDB port (remove public exposure if not needed)
- [ ] Enable Docker logging limits
- [ ] Regular security updates: `docker-compose pull && docker-compose up -d`

---

## 📈 Performance Tips

### 1. Enable Docker Logging Limits
Add to docker-compose.yml for each service:
```yaml
logging:
  driver: "json-file"
  options:
    max-size: "10m"
    max-file: "3"
```

### 2. Limit Container Resources
```yaml
deploy:
  resources:
    limits:
      cpus: '1.0'
      memory: 1G
    reservations:
      cpus: '0.5'
      memory: 512M
```

### 3. Monitor Performance
```bash
docker stats --no-stream
```

---

## ❌ Troubleshooting

### Frontend Not Loading
```bash
# Check if nginx is running
docker exec student-info-frontend ps aux | grep nginx

# Check nginx logs
docker logs student-info-frontend

# Verify build files exist
docker exec student-info-frontend ls -la /usr/share/nginx/html
```

### Backend Crashes
```bash
# Check logs
docker logs student-info-backend --tail 100

# Check if port is available
netstat -tuln | grep 3000

# Restart backend
docker-compose restart backend
```

### Cannot Connect to MongoDB
```bash
# Check MongoDB logs
docker logs mongo_db --tail 50

# Test connection
docker exec mongo_db mongosh --eval "db.version()"
```

### Chunked Upload Issues
```bash
# Check uploads directory permissions
docker exec student-info-backend ls -la /app/public/uploads

# Check chunks directory
docker exec student-info-backend ls -la /app/public/uploads/chunks
```

---

## 🎯 Next Steps After Deployment

1. ✅ Test chunked upload with large files (>5MB)
2. ✅ Update Cloudflare Tunnel config for new ports
3. ✅ Monitor logs for any errors
4. ✅ Set up automated backups
5. ✅ Configure log rotation
6. ✅ Set up monitoring/alerts

---

## 📞 Support

If you encounter issues:
1. Check logs: `docker-compose logs -f`
2. Verify health checks: `curl http://localhost:3000/api/auth/health`
3. Check container status: `docker-compose ps`
4. Review this guide's troubleshooting section

---

## 🎉 Success Indicators

Your production deployment is successful when:
- ✅ All containers show "Up (healthy)"
- ✅ Health endpoints return 200 OK
- ✅ Frontend loads on port 80
- ✅ Backend API responds on port 3000
- ✅ File uploads work (including chunked uploads)
- ✅ No errors in logs

**Congratulations! Your app is now running in production mode! 🚀**
