#!/usr/bin/env node

/**
 * ATLAS AI Framework Import Script for MitreShiled
 * Imports ATLAS (Adversarial Threat Landscape for AI Systems) data
 * Source: https://github.com/mitre-atlas/atlas-data
 */

require('dotenv').config();
const mongoose = require('mongoose');
const MitreTechnique = require('./models/MitreTechnique');
const fs = require('fs');
const https = require('https');
const yaml = require('js-yaml');

// Database connection
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/mitre-shield';

// ATLAS data URLs
const ATLAS_TACTICS_URL = 'https://raw.githubusercontent.com/mitre-atlas/atlas-data/main/data/tactics.yaml';
const ATLAS_TECHNIQUES_URL = 'https://raw.githubusercontent.com/mitre-atlas/atlas-data/main/data/techniques.yaml';

// Tactic mapping for consistent naming
const TACTIC_MAPPING = {
  'AML.TA0000': 'AI Model Access',
  'AML.TA0001': 'AI Attack Staging', 
  'AML.TA0002': 'Reconnaissance',
  'AML.TA0003': 'Resource Development',
  'AML.TA0004': 'Initial Access',
  'AML.TA0005': 'Execution',
  'AML.TA0006': 'Persistence',
  'AML.TA0007': 'Defense Evasion',
  'AML.TA0008': 'Discovery',
  'AML.TA0009': 'Collection',
  'AML.TA0010': 'Exfiltration',
  'AML.TA0011': 'Impact',
  'AML.TA0012': 'Privilege Escalation',
  'AML.TA0013': 'Credential Access',
  'AML.TA0014': 'Command and Control'
};

// Template reference mapping
const TEMPLATE_MAPPING = {
  'ml_model_access': 'AML.TA0000',
  'ml_attack_staging': 'AML.TA0001',
  'reconnaissance': 'AML.TA0002',
  'resource_development': 'AML.TA0003',
  'initial_access': 'AML.TA0004',
  'execution': 'AML.TA0005',
  'persistence': 'AML.TA0006',
  'defense_evasion': 'AML.TA0007',
  'discovery': 'AML.TA0008',
  'collection': 'AML.TA0009',
  'exfiltration': 'AML.TA0010',
  'impact': 'AML.TA0011',
  'privilege_escalation': 'AML.TA0012',
  'credential_access': 'AML.TA0013',
  'command_and_control': 'AML.TA0014'
};

/**
 * Fetch data from URL
 */
function fetchData(url) {
  return new Promise((resolve, reject) => {
    https.get(url, (response) => {
      let data = '';
      
      response.on('data', (chunk) => {
        data += chunk;
      });
      
      response.on('end', () => {
        try {
          resolve(data);
        } catch (error) {
          reject(error);
        }
      });
    }).on('error', (error) => {
      reject(error);
    });
  });
}

/**
 * Parse YAML data
 */
function parseYamlData(yamlString) {
  try {
    return yaml.load(yamlString);
  } catch (error) {
    console.error('YAML parsing error:', error);
    return null;
  }
}

/**
 * Resolve tactic references
 */
function resolveTacticReference(tacticRef) {
  // Direct tactic ID reference
  if (tacticRef.startsWith('AML.TA')) {
    return tacticRef;
  }
  
  // Template reference like {{ml_model_access.id}}
  if (tacticRef.includes('{{') && tacticRef.includes('}}')) {
    const templateName = tacticRef.replace('{{', '').replace('}}', '').replace('.id', '');
    return TEMPLATE_MAPPING[templateName] || null;
  }
  
  return null;
}

/**
 * Map ATLAS technique to MitreShiled schema
 */
function mapAtlasTechnique(technique, tacticsData, allTechniques = []) {
  const techId = technique.id || '';
  const techName = technique.name || '';
  const description = technique.description || '';
  const tacticRefs = technique.tactics || [];
  
  // Determine if it's a sub-technique
  const techParts = techId.split('.');
  const isSubtechnique = techParts.length > 2;
  
  // Resolve parent technique for sub-techniques
  let parentTechniqueId = null;
  if (isSubtechnique) {
    parentTechniqueId = techParts.slice(0, 2).join('.');
  }
  
  // Resolve tactic references
  const resolvedTactics = [];
  const tacticNames = [];
  
  for (const tacticRef of tacticRefs) {
    const resolvedTacticId = resolveTacticReference(tacticRef);
    if (resolvedTacticId && TACTIC_MAPPING[resolvedTacticId]) {
      resolvedTactics.push(resolvedTacticId);
      tacticNames.push(TACTIC_MAPPING[resolvedTacticId]);
    }
  }
  
  // If no tactics found and this is a sub-technique, inherit from parent
  if (tacticNames.length === 0 && isSubtechnique && parentTechniqueId) {
    const parentTechnique = allTechniques.find(t => t.id === parentTechniqueId);
    if (parentTechnique && parentTechnique.tactics && parentTechnique.tactics.length > 0) {
      for (const tacticRef of parentTechnique.tactics) {
        const resolvedTacticId = resolveTacticReference(tacticRef);
        if (resolvedTacticId && TACTIC_MAPPING[resolvedTacticId]) {
          resolvedTactics.push(resolvedTacticId);
          tacticNames.push(TACTIC_MAPPING[resolvedTacticId]);
        }
      }
    }
  }
  
  // Use the first tactic as primary tactic
  const primaryTactic = tacticNames[0] || 'Unknown';
  
  return {
    technique_id: techId,
    name: techName,
    description: description,
    tactic: primaryTactic,
    tactics: tacticNames,
    platforms: ['AI'], // ATLAS is AI/ML specific
    data_sources: [], // Will be populated later if available
    detection: '', // Will be populated later if available
    detection_rules: [],
    is_subtechnique: isSubtechnique,
    parent_technique: parentTechniqueId ? TACTIC_MAPPING[parentTechniqueId] : null,
    parent_technique_id: parentTechniqueId,
    mitre_version: '1.0',
    stix_id: technique.stix_id || '',
    sync_source: 'atlas_import',
    extraction_platform: 'ai',
    complexity: 'Medium', // Default for ATLAS techniques
    impact_level: 'High', // AI attacks typically have high impact
    detection_difficulty: 'Hard', // AI attacks are generally hard to detect
    ai_specific: true // This is AI-specific framework
  };
}

