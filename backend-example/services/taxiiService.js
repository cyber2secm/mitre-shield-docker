const axios = require('axios');
const { v4: uuidv4 } = require('uuid');

class TaxiiService {
  constructor() {
    // MITRE ATT&CK TAXII Server endpoints
    this.baseUrl = 'https://cti-taxii.mitre.org';
    this.discoveryUrl = `${this.baseUrl}/taxii/`;
    this.collectionUrl = `${this.baseUrl}/stix/collections/95ecc380-afe9-11e4-9b6c-751b66dd541e/`;
    
    // Enhanced configuration for large datasets and better timeout handling
    this.config = {
      timeout: 60000, // Reduced to 1 minute initial timeout
      connectionTimeout: 30000, // 30 seconds for connection
      maxRetries: 5, // Increased retries for connectivity issues
      retryDelay: 3000, // 3 seconds initial delay
      maxRetryDelay: 30000, // Maximum 30 seconds delay
      chunkSize: 100, // Process data in chunks
      maxObjects: 10000, // Maximum objects to fetch in one request
      rateLimitDelay: 1000, // Delay between requests to respect rate limits
      fallbackEnabled: true, // Enable fallback mechanisms
      healthCheckInterval: 300000 // 5 minutes between health checks
    };
    
    // Track connection health
    this.connectionHealth = {
      isHealthy: false,
      lastSuccessfulConnection: null,
      lastError: null,
      consecutiveFailures: 0,
      totalAttempts: 0
    };
    
    // Set up axios with proper headers and timeouts
    this.client = axios.create({
      headers: {
        'Accept': 'application/taxii+json;version=2.1',
        'Content-Type': 'application/taxii+json;version=2.1',
        'User-Agent': 'MITRE-Shield-Integration/1.0'
      },
      timeout: this.config.timeout,
      // Additional axios configuration for better connection handling
      maxRedirects: 3,
      validateStatus: (status) => status < 400
    });

    // Add response interceptors for better error handling
    this.client.interceptors.response.use(
      (response) => {
        // Update health status on successful response
        this.updateConnectionHealth(true);
        return response;
      },
      (error) => {
        // Update health status on error
        this.updateConnectionHealth(false, error);
        
        console.error('🚨 TAXII API error:', {
          message: error.message,
          code: error.code,
          status: error.response?.status,
          statusText: error.response?.statusText,
          url: error.config?.url,
          timeout: error.code === 'ECONNABORTED',
          networkError: this.isNetworkError(error)
        });
        return Promise.reject(error);
      }
    );
  }

  /**
   * Check if error is network-related
   */
  isNetworkError(error) {
    return ['ECONNREFUSED', 'ENOTFOUND', 'ECONNABORTED', 'ETIMEDOUT', 'ENETUNREACH'].includes(error.code);
  }

  /**
   * Update connection health tracking
   */
  updateConnectionHealth(success, error = null) {
    this.connectionHealth.totalAttempts++;
    
    if (success) {
      this.connectionHealth.isHealthy = true;
      this.connectionHealth.lastSuccessfulConnection = new Date();
      this.connectionHealth.consecutiveFailures = 0;
      this.connectionHealth.lastError = null;
    } else {
      this.connectionHealth.isHealthy = false;
      this.connectionHealth.consecutiveFailures++;
      this.connectionHealth.lastError = {
        message: error?.message,
        code: error?.code,
        timestamp: new Date()
      };
    }
  }

  /**
   * Perform connectivity health check
   */
  async healthCheck() {
    try {
      console.log('🏥 Performing TAXII service health check...');
      const response = await this.client.get(this.discoveryUrl, {
        timeout: this.config.connectionTimeout
      });
      
      console.log('✅ TAXII service is healthy');
      return {
        healthy: true,
        responseTime: Date.now(),
        status: response.status,
        collections: response.data?.collections?.length || 0
      };
    } catch (error) {
      console.error('❌ TAXII service health check failed:', error.message);
      return {
        healthy: false,
        error: error.message,
        code: error.code,
        isNetworkError: this.isNetworkError(error)
      };
    }
  }

