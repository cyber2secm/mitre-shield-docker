const TaxiiService = require('./taxiiService');
const GitHubMitreService = require('./githubMitreService');
const MitreTechnique = require('../models/MitreTechnique');
const MitreDataProcessor = require('./mitreDataProcessor');
const DetectionRule = require('../models/DetectionRule');

class MitreSyncService {
  constructor() {
    this.taxiiService = new TaxiiService();
    this.githubService = new GitHubMitreService();
    this.dataProcessor = new MitreDataProcessor();
    this.isRunning = false;
    this.lastSyncTime = null;
    this.syncProgress = {
      status: 'idle',
      startTime: null,
      endTime: null,
      progress: 0,
      currentOperation: '',
      errors: []
    };
  }

  /**
   * Sync MITRE data using GitHub as primary source with TAXII fallback
   */
  async syncMitreData(force = false, useGitHub = true) {
    if (this.isRunning) {
      return {
        success: false,
        message: 'Sync already in progress',
        progress: this.syncProgress
      };
    }

    this.isRunning = true;
    this.syncProgress = {
      status: 'running',
      startTime: new Date(),
      endTime: null,
      progress: 0,
      currentOperation: 'Starting sync...',
      errors: []
    };

    try {
      console.log('🚀 Starting MITRE ATT&CK data sync...');
      
      let rawData;
      let dataSource = 'unknown';
      
      // Try GitHub first (faster and more reliable)
      if (useGitHub) {
        try {
          console.log('📁 Attempting to fetch data from GitHub...');
          this.syncProgress.currentOperation = 'Fetching data from GitHub...';
          this.syncProgress.progress = 10;
          
          rawData = await this.githubService.fetchAttackData('enterprise', !force);
          dataSource = 'github';
          console.log('✅ Successfully fetched data from GitHub');
          
        } catch (githubError) {
          console.warn('⚠️ GitHub fetch failed, falling back to TAXII:', githubError.message);
          this.syncProgress.errors.push({
            source: 'github',
            message: githubError.message,
            timestamp: new Date().toISOString()
          });
        }
      }
      
      // Fallback to TAXII if GitHub failed
      if (!rawData) {
        try {
          console.log('🌐 Attempting to fetch data from TAXII API...');
          this.syncProgress.currentOperation = 'Fetching data from TAXII API...';
          this.syncProgress.progress = 10;
          
          const taxiiResult = await this.taxiiService.fetchAttackData();
          rawData = taxiiResult.data;
          dataSource = 'taxii';
          console.log('✅ Successfully fetched data from TAXII');
          
        } catch (taxiiError) {
          console.error('❌ Both GitHub and TAXII failed:', taxiiError.message);
          throw new Error(`All data sources failed. GitHub: ${this.syncProgress.errors[0]?.message || 'unknown'}. TAXII: ${taxiiError.message}`);
        }
      }

      // Process the data
      this.syncProgress.currentOperation = 'Processing MITRE data...';
      this.syncProgress.progress = 30;
      
      const processedData = dataSource === 'github' 
        ? await this.githubService.processAttackData(rawData)
        : rawData;

      // Extract tactics and techniques
      const tactics = processedData.tactics || [];
      const techniques = processedData.techniques || [];

      console.log(`📊 Data summary from ${dataSource}:`);
      console.log(`   Tactics: ${tactics.length}`);
      console.log(`   Techniques: ${techniques.length}`);

      // Process tactics
      this.syncProgress.currentOperation = 'Processing tactics...';
      this.syncProgress.progress = 50;
      console.log('⚡ Processing tactics...');
      const tacticsResult = await this.processTactics(tactics);

      // Process techniques with enhanced data processor
      this.syncProgress.currentOperation = 'Processing techniques...';
      this.syncProgress.progress = 70;
      console.log('⚡ Processing techniques with enhanced data processor...');
      const techniquesResult = await this.dataProcessor.processAndStoreTechniques(techniques);
      
      // Generate AI-specific techniques
      this.syncProgress.currentOperation = 'Generating AI-specific techniques...';
      this.syncProgress.progress = 90;
      console.log('🧠 Generating AI-specific techniques...');
      const aiResult = await this.dataProcessor.generateAISpecificTechniques();

      // Update sync timestamp
      this.lastSyncTime = new Date().toISOString();
      this.syncProgress.status = 'completed';
      this.syncProgress.endTime = new Date();
      this.syncProgress.progress = 100;
      this.syncProgress.currentOperation = 'Sync completed successfully';

      const results = {
        tactics: tacticsResult,
        techniques: techniquesResult,
        aiTechniques: aiResult,
        dataSource: dataSource,
        totalObjects: rawData.objects ? rawData.objects.length : (techniques.length + tactics.length)
      };

      console.log('✅ MITRE sync completed successfully:', {
        dataSource,
        tacticsProcessed: tacticsResult.processed,
        techniquesProcessed: techniquesResult.processed,
        aiTechniquesCreated: aiResult.created,
        totalDuration: this.getSyncDuration()
      });

      return {
        success: true,
        message: `MITRE data sync completed successfully using ${dataSource}`,
        lastSyncTime: this.lastSyncTime,
        results,
        progress: this.syncProgress
      };

    } catch (error) {
      this.syncProgress.status = 'error';
      this.syncProgress.endTime = new Date();
      this.syncProgress.currentOperation = `Failed: ${error.message}`;
      this.syncProgress.errors.push({
        message: error.message,
        timestamp: new Date().toISOString()
      });
      
      console.error('❌ MITRE sync failed:', error);
      return {
        success: false,
        message: `Sync failed: ${error.message}`,
        error: error.message,
        progress: this.syncProgress
      };
    } finally {
      this.isRunning = false;
    }
  }

