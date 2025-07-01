const mongoose = require('mongoose');
const fs = require('fs');
const MitreTechnique = require('./models/MitreTechnique');
require('dotenv').config({ path: './config.env' });

async function forceImportAllLinux() {
  try {
    console.log('🔗 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/mitre-shield');
    
    console.log('📖 Reading Linux techniques...');
    const linuxData = JSON.parse(fs.readFileSync('mitreshire_linux_techniques.json', 'utf8'));
    console.log(`📊 Found ${linuxData.length} Linux techniques to import`);
    console.log('🎯 Target: Import ALL 428 techniques');
    
    let imported = 0;
    let updated = 0;
    let skipped = 0;
    let errors = 0;
    
    for (let i = 0; i < linuxData.length; i++) {
      const technique = linuxData[i];
      
      try {
        // Check if technique already exists
        const existing = await MitreTechnique.findOne({ technique_id: technique.technique_id });
        
        if (existing) {
          // Update existing technique to add Linux platform
          if (!existing.platforms.includes('Linux')) {
            existing.platforms.push('Linux');
            // Merge tactics if needed
            if (!existing.tactics.includes(technique.tactic)) {
              existing.tactics.push(technique.tactic);
            }
            await existing.save();
            updated++;
          } else {
            skipped++;
          }
        } else {
          // Create new technique (Linux-specific)
          await MitreTechnique.create(technique);
          imported++;
        }
        
        if ((i + 1) % 50 === 0) {
          console.log(`📝 Processed ${i + 1}/${linuxData.length} techniques (${imported} new, ${updated} updated, ${skipped} skipped)...`);
        }
        
      } catch (error) {
        errors++;
        console.error(`❌ Error with ${technique.technique_id}:`, error.message);
      }
    }
    
    console.log('\n✅ Linux Import Complete!');
    console.log(`📊 Imported: ${imported} new Linux techniques`);
    console.log(`📝 Updated: ${updated} existing techniques with Linux platform`);
    console.log(`⏭️ Skipped: ${skipped} already had Linux`);
    console.log(`❌ Errors: ${errors}`);
    console.log(`📋 Total processed: ${imported + updated + skipped + errors}`);
    
    // Verify final counts
    const finalLinuxCount = await MitreTechnique.countDocuments({ platforms: 'Linux' });
    const macOSCount = await MitreTechnique.countDocuments({ platforms: 'macOS' });
    
    console.log(`\n📊 Final Platform Summary:`);
    console.log(`🐧 Linux: ${finalLinuxCount} techniques`);
    console.log(`🍎 macOS: ${macOSCount} techniques`);
    
    if (finalLinuxCount === 428) {
      console.log('🎯 SUCCESS! Linux has exactly 428 techniques as expected!');
    } else {
      console.log(`⚠️ WARNING: Expected 428 Linux techniques, got ${finalLinuxCount}`);
    }
    
    await mongoose.connection.close();
    console.log('🔐 Database connection closed');
    
  } catch (error) {
    console.error('❌ Import failed:', error.message);
    process.exit(1);
  }
}

forceImportAllLinux(); 