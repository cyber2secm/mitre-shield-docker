const mongoose = require('mongoose');
const fs = require('fs');
require('dotenv').config({ path: './config.env' });

async function analyzeDataDiscrepancy() {
  try {
    console.log('🔍 ANALYZING DATA DISCREPANCY BETWEEN FILES AND DATABASE\n');
    
    // Analyze file data
    console.log('=== FILE DATA ANALYSIS ===');
    const platforms = ['windows', 'linux', 'macos', 'cloud', 'containers', 'officesuite'];
    const fileStats = {};
    
    for (const platform of platforms) {
      const filename = `mitreshire_${platform}_techniques.json`;
      if (fs.existsSync(filename)) {
        const data = JSON.parse(fs.readFileSync(filename, 'utf8'));
        const parents = data.filter(t => !t.is_subtechnique);
        const subs = data.filter(t => t.is_subtechnique);
        const uniqueIds = new Set(data.map(t => t.technique_id));
        
        fileStats[platform] = {
          total: data.length,
          parents: parents.length,
          subs: subs.length,
          unique: uniqueIds.size,
          duplicates: data.length - uniqueIds.size
        };
        
        console.log(`${platform.toUpperCase()}:`);
        console.log(`  Total: ${data.length}`);
        console.log(`  Parents: ${parents.length}`);
        console.log(`  Sub-techniques: ${subs.length}`);
        console.log(`  Unique IDs: ${uniqueIds.size}`);
        console.log(`  Duplicates: ${data.length - uniqueIds.size}`);
        console.log(`  First 3 IDs: ${Array.from(uniqueIds).slice(0, 3).join(', ')}\n`);
      }
    }
    
    // Connect to database and analyze
    console.log('=== DATABASE ANALYSIS ===');
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/mitre-shield');
    const MitreTechnique = require('./models/MitreTechnique');
    
    const dbStats = {
      total: await MitreTechnique.countDocuments(),
      parents: await MitreTechnique.countDocuments({ is_subtechnique: false }),
      subs: await MitreTechnique.countDocuments({ is_subtechnique: true })
    };
    
    console.log(`Total techniques in DB: ${dbStats.total}`);
    console.log(`Parent techniques: ${dbStats.parents}`);
    console.log(`Sub-techniques: ${dbStats.subs}\n`);
    
    // Platform-specific counts in database
    console.log('=== DATABASE PLATFORM COUNTS ===');
    const platformCounts = [
      { name: 'Windows', count: await MitreTechnique.countDocuments({ platforms: 'Windows' }) },
      { name: 'Linux', count: await MitreTechnique.countDocuments({ platforms: 'Linux' }) },
      { name: 'macOS', count: await MitreTechnique.countDocuments({ platforms: 'macOS' }) },
      { name: 'AWS', count: await MitreTechnique.countDocuments({ platforms: 'AWS' }) },
      { name: 'Azure', count: await MitreTechnique.countDocuments({ platforms: 'Azure' }) },
      { name: 'GCP', count: await MitreTechnique.countDocuments({ platforms: 'GCP' }) },
      { name: 'Oracle', count: await MitreTechnique.countDocuments({ platforms: 'Oracle' }) },
      { name: 'Containers', count: await MitreTechnique.countDocuments({ platforms: 'Containers' }) },
      { name: 'Office Suite', count: await MitreTechnique.countDocuments({ platforms: 'Office Suite' }) }
    ];
    
    platformCounts.forEach(p => {
      console.log(`${p.name}: ${p.count} techniques`);
    });
    
    // Find sample techniques to understand structure
    console.log('\n=== SAMPLE DATABASE TECHNIQUES ===');
    const sampleTechs = await MitreTechnique.find({}, 'technique_id name platforms is_subtechnique').limit(5);
    sampleTechs.forEach(tech => {
      console.log(`${tech.technique_id}: ${tech.name}`);
      console.log(`  Platforms: ${tech.platforms.join(', ')}`);
      console.log(`  Is sub-technique: ${tech.is_subtechnique}\n`);
    });
    
    // Check for potential issues
    console.log('=== DISCREPANCY ANALYSIS ===');
    
    // Check if techniques are being merged/overwritten
    const duplicateIds = await MitreTechnique.aggregate([
      { $group: { _id: '$technique_id', count: { $sum: 1 } } },
      { $match: { count: { $gt: 1 } } }
    ]);
    
    console.log(`Duplicate technique IDs in DB: ${duplicateIds.length}`);
    if (duplicateIds.length > 0) {
      console.log('Sample duplicates:', duplicateIds.slice(0, 3).map(d => `${d._id} (${d.count})`));
    }
    
    // Compare file totals vs database
    console.log('\n=== FILE VS DATABASE COMPARISON ===');
    const fileTotals = Object.values(fileStats).reduce((sum, stats) => sum + stats.total, 0);
    console.log(`Total techniques in files: ${fileTotals}`);
    console.log(`Total techniques in database: ${dbStats.total}`);
    console.log(`Missing techniques: ${fileTotals - dbStats.total}`);
    
    // Platform-specific comparison
    console.log('\n=== PLATFORM-SPECIFIC DISCREPANCIES ===');
    for (const platform of platforms) {
      if (fileStats[platform]) {
        let dbCount = 0;
        if (platform === 'windows') dbCount = await MitreTechnique.countDocuments({ platforms: 'Windows' });
        else if (platform === 'linux') dbCount = await MitreTechnique.countDocuments({ platforms: 'Linux' });
        else if (platform === 'macos') dbCount = await MitreTechnique.countDocuments({ platforms: 'macOS' });
        else if (platform === 'cloud') {
          // Cloud techniques should be split across AWS/Azure/GCP/Oracle
          dbCount = await MitreTechnique.countDocuments({ 
            platforms: { $in: ['AWS', 'Azure', 'GCP', 'Oracle'] } 
          });
        }
        else if (platform === 'containers') dbCount = await MitreTechnique.countDocuments({ platforms: 'Containers' });
        else if (platform === 'officesuite') dbCount = await MitreTechnique.countDocuments({ platforms: 'Office Suite' });
        
        console.log(`${platform.toUpperCase()}:`);
        console.log(`  File: ${fileStats[platform].total} techniques`);
        console.log(`  Database: ${dbCount} techniques`);
        console.log(`  Difference: ${fileStats[platform].total - dbCount}`);
        console.log('');
      }
    }
    
    await mongoose.connection.close();
    
  } catch (error) {
    console.error('❌ Analysis failed:', error);
  }
}

analyzeDataDiscrepancy(); 