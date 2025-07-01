#!/usr/bin/env node

/**
 * MITRE ATT&CK Data Pulling Script
 * 
 * This script demonstrates how to pull MITRE ATT&CK data and properly
 * integrate it with your platform structure including AI/ML techniques.
 * 
 * Usage:
 *   node scripts/pullMitreData.js [options]
 * 
 * Options:
 *   --force     Force a full sync even if recent data exists
 *   --ai-only   Only generate AI-specific techniques
 *   --stats     Show platform statistics after sync
 *   --help      Show this help message
 */

const mongoose = require('mongoose');
const MitreSyncService = require('../services/mitreSync');
const MitreDataProcessor = require('../services/mitreDataProcessor');
const TaxiiService = require('../services/taxiiService');
const GitHubMitreService = require('../services/githubMitreService');

// Parse command line arguments
const args = process.argv.slice(2);
const options = {
  force: args.includes('--force'),
  aiOnly: args.includes('--ai-only'),
  stats: args.includes('--stats'),
  help: args.includes('--help')
};

async function showHelp() {
  console.log(`
🛡️  MITRE ATT&CK Data Puller

This script pulls the latest MITRE ATT&CK techniques and properly formats
them for your application with enhanced platform support including AI/ML.

Usage:
  node scripts/pullMitreData.js [options]

Options:
  --force     Force a full sync even if recent data exists
  --ai-only   Only generate AI-specific techniques
  --stats     Show platform statistics after sync
  --help      Show this help message

Examples:
  node scripts/pullMitreData.js
  node scripts/pullMitreData.js --force --stats
  node scripts/pullMitreData.js --ai-only

Environment Requirements:
  - MongoDB connection string in config.env
  - Internet connection to access MITRE TAXII API
  - Node.js 14+ with required dependencies
`);
}

async function connectDatabase() {
  try {
    // Load environment variables
    require('dotenv').config({ path: '../config.env' });
    
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/mitre-shield';
    await mongoose.connect(mongoUri);
    
    console.log('✅ Connected to MongoDB');
    return true;
  } catch (error) {
    console.error('❌ Failed to connect to MongoDB:', error.message);
    return false;
  }
}

async function checkDataSourceConnectivity() {
  console.log('🔍 Checking MITRE data source connectivity...');
  
  // Try GitHub first (preferred)
  const githubService = new GitHubMitreService();
  try {
    console.log('📁 Testing GitHub MITRE repository access...');
    const testData = await githubService.fetchAttackData('enterprise', true);
    if (testData && testData.objects) {
      console.log(`✅ GitHub MITRE repository is accessible (${testData.objects.length.toLocaleString()} objects)`);
      return { source: 'github', healthy: true };
    }
  } catch (githubError) {
    console.warn('⚠️ GitHub access failed:', githubError.message);
  }
  
  // Fallback to TAXII
  const taxiiService = new TaxiiService();
  const health = await taxiiService.healthCheck();
  
  if (health.healthy) {
    console.log('✅ MITRE TAXII API is accessible (fallback)');
    return { source: 'taxii', healthy: true };
  } else {
    console.error('❌ Both GitHub and TAXII connectivity issues');
    console.log('💡 Troubleshooting tips:');
    console.log('   - Check your internet connection');
    console.log('   - Verify firewall settings allow HTTPS connections');
    console.log('   - Try again later if services are temporarily unavailable');
    return { source: 'none', healthy: false };
  }
}

async function performFullSync(force = false) {
  console.log('🔄 Starting full MITRE ATT&CK data sync...');
  
  const syncService = new MitreSyncService();
  
  try {
    const result = await syncService.syncMitreData(force);
    
    if (result.success) {
      console.log('✅ Full sync completed successfully!');
      console.log(`📊 Results:`);
      console.log(`   - Tactics: ${result.results?.tactics?.processed || 0} processed`);
      console.log(`   - Techniques: ${result.results?.techniques?.processed || 0} processed`);
      console.log(`   - AI Techniques: ${result.results?.aiTechniques?.created || 0} created`);
      return result;
    } else {
      console.error('❌ Sync failed:', result.message);
      return null;
    }
  } catch (error) {
    console.error('❌ Sync error:', error.message);
    return null;
  }
}

async function generateAITechniques() {
  console.log('🧠 Generating AI-specific techniques...');
  
  const dataProcessor = new MitreDataProcessor();
  
  try {
    const result = await dataProcessor.generateAISpecificTechniques();
    
    console.log('✅ AI techniques generated successfully!');
    console.log(`📊 Results:`);
    console.log(`   - Created: ${result.created}`);
    console.log(`   - Updated: ${result.updated}`);
    console.log(`   - Total processed: ${result.processed}`);
    
    return result;
  } catch (error) {
    console.error('❌ AI technique generation failed:', error.message);
    return null;
  }
}

async function showPlatformStats() {
  console.log('📊 Gathering platform statistics...');
  
  const dataProcessor = new MitreDataProcessor();
  
  try {
    const stats = await dataProcessor.getPlatformStats();
    
    console.log('\n📋 Platform Statistics:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    stats.forEach((platform, index) => {
      console.log(`${index + 1}. ${platform.platform}`);
      console.log(`   Techniques: ${platform.totalTechniques}`);
      console.log(`   Tactics: ${platform.tacticCount}`);
      console.log(`   Avg Complexity: ${platform.avgComplexityScore}/3.0`);
      console.log('');
    });
    
    const totalTechniques = stats.reduce((sum, p) => sum + p.totalTechniques, 0);
    console.log(`Total Techniques Across All Platforms: ${totalTechniques}`);
    
    return stats;
  } catch (error) {
    console.error('❌ Failed to get platform statistics:', error.message);
    return null;
  }
}

async function main() {
  try {
    console.log('🛡️  MITRE ATT&CK Data Puller');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    if (options.help) {
      await showHelp();
      return;
    }
    
    // Step 1: Connect to database
    const dbConnected = await connectDatabase();
    if (!dbConnected) {
      process.exit(1);
    }
    
    // Step 2: Check data source connectivity (only for full sync)
    if (!options.aiOnly) {
      const connectivity = await checkDataSourceConnectivity();
      if (!connectivity.healthy) {
        console.log('\n💡 You can still generate AI-specific techniques with --ai-only flag');
        process.exit(1);
      }
      console.log(`🎯 Will use ${connectivity.source} as data source`);
    }
    
    // Step 3: Perform requested operations
    if (options.aiOnly) {
      await generateAITechniques();
    } else {
      const syncResult = await performFullSync(options.force);
      if (!syncResult) {
        process.exit(1);
      }
    }
    
    // Step 4: Show statistics if requested
    if (options.stats) {
      await showPlatformStats();
    }
    
    console.log('\n✅ All operations completed successfully!');
    
  } catch (error) {
    console.error('❌ Script failed:', error.message);
    process.exit(1);
  } finally {
    // Close database connection
    await mongoose.disconnect();
    console.log('👋 Database connection closed');
  }
}

// Handle process signals
process.on('SIGINT', async () => {
  console.log('\n⚠️  Process interrupted, cleaning up...');
  await mongoose.disconnect();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('\n⚠️  Process terminated, cleaning up...');
  await mongoose.disconnect();
  process.exit(0);
});

// Run the script
if (require.main === module) {
  main().catch(error => {
    console.error('❌ Unhandled error:', error);
    process.exit(1);
  });
}

module.exports = {
  performFullSync,
  generateAITechniques,
  showPlatformStats
}; 