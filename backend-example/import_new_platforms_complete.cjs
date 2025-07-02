#!/usr/bin/env node

const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');

// Load environment variables
require('dotenv').config({ path: './config.env' });

// Import the MitreTechnique model
const MitreTechnique = require('./models/MitreTechnique');

// Platform mappings for extraction_platform field
const PLATFORM_MAPPINGS = {
    'Office Suite': 'officesuite',
    'Identity Provider': 'identity_provider', 
    'SaaS': 'saas',
    'IaaS': 'iaas'
};

// File mappings
const PLATFORM_FILES = {
    'Office Suite': '../mitreshire_officesuite_techniques.json',
    'Identity Provider': '../mitreshire_identity_provider_techniques.json', 
    'SaaS': '../mitreshire_saas_techniques.json',
    'IaaS': '../mitreshire_iaas_techniques.json'
};

async function connectDB() {
    try {
        const conn = await mongoose.connect(process.env.MONGODB_URI);
        console.log(`✅ MongoDB connected successfully: ${conn.connection.host}`);
        return true;
    } catch (error) {
        console.error('❌ Database connection failed:', error.message);
        return false;
    }
}

async function importPlatformData(platformName) {
    console.log(`\n🚀 Starting COMPLETE import for ${platformName}...`);
    
    const filePath = path.join(__dirname, PLATFORM_FILES[platformName]);
    const extractionPlatform = PLATFORM_MAPPINGS[platformName];
    
    try {
        // Check if file exists
        if (!fs.existsSync(filePath)) {
            console.log(`❌ File not found: ${filePath}`);
            return { success: false, error: 'File not found' };
        }
        
        // Read and parse the JSON file
        console.log(`📖 Reading data from ${filePath}...`);
        const rawData = fs.readFileSync(filePath, 'utf8');
        const techniques = JSON.parse(rawData);
        
        console.log(`📊 Loaded ${techniques.length} techniques from file`);
        
        // First, clear existing data for this platform
        console.log(`🧹 Clearing existing ${platformName} techniques...`);
        const deleteResult = await MitreTechnique.deleteMany({ 
            extraction_platform: extractionPlatform 
        });
        console.log(`🗑️  Removed ${deleteResult.deletedCount} existing techniques`);
        
        // Process and enhance each technique 
        const enhancedTechniques = techniques.map((technique, index) => ({
            ...technique,
            // Add the extraction_platform field for proper filtering
            extraction_platform: extractionPlatform,
            // Ensure platforms array includes the platform name
            platforms: technique.platforms || [platformName],
            // Ensure required fields have defaults
            data_sources: technique.data_sources || [],
            detection: technique.detection || '',
            detection_rules: technique.detection_rules || [],
            mitre_version: technique.mitre_version || '1.0',
            sync_source: technique.sync_source || 'mitre_extractor',
            last_updated: technique.last_updated ? new Date(technique.last_updated) : new Date(),
            created: technique.created ? new Date(technique.created) : new Date(),
            modified: technique.modified ? new Date(technique.modified) : new Date()
        }));
        
        // Bulk insert the enhanced techniques using composite key for uniqueness
        console.log(`💾 Importing ${enhancedTechniques.length} enhanced techniques (preserving all technique-tactic combinations)...`);
        
        const batchSize = 50;
        let imported = 0;
        let errors = [];
        
        for (let i = 0; i < enhancedTechniques.length; i += batchSize) {
            const batch = enhancedTechniques.slice(i, i + batchSize);
            
            try {
                const operations = batch.map(technique => ({
                    updateOne: {
                        filter: { 
                            technique_id: technique.technique_id,
                            tactic: technique.tactic,
                            extraction_platform: technique.extraction_platform
                        },
                        update: { $set: technique },
                        upsert: true
                    }
                }));
                
                const result = await MitreTechnique.bulkWrite(operations, { ordered: false });
                imported += batch.length;
                
                console.log(`📦 Processed batch ${Math.floor(i/batchSize) + 1}: ${batch.length} techniques`);
                
            } catch (error) {
                console.error(`❌ Error in batch ${Math.floor(i/batchSize) + 1}:`, error.message);
                errors.push({
                    batch: Math.floor(i/batchSize) + 1,
                    error: error.message
                });
            }
        }
        
        // Verify import
        const finalCount = await MitreTechnique.countDocuments({ 
            extraction_platform: extractionPlatform 
        });
        const parentCount = await MitreTechnique.countDocuments({ 
            extraction_platform: extractionPlatform,
            is_subtechnique: false 
        });
        const subCount = await MitreTechnique.countDocuments({ 
            extraction_platform: extractionPlatform,
            is_subtechnique: true 
        });
        
        console.log(`\n✅ ${platformName} COMPLETE import completed:`);
        console.log(`  📊 Techniques imported: ${imported}`);
        console.log(`  🔍 Final count in database: ${finalCount} (${parentCount} parent + ${subCount} sub)`);
        console.log(`  ❌ Errors: ${errors.length}`);
        
        if (errors.length > 0) {
            console.log(`\n⚠️  Import errors for ${platformName}:`);
            errors.forEach(err => {
                console.log(`  Batch ${err.batch}: ${err.error}`);
            });
        }
        
        return {
            success: true,
            imported,
            finalCount,
            parentCount,
            subCount,
            errors: errors.length
        };
        
    } catch (error) {
        console.error(`❌ Failed to import ${platformName}:`, error.message);
        return { success: false, error: error.message };
    }
}

