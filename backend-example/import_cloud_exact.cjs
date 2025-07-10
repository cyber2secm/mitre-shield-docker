const mongoose = require('mongoose');
const fs = require('fs');
require('dotenv').config({ path: './config.env' });

async function importCloudExact() {
  try {
    console.log('🚀 Importing Cloud techniques - EXACT 177 count');
    
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/mitre-shield');
    const MitreTechnique = require('./models/MitreTechnique');
    
    // Read the cloud techniques file
    const cloudData = JSON.parse(fs.readFileSync('mitreshire_cloud_techniques.json', 'utf8'));
    console.log(`📖 Found ${cloudData.length} cloud techniques to import`);
    
    let importCount = 0;
    
    for (const technique of cloudData) {
      try {
        // Import each technique exactly once with all cloud platforms
        const cloudTechnique = {
          ...technique,
          platforms: ['AWS', 'Azure', 'GCP', 'Oracle', 'Alibaba'], // Available on all cloud platforms
          extraction_platform: 'cloud', // Set as cloud extraction
          last_updated: new Date(),
          sync_source: 'exact_cloud_extractor'
        };
        
        await MitreTechnique.create(cloudTechnique);
        importCount++;
        
        if (importCount % 25 === 0) {
          console.log(`📝 Imported ${importCount}/177 cloud techniques...`);
        }
        
      } catch (error) {
        console.error(`❌ Error importing ${technique.technique_id}:`, error.message);
      }
    }
    
    console.log(`\n✅ Successfully imported ${importCount} cloud techniques`);
    
    // Verify the count
    const cloudCount = await MitreTechnique.countDocuments({ extraction_platform: 'cloud' });
    console.log(`📊 Verification: ${cloudCount} cloud techniques in database`);
    
    if (cloudCount === 177) {
      console.log(`🎯 Perfect! Cloud shows exactly 177 as expected`);
    } else {
      console.log(`⚠️ Warning: Expected 177, got ${cloudCount}`);
    }
    
    await mongoose.connection.close();
    console.log('🔐 Database connection closed');
    
  } catch (error) {
    console.error('❌ Import failed:', error);
  }
}

console.log('🚀 Starting EXACT cloud import (177 techniques)...');
importCloudExact(); 