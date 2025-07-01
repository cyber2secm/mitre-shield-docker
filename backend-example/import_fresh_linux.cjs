const mongoose = require('mongoose');
const fs = require('fs');
const MitreTechnique = require('./models/MitreTechnique');
require('dotenv').config({ path: './config.env' });

async function importFreshLinux() {
  try {
    console.log('🔗 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/mitre-shield');
    
    console.log('📖 Reading fresh Linux extraction data...');
    const linuxData = JSON.parse(fs.readFileSync('mitreshire_linux_techniques.json', 'utf8'));
    console.log(`📊 Found ${linuxData.length} Linux techniques to import`);
    console.log('🎯 Target: Import ALL 428 techniques for exact extraction match');
    
    let imported = 0;
    let updated = 0;
    let errors = 0;
    
    for (let i = 0; i < linuxData.length; i++) {
      const technique = linuxData[i];
      
      try {
        // Check if technique already exists (from macOS or other platforms)
        const existing = await MitreTechnique.findOne({ technique_id: technique.technique_id });
        
        if (existing) {
          // Add Linux to existing technique
          if (!existing.platforms.includes('Linux')) {
            existing.platforms.push('Linux');
          }
          // Merge tactics if needed
          if (!existing.tactics.includes(technique.tactic)) {
            existing.tactics.push(technique.tactic);
          }
          await existing.save();
          updated++;
        } else {
          // Create new Linux technique
          await MitreTechnique.create(technique);
          imported++;
        }
        
        if ((i + 1) % 50 === 0) {
          console.log(`📝 Processed ${i + 1}/${linuxData.length} techniques (${imported} new, ${updated} updated)...`);
        }
        
      } catch (error) {
        errors++;
        if (error.code !== 11000) {
          console.error(`❌ Error with ${technique.technique_id}:`, error.message);
        }
      }
    }
    
    console.log('\n✅ Fresh Linux Import Complete!');
    console.log(`📊 Imported: ${imported} new Linux techniques`);
    console.log(`📝 Updated: ${updated} existing techniques with Linux platform`);
    console.log(`❌ Errors: ${errors}`);
    console.log(`📋 Total processed: ${imported + updated}`);
    
    // Verify final counts match extraction exactly
    const finalLinuxCount = await MitreTechnique.countDocuments({ platforms: 'Linux' });
    const macOSCount = await MitreTechnique.countDocuments({ platforms: 'macOS' });
    
    console.log(`\n📊 Final Platform Summary:`);
    console.log(`🐧 Linux: ${finalLinuxCount} techniques`);
    console.log(`🍎 macOS: ${macOSCount} techniques (preserved)`);
    
    if (finalLinuxCount === 428) {
      console.log('🎯 SUCCESS! Linux has exactly 428 techniques matching extraction!');
    } else {
      console.log(`⚠️ WARNING: Expected 428 Linux techniques, got ${finalLinuxCount}`);
    }
    
    // Verify tactic breakdown matches extraction
    console.log('\n🔍 Verifying tactic breakdown matches extraction...');
    const tactics = await MitreTechnique.aggregate([
      { $match: { platforms: 'Linux' } },
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
    console.log('🎨 Your Linux tactic cards will now display the exact extraction format!');
    
  } catch (error) {
    console.error('❌ Import failed:', error.message);
    process.exit(1);
  }
}

importFreshLinux(); 