async function importAllPlatforms() {
    console.log('🚀 Starting COMPLETE import for all new platforms (preserving all technique-tactic combinations)...\n');
    
    const results = {};
    
    for (const platformName of Object.keys(PLATFORM_FILES)) {
        try {
            results[platformName] = await importPlatformData(platformName);
        } catch (error) {
            console.error(`❌ Failed to import ${platformName}:`, error.message);
            results[platformName] = { success: false, error: error.message };
        }
    }
    
    // Print final summary
    console.log('\n' + '='.repeat(80));
    console.log('📊 NEW PLATFORMS COMPLETE IMPORT SUMMARY');
    console.log('='.repeat(80));
    
    let totalImported = 0;
    let totalErrors = 0;
    
    for (const [platform, result] of Object.entries(results)) {
        if (result.success) {
            console.log(`✅ ${platform.padEnd(20)}: ${result.finalCount.toString().padStart(3)} total (${result.parentCount.toString().padStart(2)} parent + ${result.subCount.toString().padStart(2)} sub)`);
            totalImported += result.finalCount;
            totalErrors += result.errors;
        } else {
            console.log(`❌ ${platform.padEnd(20)}: FAILED - ${result.error}`);
        }
    }
    
    console.log('='.repeat(80));
    console.log(`📈 Total techniques imported: ${totalImported}`);
    console.log(`⚠️  Total errors: ${totalErrors}`);
    console.log('='.repeat(80));
    
    // Check against expected counts
    const expected = {
        'Office Suite': 100,
        'Identity Provider': 74, // Note: User wants 100, but extraction only found 74
        'SaaS': 83,
        'IaaS': 127
    };
    
    console.log('\n📋 VERIFICATION AGAINST EXTRACTION:');
    console.log('==================================');
    for (const [platform, result] of Object.entries(results)) {
        if (result.success) {
            const expectedCount = expected[platform];
            const actualCount = result.finalCount;
            const status = actualCount === expectedCount ? '✅' : '⚠️';
            console.log(`${status} ${platform.padEnd(20)}: ${actualCount}/${expectedCount}`);
        }
    }
    
    return results;
}

async function main() {
    console.log('🔧 MITRE ATT&CK New Platforms COMPLETE Data Importer');
    console.log('🎯 Platforms: Office Suite, Identity Provider, SaaS, IaaS');
    console.log('📌 Note: This preserves ALL technique-tactic combinations (no deduplication)\n');
    
    // Connect to database
    const connected = await connectDB();
    if (!connected) {
        console.error('❌ Failed to connect to database. Exiting...');
        process.exit(1);
    }
    
    try {
        // Import all platforms
        const results = await importAllPlatforms();
        
        // Check if all imports were successful
        const allSuccessful = Object.values(results).every(r => r.success);
        
        if (allSuccessful) {
            console.log('\n🎉 All platforms imported successfully!');
            console.log('\n📝 Next steps:');
            console.log('1. Restart your MitreShiled server');
            console.log('2. Navigate to the Matrix page');
            console.log('3. Test the new platform filters - you should now see:');
            console.log('   - Office Suite: 100 techniques');
            console.log('   - Identity Provider: 74 techniques (extraction limit)');
            console.log('   - SaaS: 83 techniques');
            console.log('   - IaaS: 127 techniques');
            console.log('4. Note: Identity Provider shows 74 because that\'s what MITRE has');
            console.log('   If you need 100, we may need to check other sources or re-extract');
        } else {
            console.log('\n⚠️  Some imports failed. Check the errors above.');
        }
        
    } catch (error) {
        console.error('❌ Import process failed:', error.message);
        process.exit(1);
    } finally {
        await mongoose.connection.close();
        console.log('\n📡 Database connection closed');
    }
}

// Handle process termination
process.on('SIGINT', async () => {
    console.log('\n⏹️  Process interrupted. Closing database connection...');
    await mongoose.connection.close();
    process.exit(0);
});

// Run the importer
if (require.main === module) {
    main().catch(error => {
        console.error('❌ Fatal error:', error);
        process.exit(1);
    });
}

module.exports = { importAllPlatforms, importPlatformData }; 