  /**
   * Process tactics with batch operations
   */
  async processTactics(tactics) {
    const batchSize = 50;
    const batches = this.chunkArray(tactics, batchSize);
    
    let processed = 0;
    let updated = 0;
    let created = 0;
    const errors = [];

    console.log(`📊 Processing ${tactics.length} tactics in ${batches.length} batches...`);

    for (let i = 0; i < batches.length; i++) {
      const batch = batches[i];
      console.log(`🔄 Processing tactics batch ${i + 1}/${batches.length} (${batch.length} items)...`);

      try {
        // Use bulkWrite for better performance
        const operations = batch.map(tactic => ({
          updateOne: {
            filter: { 
              $or: [
                { tactic_id: tactic.tactic_id },
                { stix_id: tactic.stix_id }
              ]
            },
            update: {
              $set: {
                ...tactic,
                last_updated: new Date(),
                sync_source: 'mitre_taxii'
              }
            },
            upsert: true
          }
        }));

        const result = await MitreTechnique.bulkWrite(operations, { ordered: false });
        
        processed += batch.length;
        created += result.upsertedCount || 0;
        updated += result.modifiedCount || 0;
        
        this.syncProgress.processedTactics = processed;

      } catch (error) {
        console.error(`❌ Error processing tactics batch ${i + 1}:`, error.message);
        errors.push(`Batch ${i + 1}: ${error.message}`);
        
        // Continue with individual processing for this batch
        for (const tactic of batch) {
          try {
            await this.processSingleTactic(tactic);
            processed++;
            this.syncProgress.processedTactics = processed;
          } catch (individualError) {
            console.error(`❌ Error processing tactic ${tactic.tactic_id}:`, individualError.message);
            errors.push(`Tactic ${tactic.tactic_id}: ${individualError.message}`);
          }
        }
      }

      // Small delay between batches to prevent overwhelming the database
      if (i < batches.length - 1) {
        await this.delay(100);
      }
    }

    return { processed, updated, created, errors };
  }

