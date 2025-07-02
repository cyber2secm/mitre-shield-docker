const MitreTechnique = require('../models/MitreTechnique');

class MitreDataProcessor {
  constructor() {
    // Enhanced platform mapping including AI/ML specific platforms
    this.platformMapping = {
      // Official MITRE platforms
      'Windows': ['Windows'],
      'macOS': ['macOS'],
      'Linux': ['Linux'],
      'AWS': ['AWS'],
      'Azure': ['Azure'],
      'GCP': ['GCP'],
      'Google Cloud Platform': ['GCP'],
      'Azure AD': ['Azure'],
      'Office 365': ['Azure'],
      'Containers': ['Containers'],
      'Docker': ['Containers'],
      'Kubernetes': ['Containers'],
      
      // AI/ML specific mappings
      'AI': ['AI'],
      'Machine Learning': ['AI'],
      'Artificial Intelligence': ['AI'],
      'ML Models': ['AI'],
      'Neural Networks': ['AI'],
      'Deep Learning': ['AI'],
      
      // Network and infrastructure
      'Network': ['Network Devices'],
      'Network Devices': ['Network Devices'],
      'IaaS': ['AWS', 'Azure', 'GCP'],
      'SaaS': ['Azure', 'AWS', 'GCP'],
      'PRE': ['Network Devices']
    };

    // AI/ML specific techniques that should be tagged with AI platform
    this.aiRelatedKeywords = [
      'machine learning', 'ml model', 'neural network', 'artificial intelligence',
      'deep learning', 'ai model', 'algorithm', 'training data', 'model inference',
      'model serving', 'jupyter', 'python script', 'data science', 'tensorflow',
      'pytorch', 'scikit-learn', 'model deployment', 'feature engineering',
      'data pipeline', 'model monitoring', 'model drift', 'adversarial', 'evasion attack'
    ];

    // Tactic ID to name mapping
    this.tacticMapping = {
      'TA0001': 'Initial Access',
      'TA0002': 'Execution', 
      'TA0003': 'Persistence',
      'TA0004': 'Privilege Escalation',
      'TA0005': 'Defense Evasion',
      'TA0006': 'Credential Access',
      'TA0007': 'Discovery',
      'TA0008': 'Lateral Movement',
      'TA0009': 'Collection',
      'TA0010': 'Exfiltration',
      'TA0011': 'Command and Control',
      'TA0040': 'Impact'
    };
  }

  /**
   * Process and enhance MITRE techniques with platform-specific data
   */
  async processAndStoreTechniques(techniques) {
    console.log(`🔄 Processing ${techniques.length} MITRE techniques...`);
    
    const enhancedTechniques = [];
    const aiTechniques = [];
    
    for (const technique of techniques) {
      try {
        // Enhance technique with proper platform mapping
        const enhanced = await this.enhanceTechnique(technique);
        enhancedTechniques.push(enhanced);
        
        // Check if this technique is AI/ML related
        if (this.isAIRelated(technique)) {
          const aiVersion = await this.createAIVariant(enhanced);
          aiTechniques.push(aiVersion);
        }
        
      } catch (error) {
        console.warn(`⚠️ Error processing technique ${technique.technique_id}:`, error.message);
      }
    }
    
    // Store all enhanced techniques
    const allTechniques = [...enhancedTechniques, ...aiTechniques];
    console.log(`📦 Created ${enhancedTechniques.length} standard techniques and ${aiTechniques.length} AI-specific techniques`);
    
    return await this.bulkStoreTechniques(allTechniques);
  }

  /**
   * Enhance individual technique with better platform mapping and data
   */
  async enhanceTechnique(technique) {
    // Normalize and enhance platforms
    const enhancedPlatforms = this.normalizePlatforms(technique.platforms || []);
    
    // Enhance tactic information
    const enhancedTactics = this.normalizeTactics(technique.tactics || []);
    
    // Set primary tactic (first one) and tactics array
    const primaryTactic = enhancedTactics.length > 0 ? enhancedTactics[0] : 'Unknown';
    
    // Extract and enhance detection information
    const detectionData = this.extractDetectionInfo(technique);
    
    return {
      technique_id: technique.technique_id,
      name: technique.name,
      description: technique.description || '',
      platforms: enhancedPlatforms,
      tactic: primaryTactic, // Primary tactic for Matrix display
      tactics: enhancedTactics, // All applicable tactics
      data_sources: technique.data_sources || [],
      detection: detectionData.detection,
      detection_rules: detectionData.rules,
      is_subtechnique: technique.is_subtechnique || false,
      parent_technique: technique.parent_technique,
      mitre_version: technique.version || '1.0',
      created: technique.created,
      modified: technique.modified,
      stix_id: technique.stix_id,
      last_updated: new Date(),
      sync_source: 'mitre_taxii_enhanced',
      // Additional metadata
      complexity: this.assessComplexity(technique),
      impact_level: this.assessImpact(technique),
      detection_difficulty: this.assessDetectionDifficulty(technique)
    };
  }

