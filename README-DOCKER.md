# MITRE Shield Docker Setup

This repository contains the complete Docker configuration for the MITRE Shield ATT&CK Rule Manager, enabling easy deployment for teams with all existing data preserved.

## 🚀 Quick Start

1. **Clone this repository**
   ```bash
   git clone https://github.com/cyber2secm/mitre-shield-docker.git
   cd mitre-shield-docker
   ```

2. **Start the application**
   ```bash
   docker-compose up -d
   ```

3. **Access the application**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:3001
   - MongoDB: localhost:27017

## 📁 Repository Structure

```
mitre-shield-docker/
├── docker-compose.yml          # Main orchestration file
├── Dockerfile                  # Frontend container
├── nginx.conf                  # Nginx configuration
├── backend-example/
│   ├── Dockerfile             # Backend container
│   └── .dockerignore          # Backend build exclusions
├── database-backup/           # Exported database data (2,339 techniques)
│   └── mitre-shield/
│       ├── mitretechniques.bson
│       ├── detectionrules.bson
│       ├── users.bson
│       └── futurerules.bson
├── scripts/
│   └── restore-db.sh          # Database restoration script
├── .dockerignore              # Frontend build exclusions
└── DOCKER_SETUP.md           # Detailed setup guide
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

## 📊 Data Preservation

Your data is automatically preserved:
- **2,339 MITRE techniques** ✅
- **12 detection rules** ✅
- **1 user account** ✅
- **All file uploads** ✅ (via volume mapping)

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

# Verify data restoration
docker exec -it mitre-shield-mongodb mongosh mitre-shield --eval "db.mitretechniques.countDocuments()"
```

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

## 🔒 Security Notes

- JWT secrets are configured in docker-compose.yml
- Database is accessible only within the Docker network
- Frontend uses Nginx for production-ready serving
- API requests are proxied through Nginx

## 🎯 Team Collaboration

Each team member can:
1. Clone this repository
2. Run `docker-compose up -d`
3. Access the same application with identical data
4. No local setup required (Node.js, MongoDB, etc.)

## 📋 System Requirements

- Docker 20.10+
- Docker Compose 2.0+
- 4GB RAM minimum
- 10GB disk space

## 🐛 Known Issues

- MongoDB 7.0 is required to match the existing database compatibility
- First startup may take 2-3 minutes while database restores
- Windows users may need to adjust line endings for shell scripts

## 📧 Support

If you encounter issues:
1. Check the troubleshooting section above
2. Review service logs using `docker-compose logs`
3. Verify Docker and Docker Compose versions
4. Contact the development team

## 📈 Application Features

The MITRE Shield application includes:
- **2,339 MITRE ATT&CK techniques** with full descriptions
- **Detection rule management** with status tracking
- **Analytics dashboard** with coverage metrics
- **Platform support** for Windows, macOS, Linux, Cloud, Containers
- **Team collaboration** features
- **Real-time sync** with MITRE ATT&CK framework

---

**Note**: This Docker setup preserves all existing data while providing a consistent environment for your entire team. No data migration required! 