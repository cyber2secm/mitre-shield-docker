const express = require('express');
const router = express.Router();
const MitreSyncService = require('../services/mitreSync');
const MitreDataProcessor = require('../services/mitreDataProcessor');

// Create a single instance of the sync service and data processor
const mitreSyncService = new MitreSyncService();
const mitreDataProcessor = new MitreDataProcessor();

/**
 * @route   POST /api/mitre/sync
 * @desc    Trigger a manual sync of MITRE ATT&CK data
 * @access  Public (should be protected in production)
 */
router.post('/sync', async (req, res) => {
  try {
    const { force = false } = req.body;
    
    console.log(`🔄 Manual MITRE sync triggered (force: ${force})`);
    
    // Set a longer timeout for this request (10 minutes)
    req.setTimeout(600000);
    res.setTimeout(600000);
    
    // Set headers for streaming response
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    
    // If sync is already running, return current progress
    if (mitreSyncService.isRunning) {
      const status = mitreSyncService.getSyncStatus();
      return res.status(202).json({
        success: false,
        message: 'Sync already in progress',
        data: status
      });
    }
    
    // Start the sync in background and return immediately with accepted status
    const syncPromise = mitreSyncService.syncMitreData(force);
    
    // Return immediate response
    res.status(202).json({
      success: true,
      message: 'MITRE sync started successfully',
      data: {
        status: 'started',
        checkStatusUrl: '/api/mitre/status'
      }
    });
    
    // Handle the sync result in background (for logging)
    syncPromise.then(result => {
      if (result.success) {
        console.log(`✅ Background MITRE sync completed: ${result.message}`);
      } else {
        console.error(`❌ Background MITRE sync failed: ${result.message}`);
      }
    }).catch(error => {
      console.error('❌ Unexpected error in background sync:', error);
    });
    
  } catch (error) {
    console.error('❌ Error starting MITRE sync:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to start sync',
      error: error.message
    });
  }
});

/**
 * @route   GET /api/mitre/status
 * @desc    Get current sync status and progress
 * @access  Public
 */
router.get('/status', async (req, res) => {
  try {
    const status = mitreSyncService.getSyncStatus();
    
    res.status(200).json({
      success: true,
      data: status
    });
    
  } catch (error) {
    console.error('❌ Error getting sync status:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get sync status',
      error: error.message
    });
  }
});

/**
 * @route   POST /api/mitre/sync/stream
 * @desc    Trigger sync with streaming progress updates (Server-Sent Events)
 * @access  Public
 */
router.post('/sync/stream', async (req, res) => {
  try {
    const { force = false } = req.body;
    
    console.log(`🔄 Streaming MITRE sync triggered (force: ${force})`);
    
    // Set up Server-Sent Events
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Cache-Control'
    });
    
    // Keep connection alive
    const keepAlive = setInterval(() => {
      res.write('data: {"type":"keepalive","timestamp":"' + new Date().toISOString() + '"}\n\n');
    }, 30000); // Every 30 seconds
    
    const sendProgress = (data) => {
      res.write(`data: ${JSON.stringify(data)}\n\n`);
    };
    
    // Send initial status
    sendProgress({
      type: 'status',
      message: 'Starting MITRE sync...',
      status: 'starting'
    });
    
    try {
      const result = await mitreSyncService.syncMitreData(force);
      
      // Send final result
      sendProgress({
        type: 'complete',
        success: result.success,
        message: result.message,
        data: result.results || {},
        progress: result.progress
      });
      
    } catch (syncError) {
      sendProgress({
        type: 'error',
        success: false,
        message: `Sync failed: ${syncError.message}`,
        error: syncError.message
      });
    }
    
    // Close connection
    clearInterval(keepAlive);
    res.end();
    
  } catch (error) {
    console.error('❌ Error in streaming sync:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to start streaming sync',
      error: error.message
    });
  }
});

/**
 * @route   GET /api/mitre/techniques/count
 * @desc    Get count of MITRE techniques in database
 * @access  Public
 */
