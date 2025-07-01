const mongoose = require('mongoose');
const fs = require('fs');
const MitreTechnique = require('./models/MitreTechnique');
require('dotenv').config({ path: './config.env' });

async function importLinuxOnly() {
  try {
    console.log('🔗 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/mitre-shield');
    
    console.log('📖 Reading Linux techniques...');
    const linuxData = JSON.parse(fs.readFileSync('mitreshire_linux_techniques.json', 'utf8'));
    console.log(`📊 Found ${linuxData.length} Linux techniques to import`);
    
    let imported = 0;
    let updated = 0;
    let errors = 0;
    
    for (let i = 0; i < linuxData.length; i++) {
      const technique = linuxData[i];
      
      try {
        // Check if technique already exists (from macOS or other platforms)
        const existing = await MitreTechnique.findOne({ technique_id: technique.technique_id });
        
        if (existing) {
          // Update existing technique to add Linux platform
          if (!existing.platforms.includes('Linux')) {
            existing.platforms.push('Linux');
            // Also add Linux-specific tactics if not present
            if (!existing.tactics.includes(technique.tactic)) {
              existing.tactics.push(technique.tactic);
            }
            await existing.save();
            updated++;
          }
        } else {
          // Create new technique (Linux-specific)
          await MitreTechnique.create(technique);
          imported++;
        }
        
        if ((i + 1) % 50 === 0) {
          console.log(`📝 Processed ${i + 1}/${linuxData.length} techniques...`);
        }
        
      } catch (error) {
        errors++;
        if (error.code !== 11000) {
          console.error(`❌ Error with ${technique.technique_id}:`, error.message);
        }
      }
    }
    
    console.log('\n✅ Linux Import Complete!');
    console.log(`📊 Imported: ${imported} new Linux techniques`);
    console.log(`📝 Updated: ${updated} existing techniques with Linux platform`);
    console.log(`❌ Errors: ${errors}`);
    
    // Verify both platforms exist
    const macOSCount = await MitreTechnique.countDocuments({ platforms: 'macOS' });
    const linuxCount = await MitreTechnique.countDocuments({ platforms: 'Linux' });
    
    console.log(`\n📊 Platform Summary:`);
    console.log(`🍎 macOS: ${macOSCount} techniques`);
    console.log(`🐧 Linux: ${linuxCount} techniques`);
    
    await mongoose.connection.close();
    console.log('🔐 Database connection closed');
    
  } catch (error) {
    console.error('❌ Import failed:', error.message);
    process.exit(1);
  }
}

importLinuxOnly(); 