  /**
   * Fetch all MITRE ATT&CK techniques and tactics with enhanced error handling
   */
  async fetchAttackData() {
    try {
      console.log('🔄 Starting MITRE ATT&CK data fetch...');
      
      // Perform initial health check
      const health = await this.healthCheck();
      if (!health.healthy) {
        if (health.isNetworkError) {
          throw new Error(`Network connectivity issue: ${health.error}. Please check your internet connection and firewall settings.`);
        } else {
          throw new Error(`TAXII service unavailable: ${health.error}`);
        }
      }
      
      // First, discover available collections
      const discovery = await this.discoverCollections();
      console.log(`📂 Found ${discovery.collections?.length || 0} collections`);
      
      // Fetch objects with pagination
      let allObjects = [];
      let next = null;
      let pageCount = 0;
      const maxPages = 50; // Prevent infinite loops
      
      do {
        try {
          console.log(`📄 Fetching page ${pageCount + 1}${next ? ` (next: ${next})` : ''}...`);
          
          const page = await this.fetchObjectsPage(next);
          
          if (page.objects && page.objects.length > 0) {
            allObjects = allObjects.concat(page.objects);
            console.log(`📦 Fetched ${page.objects.length} objects (total: ${allObjects.length})`);
          }
          
          next = page.next;
          pageCount++;
          
          // Respect rate limits
          if (next && this.config.rateLimitDelay > 0) {
            await this.delay(this.config.rateLimitDelay);
          }
          
        } catch (error) {
          console.error(`❌ Error fetching page ${pageCount + 1}:`, error.message);
          
          if (pageCount === 0) {
            // If first page fails, throw error
            throw error;
          } else {
            // For subsequent pages, log warning and continue
            console.warn(`⚠️ Skipping page ${pageCount + 1} due to error, continuing with ${allObjects.length} objects...`);
            break;
          }
        }
        
      } while (next && pageCount < maxPages);
      
      console.log(`✅ Fetched total of ${allObjects.length} STIX objects across ${pageCount} pages`);
      
      // If we got no objects, provide helpful error message
      if (allObjects.length === 0) {
        throw new Error('No STIX objects were retrieved from MITRE TAXII API. The service may be experiencing issues.');
      }
      
      // Process objects in chunks to avoid memory issues
      const processedData = await this.processObjectsInChunks(allObjects);
      
      return {
        success: true,
        data: processedData,
        totalObjects: allObjects.length,
        pages: pageCount,
        connectionHealth: this.connectionHealth
      };
      
    } catch (error) {
      console.error('❌ Failed to fetch MITRE ATT&CK data:', error.message);
      
      // Provide more specific error messages based on error type
      let errorMessage = error.message;
      if (this.isNetworkError(error)) {
        errorMessage = `Network connectivity issue: ${error.message}. This could be due to:
- Internet connection problems
- Firewall blocking HTTPS connections to cti-taxii.mitre.org
- DNS resolution issues
- MITRE TAXII service temporarily unavailable
        
Please check your network connection and try again later.`;
      }
      
      throw new Error(`TAXII fetch failed: ${errorMessage}`);
    }
  }

  /**
   * Discover available collections with enhanced retry logic
   */
  async discoverCollections() {
    return await this.retryOperation(async () => {
      console.log('🔍 Discovering TAXII collections...');
      const response = await this.client.get(this.discoveryUrl, {
        timeout: this.config.connectionTimeout
      });
      return response.data;
    }, 'discover collections');
  }

  /**
   * Fetch a single page of objects with enhanced retry logic
   */
  async fetchObjectsPage(next = null) {
    return await this.retryOperation(async () => {
      let url = `${this.collectionUrl}objects/`;
      
      const params = new URLSearchParams({
        limit: this.config.maxObjects.toString()
      });
      
      if (next) {
        // Use the next URL directly if provided
        url = next;
      } else {
        url += `?${params.toString()}`;
      }
      
      const response = await this.client.get(url, {
        timeout: this.config.timeout
      });
      return response.data;
    }, `fetch objects page${next ? ' (next)' : ''}`);
  }

  /**
   * Process objects in chunks to avoid memory issues
   */
  async processObjectsInChunks(objects) {
    const chunks = this.chunkArray(objects, this.config.chunkSize);
    const processedData = {
      techniques: [],
      tactics: [],
      relationships: [],
      groups: [],
      software: [],
      campaigns: [],
      mitigations: []
    };
    
    console.log(`🔄 Processing ${objects.length} objects in ${chunks.length} chunks...`);
    
    for (let i = 0; i < chunks.length; i++) {
      const chunk = chunks[i];
      console.log(`📊 Processing chunk ${i + 1}/${chunks.length} (${chunk.length} objects)...`);
      
      for (const obj of chunk) {
        try {
          const processed = this.parseStixObject(obj);
          if (processed) {
            processedData[processed.type].push(processed.data);
          }
        } catch (error) {
          console.warn(`⚠️ Error processing object ${obj.id}:`, error.message);
        }
      }
      
      // Small delay between chunks to prevent overwhelming the system
      if (i < chunks.length - 1) {
        await this.delay(100);
      }
    }
    
    // Log summary
    console.log('📋 Processing summary:', {
      techniques: processedData.techniques.length,
      tactics: processedData.tactics.length,
      relationships: processedData.relationships.length,
      groups: processedData.groups.length,
      software: processedData.software.length,
      campaigns: processedData.campaigns.length,
      mitigations: processedData.mitigations.length
    });
    
    return processedData;
  }