router.get('/techniques/count', async (req, res) => {
  try {
    const MitreTechnique = require('../models/MitreTechnique');
    
    const counts = await MitreTechnique.aggregate([
      {
        $group: {
          _id: '$tactic',
          count: { $sum: 1 }
        }
      },
      {
        $group: {
          _id: null,
          tactics: { 
            $push: { 
              tactic: '$_id', 
              count: '$count' 
            } 
          },
          total: { $sum: '$count' }
        }
      }
    ]);
    
    const result = counts[0] || { tactics: [], total: 0 };
    
    res.status(200).json({
      success: true,
      data: {
        total: result.total,
        byTactic: result.tactics,
        lastSyncTime: mitreSyncService.lastSyncTime
      }
    });
    
  } catch (error) {
    console.error('❌ Error getting technique counts:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get technique counts',
      error: error.message
    });
  }
});

/**
 * @route   DELETE /api/mitre/techniques/cleanup
 * @desc    Clean up deprecated techniques
 * @access  Public (should be protected in production)
 */
router.delete('/techniques/cleanup', async (req, res) => {
  try {
    console.log('🧹 Manual cleanup of deprecated techniques triggered');
    
    const deletedCount = await mitreSyncService.cleanupDeprecatedTechniques();
    
    res.status(200).json({
      success: true,
      message: `Cleanup completed successfully`,
      data: {
        deletedCount,
        timestamp: new Date().toISOString()
      }
    });
    
  } catch (error) {
    console.error('❌ Error during cleanup:', error);
    res.status(500).json({
      success: false,
      message: 'Cleanup failed',
      error: error.message
    });
  }
});

/**
 * @route   GET /api/mitre/health
 * @desc    Check MITRE service health
 * @access  Public
 */
router.get('/health', async (req, res) => {
  try {
    const TaxiiService = require('../services/taxiiService');
    const taxiiService = new TaxiiService();
    
    // Perform a real health check
    const healthCheck = await taxiiService.healthCheck();
    
    const status = {
      taxiiService: taxiiService.getStatus(),
      syncService: mitreSyncService.getSyncStatus(),
      healthCheck: healthCheck,
      database: {
        connected: require('mongoose').connection.readyState === 1
      },
      timestamp: new Date().toISOString()
    };
    
    // Return appropriate status code based on health
    const statusCode = healthCheck.healthy ? 200 : 503;
    
    res.status(statusCode).json({
      success: healthCheck.healthy,
      data: status
    });
    
  } catch (error) {
    console.error('❌ Error checking MITRE service health:', error);
    res.status(500).json({
      success: false,
      message: 'Health check failed',
      error: error.message
    });
  }
});

/**
 * @route   GET /api/mitre/diagnostics
 * @desc    Get detailed MITRE service diagnostics and troubleshooting info
 * @access  Public
 */
router.get('/diagnostics', async (req, res) => {
  try {
    const TaxiiService = require('../services/taxiiService');
    const taxiiService = new TaxiiService();
    
    const diagnostics = taxiiService.getDiagnostics();
    
    res.status(200).json({
      success: true,
      data: diagnostics
    });
    
  } catch (error) {
    console.error('❌ Error getting MITRE service diagnostics:', error);
    res.status(500).json({
      success: false,
      message: 'Diagnostics failed',
      error: error.message
    });
  }
});

/**
 * @route   GET /api/mitre/platforms/stats
 * @desc    Get platform-specific technique statistics
 * @access  Public
 */
router.get('/platforms/stats', async (req, res) => {
  try {
    console.log('📊 Getting platform-specific technique statistics...');
    
    const stats = await mitreDataProcessor.getPlatformStats();
    
    res.status(200).json({
      success: true,
      data: {
        platforms: stats,
        timestamp: new Date().toISOString(),
        totalPlatforms: stats.length
      }
    });
    
  } catch (error) {
    console.error('❌ Error getting platform statistics:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get platform statistics',
      error: error.message
    });
  }
});

/**
 * @route   POST /api/mitre/generate-ai-techniques
 * @desc    Generate AI-specific techniques
 * @access  Public
 */
router.post('/generate-ai-techniques', async (req, res) => {
  try {
    console.log('🧠 Generating AI-specific techniques...');
    
    const result = await mitreDataProcessor.generateAISpecificTechniques();
    
    res.status(200).json({
      success: true,
      message: `Generated ${result.created} AI-specific techniques`,
      data: result
    });
    
  } catch (error) {
    console.error('❌ Error generating AI techniques:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate AI techniques',
      error: error.message
    });
  }
});

// Export both router and sync service instance for access from other modules
module.exports = {
  router,
  mitreSyncService
}; 