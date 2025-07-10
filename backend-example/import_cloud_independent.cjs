const mongoose = require('mongoose');
const fs = require('fs');
const MitreTechnique = require('./models/MitreTechnique');
require('dotenv').config({ path: './config.env' });

async function importCloudIndependent() {
  try {
    console.log('🔗 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/mitre-shield');
    
    // Import Cloud as completely independent (177 techniques)
    console.log('\n☁️ Importing Cloud as independent platform...');
    const cloudData = JSON.parse(fs.readFileSync('mitreshire_cloud_techniques.json', 'utf8'));
    console.log(`📊 Found ${cloudData.length} Cloud techniques`);
    console.log('🎯 Target: Import ALL 177 techniques for exact extraction match');
    
    let cloudImported = 0;
    for (let i = 0; i < cloudData.length; i++) {
      const technique = cloudData[i];
      try {
        // Create unique record for Cloud platform
        const cloudRecord = {
          ...technique,
          _id: undefined, // Let MongoDB generate new ID
          platform_specific_id: `${technique.technique_id}-Cloud`,
          platforms: technique.platforms // Keep original cloud platforms (AWS, Azure, GCP, Oracle)
        };
        
        await MitreTechnique.create(cloudRecord);
        cloudImported++;
        
        if (cloudImported % 20 === 0) {
          console.log(`📝 Imported ${cloudImported} Cloud techniques...`);
        }
      } catch (error) {
        if (error.code !== 11000) {
          console.error(`❌ Error with Cloud ${technique.technique_id}:`, error.message);
        }
      }
    }
    
    console.log('\n✅ Cloud Import Complete!');
    console.log(`☁️ Cloud: ${cloudImported} techniques imported`);
    
    // Verify final counts for all platforms
    const finalCloudCount = await MitreTechnique.countDocuments({ 
      platforms: { $in: ['AWS', 'Azure', 'GCP', 'Oracle', 'Alibaba'] }
    });
    const finalContainersCount = await MitreTechnique.countDocuments({ platforms: 'Containers' });
    const finalWindowsCount = await MitreTechnique.countDocuments({ platforms: 'Windows' });
    const finalMacOSCount = await MitreTechnique.countDocuments({ platforms: 'macOS' });
    const finalLinuxCount = await MitreTechnique.countDocuments({ platforms: 'Linux' });
    const totalCount = await MitreTechnique.countDocuments({});
    
    console.log(`\n📊 Final Database Counts:`);
    console.log(`☁️ Cloud: ${finalCloudCount} techniques`);
    console.log(`🐳 Containers: ${finalContainersCount} techniques`);
    console.log(`🪟 Windows: ${finalWindowsCount} techniques`);
    console.log(`🍎 macOS: ${finalMacOSCount} techniques`);
    console.log(`🐧 Linux: ${finalLinuxCount} techniques`);
    console.log(`📋 Total: ${totalCount} records`);
    
    if (finalCloudCount === 177 && finalContainersCount === 68 && finalWindowsCount === 605 && finalMacOSCount === 431 && finalLinuxCount === 428) {
      console.log('🎯 SUCCESS! All platforms have exact extraction counts!');
      console.log('🎨 Frontend will now show:');
      console.log('   ☁️ Cloud: 177 techniques (exact match)');
      console.log('   🐳 Containers: 68 techniques (exact match)');
      console.log('   🪟 Windows: 605 techniques (exact match)');
      console.log('   🍎 macOS: 431 techniques (exact match)');
      console.log('   🐧 Linux: 428 techniques (exact match)');
    } else {
      console.log(`⚠️ Expected: Cloud=177, Containers=68, Windows=605, macOS=431, Linux=428`);
      console.log(`⚠️ Got: Cloud=${finalCloudCount}, Containers=${finalContainersCount}, Windows=${finalWindowsCount}, macOS=${finalMacOSCount}, Linux=${finalLinuxCount}`);
    }
    
    // Show Cloud tactic breakdown
    console.log('\n🔍 Cloud tactic breakdown:');
    const tactics = await MitreTechnique.aggregate([
      { $match: { platforms: { $in: ['AWS', 'Azure', 'GCP', 'Oracle', 'Alibaba'] } } },
      { $group: { 
          _id: '$tactic', 
          parent_count: { $sum: { $cond: [{ $eq: ['$is_subtechnique', false] }, 1, 0] } },
          sub_count: { $sum: { $cond: [{ $eq: ['$is_subtechnique', true] }, 1, 0] } },
          total: { $sum: 1 }
        }},
      { $sort: { _id: 1 } }
    ]);
    
    tactics.forEach(tactic => {
      console.log(`  ${tactic._id}: ${tactic.parent_count} techniques (${tactic.sub_count} sub)`);
    });
    
    await mongoose.connection.close();
    console.log('\n🔐 Database connection closed');
    console.log('🎯 All five platforms are now completely independent!');
    
  } catch (error) {
    console.error('❌ Import failed:', error.message);
    process.exit(1);
  }
}

importCloudIndependent(); 