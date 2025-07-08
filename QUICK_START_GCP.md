# 🚀 Quick Start: Deploy MITRE Shield to GCP

## Option 1: Super Simple (5 minutes) 🟢

### Prerequisites:
1. **GCP Account**: Sign up at https://console.cloud.google.com
2. **Create Project**: Create a new project in GCP Console
3. **Enable APIs**: 
   - Go to APIs & Services → Library
   - Enable: "Cloud Run API" and "Cloud Build API"
4. **Enable Billing**: Required for Cloud Run

### Deploy via GCP Portal:

#### Method A: Using Cloud Shell (Easiest)
1. Open **Cloud Shell** in GCP Console (terminal icon)
2. Run these commands:
```bash
# Clone your repository (or upload files)
git clone [YOUR_REPO_URL]
cd mitre-shield-docker

# Deploy with one command
gcloud run deploy mitre-shield \
    --source . \
    --platform managed \
    --region us-central1 \
    --allow-unauthenticated \
    --port 8080 \
    --memory 1Gi
```

#### Method B: Using Cloud Build
1. Go to **Cloud Build** → **Triggers**
2. Create trigger from GitHub repository
3. Use `Dockerfile.simple` as the build file
4. Deploy automatically to Cloud Run

### 🎉 Result:
- Your app will be live at: `https://mitre-shield-[hash]-uc.a.run.app`
- Share this URL with your team!

---

## Option 2: Production Ready (30 minutes) 🔶

### 1. Create Cloud SQL Database
- Go to **Cloud SQL** → **Create Instance**
- Choose **MySQL** → Set password → Create
- Note the connection string

### 2. Deploy with Database
```bash
# Deploy with database connection
gcloud run deploy mitre-shield \
    --source . \
    --platform managed \
    --region us-central1 \
    --allow-unauthenticated \
    --port 8080 \
    --memory 1Gi \
    --set-env-vars="DATABASE_URL=mysql://[CONNECTION_STRING]"
```

### 3. Import Your Data
- Use the GCP Console to import your database backup
- Or use your backend API endpoints

---

## 💰 Cost Estimate

### Free Tier (Perfect for Teams):
- **Cloud Run**: First 2M requests/month = FREE
- **Cloud SQL**: f1-micro instance = ~$7/month
- **Storage**: First 5GB = FREE

### Typical Team Usage:
- **Monthly cost**: $10-20 for small teams
- **Scales automatically** with usage
- **No maintenance** required

---

## 🔧 Portal-Only Deployment (No Command Line)

### Via GCP Console:
1. **Cloud Run** → **Create Service**
2. **Container Image**: 
   - Click "Build from source"
   - Connect your GitHub repository
   - Select `Dockerfile.simple`
3. **Service Settings**:
   - Name: `mitre-shield`
   - Region: `us-central1`
   - Authentication: Allow unauthenticated
   - Port: 8080
   - Memory: 1GiB
4. **Create** → Wait for deployment

### Custom Domain (Optional):
1. **Cloud Run** → **Manage Custom Domains**
2. **Add Mapping** → Enter your domain
3. **Verify domain** → Update DNS records

---

## 📊 Team Access

### Share with Team:
1. **Public URL**: Anyone can access via the Cloud Run URL
2. **Custom Domain**: Set up your own domain for branding
3. **Authentication**: Add Google OAuth if needed

### Monitoring:
- **Cloud Run Metrics**: Built-in monitoring
- **Logs**: Real-time application logs
- **Alerts**: Set up notifications

---

## 🆘 Need Help?

### Common Issues:
1. **Build Fails**: Check Dockerfile syntax
2. **Port Error**: Ensure port 8080 is exposed
3. **Database Connection**: Verify Cloud SQL setup

### Support:
- GCP Support: https://cloud.google.com/support
- Documentation: https://cloud.google.com/run/docs

---

## 🎯 Next Steps

1. **Deploy**: Use Option 1 to get started quickly
2. **Test**: Share URL with your team
3. **Production**: Follow Option 2 for production setup
4. **Monitor**: Set up logging and monitoring
5. **Scale**: Configure auto-scaling as needed

**Your team will love the instant access to MITRE Shield! 🚀** 