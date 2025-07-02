const { MongoClient } = require('mongodb');
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Database configuration
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/mitre-shield';
const DB_NAME = 'mitre-shield';
const COLLECTION_NAME = 'mitretechniques';

// Platforms to extract (excluding 'ai' as requested)
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

async function extractPlatformData(platform) {
    console.log(`\n📊 Extracting ${platform.toUpperCase()} techniques with descriptions...`);
    
    try {
        const command = `python3 mitre_data_extractor.py ${platform} mitreshire --descriptions`;
        console.log(`🔄 Running: ${command}`);
        
        // Run extraction with timeout of 20 minutes per platform
        execSync(command, { 
            cwd: process.cwd(),
            stdio: 'inherit',
            timeout: 1200000 // 20 minutes
        });
        
        console.log(`✅ Extraction completed for ${platform}`);
        return true;
    } catch (error) {
        console.error(`❌ Extraction failed for ${platform}:`, error.message);
        return false;
    }
}

async function importPlatformTechniques(platform) {
    const filename = `mitreshire_${platform}_techniques.json`;
    
    if (!fs.existsSync(filename)) {
        console.error(`❌ File not found: ${filename}`);
        return { success: false, imported: 0 };
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
        
        // Remove existing techniques for this platform
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
            console.log(`📖 ${techniquesWithDescriptions} techniques have descriptions`);
            
            await client.close();
            return { success: true, imported: insertResult.insertedCount, withDescriptions: techniquesWithDescriptions };
        } else {
            await client.close();
            return { success: true, imported: 0, withDescriptions: 0 };
        }
        
    } catch (error) {
        console.error(`❌ Import failed for ${platform}:`, error.message);
        return { success: false, imported: 0 };
    }
}

async function main() {
    console.log('🚀 Starting enhanced MITRE data extraction and import with descriptions...');
    console.log(`📋 Processing ${PLATFORMS.length} platforms: ${PLATFORMS.join(', ')}`);
    console.log('⚠️ This will take a significant amount of time due to description fetching');
    
    const results = {
        extracted: 0,
        imported: 0,
        withDescriptions: 0,
        failed: []
    };
    
    for (const platform of PLATFORMS) {
        console.log(`\n${'='.repeat(60)}`);
        console.log(`🎯 Processing platform: ${platform.toUpperCase()}`);
        console.log(`${'='.repeat(60)}`);
        
        // Extract data with descriptions
        const extractSuccess = await extractPlatformData(platform);
        
        if (extractSuccess) {
            results.extracted++;
            
            // Import the extracted data
            const importResult = await importPlatformTechniques(platform);
            
            if (importResult.success) {
                results.imported += importResult.imported;
                results.withDescriptions += importResult.withDescriptions || 0;
            } else {
                results.failed.push(platform);
            }
        } else {
            results.failed.push(platform);
        }
        
        // Add a small delay between platforms to be respectful
        if (PLATFORMS.indexOf(platform) < PLATFORMS.length - 1) {
            console.log('⏳ Waiting 30 seconds before next platform...');
            await new Promise(resolve => setTimeout(resolve, 30000));
        }
    }
    
    // Print final summary
    console.log('\n' + '='.repeat(70));
    console.log('📊 ENHANCED MITRE EXTRACTION & IMPORT SUMMARY');
    console.log('='.repeat(70));
    console.log(`✅ Platforms successfully extracted: ${results.extracted}/${PLATFORMS.length}`);
    console.log(`✅ Total techniques imported: ${results.imported}`);
    console.log(`📖 Techniques with descriptions: ${results.withDescriptions}`);
    console.log(`❌ Failed platforms: ${results.failed.length > 0 ? results.failed.join(', ') : 'None'}`);
    console.log('='.repeat(70));
    
    if (results.failed.length > 0) {
        console.log('\n⚠️ Some platforms failed. You may want to retry them individually.');
        process.exit(1);
    } else {
        console.log('\n🎉 All platforms processed successfully!');
        console.log('💡 Remember: AI platform was not touched as requested');
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