  /**
   * Parse a STIX object into our format
   */
  parseStixObject(obj) {
    if (!obj || !obj.type) return null;

    try {
      switch (obj.type) {
        case 'attack-pattern':
          return {
            type: 'techniques',
            data: this.parseAttackPattern(obj)
          };
          
        case 'x-mitre-tactic':
          return {
            type: 'tactics',
            data: this.parseTactic(obj)
          };
          
        case 'relationship':
          return {
            type: 'relationships',
            data: this.parseRelationship(obj)
          };
          
        case 'intrusion-set':
          return {
            type: 'groups',
            data: this.parseGroup(obj)
          };
          
        case 'malware':
        case 'tool':
          return {
            type: 'software',
            data: this.parseSoftware(obj)
          };
          
        case 'campaign':
          return {
            type: 'campaigns',
            data: this.parseCampaign(obj)
          };
          
        case 'course-of-action':
          return {
            type: 'mitigations',
            data: this.parseMitigation(obj)
          };
          
        default:
          // Skip unknown types
          return null;
      }
    } catch (error) {
      console.warn(`⚠️ Error parsing ${obj.type} object:`, error.message);
      return null;
    }
  }

  /**
   * Parse ATT&CK technique
   */
  parseAttackPattern(obj) {
    const externalRefs = obj.external_references || [];
    const mitreRef = externalRefs.find(ref => ref.source_name === 'mitre-attack');
    
    // Extract platforms
    const platforms = [];
    if (obj.x_mitre_platforms) {
      platforms.push(...obj.x_mitre_platforms);
    }
    
    // Extract data sources
    const dataSources = [];
    if (obj.x_mitre_data_sources) {
      dataSources.push(...obj.x_mitre_data_sources);
    }
    
    return {
      technique_id: mitreRef?.external_id || obj.id,
      name: obj.name,
      description: obj.description || '',
      platforms: platforms,
      tactics: this.extractTactics(obj),
      detection: obj.x_mitre_detection || '',
      data_sources: dataSources,
      is_subtechnique: obj.x_mitre_is_subtechnique || false,
      parent_technique: this.extractParentTechnique(obj),
      kill_chain_phases: obj.kill_chain_phases || [],
      created: obj.created,
      modified: obj.modified,
      version: obj.x_mitre_version || '1.0',
      stix_id: obj.id,
      revoked: obj.revoked || false,
      deprecated: obj.x_mitre_deprecated || false
    };
  }

  /**
   * Parse tactic
   */
  parseTactic(obj) {
    const externalRefs = obj.external_references || [];
    const mitreRef = externalRefs.find(ref => ref.source_name === 'mitre-attack');
    
    return {
      tactic_id: mitreRef?.external_id || obj.id,
      name: obj.name,
      description: obj.description || '',
      short_name: obj.x_mitre_shortname || obj.name,
      created: obj.created,
      modified: obj.modified,
      stix_id: obj.id
    };
  }

  /**
   * Parse relationship
   */
  parseRelationship(obj) {
    return {
      source_ref: obj.source_ref,
      target_ref: obj.target_ref,
      relationship_type: obj.relationship_type,
      created: obj.created,
      modified: obj.modified,
      stix_id: obj.id
    };
  }

