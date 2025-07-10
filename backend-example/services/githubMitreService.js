const axios = require('axios');
const fs = require('fs');
const path = require('path');

class GitHubMitreService {
  constructor() {
    // MITRE ATT&CK GitHub repository URLs
    this.baseUrl = 'https://raw.githubusercontent.com/mitre-attack/attack-stix-data/refs/heads/master';
    this.endpoints = {
      enterprise: `${this.baseUrl}/enterprise-attack/enterprise-attack-17.1.json`,
      mobile: `${this.baseUrl}/mobile-attack/mobile-attack-17.1.json`,
      ics: `${this.baseUrl}/ics-attack/ics-attack-17.1.json`
    };
    
    // Configuration for better performance
    this.config = {
      timeout: 30000, // 30 seconds
      maxRetries: 3,
      retryDelay: 2000,
      cacheDir: path.join(__dirname, '../cache'),
      cacheTimeout: 3600000 // 1 hour
    };
    
    // Platform mapping for your application
    this.platformMapping = {
      // MITRE platforms → Your app platforms
      'Windows': 'Windows',
      'macOS': 'macOS',
      'Linux': 'Linux',
      'AWS': 'AWS',
      'Azure': 'Azure',
      'GCP': 'GCP',
      'Google Cloud Platform': 'GCP',
      'Azure AD': 'Azure',
      'Office 365': 'Azure',
      'Google Workspace': 'GCP',
      'Alibaba Cloud': 'Alibaba',
      'Alibaba': 'Alibaba',
      'Aliyun': 'Alibaba',
      'IaaS': ['AWS', 'Azure', 'GCP', 'Alibaba'],
      'SaaS': ['Azure', 'AWS', 'GCP', 'Alibaba'],
      'Containers': 'Containers',
      'Docker': 'Containers',
      'Kubernetes': 'Containers',
      'Network': 'Network',
      'PRE': 'Network'
    };
    
    // Your app's supported platforms
    this.supportedPlatforms = ['Windows', 'macOS', 'Linux', 'AWS', 'Azure', 'GCP', 'Oracle', 'Alibaba', 'Containers', 'AI'];
    
    // Tactic mapping from MITRE kill chain phases
    this.tacticMapping = {
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
    
    // Setup cache directory
    this.ensureCacheDir();
  }
  
  /**
   * Ensure cache directory exists
   */
  ensureCacheDir() {
    if (!fs.existsSync(this.config.cacheDir)) {
      fs.mkdirSync(this.config.cacheDir, { recursive: true });
    }
  }
  
  /**
   * Fetch MITRE ATT&CK data from GitHub
   */
  async fetchAttackData(dataset = 'enterprise', useCache = true) {
    try {
      console.log(`🔄 Fetching MITRE ATT&CK ${dataset} data from GitHub...`);
      
      const cacheFile = path.join(this.config.cacheDir, `${dataset}-attack.json`);
      
      // Check cache first
      if (useCache && this.isCacheValid(cacheFile)) {
        console.log(`📋 Using cached ${dataset} data`);
        return JSON.parse(fs.readFileSync(cacheFile, 'utf8'));
      }
      
      // Fetch from GitHub
      const url = this.endpoints[dataset];
      if (!url) {
        throw new Error(`Unknown dataset: ${dataset}`);
      }
      
      console.log(`🌐 Downloading from: ${url}`);
      const response = await this.retryRequest(url);
      
      // Cache the response
      fs.writeFileSync(cacheFile, JSON.stringify(response.data, null, 2));
      console.log(`💾 Cached ${dataset} data locally`);
      
      return response.data;
      
    } catch (error) {
      console.error(`❌ Error fetching ${dataset} data:`, error.message);
      throw error;
    }
  }
  
  /**
   * Check if cache file is valid (not expired)
   */
  isCacheValid(cacheFile) {
    if (!fs.existsSync(cacheFile)) {
      return false;
    }
    
    const stats = fs.statSync(cacheFile);
    const age = Date.now() - stats.mtime.getTime();
    return age < this.config.cacheTimeout;
  }
  
  /**
   * Retry request with exponential backoff
   */
  async retryRequest(url, attempt = 1) {
    try {
      const response = await axios.get(url, {
        timeout: this.config.timeout,
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'MITRE-Shield-Integration/1.0'
        }
      });
      
      console.log(`✅ Successfully fetched data (${(response.data.objects?.length || 0).toLocaleString()} objects)`);
      return response;
      
    } catch (error) {
      if (attempt < this.config.maxRetries) {
        const delay = this.config.retryDelay * Math.pow(2, attempt - 1);
        console.warn(`⚠️ Attempt ${attempt} failed, retrying in ${delay}ms...`);
        await this.delay(delay);
        return this.retryRequest(url, attempt + 1);
      }
      throw error;
    }
  }
  
  /**
   * Delay utility
   */
  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
  