  /**
   * Process techniques with batch operations and expanded tactic mapping
   */
  async processTechniques(techniques) {
    const batchSize = 50;
    let processed = 0;
    let updated = 0;
    let created = 0;
    const errors = [];

    console.log(`⚡ Processing ${techniques.length} techniques...`);

    // First, expand techniques by tactics (one record per technique-tactic pair)
    const expandedTechniques = [];
    for (const technique of techniques) {
      if (technique.tactics && technique.tactics.length > 0) {
        // Create one record for each tactic the technique belongs to
        for (const tacticName of technique.tactics) {
          expandedTechniques.push({
            ...technique,
            tactic: this.normalizeTacticName(tacticName),
            tactics: technique.tactics, // Keep original array for reference
            technique_id: technique.technique_id,
            name: technique.name,
            description: technique.description || '',
            platforms: this.normalizePlatforms(technique.platforms || []),
            data_sources: technique.data_sources || [],
            is_subtechnique: technique.is_subtechnique || false,
            parent_technique: technique.parent_technique,
            created: technique.created,
            modified: technique.modified,
            version: technique.version || '1.0',
            stix_id: technique.stix_id,
            last_updated: new Date(),
            sync_source: 'mitre_taxii'
          });
        }
      } else {
        // No tactics specified, create a general entry
        expandedTechniques.push({
          ...technique,
          tactic: 'Unknown',
          platforms: this.normalizePlatforms(technique.platforms || []),
          data_sources: technique.data_sources || [],
          last_updated: new Date(),
          sync_source: 'mitre_taxii'
        });
      }
    }

    console.log(`📈 Expanded ${techniques.length} techniques to ${expandedTechniques.length} technique-tactic pairs`);
    
    const batches = this.chunkArray(expandedTechniques, batchSize);

    for (let i = 0; i < batches.length; i++) {
      const batch = batches[i];
      console.log(`🔄 Processing techniques batch ${i + 1}/${batches.length} (${batch.length} items)...`);

      try {
        // Use bulkWrite for better performance
        const operations = batch.map(technique => ({
          updateOne: {
            filter: { 
              $and: [
                { 
                  $or: [
                    { technique_id: technique.technique_id },
                    { stix_id: technique.stix_id }
                  ]
                },
                { tactic: technique.tactic }
              ]
            },
            update: { $set: technique },
            upsert: true
          }
        }));

        const result = await MitreTechnique.bulkWrite(operations, { ordered: false });
        
        processed += batch.length;
        created += result.upsertedCount || 0;
        updated += result.modifiedCount || 0;
        
        this.syncProgress.processedTechniques = processed;

      } catch (error) {
        console.error(`❌ Error processing techniques batch ${i + 1}:`, error.message);
        errors.push(`Batch ${i + 1}: ${error.message}`);
        
        // Continue with individual processing for this batch
        for (const technique of batch) {
          try {
            await this.processSingleTechnique(technique);
            processed++;
            this.syncProgress.processedTechniques = processed;
          } catch (individualError) {
            console.error(`❌ Error processing technique ${technique.technique_id}:`, individualError.message);
            errors.push(`Technique ${technique.technique_id}: ${individualError.message}`);
          }
        }
      }

      // Small delay between batches
      if (i < batches.length - 1) {
        await this.delay(100);
      }
    }

    return { processed, updated, created, errors };
  }

  /**
   * Process a single tactic (fallback for failed batch operations)
   */
  async processSingleTactic(tactic) {
    return await MitreTechnique.findOneAndUpdate(
      { 
        $or: [
          { tactic_id: tactic.tactic_id },
          { stix_id: tactic.stix_id }
        ]
      },
      {
        $set: {
          ...tactic,
          last_updated: new Date(),
          sync_source: 'mitre_taxii'
        }
      },
      { upsert: true, new: true }
    );
  }

  /**
   * Process a single technique (fallback for failed batch operations)
   */
  async processSingleTechnique(technique) {
    return await MitreTechnique.findOneAndUpdate(
      { 
        $and: [
          { 
            $or: [
              { technique_id: technique.technique_id },
              { stix_id: technique.stix_id }
            ]
          },
          { tactic: technique.tactic }
        ]
      },
      { $set: technique },
      { upsert: true, new: true }
    );
  }