  /**
   * Create AI/ML specific variant of technique
   */
  async createAIVariant(technique) {
    return {
      ...technique,
      technique_id: `${technique.technique_id}-AI`,
      name: `${technique.name} (AI/ML Context)`,
      description: this.enhanceDescriptionForAI(technique.description),
      platforms: ['AI', ...technique.platforms.filter(p => p !== 'AI')],
      tactic: technique.tactic, // Keep the same primary tactic
      tactics: technique.tactics,
      data_sources: [...technique.data_sources, 'ML Model Logs', 'Training Data', 'Model Metrics'],
      detection: this.enhanceDetectionForAI(technique.detection),
      ai_specific: true,
      parent_technique_id: technique.technique_id
    };
  }

  /**
   * Check if technique is AI/ML related
   */
  isAIRelated(technique) {
    const text = `${technique.name} ${technique.description}`.toLowerCase();
    return this.aiRelatedKeywords.some(keyword => text.includes(keyword));
  }

  /**
   * Normalize platforms with enhanced mapping
   */
  normalizePlatforms(platforms) {
    const normalized = new Set();
    
    for (const platform of platforms) {
      const mapped = this.platformMapping[platform];
      if (mapped) {
        mapped.forEach(p => normalized.add(p));
      } else {
        // Keep unknown platforms as-is but clean them up
        normalized.add(this.cleanPlatformName(platform));
      }
    }
    
    return Array.from(normalized);
  }

  /**
   * Normalize tactic names
   */
  normalizeTactics(tactics) {
    return tactics.map(tactic => {
      // If it's a tactic ID, convert to name
      if (this.tacticMapping[tactic]) {
        return this.tacticMapping[tactic];
      }
      // Otherwise clean up the name
      return this.cleanTacticName(tactic);
    }).filter(Boolean);
  }

  /**
   * Extract detection information from technique
   */
  extractDetectionInfo(technique) {
    const detection = technique.detection || '';
    const rules = [];
    
    // Extract potential detection rules from description and detection fields
    const text = `${technique.description} ${detection}`.toLowerCase();
    
    // Look for common detection patterns
    if (text.includes('process creation') || text.includes('process monitoring')) {
      rules.push('Process Creation Monitoring');
    }
    if (text.includes('network traffic') || text.includes('network connection')) {
      rules.push('Network Traffic Analysis');
    }
    if (text.includes('file') || text.includes('registry')) {
      rules.push('File System Monitoring');
    }
    if (text.includes('authentication') || text.includes('login')) {
      rules.push('Authentication Log Analysis');
    }
    
    return {
      detection,
      rules: [...new Set(rules)] // Remove duplicates
    };
  }

  /**
   * Enhance description for AI/ML context
   */
  enhanceDescriptionForAI(description) {
    return `${description}\n\nAI/ML Context: This technique may be applied against machine learning systems, AI models, or data science environments. Consider model poisoning, adversarial examples, data exfiltration from training datasets, and attacks on ML pipelines.`;
  }

  /**
   * Enhance detection for AI/ML context
   */
  enhanceDetectionForAI(detection) {
    const aiDetection = `\n\nAI/ML Detection: Monitor model performance metrics, training data access, model serving logs, unusual data science tool usage, and anomalous model inference patterns.`;
    return detection + aiDetection;
  }

  /**
   * Assess technique complexity
   */
  assessComplexity(technique) {
    const description = technique.description?.toLowerCase() || '';
    
    if (description.includes('advanced') || description.includes('sophisticated') || 
        description.includes('complex') || technique.is_subtechnique) {
      return 'High';
    } else if (description.includes('simple') || description.includes('basic')) {
      return 'Low';
    }
    return 'Medium';
  }

  /**
   * Assess potential impact
   */
  assessImpact(technique) {
    const text = `${technique.name} ${technique.description}`.toLowerCase();
    
    if (text.includes('destroy') || text.includes('delete') || text.includes('wipe') || 
        text.includes('ransom') || text.includes('encrypt')) {
      return 'High';
    } else if (text.includes('access') || text.includes('credential') || text.includes('escalat')) {
      return 'Medium';
    }
    return 'Low';
  }