  /**
   * Parse group/intrusion set
   */
  parseGroup(obj) {
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
   * Parse software (malware/tool)
   */
  parseSoftware(obj) {
    const externalRefs = obj.external_references || [];
    const mitreRef = externalRefs.find(ref => ref.source_name === 'mitre-attack');
    
    return {
      software_id: mitreRef?.external_id || obj.id,
      name: obj.name,
      description: obj.description || '',
      type: obj.type,
      aliases: obj.x_mitre_aliases || [],
      platforms: obj.x_mitre_platforms || [],
      created: obj.created,
      modified: obj.modified,
      stix_id: obj.id
    };
  }

  /**
   * Parse campaign
   */
  parseCampaign(obj) {
    const externalRefs = obj.external_references || [];
    const mitreRef = externalRefs.find(ref => ref.source_name === 'mitre-attack');
    
    return {
      campaign_id: mitreRef?.external_id || obj.id,
      name: obj.name,
      description: obj.description || '',
      aliases: obj.aliases || [],
      first_seen: obj.first_seen,
      last_seen: obj.last_seen,
      created: obj.created,
      modified: obj.modified,
      stix_id: obj.id
    };
  }

  /**
   * Parse mitigation/course of action
   */
  parseMitigation(obj) {
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
   * Extract tactics from kill chain phases
   */
  extractTactics(obj) {
    if (!obj.kill_chain_phases) return [];
    
    return obj.kill_chain_phases
      .filter(phase => phase.kill_chain_name === 'mitre-attack')
      .map(phase => phase.phase_name);
  }

  /**
   * Extract parent technique for sub-techniques
   */
  extractParentTechnique(obj) {
    if (!obj.x_mitre_is_subtechnique) return null;
    
    const externalRefs = obj.external_references || [];
    const mitreRef = externalRefs.find(ref => ref.source_name === 'mitre-attack');
    
    if (mitreRef?.external_id) {
      // Sub-techniques have IDs like T1001.001, parent would be T1001
      const parts = mitreRef.external_id.split('.');
      return parts.length > 1 ? parts[0] : null;
    }
    
    return null;
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
   * Retry operation with exponential backoff and enhanced error handling
   */
  async retryOperation(operation, operationName = 'operation', maxRetries = this.config.maxRetries) {
    let lastError;
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const result = await operation();
        
        // Log successful retry if this wasn't the first attempt
        if (attempt > 1) {
          console.log(`✅ ${operationName} succeeded on attempt ${attempt}`);
        }
        
        return result;
      } catch (error) {
        lastError = error;
        
        // Calculate delay with exponential backoff, capped at maxRetryDelay
        const baseDelay = this.config.retryDelay * Math.pow(2, attempt - 1);
        const delay = Math.min(baseDelay, this.config.maxRetryDelay);
        
        if (attempt === maxRetries) {
          console.error(`❌ ${operationName} failed after ${maxRetries} attempts: ${error.message}`);
          break;
        }
        
        // Check if this is a network error for more specific messaging
        const isNetworkIssue = this.isNetworkError(error);
        const errorType = isNetworkIssue ? 'Network error' : 'Service error';
        
        console.warn(`⚠️ ${errorType} during ${operationName} (attempt ${attempt}/${maxRetries}): ${error.message}`);
        console.warn(`⏳ Retrying in ${delay}ms...`);
        
        await this.delay(delay);
      }
    }
    
    // Enhance the final error with context
    if (this.isNetworkError(lastError)) {
      throw new Error(`Network connectivity failed for ${operationName}: ${lastError.message}. This may indicate firewall issues or service unavailability.`);
    }
    
    throw lastError;
  }

  /**
   * Get service status and configuration
   */
  getStatus() {
    return {
      baseUrl: this.baseUrl,
      config: this.config,
      connectionHealth: this.connectionHealth,
      ready: this.connectionHealth.isHealthy || this.connectionHealth.consecutiveFailures < 3,
      lastHealthCheck: new Date().toISOString()
    };
  }

  /**
   * Get detailed diagnostic information
   */
  getDiagnostics() {
    return {
      service: 'MITRE ATT&CK TAXII API',
      baseUrl: this.baseUrl,
      discoveryUrl: this.discoveryUrl,
      collectionUrl: this.collectionUrl,
      configuration: {
        timeout: this.config.timeout,
        connectionTimeout: this.config.connectionTimeout,
        maxRetries: this.config.maxRetries,
        retryDelay: this.config.retryDelay,
        maxRetryDelay: this.config.maxRetryDelay
      },
      connectionHealth: {
        ...this.connectionHealth,
        healthStatus: this.connectionHealth.isHealthy ? 'HEALTHY' : 'UNHEALTHY',
        lastSuccessfulConnection: this.connectionHealth.lastSuccessfulConnection?.toISOString(),
        lastError: this.connectionHealth.lastError ? {
          ...this.connectionHealth.lastError,
          timestamp: this.connectionHealth.lastError.timestamp?.toISOString()
        } : null
      },
      troubleshooting: this.getTroubleshootingTips()
    };
  }

  /**
   * Get troubleshooting tips based on current status
   */
  getTroubleshootingTips() {
    const tips = [];
    
    if (this.connectionHealth.consecutiveFailures > 0) {
      tips.push('Check your internet connection');
      tips.push('Verify that HTTPS traffic to cti-taxii.mitre.org is not blocked by firewall');
      tips.push('Confirm DNS resolution works for cti-taxii.mitre.org');
      
      if (this.connectionHealth.lastError?.code === 'ETIMEDOUT') {
        tips.push('The connection is timing out - this may indicate network latency issues');
        tips.push('Try again later as the MITRE service may be experiencing high load');
      }
      
      if (this.connectionHealth.lastError?.code === 'ECONNREFUSED') {
        tips.push('Connection refused - the MITRE TAXII service may be down for maintenance');
      }
      
      if (this.connectionHealth.consecutiveFailures >= 3) {
        tips.push('Multiple consecutive failures detected - consider checking MITRE service status');
        tips.push('Try manually accessing https://cti-taxii.mitre.org/taxii/ in a web browser');
      }
    }
    
    return tips;
  }
}

module.exports = TaxiiService; 