const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: './backend-example/config.env' });

// Import the MitreTechnique model
const MitreTechnique = require('./backend-example/models/MitreTechnique');

async function importMitreData(platform = 'windows') {
  try {
    // Connect to MongoDB
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/mitre-shield';
    console.log(`🔗 Connecting to MongoDB: ${mongoUri}`);
    
    await mongoose.connect(mongoUri, {
      maxPoolSize: 20,
      serverSelectionTimeoutMS: 10000,
      socketTimeoutMS: 45000,
      maxIdleTimeMS: 30000,
      family: 4
    });
    
    console.log('✅ Connected to MongoDB');
    
    // Read the techniques file
    const filename = `mitreshire_${platform.toLowerCase()}_techniques.json`;
    const filePath = path.join(__dirname, filename);
    
    if (!fs.existsSync(filePath)) {
      console.error(`❌ File not found: ${filename}`);
      console.log(`Please run: python3 mitre_data_extractor.py ${platform}`);
      process.exit(1);
    }
    
    console.log(`📖 Reading techniques from ${filename}...`);
    const techniques = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    
    console.log(`📊 Found ${techniques.length} techniques to import`);
    
    // Clear existing techniques for this platform (optional)
    if (process.argv.includes('--clear')) {
      console.log(`🗑️ Clearing existing ${platform} techniques...`);
      const deleteResult = await MitreTechnique.deleteMany({ 
        platforms: platform === 'cloud' ? { $in: ['AWS', 'Azure', 'GCP', 'Oracle'] } : platform
      });
      console.log(`🗑️ Removed ${deleteResult.deletedCount} existing techniques`);
    }
    
    // Import techniques
    let imported = 0;
    let updated = 0;
    let errors = 0;
    
    for (const technique of techniques) {
      try {
        // Check if technique already exists
        const existing = await MitreTechnique.findOne({ technique_id: technique.technique_id });
        
        if (existing) {
          // Update existing technique
          await MitreTechnique.findOneAndUpdate(
            { technique_id: technique.technique_id },
            { $set: technique },
            { upsert: true }
          );
          updated++;
          if (updated % 50 === 0) {
            console.log(`📝 Updated ${updated} techniques...`);
          }
        } else {
          // Create new technique
          await MitreTechnique.create(technique);
          imported++;
          if (imported % 50 === 0) {
            console.log(`📝 Imported ${imported} techniques...`);
          }
        }
      } catch (error) {
        console.error(`❌ Error processing ${technique.technique_id}: ${error.message}`);
        errors++;
      }
    }
    
    console.log('\n' + '='.repeat(60));
    console.log(`📊 IMPORT SUMMARY FOR ${platform.toUpperCase()}`);
    console.log('='.repeat(60));
    console.log(`✅ New techniques imported: ${imported}`);
    console.log(`📝 Existing techniques updated: ${updated}`);
    console.log(`❌ Errors: ${errors}`);
    console.log(`📋 Total processed: ${imported + updated + errors}`);
    console.log('='.repeat(60));
    
    // Verify import by counting techniques per tactic
    console.log('\n📊 Technique count per tactic:');
    const tactics = await MitreTechnique.aggregate([
      { $match: { platforms: platform === 'cloud' ? { $in: ['AWS', 'Azure', 'GCP', 'Oracle'] } : platform } },
      { $group: { _id: '$tactic', count: { $sum: 1 } } },
      { $sort: { _id: 1 } }
    ]);
    
    for (const tactic of tactics) {
      console.log(`  ${tactic._id}: ${tactic.count} techniques`);
    }
    
    console.log('\n✅ Import completed successfully!');
    console.log('\n📝 Next steps:');
    console.log('1. Restart your backend server');
    console.log('2. Check the Matrix page in your frontend');
    console.log('3. Verify tactic cards are displaying correctly');
    console.log(`4. Test platform filtering for ${platform}`);
    
  } catch (error) {
    console.error('❌ Import failed:', error);
    process.exit(1);
  } finally {
    // Close the connection
    await mongoose.connection.close();
    console.log('\n🔐 Database connection closed');
  }
}

// Get platform from command line arguments
const platform = process.argv[2] || 'windows';
const validPlatforms = ['windows', 'macos', 'linux', 'cloud', 'containers'];

if (!validPlatforms.includes(platform.toLowerCase())) {
  console.error('❌ Invalid platform. Valid platforms:', validPlatforms.join(', '));
  console.log('\nUsage:');
  console.log('  node import_mitre_data.js <platform> [--clear]');
  console.log('\nExamples:');
  console.log('  node import_mitre_data.js windows');
  console.log('  node import_mitre_data.js windows --clear  # Clear existing data first');
  process.exit(1);
}

console.log(`🚀 Starting MITRE data import for ${platform.toUpperCase()} platform...`);
importMitreData(platform);
