const mongoose = require('mongoose');
const fs = require('fs');
const MitreTechnique = require('./models/MitreTechnique');
require('dotenv').config({ path: './config.env' });

async function importIndependentPlatforms() {
  try {
    console.log('🔗 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/mitre-shield');
    
    // Import macOS as completely independent (431 techniques)
    console.log('\n🍎 Importing macOS as independent platform...');
    const macOSData = JSON.parse(fs.readFileSync('mitreshire_macos_techniques.json', 'utf8'));
    console.log(`📊 Found ${macOSData.length} macOS techniques`);
    
    let macOSImported = 0;
    for (let i = 0; i < macOSData.length; i++) {
      const technique = macOSData[i];
      try {
        // Create unique record for macOS platform
        const macOSRecord = {
          ...technique,
          _id: undefined, // Let MongoDB generate new ID
          platform_specific_id: `${technique.technique_id}-macOS`,
          platforms: ['macOS'] // Only macOS platform
        };
        
        await MitreTechnique.create(macOSRecord);
        macOSImported++;
        
        if (macOSImported % 50 === 0) {
          console.log(`📝 Imported ${macOSImported} macOS techniques...`);
        }
      } catch (error) {
        if (error.code !== 11000) {
          console.error(`❌ Error with macOS ${technique.technique_id}:`, error.message);
        }
      }
    }
    
    // Import Linux as completely independent (428 techniques)
    console.log('\n🐧 Importing Linux as independent platform...');
    const linuxData = JSON.parse(fs.readFileSync('mitreshire_linux_techniques.json', 'utf8'));
    console.log(`📊 Found ${linuxData.length} Linux techniques`);
    
    let linuxImported = 0;
    for (let i = 0; i < linuxData.length; i++) {
      const technique = linuxData[i];
      try {
        // Create unique record for Linux platform
        const linuxRecord = {
          ...technique,
          _id: undefined, // Let MongoDB generate new ID
          platform_specific_id: `${technique.technique_id}-Linux`,
          platforms: ['Linux'] // Only Linux platform
        };
        
        await MitreTechnique.create(linuxRecord);
        linuxImported++;
        
        if (linuxImported % 50 === 0) {
          console.log(`📝 Imported ${linuxImported} Linux techniques...`);
        }
      } catch (error) {
        if (error.code !== 11000) {
          console.error(`❌ Error with Linux ${technique.technique_id}:`, error.message);
        }
      }
    }
    
    console.log('\n✅ Independent Platform Import Complete!');
    console.log(`🍎 macOS: ${macOSImported} techniques imported`);
    console.log(`🐧 Linux: ${linuxImported} techniques imported`);
    
    // Verify final counts
    const finalMacOSCount = await MitreTechnique.countDocuments({ platforms: 'macOS' });
    const finalLinuxCount = await MitreTechnique.countDocuments({ platforms: 'Linux' });
    const totalCount = await MitreTechnique.countDocuments({});
    
    console.log(`\n📊 Final Database Counts:`);
    console.log(`🍎 macOS: ${finalMacOSCount} techniques`);
    console.log(`🐧 Linux: ${finalLinuxCount} techniques`);
    console.log(`📋 Total: ${totalCount} records`);
    
    if (finalMacOSCount === 431 && finalLinuxCount === 428) {
      console.log('🎯 SUCCESS! Both platforms have exact extraction counts!');
      console.log('🎨 Frontend will now show:');
      console.log('   🍎 macOS: 431 techniques (exact match)');
      console.log('   🐧 Linux: 428 techniques (exact match)');
    } else {
      console.log(`⚠️ Expected: macOS=431, Linux=428`);
      console.log(`⚠️ Got: macOS=${finalMacOSCount}, Linux=${finalLinuxCount}`);
    }
    
    await mongoose.connection.close();
    console.log('\n🔐 Database connection closed');
    console.log('🎯 Each platform is now completely independent!');
    
  } catch (error) {
    console.error('❌ Import failed:', error.message);
    process.exit(1);
  }
}

importIndependentPlatforms(); 