  /**
   * Assess detection difficulty
   */
  assessDetectionDifficulty(technique) {
    const text = `${technique.name} ${technique.description}`.toLowerCase();
    
    if (text.includes('stealth') || text.includes('hidden') || text.includes('evasion') || 
        text.includes('obfuscat') || text.includes('bypass')) {
      return 'Hard';
    } else if (text.includes('obvious') || text.includes('clear') || text.includes('direct')) {
      return 'Easy';
    }
    return 'Medium';
  }

  /**
   * Clean platform name
   */
  cleanPlatformName(platform) {
    return platform.trim()
      .replace(/[^\w\s-]/g, '') // Remove special chars except dash
      .replace(/\s+/g, ' ')     // Normalize whitespace
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
  }

  /**
   * Clean tactic name
   */
  cleanTacticName(tactic) {
    return tactic.trim()
      .replace(/[^\w\s-]/g, '')
      .replace(/\s+/g, ' ')
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
  }

  /**
   * Bulk store techniques with proper handling of duplicates
   */
  async bulkStoreTechniques(techniques) {
    const batchSize = 50;
    let processed = 0;
    let created = 0;
    let updated = 0;
    let errors = [];

    // Process in batches to avoid memory issues
    for (let i = 0; i < techniques.length; i += batchSize) {
      const batch = techniques.slice(i, i + batchSize);
      
      try {
        const operations = batch.map(technique => ({
          updateOne: {
            filter: { technique_id: technique.technique_id },
            update: { $set: technique },
            upsert: true
          }
        }));

        const result = await MitreTechnique.bulkWrite(operations, { ordered: false });
        
        created += result.upsertedCount || 0;
        updated += result.modifiedCount || 0;
        processed += batch.length;
        
        console.log(`📊 Processed batch ${Math.floor(i/batchSize) + 1}: ${batch.length} techniques`);
        
      } catch (error) {
        console.error(`❌ Error processing batch starting at ${i}:`, error.message);
        errors.push({
          batch: Math.floor(i/batchSize) + 1,
          error: error.message
        });
      }
    }

    console.log(`✅ Bulk technique storage complete: ${created} created, ${updated} updated, ${processed} total processed`);
    
    return {
      processed,
      created,
      updated,
      errors,
      success: errors.length === 0
    };
  }

