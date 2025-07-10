# MITRE ATT&CK Data Integration Guide

## Overview

This guide explains how to pull MITRE ATT&CK data and properly integrate it with your MITRE Shield application, including support for all platforms with special emphasis on AI/ML techniques.

## 🚀 Quick Start

### 1. Generate AI-specific techniques (works offline)
```bash
cd backend-example
node scripts/pullMitreData.js --ai-only --stats
```

### 2. Full MITRE data sync (requires internet)
```bash
cd backend-example
node scripts/pullMitreData.js --force --stats
```

### 3. Via API endpoints
```bash
# Start AI technique generation
curl -X POST http://localhost:3000/api/mitre/generate-ai-techniques

# Trigger full sync
curl -X POST http://localhost:3000/api/mitre/sync

# Get platform statistics
curl http://localhost:3000/api/mitre/platforms/stats
```

## 📋 Features

### Enhanced Platform Support
- **Traditional Platforms**: Windows, macOS, Linux, AWS, Azure, GCP, Oracle, Alibaba, Containers
- **AI/ML Platform**: Specialized techniques for machine learning environments
- **Smart Mapping**: Automatically maps MITRE platforms to your application's platform structure

### AI/ML Specific Techniques
- **Model Poisoning**: Injection of malicious data into training datasets
- **Adversarial Examples**: Crafted inputs to fool ML models
- **Model Inversion**: Extracting sensitive information from models
- **Model Extraction**: Systematic querying to copy models
- **Backdoor Injection**: Hidden functionality in ML models

### Enhanced Data Processing
- **Complexity Assessment**: Automatic evaluation of technique complexity
- **Impact Analysis**: Assessment of potential damage from techniques
- **Detection Difficulty**: Evaluation of how hard techniques are to detect
- **Platform Optimization**: Techniques optimized for each platform

## 🛠️ System Architecture

### Core Components

#### 1. TaxiiService (`backend-example/services/taxiiService.js`)
- Connects to MITRE's official TAXII API
- Handles network connectivity issues and retries
- Parses STIX 2.1 objects into usable format

#### 2. MitreDataProcessor (`backend-example/services/mitreDataProcessor.js`)
- Enhances raw MITRE data with platform-specific information
- Generates AI/ML specific technique variants
- Provides platform mapping and normalization

#### 3. MitreSyncService (`backend-example/services/mitreSync.js`)
- Orchestrates the data sync process
- Manages batch operations and error handling
- Integrates with the enhanced data processor

### Data Flow
```
MITRE TAXII API 
    ↓
TaxiiService (fetch & parse)
    ↓
MitreDataProcessor (enhance & platform mapping)
    ↓
MongoDB (store enhanced techniques)
    ↓
Frontend (display in tactic cards & technique cards)
```

## 🎯 Platform Mapping

### Automatic Platform Detection
The system automatically maps MITRE platforms to your application structure:

```javascript
// Official MITRE platforms → Your platforms
'Google Cloud Platform' → 'GCP'
'Azure AD' → 'Azure'
'Office 365' → 'Azure'
'Docker' → 'Containers'
'Kubernetes' → 'Containers'

// AI/ML specific mappings
'Machine Learning' → 'AI'
'Artificial Intelligence' → 'AI'
'Neural Networks' → 'AI'
```

### AI/ML Platform Enhancement
Techniques are automatically enhanced for AI/ML contexts when they contain keywords like:
- machine learning, neural network, training data
- model inference, data science, tensorflow, pytorch
- adversarial, model deployment, feature engineering

## 📊 Usage Examples

### 1. Command Line Script

**Basic sync with statistics:**
```bash
node scripts/pullMitreData.js --stats
```

**Force full refresh:**
```bash
node scripts/pullMitreData.js --force --stats
```

**AI techniques only (offline):**
```bash
node scripts/pullMitreData.js --ai-only
```

### 2. API Integration

**Check service health:**
```bash
curl http://localhost:3000/api/mitre/health
```

**Get platform statistics:**
```bash
curl http://localhost:3000/api/mitre/platforms/stats | jq '.data.platforms'
```

**Start sync with progress monitoring:**
```bash
curl -X POST http://localhost:3000/api/mitre/sync/stream
```

### 3. Programmatic Usage

```javascript
const MitreDataProcessor = require('./services/mitreDataProcessor');
const processor = new MitreDataProcessor();

// Get platform statistics
const stats = await processor.getPlatformStats();
console.log('Windows techniques:', stats.find(p => p.platform === 'Windows'));

// Generate AI techniques
const aiResult = await processor.generateAISpecificTechniques();
console.log(`Generated ${aiResult.created} AI techniques`);
```

## 🎨 Frontend Integration

### Tactic Cards
Your tactic cards automatically display techniques grouped by platform:

```javascript
// The enhanced data provides:
{
  tactic: "Defense Evasion",
  techniques: [
    {
      technique_id: "T1055",
      name: "Process Injection",
      platforms: ["Windows", "macOS", "Linux"],
      complexity: "High",
      detection_difficulty: "Hard"
    }
  ]
}
```