  /**
   * Normalize tactic names to match our schema
   */
  normalizeTacticName(tacticName) {
    const tacticMap = {
      'reconnaissance': 'Reconnaissance',
      'resource-development': 'Resource Development',
      'initial-access': 'Initial Access',
      'execution': 'Execution',
      'persistence': 'Persistence',
      'privilege-escalation': 'Privilege Escalation',
      'defense-evasion': 'Defense Evasion',
      'credential-access': 'Credential Access',
      'discovery': 'Discovery',
      'lateral-movement': 'Lateral Movement',
      'collection': 'Collection',
      'command-and-control': 'Command and Control',
      'exfiltration': 'Exfiltration',
      'impact': 'Impact'
    };

    return tacticMap[tacticName] || tacticName;
  }

  /**
   * Normalize platform names to match our schema
   */
  normalizePlatforms(platforms) {
    const platformMap = {
      'Windows': 'Windows',
      'macOS': 'macOS',
      'Linux': 'Linux',
      'AWS': 'AWS',
      'Azure': 'Azure',
      'Azure AD': 'Azure',
      'GCP': 'GCP',
      'Google Workspace': 'GCP',
      'Office 365': 'Azure',
      'SaaS': 'Cloud',
      'IaaS': 'Cloud',
      'Containers': 'Containers',
      'Docker': 'Containers',
      'Kubernetes': 'Containers',
      'Network': 'Network',
      'PRE': 'PRE'
    };

    return platforms
      .map(platform => platformMap[platform] || platform)
      .filter((platform, index, arr) => arr.indexOf(platform) === index) // Remove duplicates
      .filter(platform => 
        ['Windows', 'macOS', 'Linux', 'AWS', 'Azure', 'GCP', 'Oracle', 'Alibaba', 'Containers', 'Cloud', 'Network', 'PRE', 'AI'].includes(platform)
      );
  }

  /**
   * Get sync status and progress
   */
  getSyncStatus() {
    return {
      isRunning: this.isRunning,
      lastSyncTime: this.lastSyncTime,
      progress: this.syncProgress,
      duration: this.getSyncDuration()
    };
  }

  /**
   * Get sync duration
   */
  getSyncDuration() {
    if (!this.syncProgress.startTime) return null;
    
    const endTime = this.syncProgress.endTime || new Date();
    return Math.round((endTime - this.syncProgress.startTime) / 1000); // in seconds
  }

  /**
   * Reset progress tracking
   */
  resetProgress() {
    this.syncProgress = {
      status: 'idle',
      totalTechniques: 0,
      processedTechniques: 0,
      totalTactics: 0,
      processedTactics: 0,
      errors: [],
      startTime: null,
      endTime: null
    };
  }

  /**
   * Utility function to chunk array
   */
  chunkArray(array, size) {
    const chunks = [];
    for (let i = 0; i < array.length; i += size) {
      chunks.push(array.slice(i, i + size));
    }
    return chunks;
  }

  /**
   * Utility function for delays
   */
  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Clean up old/deprecated techniques
   */
  async cleanupDeprecatedTechniques() {
    try {
      console.log('🧹 Cleaning up deprecated techniques...');
      
      // Remove techniques that haven't been updated in the last sync
      const cutoffDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000); // 7 days ago
      
      const result = await MitreTechnique.deleteMany({
        $and: [
          { sync_source: 'mitre_taxii' },
          { last_updated: { $lt: cutoffDate } }
        ]
      });
      
      console.log(`🗑️ Removed ${result.deletedCount} deprecated techniques`);
      return result.deletedCount;
      
    } catch (error) {
      console.error('❌ Error cleaning up deprecated techniques:', error);
      return 0;
    }
  }
}

module.exports = MitreSyncService; 