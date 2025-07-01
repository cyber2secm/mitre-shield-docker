const mongoose = require('mongoose');
const fs = require('fs');
const MitreTechnique = require('./models/MitreTechnique');
require('dotenv').config({ path: './config.env' });

async function importWindowsIndependent() {
  try {
    console.log('🔗 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/mitre-shield');
    
    // Import Windows as completely independent (605 techniques)
    console.log('\n🪟 Importing Windows as independent platform...');
    const windowsData = JSON.parse(fs.readFileSync('mitreshire_windows_techniques.json', 'utf8'));
    console.log(`📊 Found ${windowsData.length} Windows techniques`);
    console.log('🎯 Target: Import ALL 605 techniques for exact extraction match');
    
    let windowsImported = 0;
    for (let i = 0; i < windowsData.length; i++) {
      const technique = windowsData[i];
      try {
        // Create unique record for Windows platform
        const windowsRecord = {
          ...technique,
          _id: undefined, // Let MongoDB generate new ID
          platform_specific_id: `${technique.technique_id}-Windows`,
          platforms: ['Windows'] // Only Windows platform
        };
        
        await MitreTechnique.create(windowsRecord);
        windowsImported++;
        
        if (windowsImported % 50 === 0) {
          console.log(`📝 Imported ${windowsImported} Windows techniques...`);
        }
      } catch (error) {
        if (error.code !== 11000) {
          console.error(`❌ Error with Windows ${technique.technique_id}:`, error.message);
        }
      }
    }
    
    console.log('\n✅ Windows Import Complete!');
    console.log(`🪟 Windows: ${windowsImported} techniques imported`);
    
    // Verify final counts for all platforms
    const finalWindowsCount = await MitreTechnique.countDocuments({ platforms: 'Windows' });
    const finalMacOSCount = await MitreTechnique.countDocuments({ platforms: 'macOS' });
    const finalLinuxCount = await MitreTechnique.countDocuments({ platforms: 'Linux' });
    const totalCount = await MitreTechnique.countDocuments({});
    
    console.log(`\n📊 Final Database Counts:`);
    console.log(`🪟 Windows: ${finalWindowsCount} techniques`);
    console.log(`🍎 macOS: ${finalMacOSCount} techniques`);
    console.log(`🐧 Linux: ${finalLinuxCount} techniques`);
    console.log(`📋 Total: ${totalCount} records`);
    
    if (finalWindowsCount === 605 && finalMacOSCount === 431 && finalLinuxCount === 428) {
      console.log('🎯 SUCCESS! All platforms have exact extraction counts!');
      console.log('🎨 Frontend will now show:');
      console.log('   🪟 Windows: 605 techniques (exact match)');
      console.log('   🍎 macOS: 431 techniques (exact match)');
      console.log('   🐧 Linux: 428 techniques (exact match)');
    } else {
      console.log(`⚠️ Expected: Windows=605, macOS=431, Linux=428`);
      console.log(`⚠️ Got: Windows=${finalWindowsCount}, macOS=${finalMacOSCount}, Linux=${finalLinuxCount}`);
    }
    
    // Show Windows tactic breakdown
    console.log('\n🔍 Windows tactic breakdown:');
    const tactics = await MitreTechnique.aggregate([
      { $match: { platforms: 'Windows' } },
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
    console.log('🎯 All three platforms are now completely independent!');
    
  } catch (error) {
    console.error('❌ Import failed:', error.message);
    process.exit(1);
  }
}

importWindowsIndependent(); 