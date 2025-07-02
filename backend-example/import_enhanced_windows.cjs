const { MongoClient } = require('mongodb');
const fs = require('fs');

async function importEnhancedWindows() {
    const client = new MongoClient('mongodb://localhost:27017');
    await client.connect();
    const db = client.db('mitre-shield');
    const collection = db.collection('mitretechniques');
    
    console.log('📚 Loading enhanced Windows data with descriptions...');
    const data = JSON.parse(fs.readFileSync('../mitreshire_windows_techniques.json', 'utf8'));
    
    console.log(`📦 Found ${data.length} Windows techniques`);
    
    // Count techniques with descriptions
    const withDescriptions = data.filter(tech => tech.description && tech.description.trim() !== '').length;
    console.log(`📝 ${withDescriptions}/${data.length} techniques have descriptions (${Math.round((withDescriptions/data.length)*100)}%)`);
    
    // Add extraction_platform field to each technique
    const enhancedData = data.map(tech => ({
        ...tech,
        extraction_platform: 'windows'
    }));
    
    // Delete existing Windows data
    const deleteResult = await collection.deleteMany({extraction_platform: 'windows'});
    console.log(`🗑️ Deleted ${deleteResult.deletedCount} existing Windows techniques`);
    
    // Import enhanced data
    const insertResult = await collection.insertMany(enhancedData);
    console.log(`✅ Imported ${insertResult.insertedCount} Windows techniques`);
    
    // Verify descriptions in database
    const dbWithDesc = await collection.countDocuments({
        extraction_platform: 'windows',
        description: {$ne: ''}
    });
    console.log(`📝 Database verification: ${dbWithDesc}/${insertResult.insertedCount} have descriptions`);
    console.log(`💯 Description coverage: ${Math.round((dbWithDesc/insertResult.insertedCount)*100)}%`);
    
    await client.close();
    console.log('✅ Windows import completed!');
    
    return {
        imported: insertResult.insertedCount,
        withDescriptions: dbWithDesc,
        percentage: Math.round((dbWithDesc/insertResult.insertedCount)*100)
    };
}

if (require.main === module) {
    importEnhancedWindows()
        .then(result => {
            console.log('\n📊 IMPORT SUMMARY:');
            console.log(`✅ Imported: ${result.imported} techniques`);
            console.log(`📝 With descriptions: ${result.withDescriptions} (${result.percentage}%)`);
        })
        .catch(error => {
            console.error('❌ Import failed:', error);
            process.exit(1);
        });
}

module.exports = importEnhancedWindows; 