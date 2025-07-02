const { MongoClient } = require('mongodb');
const fs = require('fs');

// Platforms to check and import (excluding AI which is already perfect)
const PLATFORMS = [
    'windows', 'macos', 'linux', 'cloud', 'containers',
    'officesuite', 'identity_provider', 'saas', 'iaas', 'network_devices'
];

async function importCompletedEnhancements() {
    const client = new MongoClient('mongodb://localhost:27017');
    await client.connect();
    const db = client.db('mitre-shield');
    const collection = db.collection('mitretechniques');
    
    console.log('🚀 IMPORTING COMPLETED ENHANCED PLATFORMS');
    console.log('=' * 60);
    
    let totalImported = 0;
    let totalWithDescriptions = 0;
    
    for (const platform of PLATFORMS) {
        const filename = `../mitreshire_${platform}_techniques.json`;
        
        try {
            if (!fs.existsSync(filename)) {
                console.log(`⚠️ ${platform}: File not found`);
                continue;
            }
            
            // Load and check the file
            const data = JSON.parse(fs.readFileSync(filename, 'utf8'));
            const withDescriptions = data.filter(t => t.description && t.description.trim() !== '').length;
            const descriptionPercentage = Math.round((withDescriptions / data.length) * 100);
            
            console.log(`\n📁 ${platform.toUpperCase()}: ${data.length} techniques, ${withDescriptions} with descriptions (${descriptionPercentage}%)`);
            
            // Only import if we have significant descriptions (>50%) or containers which we know is complete
            if (descriptionPercentage > 50 || platform === 'containers') {
                console.log(`🔄 Importing ${platform}...`);
                
                // Add extraction_platform field
                const enhancedData = data.map(tech => ({
                    ...tech,
                    extraction_platform: platform
                }));
                
                // Delete existing data for this platform
                const deleteResult = await collection.deleteMany({extraction_platform: platform});
                console.log(`🗑️ Deleted ${deleteResult.deletedCount} existing ${platform} techniques`);
                
                // Import enhanced data
                const insertResult = await collection.insertMany(enhancedData);
                console.log(`✅ Imported ${insertResult.insertedCount} ${platform} techniques`);
                
                // Verify descriptions in database
                const dbWithDesc = await collection.countDocuments({
                    extraction_platform: platform,
                    description: {$ne: ''}
                });
                console.log(`📝 Database verification: ${dbWithDesc}/${insertResult.insertedCount} have descriptions`);
                
                totalImported += insertResult.insertedCount;
                totalWithDescriptions += dbWithDesc;
                
            } else {
                console.log(`⏳ Skipping ${platform} - still being enhanced (${descriptionPercentage}% complete)`);
            }
            
        } catch (error) {
            console.log(`❌ Error processing ${platform}: ${error.message}`);
        }
    }
    
    console.log(`\n${'=' * 60}`);
    console.log('📊 IMPORT SUMMARY');
    console.log(`✅ Total techniques imported: ${totalImported}`);
    console.log(`📝 Total with descriptions: ${totalWithDescriptions}`);
    console.log(`💯 Description coverage: ${Math.round((totalWithDescriptions/totalImported)*100)}%`);
    
    // Final database verification
    console.log(`\n🔍 OVERALL DATABASE STATE:`);
    const allPlatforms = await collection.aggregate([
        {$group: {
            _id: '$extraction_platform', 
            count: {$sum: 1},
            withDesc: {$sum: {$cond: [{$ne: ['$description', '']}, 1, 0]}}
        }}, 
        {$sort: {_id: 1}}
    ]).toArray();
    
    allPlatforms.forEach(p => {
        const percentage = Math.round((p.withDesc / p.count) * 100);
        console.log(`${p._id}: ${p.withDesc}/${p.count} (${percentage}%)`);
    });
    
    await client.close();
    console.log('\n✅ Import process completed!');
}

importCompletedEnhancements().catch(console.error); 