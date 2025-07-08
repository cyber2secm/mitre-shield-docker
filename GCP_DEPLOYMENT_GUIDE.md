# 🚀 GCP Deployment Guide - MITRE Shield

## Overview
Deploy your MITRE Shield application to Google Cloud Platform using Cloud Run and Cloud SQL.

## Architecture
- **Frontend**: Cloud Run (Static files with Nginx)
- **Backend**: Cloud Run (Node.js API)
- **Database**: Cloud SQL (MongoDB)

---

## 🔧 Prerequisites

1. **Google Cloud Account**: Sign up at https://cloud.google.com
2. **Enable APIs**: Cloud Run API, Cloud SQL API, Cloud Build API
3. **Enable Billing**: Required for Cloud Run and Cloud SQL

---

## 📦 Step 1: Build and Push Images

### Build Backend Image
```bash
cd backend-example
docker build -f Dockerfile.cloudrun -t gcr.io/[PROJECT_ID]/mitre-shield-backend:latest .
docker push gcr.io/[PROJECT_ID]/mitre-shield-backend:latest
```

### Build Frontend Image
```bash
cd ..
docker build -f Dockerfile.frontend -t gcr.io/[PROJECT_ID]/mitre-shield-frontend:latest .
docker push gcr.io/[PROJECT_ID]/mitre-shield-frontend:latest
```

---

## 🗄️ Step 2: Create Cloud SQL Database

### Via GCP Console:
1. Go to **Cloud SQL** → **Create Instance**
2. Choose **MySQL** (closest to MongoDB support)
3. **Instance ID**: `mitre-shield-db`
4. **Password**: Set strong password
5. **Region**: Choose closest to your users
6. **Machine Type**: `db-f1-micro` (for testing)
7. Click **Create**

### Alternative: Use Cloud Firestore (NoSQL)
1. Go to **Firestore** → **Create Database**
2. Choose **Firestore Native Mode**
3. **Location**: Choose closest region
4. **Security Rules**: Start in test mode

---

## 🚀 Step 3: Deploy Backend to Cloud Run

### Via GCP Console:
1. Go to **Cloud Run** → **Create Service**
2. **Container Image URL**: `gcr.io/[PROJECT_ID]/mitre-shield-backend:latest`
3. **Service Name**: `mitre-shield-backend`
4. **Region**: Same as your database
5. **Authentication**: Allow unauthenticated invocations
6. **Advanced Settings**:
   - **Port**: 8080
   - **Memory**: 512 MiB
   - **CPU**: 1
   - **Environment Variables**:
     - `NODE_ENV`: production
     - `PORT`: 8080
     - `DATABASE_URL`: [Your Cloud SQL connection string]
     - `JWT_SECRET`: [Generate a secure secret]

7. Click **Create**

---

## 🌐 Step 4: Deploy Frontend to Cloud Run

### Via GCP Console:
1. Go to **Cloud Run** → **Create Service**
2. **Container Image URL**: `gcr.io/[PROJECT_ID]/mitre-shield-frontend:latest`
3. **Service Name**: `mitre-shield-frontend`
4. **Region**: Same as backend
5. **Authentication**: Allow unauthenticated invocations
6. **Advanced Settings**:
   - **Port**: 8080
   - **Memory**: 256 MiB
   - **CPU**: 0.5

7. **After deployment**: Update nginx.conf with your backend URL
8. Click **Create**

---

## 🔗 Step 5: Configure Frontend-Backend Communication

### Update nginx.conf:
1. Replace `BACKEND_SERVICE_URL` with your backend Cloud Run URL
2. Rebuild and redeploy frontend:
```bash
docker build -f Dockerfile.frontend -t gcr.io/[PROJECT_ID]/mitre-shield-frontend:v2 .
docker push gcr.io/[PROJECT_ID]/mitre-shield-frontend:v2
```

3. Update Cloud Run service with new image

---

## 💾 Step 6: Import Database Data

### Option A: Manual Upload
1. Convert your MongoDB backup to SQL/Firestore format
2. Import via Cloud SQL/Firestore console

### Option B: API Upload
1. Use your backend API to upload the data
2. Create a one-time import script

---

## 🔐 Step 7: Security & Production Setup

### Enable HTTPS:
- Cloud Run automatically provides SSL certificates

### Set up IAM:
1. **Service Account**: Create for Cloud Run services
2. **Permissions**: Grant minimal required permissions
3. **Secrets**: Use Google Secret Manager for sensitive data

### Configure Domain:
1. **Cloud Run** → **Manage Custom Domains**
2. Add your custom domain
3. Update DNS records

---

## 📊 Step 8: Monitor & Scale

### Monitoring:
- **Cloud Run Metrics**: CPU, Memory, Request count
- **Cloud SQL Monitoring**: Connection count, CPU usage
- **Cloud Logging**: Application logs

### Auto-scaling:
- Cloud Run automatically scales based on traffic
- Configure max instances in Cloud Run settings

---

## 🎯 Final URLs

After deployment, your application will be available at:
- **Frontend**: `https://mitre-shield-frontend-[hash]-uc.a.run.app`
- **Backend**: `https://mitre-shield-backend-[hash]-uc.a.run.app`

---

## 💡 Cost Optimization

### Free Tier Benefits:
- Cloud Run: 2 million requests/month
- Cloud SQL: 1 instance (f1-micro)
- Cloud Build: 120 build minutes/day

### Production Costs:
- **Cloud Run**: ~$0.40 per 1M requests
- **Cloud SQL**: ~$10-50/month depending on size
- **Data Transfer**: Minimal for most applications

---

## 🆘 Troubleshooting

### Common Issues:
1. **Build Failures**: Check Dockerfile syntax
2. **Database Connection**: Verify Cloud SQL credentials
3. **CORS Errors**: Configure backend CORS settings
4. **Port Issues**: Ensure services use port 8080

### Logs:
- **Cloud Run Logs**: View in GCP Console
- **Cloud SQL Logs**: Check connection issues
- **Cloud Build Logs**: Debug build problems

---

## 📞 Support

For additional help:
- **GCP Documentation**: https://cloud.google.com/docs
- **Cloud Run Guide**: https://cloud.google.com/run/docs
- **Cloud SQL Guide**: https://cloud.google.com/sql/docs 