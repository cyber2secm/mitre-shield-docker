const { MongoClient } = require('mongodb');
const fs = require('fs');

// Database configuration
const MONGODB_URI = 'mongodb://localhost:27017/mitre-shield';

// Platform mapping (extracted platforms to DB platform names)
const PLATFORM_MAPPING = {
    'windows': 'windows',
    'macos': 'macos', 
    'linux': 'linux',
    'cloud': 'cloud',
    'containers': 'containers',
    'officesuite': 'officesuite',
    'identity_provider': 'identity_provider',
    'saas': 'saas',
    'iaas': 'iaas',
    'network_devices': 'network_devices'
};

async function importAllPlatforms() {
    console.log('🚀 Starting comprehensive platform import (excluding AI)...');
    
    const client = new MongoClient(MONGODB_URI);
    await client.connect();
    const db = client.db('mitre-shield');
    const collection = db.collection('mitretechniques');
    
    let totalImported = 0;
    let totalWithDescriptions = 0;
    
    for (const [platformKey, dbPlatform] of Object.entries(PLATFORM_MAPPING)) {
        const filename = `../mitreshire_${platformKey}_techniques.json`;
        
        console.log(`\n📁 Processing ${platformKey}...`);
        
        try {
            // Check if file exists
            if (!fs.existsSync(filename)) {
                console.log(`⚠️ File not found: ${filename}`);
                continue;
            }
            
            // Load data
            const rawData = JSON.parse(fs.readFileSync(filename, 'utf8'));
            console.log(`📊 Loaded ${rawData.length} techniques from ${filename}`);
            
            // Transform data to add extraction_platform
            const transformedData = rawData.map(tech => ({
                ...tech,
                extraction_platform: dbPlatform
            }));
            
            // Delete existing platform data
            const deleteResult = await collection.deleteMany({extraction_platform: dbPlatform});
            console.log(`🗑️ Deleted ${deleteResult.deletedCount} existing ${platformKey} techniques`);
            
            // Import new data
            if (transformedData.length > 0) {
                const insertResult = await collection.insertMany(transformedData);
                console.log(`✅ Imported ${insertResult.insertedCount} ${platformKey} techniques`);
                
                // Count descriptions
                const withDesc = transformedData.filter(t => t.description && t.description.trim() !== '').length;
                console.log(`📝 ${withDesc}/${insertResult.insertedCount} techniques have descriptions`);
                
                totalImported += insertResult.insertedCount;
                totalWithDescriptions += withDesc;
            }
            
        } catch (error) {
            console.log(`❌ Error processing ${platformKey}:`, error.message);
        }
    }
    
    console.log(`\n🎉 IMPORT COMPLETE!`);
    console.log(`📊 Total imported: ${totalImported} techniques`);
    console.log(`📝 Total with descriptions: ${totalWithDescriptions} techniques`);
    console.log(`💯 Description coverage: ${Math.round(totalWithDescriptions/totalImported*100)}%`);
    
    // Verify AI platform is still intact
    const aiCount = await collection.countDocuments({extraction_platform: 'ai'});
    console.log(`🤖 AI platform verified: ${aiCount} techniques preserved`);
    
    await client.close();
}

importAllPlatforms().catch(console.error); 