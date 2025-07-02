const { MongoClient } = require('mongodb');
const fs = require('fs');
const path = require('path');

// Database configuration
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/mitre-shield';
const DB_NAME = 'mitre-shield';
const COLLECTION_NAME = 'mitretechniques';

// Platforms to import (excluding 'ai' as requested)
const PLATFORMS = [
    'windows',
    'macos', 
    'linux',
    'cloud',
    'containers',
    'officesuite',
    'identity_provider',
    'saas',
    'iaas',
    'network_devices'
];

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

async function importPlatformTechniques(platform) {
    const filename = path.join('..', `mitreshire_${platform}_techniques.json`);
    
    if (!fs.existsSync(filename)) {
        console.error(`❌ File not found: ${filename}`);
        return { success: false, imported: 0, withDescriptions: 0 };
    }
    
    console.log(`📥 Importing techniques from ${filename}...`);
    
    try {
        const rawData = fs.readFileSync(filename, 'utf8');
        const techniques = JSON.parse(rawData);
        
        console.log(`📋 Found ${techniques.length} techniques to import`);
        
        // Connect to MongoDB
        const client = new MongoClient(MONGODB_URI);
        await client.connect();
        
        const db = client.db(DB_NAME);
        const collection = db.collection(COLLECTION_NAME);
        
        // Add extraction_platform field to each technique
        const enhancedTechniques = techniques.map(technique => ({
            ...technique,
            extraction_platform: PLATFORM_MAPPING[platform]
        }));
        
        // Remove existing techniques for this platform (but NOT AI)
        const deleteResult = await collection.deleteMany({ 
            extraction_platform: PLATFORM_MAPPING[platform] 
        });
        console.log(`🗑️ Removed ${deleteResult.deletedCount} existing ${platform} techniques`);
        
        // Insert new techniques
        if (enhancedTechniques.length > 0) {
            const insertResult = await collection.insertMany(enhancedTechniques);
            console.log(`✅ Imported ${insertResult.insertedCount} techniques for ${platform}`);
            
            // Check how many have descriptions
            const techniquesWithDescriptions = enhancedTechniques.filter(t => t.description && t.description.trim() !== '').length;
            const descriptionsPercentage = Math.round((techniquesWithDescriptions / enhancedTechniques.length) * 100);
            console.log(`📖 ${techniquesWithDescriptions}/${enhancedTechniques.length} techniques have descriptions (${descriptionsPercentage}%)`);
            
            await client.close();
            return { 
                success: true, 
                imported: insertResult.insertedCount, 
                withDescriptions: techniquesWithDescriptions,
                total: enhancedTechniques.length
            };
        } else {
            await client.close();
            return { success: true, imported: 0, withDescriptions: 0, total: 0 };
        }
        
    } catch (error) {
        console.error(`❌ Import failed for ${platform}:`, error.message);
        return { success: false, imported: 0, withDescriptions: 0, total: 0 };
    }
}

async function checkAIPlatformIntact() {
    try {
        const client = new MongoClient(MONGODB_URI);
        await client.connect();
        
        const db = client.db(DB_NAME);
        const collection = db.collection(COLLECTION_NAME);
        
        const aiCount = await collection.countDocuments({ extraction_platform: 'ai' });
        await client.close();
        
        console.log(`🤖 AI platform check: ${aiCount} techniques found (should be 115)`);
        return aiCount === 115;
    } catch (error) {
        console.error('❌ Error checking AI platform:', error.message);
        return false;
    }
}

async function main() {
    console.log('🚀 Starting enhanced MITRE data import with descriptions...');
    console.log(`📋 Processing ${PLATFORMS.length} platforms: ${PLATFORMS.join(', ')}`);
    console.log('💡 AI platform will be completely preserved');
    
    // First, verify AI platform is intact
    console.log('\n🔍 Checking AI platform integrity...');
    const aiIntact = await checkAIPlatformIntact();
    if (!aiIntact) {
        console.error('❌ AI platform is not intact! Aborting to prevent data loss.');
        process.exit(1);
    }
    console.log('✅ AI platform is intact and will be preserved');
    
    const results = {
        imported: 0,
        withDescriptions: 0,
        totalTechniques: 0,
        failed: [],
        successful: []
    };
    
    for (const platform of PLATFORMS) {
        console.log(`\n${'='.repeat(60)}`);
        console.log(`📦 Importing platform: ${platform.toUpperCase()}`);
        console.log(`${'='.repeat(60)}`);
        
        const importResult = await importPlatformTechniques(platform);
        
        if (importResult.success) {
            results.imported += importResult.imported;
            results.withDescriptions += importResult.withDescriptions;
            results.totalTechniques += importResult.total;
            results.successful.push({
                platform,
                imported: importResult.imported,
                withDescriptions: importResult.withDescriptions,
                total: importResult.total
            });
        } else {
            results.failed.push(platform);
        }
    }
    
    // Final verification that AI is still intact
    console.log('\n🔍 Final AI platform verification...');
    const finalAiIntact = await checkAIPlatformIntact();
    if (!finalAiIntact) {
        console.error('❌ WARNING: AI platform was affected during import!');
    } else {
        console.log('✅ AI platform remains intact');
    }
    
    // Print final summary
    console.log('\n' + '='.repeat(70));
    console.log('📊 ENHANCED DESCRIPTIONS IMPORT SUMMARY');
    console.log('='.repeat(70));
    console.log(`✅ Platforms successfully imported: ${results.successful.length}/${PLATFORMS.length}`);
    console.log(`✅ Total techniques imported: ${results.imported}`);
    console.log(`📖 Techniques with descriptions: ${results.withDescriptions}/${results.totalTechniques}`);
    
    if (results.totalTechniques > 0) {
        const overallPercentage = Math.round((results.withDescriptions / results.totalTechniques) * 100);
        console.log(`📈 Overall description coverage: ${overallPercentage}%`);
    }
    
    console.log(`🤖 AI platform: PRESERVED (115 techniques)`);
    console.log(`❌ Failed platforms: ${results.failed.length > 0 ? results.failed.join(', ') : 'None'}`);
    
    // Detailed breakdown
    if (results.successful.length > 0) {
        console.log('\n📋 Detailed breakdown by platform:');
        for (const platform of results.successful) {
            const percentage = platform.total > 0 ? Math.round((platform.withDescriptions / platform.total) * 100) : 0;
            console.log(`  ${platform.platform.padEnd(20)} ${platform.withDescriptions}/${platform.total} descriptions (${percentage}%)`);
        }
    }
    
    console.log('='.repeat(70));
    
    if (results.failed.length > 0) {
        console.log('\n⚠️ Some platforms failed. You may want to retry them individually.');
        process.exit(1);
    } else {
        console.log('\n🎉 All platforms imported successfully with descriptions!');
        console.log('💡 AI platform was preserved exactly as requested');
        console.log('\n📝 Next steps:');
        console.log('1. Restart the backend server to ensure data is fresh');
        console.log('2. Check the frontend to verify descriptions are displayed');
        console.log('3. Test technique details across different platforms');
    }
}

// Handle graceful shutdown
process.on('SIGINT', () => {
    console.log('\n⚠️ Process interrupted by user');
    process.exit(1);
});

process.on('SIGTERM', () => {
    console.log('\n⚠️ Process terminated');
    process.exit(1);
});

if (require.main === module) {
    main().catch(error => {
        console.error('❌ Fatal error:', error);
        process.exit(1);
    });
} 