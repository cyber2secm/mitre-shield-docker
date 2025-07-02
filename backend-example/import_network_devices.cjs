#!/usr/bin/env node

const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');

// Load environment variables
require('dotenv').config({ path: './config.env' });

// Import the MitreTechnique model
const MitreTechnique = require('./models/MitreTechnique');

// Platform mapping for extraction_platform field
const PLATFORM_MAPPING = 'network_devices';
const PLATFORM_NAME = 'Network Devices';
const TECHNIQUES_FILE = '../mitreshire_network_devices_techniques.json';

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

async function importNetworkDevicesData() {
    console.log(`\n🚀 Starting import for ${PLATFORM_NAME}...`);
    
    const filePath = path.join(__dirname, TECHNIQUES_FILE);
    
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
        console.log(`🧹 Clearing existing ${PLATFORM_NAME} techniques...`);
        const deleteResult = await MitreTechnique.deleteMany({ 
            extraction_platform: PLATFORM_MAPPING 
        });
        console.log(`🗑️  Removed ${deleteResult.deletedCount} existing techniques`);
        
        // Process and enhance each technique
        const enhancedTechniques = techniques.map((technique, index) => ({
            ...technique,
            // Add the extraction_platform field for proper filtering
            extraction_platform: PLATFORM_MAPPING,
            // Ensure platforms array includes the platform name
            platforms: technique.platforms || [PLATFORM_NAME],
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
            extraction_platform: PLATFORM_MAPPING 
        });
        const parentCount = await MitreTechnique.countDocuments({ 
            extraction_platform: PLATFORM_MAPPING,
            is_subtechnique: false 
        });
        const subCount = await MitreTechnique.countDocuments({ 
            extraction_platform: PLATFORM_MAPPING,
            is_subtechnique: true 
        });
        
        console.log(`\n✅ ${PLATFORM_NAME} import completed:`);
        console.log(`  📊 Techniques imported: ${imported}`);
        console.log(`  🔍 Final count in database: ${finalCount} (${parentCount} parent + ${subCount} sub)`);
        console.log(`  ❌ Errors: ${errors.length}`);
        
        if (errors.length > 0) {
            console.log(`\n⚠️  Import errors for ${PLATFORM_NAME}:`);
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
        console.error(`❌ Failed to import ${PLATFORM_NAME}:`, error.message);
        return { success: false, error: error.message };
    }
}

async function main() {
    console.log('🔧 MITRE ATT&CK Network Devices Data Importer');
    console.log('🎯 Platform: Network Devices (routers, switches, load balancers)');
    console.log('📌 Note: This preserves ALL technique-tactic combinations\n');
    
    // Connect to database
    const connected = await connectDB();
    if (!connected) {
        console.error('❌ Failed to connect to database. Exiting...');
        process.exit(1);
    }
    
    try {
        // Import Network Devices platform
        const result = await importNetworkDevicesData();
        
        // Print final summary
        console.log('\n' + '='.repeat(70));
        console.log('📊 NETWORK DEVICES IMPORT SUMMARY');
        console.log('='.repeat(70));
        
        if (result.success) {
            console.log(`✅ ${PLATFORM_NAME}: ${result.finalCount} total (${result.parentCount} parent + ${result.subCount} sub)`);
            console.log(`📈 Total techniques imported: ${result.finalCount}`);
            console.log(`⚠️  Total errors: ${result.errors}`);
            
            console.log('\n📋 VERIFICATION AGAINST EXTRACTION:');
            console.log('==================================');
            const expectedCount = 131; // From extraction output
            const actualCount = result.finalCount;
            const status = actualCount === expectedCount ? '✅' : '⚠️';
            console.log(`${status} ${PLATFORM_NAME}: ${actualCount}/${expectedCount}`);
            
            if (actualCount === expectedCount) {
                console.log('\n🎉 Network Devices imported successfully!');
                console.log('\n📝 Next steps:');
                console.log('1. Restart your MitreShiled server');
                console.log('2. Navigate to the Matrix page');
                console.log('3. Test the Network Devices filter - you should see:');
                console.log('   - Network Devices: 131 techniques (65 parent + 66 sub)');
                console.log('4. The platform should appear in the main navigation');
            } else {
                console.log('\n⚠️  Technique count mismatch - check for data integrity issues');
            }
        } else {
            console.log(`❌ ${PLATFORM_NAME}: FAILED - ${result.error}`);
        }
        
        console.log('='.repeat(70));
        
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

module.exports = { importNetworkDevicesData }; 