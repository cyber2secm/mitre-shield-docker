const mongoose = require('mongoose');
const fs = require('fs');
const MitreTechnique = require('./models/MitreTechnique');
require('dotenv').config({ path: './config.env' });

async function importContainersIndependent() {
  try {
    console.log('🔗 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/mitre-shield');
    
    // Import Containers as completely independent (68 techniques)
    console.log('\n🐳 Importing Containers as independent platform...');
    const containersData = JSON.parse(fs.readFileSync('mitreshire_containers_techniques.json', 'utf8'));
    console.log(`📊 Found ${containersData.length} Containers techniques`);
    console.log('🎯 Target: Import ALL 68 techniques for exact extraction match');
    
    let containersImported = 0;
    for (let i = 0; i < containersData.length; i++) {
      const technique = containersData[i];
      try {
        // Create unique record for Containers platform
        const containersRecord = {
          ...technique,
          _id: undefined, // Let MongoDB generate new ID
          platform_specific_id: `${technique.technique_id}-Containers`,
          platforms: ['Containers'] // Only Containers platform
        };
        
        await MitreTechnique.create(containersRecord);
        containersImported++;
        
        if (containersImported % 10 === 0) {
          console.log(`📝 Imported ${containersImported} Containers techniques...`);
        }
      } catch (error) {
        if (error.code !== 11000) {
          console.error(`❌ Error with Containers ${technique.technique_id}:`, error.message);
        }
      }
    }
    
    console.log('\n✅ Containers Import Complete!');
    console.log(`🐳 Containers: ${containersImported} techniques imported`);
    
    // Verify final counts for all platforms
    const finalContainersCount = await MitreTechnique.countDocuments({ platforms: 'Containers' });
    const finalWindowsCount = await MitreTechnique.countDocuments({ platforms: 'Windows' });
    const finalMacOSCount = await MitreTechnique.countDocuments({ platforms: 'macOS' });
    const finalLinuxCount = await MitreTechnique.countDocuments({ platforms: 'Linux' });
    const totalCount = await MitreTechnique.countDocuments({});
    
    console.log(`\n📊 Final Database Counts:`);
    console.log(`🐳 Containers: ${finalContainersCount} techniques`);
    console.log(`🪟 Windows: ${finalWindowsCount} techniques`);
    console.log(`🍎 macOS: ${finalMacOSCount} techniques`);
    console.log(`🐧 Linux: ${finalLinuxCount} techniques`);
    console.log(`📋 Total: ${totalCount} records`);
    
    if (finalContainersCount === 68 && finalWindowsCount === 605 && finalMacOSCount === 431 && finalLinuxCount === 428) {
      console.log('🎯 SUCCESS! All platforms have exact extraction counts!');
      console.log('🎨 Frontend will now show:');
      console.log('   🐳 Containers: 68 techniques (exact match)');
      console.log('   🪟 Windows: 605 techniques (exact match)');
      console.log('   🍎 macOS: 431 techniques (exact match)');
      console.log('   🐧 Linux: 428 techniques (exact match)');
    } else {
      console.log(`⚠️ Expected: Containers=68, Windows=605, macOS=431, Linux=428`);
      console.log(`⚠️ Got: Containers=${finalContainersCount}, Windows=${finalWindowsCount}, macOS=${finalMacOSCount}, Linux=${finalLinuxCount}`);
    }
    
    // Show Containers tactic breakdown
    console.log('\n🔍 Containers tactic breakdown:');
    const tactics = await MitreTechnique.aggregate([
      { $match: { platforms: 'Containers' } },
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
    console.log('🎯 All four platforms are now completely independent!');
    
  } catch (error) {
    console.error('❌ Import failed:', error.message);
    process.exit(1);
  }
}

importContainersIndependent(); 