const { MongoClient } = require('mongodb');
const fs = require('fs');

async function importContainers() {
    const client = new MongoClient('mongodb://localhost:27017');
    await client.connect();
    const db = client.db('mitre-shield');
    const collection = db.collection('mitretechniques');
    
    console.log('📚 Loading containers data...');
    const data = JSON.parse(fs.readFileSync('../mitreshire_containers_techniques.json', 'utf8'));
    
    console.log(`📦 Found ${data.length} containers techniques`);
    
    // Delete existing containers data
    const deleteResult = await collection.deleteMany({extraction_platform: 'containers'});
    console.log(`🗑️ Deleted ${deleteResult.deletedCount} existing containers techniques`);
    
    // Import new data
    const insertResult = await collection.insertMany(data);
    console.log(`✅ Imported ${insertResult.insertedCount} containers techniques`);
    
    // Verify descriptions
    const withDesc = await collection.countDocuments({
        extraction_platform: 'containers',
        description: {$ne: ''}
    });
    console.log(`📝 ${withDesc}/${insertResult.insertedCount} techniques have descriptions`);
    
    await client.close();
}

importContainers().catch(console.error); 