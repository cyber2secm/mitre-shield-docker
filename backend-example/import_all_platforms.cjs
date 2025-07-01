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
  ['cloud', ['AWS', 'Azure', 'GCP', 'Oracle']], // Cloud expands to multiple platforms
  ['containers', 'Containers'],
  ['officesuite', 'Office Suite']
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
        
        // Handle cloud platform special case
        if (platform.toLowerCase() === 'cloud') {
          technique.platforms = ['AWS', 'Azure', 'GCP', 'Oracle'];
        }
        
        const existingTechnique = await MitreTechnique.findOne({ 
          technique_id: technique.technique_id 
        });
        
        if (existingTechnique) {
          // Update existing technique - merge platforms and tactics
          const newPlatforms = Array.isArray(technique.platforms) ? technique.platforms : [technique.platforms[0]];
          const newTactics = Array.isArray(technique.tactics) ? technique.tactics : [technique.tactic];
          
          // Merge platforms without duplicates
          newPlatforms.forEach(platform => {
            if (!existingTechnique.platforms.includes(platform)) {
              existingTechnique.platforms.push(platform);
            }
          });
          
          // Merge tactics without duplicates
          newTactics.forEach(tactic => {
            if (!existingTechnique.tactics.includes(tactic)) {
              existingTechnique.tactics.push(tactic);
            }
          });
          
          // Update other fields
          existingTechnique.name = technique.name;
          existingTechnique.description = technique.description;
          existingTechnique.last_updated = technique.last_updated;
          existingTechnique.subtechniques = technique.subtechniques || [];
          
          await existingTechnique.save();
          updatedCount++;
        } else {
          // Import new technique
          await MitreTechnique.create(technique);
          importedCount++;
        }
        
        // Progress logging
        if ((i + 1) % 25 === 0) {
          console.log(`📝 Processed ${i + 1}/${techniques.length} techniques...`);
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
    
    // Import all platforms
    const platforms = ['windows', 'linux', 'macos', 'cloud', 'containers', 'officesuite'];
    const totalSummary = { imported: 0, updated: 0, errors: 0, total: 0 };
    
    console.log(`\n🚀 Starting comprehensive import for ${platforms.length} platforms:\n`);
    
    for (const platform of platforms) {
      const result = await importPlatformData(platform);
      totalSummary.imported += result.imported;
      totalSummary.updated += result.updated;
      totalSummary.errors += result.errors;
      totalSummary.total += result.total;
      
      // Small pause between imports
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    // Final summary
    console.log(`\n🎯 COMPREHENSIVE IMPORT SUMMARY`);
    console.log(`============================================================`);
    console.log(`✅ Total new techniques imported: ${totalSummary.imported}`);
    console.log(`📝 Total existing techniques updated: ${totalSummary.updated}`);
    console.log(`❌ Total errors: ${totalSummary.errors}`);
    console.log(`📋 Total records processed: ${totalSummary.total}`);
    console.log(`============================================================`);
    
    // Count techniques by platform
    console.log(`\n📊 Final technique count per platform:`);
    
    const platformCounts = [
      { name: 'Windows', count: await MitreTechnique.countDocuments({ platforms: 'Windows' }) },
      { name: 'Linux', count: await MitreTechnique.countDocuments({ platforms: 'Linux' }) },
      { name: 'macOS', count: await MitreTechnique.countDocuments({ platforms: 'macOS' }) },
      { name: 'AWS', count: await MitreTechnique.countDocuments({ platforms: 'AWS' }) },
      { name: 'Azure', count: await MitreTechnique.countDocuments({ platforms: 'Azure' }) },
      { name: 'GCP', count: await MitreTechnique.countDocuments({ platforms: 'GCP' }) },
      { name: 'Oracle', count: await MitreTechnique.countDocuments({ platforms: 'Oracle' }) },
      { name: 'Containers', count: await MitreTechnique.countDocuments({ platforms: 'Containers' }) },
      { name: 'Office Suite', count: await MitreTechnique.countDocuments({ platforms: 'Office Suite' }) }
    ];
    
    platformCounts.forEach(platform => {
      console.log(`${platform.name.padEnd(15)}: ${platform.count} techniques`);
    });
    
    // Overall database stats
    const totalUniqueTechniques = await MitreTechnique.countDocuments();
    const parentTechniques = await MitreTechnique.countDocuments({ is_subtechnique: false });
    const subTechniques = await MitreTechnique.countDocuments({ is_subtechnique: true });
    
    console.log(`\n📈 Database Statistics:`);
    console.log(`============================================================`);
    console.log(`Total unique techniques: ${totalUniqueTechniques}`);
    console.log(`Parent techniques: ${parentTechniques}`);
    console.log(`Sub-techniques: ${subTechniques}`);
    console.log(`============================================================`);
    
    console.log(`\n✅ Comprehensive import completed successfully!`);
    console.log(`\n📝 Next steps:`);
    console.log(`1. Restart your backend server`);
    console.log(`2. Check the Matrix page in your frontend`);
    console.log(`3. Verify all platform data is displaying correctly`);
    console.log(`4. Test platform filtering for all 6 platforms`);
    console.log(`5. Verify tactic cards show accurate technique counts`);
    
  } catch (error) {
    console.error('❌ Comprehensive import failed:', error);
    process.exit(1);
  } finally {
    console.log('\n🔐 Database connection closed');
    await mongoose.connection.close();
  }
}

console.log(`🚀 Starting comprehensive MITRE data import for ALL platforms...`);
console.log(`📋 Platforms: Windows, Linux, macOS, Cloud (AWS/Azure/GCP/Oracle), Containers, Office Suite`);
main(); 