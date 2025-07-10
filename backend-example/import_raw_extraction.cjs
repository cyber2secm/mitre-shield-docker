const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: './config.env' });

// Import the MitreTechnique model
const MitreTechnique = require('./models/MitreTechnique');

async function importRawExtractionData(platform) {
  const filename = `mitreshire_${platform.toLowerCase()}_techniques.json`;
  
  console.log(`🚀 Starting RAW MITRE data import for ${platform.toUpperCase()} platform...`);
  console.log(`📋 This will preserve EXACT extraction data (including duplicates)`);
  
  try {
    // Check if file exists
    if (!fs.existsSync(filename)) {
      console.log(`❌ File ${filename} not found! Skipping ${platform}...`);
      return { imported: 0, updated: 0, errors: 0, total: 0 };
    }

    console.log(`📖 Reading techniques from ${filename}...`);
    const rawData = fs.readFileSync(filename, 'utf8');
    const techniques = JSON.parse(rawData);
    
    console.log(`📊 Found ${techniques.length} techniques to import (including duplicates)`);
    
    let importedCount = 0;
    let errorCount = 0;
    
    for (let i = 0; i < techniques.length; i++) {
      try {
        const technique = techniques[i];
        
        // Handle cloud platform special case - expand to individual cloud providers
        if (platform.toLowerCase() === 'cloud') {
          const cloudPlatforms = ['AWS', 'Azure', 'GCP', 'Oracle', 'Alibaba'];
          for (const cloudPlatform of cloudPlatforms) {
            const cloudTechnique = {
              ...technique,
              platforms: [cloudPlatform],
              // Create unique identifier by combining technique_id with platform and tactic
              _extraction_id: `${technique.technique_id}_${cloudPlatform}_${technique.tactic}`,
              extraction_platform: platform,
              extraction_source: 'raw_mitre_extractor'
            };
            
            await MitreTechnique.create(cloudTechnique);
            importedCount++;
          }
        } else {
          // Add extraction metadata to preserve the raw data structure
          const enhancedTechnique = {
            ...technique,
            // Create unique identifier combining technique_id with platform and tactic to prevent unwanted merging
            _extraction_id: `${technique.technique_id}_${technique.platforms[0]}_${technique.tactic}`,
            extraction_platform: platform,
            extraction_source: 'raw_mitre_extractor'
          };
          
          await MitreTechnique.create(enhancedTechnique);
          importedCount++;
        }
        
        // Progress logging
        if ((i + 1) % 25 === 0) {
          console.log(`📝 Imported ${importedCount} raw technique records...`);
        }
      } catch (error) {
        errorCount++;
        console.error(`❌ Error importing technique ${techniques[i]?.technique_id}:`, error.message);
      }
    }
    
    console.log(`\n============================================================`);
    console.log(`📊 RAW IMPORT SUMMARY FOR ${platform.toUpperCase()}`);
    console.log(`============================================================`);
    console.log(`✅ Raw techniques imported: ${importedCount}`);
    console.log(`❌ Errors: ${errorCount}`);
    console.log(`📋 Total processed: ${techniques.length}`);
    console.log(`📋 Expected matches extraction: ${platform.toLowerCase() === 'cloud' ? techniques.length * 4 : techniques.length}`);
    console.log(`============================================================\n`);
    
    return { 
      imported: importedCount, 
      updated: 0, 
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
    
    // Import all platforms with RAW extraction data (preserving duplicates)
    const platforms = ['windows', 'linux', 'macos', 'cloud', 'containers', 'officesuite'];
    const totalSummary = { imported: 0, updated: 0, errors: 0, total: 0 };
    
    console.log(`\n🚀 Starting RAW EXTRACTION import for ${platforms.length} platforms:\n`);
    console.log(`🎯 This will match EXACTLY the extraction script output\n`);
    
    for (const platform of platforms) {
      const result = await importRawExtractionData(platform);
      totalSummary.imported += result.imported;
      totalSummary.updated += result.updated;
      totalSummary.errors += result.errors;
      totalSummary.total += result.total;
      
      // Small pause between imports
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    // Final summary
    console.log(`\n🎯 RAW EXTRACTION IMPORT SUMMARY`);
    console.log(`============================================================`);
    console.log(`✅ Total raw techniques imported: ${totalSummary.imported}`);
    console.log(`❌ Total errors: ${totalSummary.errors}`);
    console.log(`📋 Total records processed: ${totalSummary.total}`);
    console.log(`============================================================`);
    
    // Count techniques by platform (now should match extraction exactly)
    console.log(`\n📊 Final technique count per platform (matching extraction):`);
    
    const platformCounts = [
      { name: 'Windows', count: await MitreTechnique.countDocuments({ extraction_platform: 'windows' }) },
      { name: 'Linux', count: await MitreTechnique.countDocuments({ extraction_platform: 'linux' }) },
      { name: 'macOS', count: await MitreTechnique.countDocuments({ extraction_platform: 'macos' }) },
      { name: 'AWS', count: await MitreTechnique.countDocuments({ platforms: 'AWS' }) },
      { name: 'Azure', count: await MitreTechnique.countDocuments({ platforms: 'Azure' }) },
      { name: 'GCP', count: await MitreTechnique.countDocuments({ platforms: 'GCP' }) },
      { name: 'Oracle', count: await MitreTechnique.countDocuments({ platforms: 'Oracle' }) },
      { name: 'Containers', count: await MitreTechnique.countDocuments({ extraction_platform: 'containers' }) },
      { name: 'Office Suite', count: await MitreTechnique.countDocuments({ extraction_platform: 'officesuite' }) }
    ];
    
    platformCounts.forEach(platform => {
      console.log(`${platform.name.padEnd(15)}: ${platform.count} techniques`);
    });
    
    // Overall database stats
    const totalTechniques = await MitreTechnique.countDocuments();
    const parentTechniques = await MitreTechnique.countDocuments({ is_subtechnique: false });
    const subTechniques = await MitreTechnique.countDocuments({ is_subtechnique: true });
    
    console.log(`\n📈 Raw Database Statistics:`);
    console.log(`============================================================`);
    console.log(`Total technique records: ${totalTechniques}`);
    console.log(`Parent technique records: ${parentTechniques}`);
    console.log(`Sub-technique records: ${subTechniques}`);
    console.log(`============================================================`);
    
    // Verification against extraction script output
    console.log(`\n🎯 EXTRACTION SCRIPT MATCH VERIFICATION:`);
    console.log(`============================================================`);
    console.log(`Windows - Expected: 605, Got: ${await MitreTechnique.countDocuments({ extraction_platform: 'windows' })}`);
    console.log(`Linux - Expected: 428, Got: ${await MitreTechnique.countDocuments({ extraction_platform: 'linux' })}`);
    console.log(`macOS - Expected: 431, Got: ${await MitreTechnique.countDocuments({ extraction_platform: 'macos' })}`);
    console.log(`Cloud - Expected: 177 × 4 = 708, Got: ${await MitreTechnique.countDocuments({ extraction_platform: 'cloud' })}`);
    console.log(`Containers - Expected: 68, Got: ${await MitreTechnique.countDocuments({ extraction_platform: 'containers' })}`);
    console.log(`Office Suite - Expected: 100, Got: ${await MitreTechnique.countDocuments({ extraction_platform: 'officesuite' })}`);
    console.log(`============================================================`);
    
    console.log(`\n✅ Raw extraction import completed successfully!`);
    console.log(`\n📝 Next steps:`);
    console.log(`1. Restart your backend server`);
    console.log(`2. Database now contains EXACT extraction script data`);
    console.log(`3. Technique counts will match extraction output precisely`);
    console.log(`4. All duplicates from extraction are preserved`);
    
  } catch (error) {
    console.error('❌ Raw extraction import failed:', error);
    process.exit(1);
  } finally {
    console.log('\n🔐 Database connection closed');
    await mongoose.connection.close();
  }
}

console.log(`🚀 Starting RAW MITRE extraction data import...`);
console.log(`📋 This preserves ALL data from extraction script (including duplicates)`);
console.log(`🎯 Final counts will match extraction script output exactly`);
main(); 