  /**
   * Process and extract relevant data for your application
   */
  async processAttackData(rawData) {
    console.log('🔄 Processing MITRE ATT&CK data...');
    
    const objects = rawData.objects || [];
    const processed = {
      techniques: [],
      tactics: [],
      relationships: [],
      groups: [],
      software: [],
      mitigations: []
    };
    
    // Process each STIX object
    for (const obj of objects) {
      try {
        switch (obj.type) {
          case 'attack-pattern':
            const technique = this.processAttackPattern(obj);
            if (technique && this.isRelevantForPlatforms(technique.platforms)) {
              processed.techniques.push(technique);
            }
            break;
            
          case 'x-mitre-tactic':
            const tactic = this.processTactic(obj);
            if (tactic) {
              processed.tactics.push(tactic);
            }
            break;
            
          case 'relationship':
            const relationship = this.processRelationship(obj);
            if (relationship) {
              processed.relationships.push(relationship);
            }
            break;
            
          case 'intrusion-set':
            const group = this.processGroup(obj);
            if (group) {
              processed.groups.push(group);
            }
            break;
            
          case 'malware':
          case 'tool':
            const software = this.processSoftware(obj);
            if (software) {
              processed.software.push(software);
            }
            break;
            
          case 'course-of-action':
            const mitigation = this.processMitigation(obj);
            if (mitigation) {
              processed.mitigations.push(mitigation);
            }
            break;
        }
      } catch (error) {
        console.warn(`⚠️ Error processing object ${obj.id}:`, error.message);
      }
    }
    
    // Enhance techniques with tactic relationships
    processed.techniques = this.enhanceTechniquesWithTactics(processed.techniques, processed.relationships);
    
    console.log(`📊 Processed summary:`);
    console.log(`   Techniques: ${processed.techniques.length}`);
    console.log(`   Tactics: ${processed.tactics.length}`);
    console.log(`   Relationships: ${processed.relationships.length}`);
    console.log(`   Groups: ${processed.groups.length}`);
    console.log(`   Software: ${processed.software.length}`);
    console.log(`   Mitigations: ${processed.mitigations.length}`);
    
    return processed;
  }
  
  /**
   * Process attack pattern (technique)
   */
  processAttackPattern(obj) {
    const externalRefs = obj.external_references || [];
    const mitreRef = externalRefs.find(ref => ref.source_name === 'mitre-attack');
    
    if (!mitreRef || obj.revoked || obj.x_mitre_deprecated) {
      return null; // Skip revoked or deprecated techniques
    }
    
    // Extract and normalize platforms
    const platforms = this.normalizePlatforms(obj.x_mitre_platforms || []);
    
    // Extract kill chain phases (tactics)
    const tactics = (obj.kill_chain_phases || [])
      .filter(phase => phase.kill_chain_name === 'mitre-attack')
      .map(phase => this.tacticMapping[phase.phase_name])
      .filter(Boolean);
    
    return {
      technique_id: mitreRef.external_id,
      name: obj.name,
      description: obj.description || '',
      platforms: platforms,
      tactics: tactics,
      data_sources: obj.x_mitre_data_sources || [],
      detection: obj.x_mitre_detection || '',
      is_subtechnique: obj.x_mitre_is_subtechnique || false,
      parent_technique: this.extractParentTechnique(mitreRef.external_id),
      kill_chain_phases: obj.kill_chain_phases || [],
      created: obj.created,
      modified: obj.modified,
      version: obj.x_mitre_version || '1.0',
      stix_id: obj.id,
      url: mitreRef.url,
      // Enhanced fields for your app
      complexity: this.assessComplexity(obj),
      impact_level: this.assessImpact(obj),
      detection_difficulty: this.assessDetectionDifficulty(obj)
    };
  }
  
  /**
   * Process tactic
   */
  processTactic(obj) {
    const externalRefs = obj.external_references || [];
    const mitreRef = externalRefs.find(ref => ref.source_name === 'mitre-attack');
    
    if (!mitreRef) return null;
    
    return {
      tactic_id: mitreRef.external_id,
      name: obj.name,
      description: obj.description || '',
      short_name: obj.x_mitre_shortname || obj.name,
      created: obj.created,
      modified: obj.modified,
      stix_id: obj.id,
      url: mitreRef.url
    };
  }
  
  /**
   * Process relationship
   */
  processRelationship(obj) {
    return {
      source_ref: obj.source_ref,
      target_ref: obj.target_ref,
      relationship_type: obj.relationship_type,
      description: obj.description || '',
      created: obj.created,
      modified: obj.modified,
      stix_id: obj.id
    };
  }
  
  /**
   * Process group/intrusion set
   */
  processGroup(obj) {
    const externalRefs = obj.external_references || [];
    const mitreRef = externalRefs.find(ref => ref.source_name === 'mitre-attack');
    
    return {
      group_id: mitreRef?.external_id || obj.id,
      name: obj.name,
      description: obj.description || '',
      aliases: obj.aliases || [],
      created: obj.created,
      modified: obj.modified,
      stix_id: obj.id
    };
  }
  
