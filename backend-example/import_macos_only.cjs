const mongoose = require('mongoose');
const fs = require('fs');
const MitreTechnique = require('./models/MitreTechnique');
require('dotenv').config({ path: './config.env' });

async function importMacOSOnly() {
  try {
    console.log('🔗 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/mitre-shield');
    
    console.log('📖 Reading macOS techniques...');
    const macOSData = JSON.parse(fs.readFileSync('mitreshire_macos_techniques.json', 'utf8'));
    console.log(`📊 Found ${macOSData.length} macOS techniques to process`);
    
    let imported = 0;
    let updated = 0;
    let errors = 0;
    
    for (let i = 0; i < macOSData.length; i++) {
      const technique = macOSData[i];
      
      try {
        // Check if technique already exists
        const existing = await MitreTechnique.findOne({ technique_id: technique.technique_id });
        
        if (existing) {
          // Update existing technique to add macOS platform
          if (!existing.platforms.includes('macOS')) {
            existing.platforms.push('macOS');
            if (!existing.tactics.includes(technique.tactic)) {
              existing.tactics.push(technique.tactic);
            }
            await existing.save();
            updated++;
          }
        } else {
          // Create new technique
          await MitreTechnique.create(technique);
          imported++;
        }
        
        if ((i + 1) % 50 === 0) {
          console.log(`📝 Processed ${i + 1}/${macOSData.length} techniques...`);
        }
        
      } catch (error) {
        errors++;
        if (error.code !== 11000) {
          console.error(`❌ Error with ${technique.technique_id}:`, error.message);
        }
      }
    }
    
    console.log('\n✅ macOS Import Complete!');
    console.log(`📊 Imported: ${imported} new techniques`);
    console.log(`📝 Updated: ${updated} existing techniques`);
    console.log(`❌ Errors: ${errors}`);
    
    await mongoose.connection.close();
    console.log('🔐 Database connection closed');
    
  } catch (error) {
    console.error('❌ Import failed:', error.message);
    process.exit(1);
  }
}

importMacOSOnly(); 