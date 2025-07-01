# MITRE TAXII Service Troubleshooting Guide

## Current Issue Summary
Your MITRE Shield application is experiencing connectivity timeouts when trying to connect to the MITRE ATT&CK TAXII API at `https://cti-taxii.mitre.org`.

**Error Details:**
- **Error Code:** `ETIMEDOUT` / `ECONNABORTED` 
- **Target:** `3.221.214.19:443` (cti-taxii.mitre.org)
- **Issue:** Connection timeouts after 30 seconds

## Root Cause Analysis

### 1. Network Connectivity Issues
The MITRE TAXII service at `cti-taxii.mitre.org` is currently unreachable from your network. This could be due to:

- **Service Outage**: The MITRE TAXII service may be experiencing downtime
- **Network Issues**: Your internet connection or routing may have problems
- **Firewall Blocking**: Corporate or local firewall blocking HTTPS connections
- **DNS Problems**: Although DNS resolution works, routing may be failing

### 2. Confirmed Working Components
✅ **DNS Resolution**: `cti-taxii.mitre.org` correctly resolves to `3.221.214.19`  
✅ **Backend Server**: Running successfully on port 3000  
✅ **Database**: MongoDB connection is working  
✅ **Frontend**: Vite dev server running on port 5174  

## Troubleshooting Steps

### Immediate Actions

1. **Check MITRE Service Status**
   ```bash
   # Try accessing the service directly
   curl -I --connect-timeout 30 https://cti-taxii.mitre.org/taxii/
   ```

2. **Test from Different Network**
   - Try connecting from a different network (mobile hotspot, different ISP)
   - This helps identify if it's a local network issue

3. **Check Firewall Settings**
   ```bash
   # Check if port 443 is accessible
   telnet cti-taxii.mitre.org 443
   # Or using nc (netcat)
   nc -zv cti-taxii.mitre.org 443
   ```

4. **Verify Corporate Proxy/Firewall**
   - If you're on a corporate network, check if HTTPS traffic is being intercepted
   - Contact your IT department about accessing `cti-taxii.mitre.org`

### Enhanced Service Features

The backend has been enhanced with improved error handling and diagnostics:

**New Endpoints Available:**
- `GET /api/mitre/health` - Real-time health check with detailed status
- `GET /api/mitre/diagnostics` - Comprehensive diagnostic information

**Enhanced Features:**
- ⚡ Improved retry logic with exponential backoff (5 retries vs 3)
- 🏥 Real-time health monitoring and connection tracking
- 📊 Better error categorization (network vs service errors)
- ⏱️ Reduced initial timeout (60s vs 120s) for faster failure detection
- 🔧 Detailed troubleshooting tips based on error types

## Workaround Solutions

### 1. Use Cached/Existing Data
If you have existing MITRE technique data in your database, the application can continue to function with that data while the TAXII service is unavailable.

### 2. Manual Data Import
As an alternative, you can manually download MITRE ATT&CK data:

1. **Download STIX Data**:
   - Visit: https://github.com/mitre/cti
   - Download the latest ATT&CK data files
   - Import them manually using the application's import functionality

2. **Alternative APIs**:
   - MITRE provides alternative access methods when TAXII is unavailable
   - Check MITRE's documentation for backup endpoints

### 3. Schedule Sync for Later
The application includes automatic retry mechanisms:
- Daily sync attempts at 2 AM
- Weekly full sync on Sundays at 3 AM
- Manual sync can be retried when connectivity is restored

## Monitoring and Recovery

### Real-time Status Monitoring
```bash
# Check current service health
curl -s http://localhost:3000/api/mitre/health | jq '.data.healthCheck'

# Get detailed diagnostics
curl -s http://localhost:3000/api/mitre/diagnostics | jq '.data.troubleshooting'
```

### Automatic Recovery
The service will automatically:
- Track connection health and failure patterns
- Provide contextual error messages
- Retry with exponential backoff when connectivity is restored
- Update health status in real-time

## Next Steps

### Immediate (Manual)
1. **Try the manual sync** once connectivity is restored:
   ```bash
   curl -X POST http://localhost:3000/api/mitre/sync -H "Content-Type: application/json" -d '{"force": true}'
   ```

2. **Monitor sync progress**:
   ```bash
   curl -s http://localhost:3000/api/mitre/status | jq '.'
   ```

### Long-term (Automated)
- The enhanced service will automatically attempt to sync when the MITRE service becomes available
- Improved error handling will provide better feedback for future connectivity issues
- Health monitoring will help identify patterns and potential solutions

## Contact and Support

If the issue persists:
1. **Check MITRE's official channels** for service announcements
2. **Verify your network configuration** with your IT team
3. **Use the enhanced diagnostics** to gather detailed information for troubleshooting

---

## Service Configuration

The TAXII service has been configured with the following settings for optimal performance:

```javascript
Configuration:
- Connection Timeout: 30 seconds
- Request Timeout: 60 seconds  
- Max Retries: 5 (with exponential backoff)
- Retry Delay: 3-30 seconds
- Rate Limiting: 1 second between requests
- Health Check Interval: 5 minutes
```

This configuration balances performance with reliability and should handle most temporary connectivity issues automatically. 