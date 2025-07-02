const { MongoClient } = require('mongodb');
const fs = require('fs');

async function importEnhancedSaas() {
    const client = new MongoClient('mongodb://localhost:27017');
    await client.connect();
    const db = client.db('mitre-shield');
    const collection = db.collection('mitretechniques');
    
    console.log('📚 Loading enhanced SaaS data with descriptions...');
    const data = JSON.parse(fs.readFileSync('../mitreshire_saas_techniques.json', 'utf8'));
    
    console.log(`📦 Found ${data.length} SaaS techniques`);
    
    // Add extraction_platform field to each technique
    const enhancedData = data.map(tech => ({
        ...tech,
        extraction_platform: 'saas'
    }));
    
    // Delete existing SaaS data
    const deleteResult = await collection.deleteMany({extraction_platform: 'saas'});
    console.log(`🗑️ Deleted ${deleteResult.deletedCount} existing SaaS techniques`);
    
    // Import enhanced data
    const insertResult = await collection.insertMany(enhancedData);
    console.log(`✅ Imported ${insertResult.insertedCount} SaaS techniques`);
    
    // Verify descriptions in database
    const withDesc = await collection.countDocuments({
        extraction_platform: 'saas',
        description: {$ne: ''}
    });
    console.log(`📝 ${withDesc}/${insertResult.insertedCount} techniques have descriptions in database`);
    
    await client.close();
    console.log('✅ SaaS import completed!');
}

importEnhancedSaas().catch(console.error); 