### Technique Cards
Technique cards show enhanced information:

```javascript
// Enhanced technique data includes:
{
  technique_id: "T1001.AI-001",
  name: "Model Poisoning",
  platforms: ["AI"],
  complexity: "High",
  impact_level: "High",
  detection_difficulty: "Hard",
  ai_specific: true,
  detection_rules: ["Training Data Monitoring", "Model Performance Tracking"]
}
```

### Platform Icons
The PlatformIcon component automatically handles the new AI platform:

```jsx
<PlatformIcon platform="AI" className="w-4 h-4" />
// Renders brain icon for AI platform
```

## 🔧 Configuration

### Environment Variables
```bash
# config.env
MONGODB_URI=mongodb://localhost:27017/mitre-shield
TAXII_TIMEOUT=60000
TAXII_MAX_RETRIES=5
```

### Customization Options

#### Platform Mapping
Edit `MitreDataProcessor` to add custom platform mappings:

```javascript
this.platformMapping = {
  'Custom Platform': ['YourPlatform'],
  'Special Environment': ['Windows', 'Azure']
};
```

#### AI Keywords
Customize AI detection keywords:

```javascript
this.aiRelatedKeywords = [
  'your-custom-keyword',
  'special-ai-term'
];
```

## 📈 Performance Optimization

### Batch Processing
- Processes data in chunks of 100 objects
- Uses MongoDB bulk operations (50 items per batch)
- Implements rate limiting (1 second between requests)

### Memory Management
- Streaming processing for large datasets
- Automatic cleanup of temporary data
- Connection pooling with proper timeouts

### Error Handling
- Exponential backoff for retries
- Graceful degradation on partial failures
- Comprehensive logging and diagnostics

## 🚨 Troubleshooting

### Network Issues
If you see `ETIMEDOUT` errors:

1. **Check internet connection**
   ```bash
   ping cti-taxii.mitre.org
   ```

2. **Verify firewall settings**
   - Allow HTTPS connections to `cti-taxii.mitre.org:443`
   - Check corporate proxy settings

3. **Use offline mode**
   ```bash
   node scripts/pullMitreData.js --ai-only
   ```

### Database Issues
```bash
# Check MongoDB connection
mongo --eval "db.adminCommand('ismaster')"

# Verify database size
mongo mitre-shield --eval "db.stats()"
```

### Performance Issues
```bash
# Monitor memory usage
node --max-old-space-size=4096 scripts/pullMitreData.js

# Use smaller batch sizes in production
# Edit MitreDataProcessor batchSize property
```

## 🔄 Automation

### Scheduled Sync
The system includes automatic scheduling:

- **Daily sync**: 2 AM (incremental updates)
- **Weekly sync**: Sunday 3 AM (full refresh)

### Custom Scheduling
Add to your cron jobs:

```bash
# Daily AI technique generation
0 1 * * * cd /path/to/backend-example && node scripts/pullMitreData.js --ai-only

# Weekly full sync
0 2 * * 0 cd /path/to/backend-example && node scripts/pullMitreData.js --force
```

## 📋 API Reference

### Endpoints

#### `POST /api/mitre/sync`
Trigger manual sync
- **Body**: `{ "force": boolean }`
- **Response**: `{ "success": boolean, "data": object }`

#### `GET /api/mitre/status`
Get sync status and progress
- **Response**: `{ "success": boolean, "data": object }`

#### `GET /api/mitre/platforms/stats`
Get platform-specific statistics
- **Response**: `{ "success": boolean, "data": { "platforms": array } }`

#### `POST /api/mitre/generate-ai-techniques`
Generate AI-specific techniques
- **Response**: `{ "success": boolean, "data": object }`

#### `GET /api/mitre/health`
Check service health
- **Response**: `{ "success": boolean, "data": object }`

#### `GET /api/mitre/diagnostics`
Get detailed diagnostics
- **Response**: `{ "success": boolean, "data": object }`

## 🎯 Best Practices

### 1. Data Sync Strategy
- Use `--force` sparingly (only when MITRE releases major updates)
- Run AI technique generation after each sync
- Monitor platform statistics for data quality

### 2. Error Handling
- Always check API responses for errors
- Implement retry logic in production
- Log all sync operations for debugging

### 3. Performance
- Run full syncs during low-traffic hours
- Use streaming endpoints for large operations
- Monitor database size and performance

### 4. Security
- Protect sync endpoints in production
- Validate all input data
- Monitor for unusual technique modifications

## 🚀 Next Steps

1. **Test the system**: Run `node scripts/pullMitreData.js --ai-only --stats`
2. **Verify frontend**: Check that AI techniques appear in your Matrix view
3. **Schedule automation**: Set up cron jobs for regular updates
4. **Monitor performance**: Watch logs and database size
5. **Customize platforms**: Add any organization-specific platforms

## 🆘 Support

If you encounter issues:

1. Check the troubleshooting section above
2. Review logs in the console output
3. Test connectivity with the health endpoint
4. Try the AI-only mode first to verify database connectivity

The system is designed to be resilient and provide helpful error messages to guide you through any issues. 