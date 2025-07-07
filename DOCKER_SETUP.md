# Docker Setup Guide for MITRE Shield

This guide will help you set up the complete MITRE Shield application using Docker with all existing data preserved.

## 🚀 Quick Start

1. **Prerequisites**
   - Docker installed on your system
   - Docker Compose installed

2. **Clone and Start**
   ```bash
   git clone <your-repo-url>
   cd MitreShiled
   docker-compose up -d
   ```

3. **Access the Application**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:3001
   - MongoDB: localhost:27017

## 📁 Project Structure

```
MitreShiled/
├── docker-compose.yml          # Main orchestration file
├── Dockerfile                  # Frontend container
├── nginx.conf                  # Nginx configuration
├── backend-example/
│   ├── Dockerfile             # Backend container
│   └── ...
├── database-backup/           # Exported database data
│   └── mitre-shield/
│       ├── mitretechniques.bson
│       ├── detectionrules.bson
│       ├── users.bson
│       └── futurerules.bson
└── scripts/
    └── restore-db.sh          # Database restoration script
```

## 🐳 Services Overview

### MongoDB (Database)
- **Container**: `mitre-shield-mongodb`
- **Port**: 27017
- **Data**: Automatically restores from backup on first run
- **Volume**: `mongodb_data` for data persistence

### Backend (API Server)
- **Container**: `mitre-shield-backend`
- **Port**: 3001 (mapped from internal 3000)
- **Environment**: Production mode
- **Health Check**: `/api/health` endpoint

### Frontend (React App)
- **Container**: `mitre-shield-frontend`
- **Port**: 3000
- **Web Server**: Nginx with API proxy

## 🔧 Commands

### Start the application
```bash
docker-compose up -d
```

### View logs
```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f backend
docker-compose logs -f frontend
docker-compose logs -f mongodb
```

### Stop the application
```bash
docker-compose down
```

### Rebuild and restart
```bash
docker-compose down
docker-compose up -d --build
```

### Database operations
```bash
# Access MongoDB shell
docker exec -it mitre-shield-mongodb mongosh mitre-shield

# Backup database
docker exec mitre-shield-mongodb mongodump --db mitre-shield --out /tmp/backup
docker cp mitre-shield-mongodb:/tmp/backup ./new-backup

# Restore database (if needed)
docker exec -i mitre-shield-mongodb mongorestore --db mitre-shield --drop < backup-file
```

## 📊 Data Preservation

Your existing data is automatically preserved:
- **2,339 MITRE techniques** ✅
- **12 detection rules** ✅
- **1 user account** ✅
- **All file uploads** ✅ (via volume mapping)

## 🔒 Security Notes

- JWT secrets are configured in docker-compose.yml
- Database is accessible only within the Docker network
- Frontend uses Nginx for production-ready serving
- API requests are proxied through Nginx

## 🛠 Troubleshooting

### Service won't start
```bash
# Check service status
docker-compose ps

# View detailed logs
docker-compose logs [service-name]
```

### Database connection issues
```bash
# Check MongoDB logs
docker-compose logs mongodb

# Verify database restoration
docker exec -it mitre-shield-mongodb mongosh mitre-shield --eval "db.mitretechniques.countDocuments()"
```

### Port conflicts
If ports are already in use, modify the ports in `docker-compose.yml`:
```yaml
ports:
  - "3002:3000"  # Change 3000 to 3002
```

### Reset everything
```bash
# Stop and remove all containers, networks, and volumes
docker-compose down -v
docker-compose up -d
```

## 🔄 Updates and Maintenance

### Update application code
```bash
git pull
docker-compose down
docker-compose up -d --build
```

### Backup current data
```bash
# Create new backup
docker exec mitre-shield-mongodb mongodump --db mitre-shield --out /tmp/backup-$(date +%Y%m%d)
docker cp mitre-shield-mongodb:/tmp/backup-$(date +%Y%m%d) ./database-backup-$(date +%Y%m%d)
```

## 🎯 Team Collaboration

Each team member can:
1. Clone the repository
2. Run `docker-compose up -d`
3. Access the same application with identical data
4. No local setup required (Node.js, MongoDB, etc.)

## 📧 Support

If you encounter issues:
1. Check the troubleshooting section
2. Review service logs
3. Verify Docker and Docker Compose versions
4. Contact the development team

---

**Note**: This setup preserves all your existing data while providing a consistent environment for your entire team. 