  /**
   * Process software (malware/tool)
   */
  processSoftware(obj) {
    const externalRefs = obj.external_references || [];
    const mitreRef = externalRefs.find(ref => ref.source_name === 'mitre-attack');
    
    return {
      software_id: mitreRef?.external_id || obj.id,
      name: obj.name,
      description: obj.description || '',
      type: obj.type,
      aliases: obj.x_mitre_aliases || [],
      platforms: this.normalizePlatforms(obj.x_mitre_platforms || []),
      created: obj.created,
      modified: obj.modified,
      stix_id: obj.id
    };
  }
  
  /**
   * Process mitigation
   */
  processMitigation(obj) {
    const externalRefs = obj.external_references || [];
    const mitreRef = externalRefs.find(ref => ref.source_name === 'mitre-attack');
    
    return {
      mitigation_id: mitreRef?.external_id || obj.id,
      name: obj.name,
      description: obj.description || '',
      created: obj.created,
      modified: obj.modified,
      stix_id: obj.id
    };
  }
  
  /**
   * Normalize platforms to match your app's platform structure
   */
  normalizePlatforms(platforms) {
    const normalized = new Set();
    
    for (const platform of platforms) {
      const mapped = this.platformMapping[platform];
      if (Array.isArray(mapped)) {
        mapped.forEach(p => normalized.add(p));
      } else if (mapped && this.supportedPlatforms.includes(mapped)) {
        normalized.add(mapped);
      } else if (this.supportedPlatforms.includes(platform)) {
        normalized.add(platform);
      }
    }
    
    return Array.from(normalized);
  }
  
  /**
   * Check if technique is relevant for your app's platforms
   */
  isRelevantForPlatforms(platforms) {
    return platforms.length > 0 && platforms.some(p => this.supportedPlatforms.includes(p));
  }
  
  /**
   * Extract parent technique for sub-techniques
   */
  extractParentTechnique(techniqueId) {
    if (techniqueId && techniqueId.includes('.')) {
      return techniqueId.split('.')[0];
    }
    return null;
  }
  
  /**
   * Enhance techniques with tactic information from relationships
   */
  enhanceTechniquesWithTactics(techniques, relationships) {
    // Create a map of technique STIX IDs to technique data
    const techniqueMap = new Map();
    techniques.forEach(technique => {
      techniqueMap.set(technique.stix_id, technique);
    });
    
    // Process relationships to add more context
    relationships.forEach(rel => {
      if (rel.relationship_type === 'uses' && techniqueMap.has(rel.target_ref)) {
        const technique = techniqueMap.get(rel.target_ref);
        // Could add more relationship context here
      }
    });
    
    return techniques;
  }
  
  /**
   * Assess technique complexity
   */
  assessComplexity(obj) {
    const description = obj.description?.toLowerCase() || '';
    const name = obj.name?.toLowerCase() || '';
    
    if (description.includes('advanced') || description.includes('sophisticated') || 
        description.includes('complex') || obj.x_mitre_is_subtechnique) {
      return 'High';
    } else if (description.includes('simple') || description.includes('basic') || 
               name.includes('basic')) {
      return 'Low';
    }
    return 'Medium';
  }
  
  /**
   * Assess potential impact
   */
  assessImpact(obj) {
    const text = `${obj.name} ${obj.description}`.toLowerCase();
    
    if (text.includes('destroy') || text.includes('delete') || text.includes('wipe') || 
        text.includes('ransom') || text.includes('encrypt') || text.includes('impact')) {
      return 'High';
    } else if (text.includes('access') || text.includes('credential') || text.includes('escalat') ||
               text.includes('persist')) {
      return 'Medium';
    }
    return 'Low';
  }
  
  /**
   * Assess detection difficulty
   */
  assessDetectionDifficulty(obj) {
    const text = `${obj.name} ${obj.description}`.toLowerCase();
    
    if (text.includes('stealth') || text.includes('hidden') || text.includes('evasion') || 
        text.includes('obfuscat') || text.includes('bypass') || text.includes('avoid')) {
      return 'Hard';
    } else if (text.includes('obvious') || text.includes('clear') || text.includes('direct') ||
               text.includes('monitor')) {
      return 'Easy';
    }
    return 'Medium';
  }
  
  /**
   * Get service status
   */
  getStatus() {
    return {
      service: 'GitHub MITRE ATT&CK Data Service',
      baseUrl: this.baseUrl,
      supportedDatasets: Object.keys(this.endpoints),
      supportedPlatforms: this.supportedPlatforms,
      cacheDir: this.config.cacheDir,
      ready: true
    };
  }
}

module.exports = GitHubMitreService; 