  /**
   * Generate AI-specific techniques based on common AI/ML attack patterns
   */
  async generateAISpecificTechniques() {
    const aiTechniques = [
      {
        technique_id: 'T1001.AI-001',
        name: 'Model Poisoning',
        description: 'Adversaries may inject malicious data into training datasets to compromise machine learning model behavior and predictions.',
        platforms: ['AI'],
        tactic: 'Defense Evasion', // Primary tactic
        tactics: ['Defense Evasion', 'Impact'],
        data_sources: ['Training Data', 'Model Performance Metrics', 'Data Pipeline Logs'],
        detection: 'Monitor training data sources, validate data integrity, track model performance degradation, and implement data provenance tracking.',
        is_subtechnique: false,
        ai_specific: true,
        complexity: 'High',
        impact_level: 'High',
        detection_difficulty: 'Hard'
      },
      {
        technique_id: 'T1001.AI-002', 
        name: 'Adversarial Examples',
        description: 'Adversaries may craft specific inputs designed to fool machine learning models into making incorrect predictions or classifications.',
        platforms: ['AI'],
        tactic: 'Defense Evasion', // Primary tactic
        tactics: ['Defense Evasion'],
        data_sources: ['Model Inference Logs', 'Input Data', 'Model Output'],
        detection: 'Implement input validation, monitor for unusual input patterns, use adversarial detection models, and track confidence scores.',
        is_subtechnique: false,
        ai_specific: true,
        complexity: 'High',
        impact_level: 'Medium',
        detection_difficulty: 'Hard'
      },
      {
        technique_id: 'T1001.AI-003',
        name: 'Model Inversion',
        description: 'Adversaries may exploit ML models to extract sensitive information about training data or reconstruct private data.',
        platforms: ['AI'],
        tactic: 'Collection', // Primary tactic
        tactics: ['Collection', 'Credential Access'],
        data_sources: ['Model Queries', 'API Logs', 'Model Response Patterns'],
        detection: 'Monitor query patterns, implement differential privacy, track repeated similar queries, and limit model exposure.',
        is_subtechnique: false,
        ai_specific: true,
        complexity: 'High',
        impact_level: 'High',
        detection_difficulty: 'Medium'
      },
      {
        technique_id: 'T1001.AI-004',
        name: 'Model Extraction',
        description: 'Adversaries may query a machine learning model systematically to create a functionally equivalent copy.',
        platforms: ['AI'],
        tactic: 'Collection', // Primary tactic
        tactics: ['Collection', 'Exfiltration'],
        data_sources: ['API Query Logs', 'Model Response Logs', 'Network Traffic'],
        detection: 'Monitor query volume and patterns, implement rate limiting, track model access patterns, and detect systematic querying.',
        is_subtechnique: false,
        ai_specific: true,
        complexity: 'Medium',
        impact_level: 'High',
        detection_difficulty: 'Medium'
      },
      {
        technique_id: 'T1001.AI-005',
        name: 'Backdoor Injection',
        description: 'Adversaries may embed hidden functionality in machine learning models that can be triggered by specific inputs.',
        platforms: ['AI'],
        tactic: 'Persistence', // Primary tactic
        tactics: ['Persistence', 'Defense Evasion'],
        data_sources: ['Model Code', 'Training Process', 'Model Behavior Analysis'],
        detection: 'Implement model integrity checking, monitor for unexpected behavior patterns, validate model source code, and use model verification techniques.',
        is_subtechnique: false,
        ai_specific: true,
        complexity: 'High',
        impact_level: 'High',
        detection_difficulty: 'Hard'
      }
    ];

    // Store AI-specific techniques
    return await this.bulkStoreTechniques(aiTechniques.map(technique => ({
      ...technique,
      created: new Date(),
      modified: new Date(),
      last_updated: new Date(),
      sync_source: 'ai_specific_generated',
      mitre_version: '1.0',
      stix_id: `ai-technique-${technique.technique_id}`
    })));
  }

  /**
   * Get platform-specific technique statistics
   */
  async getPlatformStats() {
    try {
      // Use extraction_platform field to get correct counts that match extraction script output
      const extractionStats = await MitreTechnique.aggregate([
        {
          $match: {
            extraction_platform: { $exists: true }
          }
        },
        {
          $group: {
            _id: '$extraction_platform',
            totalTechniques: { $sum: 1 },
            tactics: { $addToSet: '$tactic' },
            complexities: { $addToSet: '$complexity' },
            avgComplexity: {
              $avg: {
                $switch: {
                  branches: [
                    { case: { $eq: ['$complexity', 'Low'] }, then: 1 },
                    { case: { $eq: ['$complexity', 'Medium'] }, then: 2 },
                    { case: { $eq: ['$complexity', 'High'] }, then: 3 }
                  ],
                  default: 2
                }
              }
            }
          }
        },
        {
          $project: {
            platform: {
              $switch: {
                branches: [
                  { case: { $eq: ['$_id', 'windows'] }, then: 'Windows' },
                  { case: { $eq: ['$_id', 'linux'] }, then: 'Linux' },
                  { case: { $eq: ['$_id', 'macos'] }, then: 'macOS' },
                  { case: { $eq: ['$_id', 'cloud'] }, then: 'Cloud' },
                  { case: { $eq: ['$_id', 'network_devices'] }, then: 'Network Devices' },
                  { case: { $eq: ['$_id', 'containers'] }, then: 'Containers' },
                  { case: { $eq: ['$_id', 'officesuite'] }, then: 'Office Suite' },
                  { case: { $eq: ['$_id', 'identity_provider'] }, then: 'Identity Provider' },
                  { case: { $eq: ['$_id', 'saas'] }, then: 'SaaS' },
                  { case: { $eq: ['$_id', 'iaas'] }, then: 'IaaS' }
                ],
                default: '$_id'
              }
            },
            totalTechniques: 1,
            tacticCount: { $size: '$tactics' },
            tactics: 1,
            avgComplexityScore: { $round: ['$avgComplexity', 1] }
          }
        },
        {
          $sort: { totalTechniques: -1 }
        }
      ]);

      // No need for individual cloud platform stats - just use extraction stats
      const allStats = [...extractionStats];
      
      return allStats.sort((a, b) => b.totalTechniques - a.totalTechniques);
    } catch (error) {
      console.error('Error getting platform stats:', error);
      return [];
    }
  }
}

module.exports = MitreDataProcessor; 