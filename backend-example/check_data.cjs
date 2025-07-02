const { MongoClient } = require('mongodb');

async function checkData() {
    const client = new MongoClient('mongodb://localhost:27017');
    await client.connect();
    const db = client.db('mitre-shield');
    const collection = db.collection('mitretechniques');
    
    console.log('=== DATABASE STATE CHECK ===');
    
    // Total count
    const total = await collection.countDocuments({});
    console.log(`Total techniques: ${total}`);
    
    // Count by platform
    const platforms = await collection.aggregate([
        {$group: {_id: '$extraction_platform', count: {$sum: 1}}}, 
        {$sort: {_id: 1}}
    ]).toArray();
    
    console.log('\nCounts by platform:');
    platforms.forEach(p => console.log(`${p._id || 'null'}: ${p.count}`));
    
    // Sample non-AI technique
    const nonAI = await collection.findOne({extraction_platform: {$ne: 'ai'}});
    if (nonAI) {
        console.log('\nSample non-AI technique:');
        console.log(`ID: ${nonAI.technique_id}`);
        console.log(`Platform: ${nonAI.extraction_platform}`);
        console.log(`Name: ${nonAI.name}`);
        console.log(`Has description: ${nonAI.description ? 'YES' : 'NO'}`);
        if (nonAI.description) {
            console.log(`Description preview: ${nonAI.description.substring(0, 100)}...`);
        }
    }
    
    await client.close();
}

checkData().catch(console.error); 