# 🚀 Complete MITRE Shield Deployment Guide

## 🎯 Full Stack Solution

This guide deploys the **complete MITRE Shield application** with:
- ✅ **React Frontend** - Modern dashboard UI
- ✅ **Node.js Backend** - REST API with full functionality  
- ✅ **MongoDB Database** - All 2,339 MITRE techniques auto-loaded
- ✅ **Auto-restore** - Database populated automatically on startup

---

## 📋 Deployment Options

### Option 1: Complete Solution (Recommended) 🟢
**File:** `Dockerfile.complete`
- **What you get:** Full application with backend + database
- **Best for:** Production use, team collaboration
- **Data:** All MITRE techniques automatically loaded

### Option 2: Frontend Only 🔶  
**File:** `Dockerfile.simple`
- **What you get:** Frontend dashboard only
- **Best for:** Quick preview, static hosting
- **Data:** Shows "Backend being configured" message

---

## 🚀 GCP Cloud Run Deployment

### Step 1: GCP Setup
1. **Create Project**: https://console.cloud.google.com
2. **Enable APIs**:
   - Cloud Run API
   - Cloud Build API
   - Artifact Registry API
3. **Enable Billing** (required for Cloud Run)

### Step 2: Deploy via Cloud Build

#### Method A: Direct from GitHub (Easiest)
1. Go to **Cloud Run** → **Create Service**
2. **Container Source**: "Continuously deploy from a repository"
3. **Set up with Cloud Build**:
   - **Repository**: Connect your GitHub repo
   - **Branch**: `main`
   - **Build Type**: `Dockerfile`
   - **Dockerfile location**: `/Dockerfile.complete`

#### Method B: Manual Build
1. Open **Cloud Shell** in GCP Console
2. Clone your repository:
```bash
git clone https://github.com/YOUR_USERNAME/mitre-shield-docker.git
cd mitre-shield-docker
```

3. Build and deploy:
```bash
# Build the image
gcloud builds submit --tag gcr.io/PROJECT_ID/mitre-shield:latest -f Dockerfile.complete .

# Deploy to Cloud Run
gcloud run deploy mitre-shield \
    --image gcr.io/PROJECT_ID/mitre-shield:latest \
    --platform managed \
    --region us-central1 \
    --allow-unauthenticated \
    --port 8080 \
    --memory 2Gi \
    --cpu 1 \
    --timeout 900 \
    --set-env-vars="NODE_ENV=production"
```

### Step 3: Configure Cloud Run Settings
- **Memory**: 2GiB (recommended for MongoDB + Node.js)
- **CPU**: 1 vCPU minimum
- **Timeout**: 15 minutes (for database initialization)
- **Port**: 8080
- **Authentication**: Allow unauthenticated invocations

---

## 📊 What Happens During Deployment

### Startup Sequence:
1. 🏗️ **Container builds** (~5-10 minutes)
2. 🗄️ **MongoDB starts** (embedded database)
3. 📊 **Database restoration** - Loads 2,339 MITRE techniques
4. 🔧 **Backend starts** - REST API becomes available
5. 🌐 **Nginx starts** - Frontend becomes accessible
6. ✅ **Health check passes** - Service goes live

### Expected Timeline:
- **Build time**: 5-10 minutes
- **Startup time**: 2-3 minutes  
- **Total deployment**: ~15 minutes

---

## 🎯 Access Your Application

### After Deployment:
- **URL**: `https://mitre-shield-[hash]-uc.a.run.app`
- **Frontend**: Dashboard with all MITRE techniques
- **Backend API**: `/api/health`, `/api/techniques`, etc.
- **Data**: 2,339 techniques + 12 detection rules automatically loaded

### Share with Team:
- Send the Cloud Run URL to your team
- No additional setup required
- Everyone gets instant access to the full application

---

## 💰 Cost Breakdown

### GCP Free Tier:
- **Cloud Run**: 2M requests/month FREE
- **Cloud Build**: 120 build-minutes/day FREE
- **Storage**: 5GB FREE

### Typical Team Usage:
- **Small team (5-10 users)**: $5-15/month
- **Medium team (20-50 users)**: $15-40/month
- **Large team (100+ users)**: $40-100/month

