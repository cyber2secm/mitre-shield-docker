const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: './config.env' });

// Import the MitreTechnique model
const MitreTechnique = require('./models/MitreTechnique');

// Platform mapping for consistency
const PLATFORM_MAPPING = new Map([
  ['windows', 'Windows'],
  ['macos', 'macOS'],
  ['linux', 'Linux'],
  ['aws', 'AWS'],
  ['azure', 'Azure'],
  ['gcp', 'GCP'],
  ['oracle', 'Oracle'],
  ['containers', 'Containers']
]);

async function importPlatformData(platform) {
  const filename = `mitreshire_${platform.toLowerCase()}_techniques.json`;
  
  console.log(`🚀 Starting MITRE data import for ${platform.toUpperCase()} platform...`);
  
  try {
    // Check if file exists
    if (!fs.existsSync(filename)) {
      console.log(`❌ File ${filename} not found! Skipping ${platform}...`);
      return { imported: 0, updated: 0, errors: 0, total: 0 };
    }

    console.log(`📖 Reading techniques from ${filename}...`);
    const rawData = fs.readFileSync(filename, 'utf8');
    const techniques = JSON.parse(rawData);
    
    console.log(`📊 Found ${techniques.length} techniques to import`);
    
    let importedCount = 0;
    let updatedCount = 0;
    let errorCount = 0;
    
    for (let i = 0; i < techniques.length; i++) {
      try {
        const technique = techniques[i];
        
        const existingTechnique = await MitreTechnique.findOne({ 
          technique_id: technique.technique_id 
        });
        
        if (existingTechnique) {
          // Update existing technique - merge platforms if needed
          if (!existingTechnique.platforms.includes(technique.platforms[0])) {
            existingTechnique.platforms.push(...technique.platforms);
          }
          if (!existingTechnique.tactics.includes(technique.tactic)) {
            existingTechnique.tactics.push(technique.tactic);
          }
          
          // Update other fields
          existingTechnique.name = technique.name;
          existingTechnique.description = technique.description;
          existingTechnique.last_updated = technique.last_updated;
          
          await existingTechnique.save();
          updatedCount++;
        } else {
          // Import new technique
          await MitreTechnique.create(technique);
          importedCount++;
        }
        
        // Progress logging
        if ((i + 1) % 50 === 0) {
          if (importedCount > updatedCount) {
            console.log(`📝 Imported ${importedCount} techniques...`);
          } else {
            console.log(`📝 Updated ${updatedCount} techniques...`);
          }
        }
      } catch (error) {
        errorCount++;
        if (error.code === 11000) {
          // Duplicate key error - technique already exists, count as update
          updatedCount++;
          errorCount--;
        } else {
          console.error(`❌ Error importing technique ${techniques[i]?.technique_id}:`, error.message);
        }
      }
    }
    
    console.log(`\n============================================================`);
    console.log(`📊 IMPORT SUMMARY FOR ${platform.toUpperCase()}`);
    console.log(`============================================================`);
    console.log(`✅ New techniques imported: ${importedCount}`);
    console.log(`📝 Existing techniques updated: ${updatedCount}`);
    console.log(`❌ Errors: ${errorCount}`);
    console.log(`📋 Total processed: ${techniques.length}`);
    console.log(`============================================================\n`);
    
    return { 
      imported: importedCount, 
      updated: updatedCount, 
      errors: errorCount, 
      total: techniques.length 
    };
    
  } catch (error) {
    console.error(`❌ Error reading or parsing ${filename}:`, error);
    return { imported: 0, updated: 0, errors: 1, total: 0 };
  }
}

async function main() {
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
    
    // Import all three platforms
    const platforms = ['windows', 'macos', 'linux'];
    const totalSummary = { imported: 0, updated: 0, errors: 0, total: 0 };
    
    for (const platform of platforms) {
      const result = await importPlatformData(platform);
      totalSummary.imported += result.imported;
      totalSummary.updated += result.updated;
      totalSummary.errors += result.errors;
      totalSummary.total += result.total;
    }
    
    // Final summary
    console.log(`\n🎯 OVERALL IMPORT SUMMARY`);
    console.log(`============================================================`);
    console.log(`✅ Total new techniques imported: ${totalSummary.imported}`);
    console.log(`📝 Total existing techniques updated: ${totalSummary.updated}`);
    console.log(`❌ Total errors: ${totalSummary.errors}`);
    console.log(`📋 Total records processed: ${totalSummary.total}`);
    console.log(`============================================================`);
    
    // Count techniques by platform
    console.log(`\n📊 Technique count per platform:`);
    for (const platform of platforms) {
      const count = await MitreTechnique.countDocuments({ 
        platforms: PLATFORM_MAPPING.get(platform.toLowerCase(), platform) 
      });
      console.log(`${PLATFORM_MAPPING.get(platform.toLowerCase(), platform)}: ${count} techniques`);
    }
    
    console.log(`\n✅ Import completed successfully!`);
    console.log(`\n📝 Next steps:`);
    console.log(`1. Restart your backend server`);
    console.log(`2. Check the Matrix page in your frontend`);
    console.log(`3. Verify tactic cards are displaying correctly`);
    console.log(`4. Test platform filtering for all platforms`);
    
  } catch (error) {
    console.error('❌ Import failed:', error);
    process.exit(1);
  } finally {
    console.log('\n🔐 Database connection closed');
    await mongoose.connection.close();
  }
}

// Get platform from command line arguments
const platform = process.argv[2] || 'windows';
const validPlatforms = ['windows', 'macos', 'linux', 'cloud', 'containers'];

if (!validPlatforms.includes(platform.toLowerCase())) {
  console.error('❌ Invalid platform. Valid platforms:', validPlatforms.join(', '));
  console.log('\nUsage:');
  console.log('  node import_mitre_data.cjs <platform> [--clear]');
  console.log('\nExamples:');
  console.log('  node import_mitre_data.cjs windows');
  console.log('  node import_mitre_data.cjs windows --clear  # Clear existing data first');
  process.exit(1);
}

console.log(`🚀 Starting MITRE data import for ${platform.toUpperCase()} platform...`);
main();
