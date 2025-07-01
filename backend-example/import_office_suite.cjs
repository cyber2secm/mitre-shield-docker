#!/usr/bin/env node

const mongoose = require('mongoose');
require('dotenv').config({ path: './config.env' });

const MitreTechnique = require('./models/MitreTechnique');
const fs = require('fs');
const path = require('path');

// MongoDB connection
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/mitreshire';

async function importOfficeSupertTechniques() {
  console.log('🔗 Connecting to MongoDB...');
  await mongoose.connect(MONGODB_URI);
  console.log('✅ Connected to MongoDB');

  // Load Office Suite techniques
  const techniquesPath = path.join(__dirname, '..', 'mitreshire_officesuite_techniques.json');
  
  if (!fs.existsSync(techniquesPath)) {
    console.error('❌ Office Suite techniques file not found:', techniquesPath);
    console.log('📝 Please run: python3 mitre_data_extractor.py officesuite');
    process.exit(1);
  }

  const techniques = JSON.parse(fs.readFileSync(techniquesPath, 'utf8'));
  console.log(`📊 Found ${techniques.length} Office Suite techniques to import`);

  let importCount = 0;
  let updateCount = 0;
  let errorCount = 0;

  console.log('🚀 Starting Office Suite techniques import...');
  
  for (const technique of techniques) {
    try {
      // Check if technique already exists
      const existing = await MitreTechnique.findOne({ 
        technique_id: technique.technique_id 
      });

      if (existing) {
        // Update existing technique to add Office Suite platform
        if (!existing.platforms.includes('Office Suite')) {
          existing.platforms.push('Office Suite');
          
          // Add Office Suite tactics if not already present
          if (technique.tactics) {
            for (const tactic of technique.tactics) {
              if (!existing.tactics.includes(tactic)) {
                existing.tactics.push(tactic);
              }
            }
          }
          
          await existing.save();
          updateCount++;
          console.log(`🔄 Updated ${technique.technique_id}: ${technique.name}`);
        } else {
          console.log(`⏭️  Skipped ${technique.technique_id}: Office Suite already supported`);
        }
      } else {
        // Create new technique
        const newTechnique = new MitreTechnique(technique);
        await newTechnique.save();
        importCount++;
        console.log(`✅ Imported ${technique.technique_id}: ${technique.name}`);
      }
    } catch (error) {
      errorCount++;
      console.error(`❌ Error processing ${technique.technique_id}:`, error.message);
    }
  }

  console.log('\n📊 Office Suite Import Summary:');
  console.log(`✅ New techniques imported: ${importCount}`);
  console.log(`🔄 Existing techniques updated: ${updateCount}`);
  console.log(`❌ Errors: ${errorCount}`);
  console.log(`📋 Total processed: ${techniques.length}`);

  // Verify the import
  console.log('\n🔍 Verifying Office Suite techniques in database...');
  const officeSupertTechniques = await MitreTechnique.find({ 
    platforms: 'Office Suite' 
  });
  
  console.log(`✅ Found ${officeSupertTechniques.length} techniques with Office Suite platform`);
  
  // Count by tactic
  const tacticCounts = {};
  officeSupertTechniques.forEach(tech => {
    const tactic = tech.tactic;
    tacticCounts[tactic] = (tacticCounts[tactic] || 0) + 1;
  });
  
  console.log('\n📊 Office Suite techniques by tactic:');
  Object.entries(tacticCounts).sort().forEach(([tactic, count]) => {
    console.log(`  ${tactic}: ${count} techniques`);
  });

  console.log('\n🎉 Office Suite import completed successfully!');
  console.log('\n📝 Next steps:');
  console.log('1. Restart your frontend and backend servers');
  console.log('2. Navigate to Matrix → Cloud → Office Suite');
  console.log('3. Verify tactic cards show correct technique counts');
  
  await mongoose.disconnect();
}

// Handle errors
process.on('unhandledRejection', (err) => {
  console.error('💥 Unhandled Promise Rejection:', err);
  process.exit(1);
});

// Run the import
importOfficeSupertTechniques().catch(err => {
  console.error('💥 Import failed:', err);
  process.exit(1);
}); 