### Cost Optimization:
- **Min instances**: 0 (scales to zero when not used)
- **Max instances**: 10 (adjust based on team size)
- **Memory**: Start with 2GiB, adjust if needed

---

## 🔧 Configuration Options

### Environment Variables:
```bash
# Optional customizations
NODE_ENV=production
MONGODB_URI=mongodb://localhost:27017/mitre-shield  # Internal
JWT_SECRET=your-custom-secret-here
JWT_EXPIRE=7d
PORT=8080  # Set by Cloud Run
```

### Custom Domain:
1. **Cloud Run** → **Manage Custom Domains**
2. **Add Mapping** → Enter your domain
3. **Verify domain** → Update DNS records
4. **SSL Certificate** → Automatically provisioned

---

## 📊 Monitoring & Logs

### Built-in Monitoring:
- **Cloud Run Metrics**: CPU, Memory, Requests
- **Real-time Logs**: Application startup and errors
- **Health Checks**: Automatic endpoint monitoring

### Key Logs to Monitor:
```bash
# View deployment logs
gcloud run services logs read mitre-shield --region=us-central1

# Key startup messages to look for:
✅ MongoDB is ready!
📈 Restored 2339 MITRE techniques  
✅ Backend is ready!
🌐 MITRE Shield is ready at http://localhost:8080
```

---

## 🚨 Troubleshooting

### Common Issues:

#### 1. **Build Timeout**
```
Error: Build timeout exceeded
```
**Solution**: Use Cloud Build instead of inline builds
```bash
gcloud builds submit --timeout=1200s --tag gcr.io/PROJECT_ID/mitre-shield:latest -f Dockerfile.complete .
```

#### 2. **Memory Issues**
```
Error: Container killed due to memory limit
```
**Solution**: Increase memory allocation
```bash
gcloud run services update mitre-shield --memory 4Gi --region us-central1
```

#### 3. **Startup Timeout**
```
Error: Container failed to start before timeout
```
**Solution**: Increase startup timeout
```bash
gcloud run services update mitre-shield --timeout 900 --region us-central1
```

#### 4. **Database Not Loading**
**Check logs for**:
```
📊 Database is empty. Restoring from backup...
✅ Database restoration completed!
```
**If missing**: Verify database-backup/ folder is included in build

---

## 🔄 Updates & Maintenance

### Update Application:
1. **Push code changes** to your GitHub repository
2. **Cloud Build automatically triggers** (if set up)
3. **New revision deploys** with zero downtime
4. **Traffic automatically switches** to new version

### Manual Update:
```bash
# Rebuild and redeploy
gcloud builds submit --tag gcr.io/PROJECT_ID/mitre-shield:v2 -f Dockerfile.complete .
gcloud run services update mitre-shield --image gcr.io/PROJECT_ID/mitre-shield:v2
```

---

## 📈 Scaling for Teams

### Small Team (1-10 users):
```bash
gcloud run services update mitre-shield \
    --memory 2Gi \
    --cpu 1 \
    --min-instances 0 \
    --max-instances 5
```

### Medium Team (10-50 users):
```bash
gcloud run services update mitre-shield \
    --memory 4Gi \
    --cpu 2 \
    --min-instances 1 \
    --max-instances 20
```

### Large Team (50+ users):
```bash
gcloud run services update mitre-shield \
    --memory 8Gi \
    --cpu 4 \
    --min-instances 2 \
    --max-instances 50
```

---

## 🎉 Success Checklist

✅ **Cloud Run service deployed successfully**  
✅ **Application accessible via HTTPS URL**  
✅ **Frontend loads with MITRE dashboard**  
✅ **API responds at `/api/health`**  
✅ **Database contains 2,339 techniques**  
✅ **Team can access the application**  
✅ **Detection rules are loadable**  

---

## 📞 Support

### Get Help:
- **GCP Support**: https://cloud.google.com/support
- **Cloud Run Docs**: https://cloud.google.com/run/docs
- **Application Logs**: Check Cloud Run logs for errors

### Quick Debug Commands:
```bash
# Check service status
gcloud run services describe mitre-shield --region us-central1

# View recent logs
gcloud run services logs tail mitre-shield --region us-central1

# Test health endpoint
curl https://YOUR-SERVICE-URL/api/health
```

**Your team now has a fully functional MITRE Shield deployment! 🚀** 