/**
 * Import ATLAS data
 */
async function importAtlasData() {
  console.log('🚀 Starting ATLAS AI Framework Import');
  console.log('=' * 60);
  
  try {
    // Connect to MongoDB
    console.log('📡 Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');
    
    // Fetch ATLAS data
    console.log('\n🔍 Fetching ATLAS tactics data...');
    const tacticsYaml = await fetchData(ATLAS_TACTICS_URL);
    const tacticsData = parseYamlData(tacticsYaml);
    
    console.log('🔍 Fetching ATLAS techniques data...');
    const techniquesYaml = await fetchData(ATLAS_TECHNIQUES_URL);
    const techniquesData = parseYamlData(techniquesYaml);
    
    if (!tacticsData || !techniquesData) {
      throw new Error('Failed to parse ATLAS YAML data');
    }
    
    console.log(`✅ Loaded ${tacticsData.length} tactics and ${techniquesData.length} techniques`);
    
    // Clear existing ATLAS data
    console.log('\n🗑️ Clearing existing ATLAS data...');
    const deleteResult = await MitreTechnique.deleteMany({ 
      extraction_platform: 'ai',
      ai_specific: true 
    });
    console.log(`✅ Deleted ${deleteResult.deletedCount} existing ATLAS records`);
    
    // Process and import techniques
    console.log('\n📥 Processing ATLAS techniques...');
    const processedTechniques = [];
    let successCount = 0;
    let errorCount = 0;
    
    for (const technique of techniquesData) {
      try {
        const mappedTechnique = mapAtlasTechnique(technique, tacticsData, techniquesData);
        
        // Validate required fields
        if (!mappedTechnique.technique_id || !mappedTechnique.name) {
          console.log(`⚠️ Skipping technique with missing required fields: ${technique.id || 'Unknown'}`);
          errorCount++;
          continue;
        }
        
        processedTechniques.push(mappedTechnique);
        console.log(`  ✅ Processed: ${mappedTechnique.technique_id} - ${mappedTechnique.name}`);
        successCount++;
        
      } catch (error) {
        console.error(`❌ Error processing technique ${technique.id || 'Unknown'}:`, error.message);
        errorCount++;
      }
    }
    
    // Bulk insert techniques
    if (processedTechniques.length > 0) {
      console.log(`\n💾 Inserting ${processedTechniques.length} ATLAS techniques...`);
      await MitreTechnique.insertMany(processedTechniques);
      console.log(`✅ Successfully inserted ${processedTechniques.length} ATLAS techniques`);
    }
    
    // Verification
    console.log('\n🔍 Verifying import...');
    const importedCount = await MitreTechnique.countDocuments({ 
      extraction_platform: 'ai',
      ai_specific: true 
    });
    
    // Get statistics by tactic
    const tacticStats = await MitreTechnique.aggregate([
      { 
        $match: { 
          extraction_platform: 'ai',
          ai_specific: true 
        } 
      },
      { 
        $group: { 
          _id: '$tactic', 
          count: { $sum: 1 } 
        } 
      },
      { $sort: { _id: 1 } }
    ]);
    
    console.log(`\n📊 ATLAS Import Summary:`);
    console.log(`-`.repeat(60));
    console.log(`✅ Total techniques imported: ${importedCount}`);
    console.log(`✅ Successfully processed: ${successCount}`);
    console.log(`❌ Errors: ${errorCount}`);
    console.log(`\n📈 Techniques by Tactic:`);
    
    for (const stat of tacticStats) {
      console.log(`  ${stat._id}: ${stat.count} techniques`);
    }
    
    // Save summary to file
    const summary = {
      timestamp: new Date().toISOString(),
      total_imported: importedCount,
      success_count: successCount,
      error_count: errorCount,
      tactics_stats: tacticStats,
      framework: 'ATLAS',
      extraction_platform: 'ai'
    };
    
    fs.writeFileSync('atlas_import_summary.json', JSON.stringify(summary, null, 2));
    console.log(`\n💾 Import summary saved to: atlas_import_summary.json`);
    
  } catch (error) {
    console.error('❌ Import failed:', error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Disconnected from MongoDB');
  }
}

/**
 * Main execution
 */
if (require.main === module) {
  importAtlasData()
    .then(() => {
      console.log('\n🎉 ATLAS import completed successfully!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Fatal error:', error);
      process.exit(1);
    });
}

module.exports = { importAtlasData }; 