// API Client for custom backend
class ApiClient {
  constructor() {
    this.baseURL = import.meta.env.VITE_API_BASE_URL || '/api';
    this.token = localStorage.getItem('auth_token');
    this.defaultTimeout = 30000; // 30 seconds default
    this.longTimeout = 600000; // 10 minutes for heavy operations
  }

  setToken(token) {
    this.token = token;
    if (token) {
      localStorage.setItem('auth_token', token);
    } else {
      localStorage.removeItem('auth_token');
    }
  }

  getHeaders() {
    const headers = {
      'Content-Type': 'application/json',
    };
    
    if (this.token) {
      headers.Authorization = `Bearer ${this.token}`;
    }
    
    return headers;
  }

  async request(endpoint, options = {}) {
    const {
      method = 'GET',
      data = null,
      headers = {},
      timeout = this.defaultTimeout,
      responseType = 'json'
    } = options;

    const url = `${this.baseURL}${endpoint}`;
    
    // Create AbortController for timeout handling
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    const config = {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...headers
      },
      signal: controller.signal
    };

    if (data && ['POST', 'PUT', 'PATCH'].includes(method)) {
      try {
        config.body = JSON.stringify(data);
      } catch (error) {
        if (error.message.includes('circular structure')) {
          console.error('❌ Circular reference detected in request data:', data);
          throw new Error('Invalid data: Contains circular references or non-serializable objects');
        }
        throw error;
      }
    }

    try {
      console.log(`🌐 API Request: ${method} ${url}`);
      
      const response = await fetch(url, config);
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        let errorData;
        try {
          errorData = await response.json();
        } catch (e) {
          // Fallback to text if JSON parsing fails
          const errorText = await response.text();
          errorData = { message: errorText };
        }
        
        const error = new Error(`HTTP error! status: ${response.status}, message: ${JSON.stringify(errorData)}`);
        error.response = { status: response.status, data: errorData };
        throw error;
      }

      if (responseType === 'stream') {
        return response;
      }
      
      const result = await response.json();
      console.log(`✅ API Response: ${method} ${url} - Success`);
      return result;
      
    } catch (error) {
      clearTimeout(timeoutId);
      
      if (error.name === 'AbortError') {
        console.error(`⏰ API request timed out: ${method} ${url}`);
        throw new Error(`Request timeout after ${timeout}ms`);
      }
      
      console.error(`❌ API request failed: ${method} ${url}`, error);
      throw error;
    }
  }

  // Standard API methods with default timeout
  async get(endpoint, options = {}) {
    return this.request(endpoint, { method: 'GET', ...options });
  }

  async post(endpoint, data = null, options = {}) {
    return this.request(endpoint, { method: 'POST', data, ...options });
  }

  async put(endpoint, data = null, options = {}) {
    return this.request(endpoint, { method: 'PUT', data, ...options });
  }

  async delete(endpoint, options = {}) {
    return this.request(endpoint, { method: 'DELETE', ...options });
  }

  async patch(endpoint, data = null, options = {}) {
    return this.request(endpoint, { method: 'PATCH', data, ...options });
  }

  // Heavy operation methods with extended timeout
  async postLong(endpoint, data = null, options = {}) {
    return this.request(endpoint, { 
      method: 'POST', 
      data, 
      timeout: this.longTimeout,
      ...options 
    });
  }

  async putLong(endpoint, data = null, options = {}) {
    return this.request(endpoint, { 
      method: 'PUT', 
      data, 
      timeout: this.longTimeout,
      ...options 
    });
  }

  // MITRE-specific methods
  async mitreSync(force = false) {
    console.log(`🔄 Starting MITRE sync (force: ${force})...`);
    return this.post('/mitre/sync', { force }, { timeout: this.longTimeout });
  }

  async mitreSyncStatus() {
    return this.get('/mitre/status');
  }

  async mitreSyncStream(force = false, onProgress = null) {
    const url = `${this.baseURL}/mitre/sync/stream`;
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ force })
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();

    try {
      while (true) {
        const { done, value } = await reader.read();
        
        if (done) break;
        
        const chunk = decoder.decode(value);
        const lines = chunk.split('\n');
        
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6));
              if (onProgress) {
                onProgress(data);
              }
              
              if (data.type === 'complete' || data.type === 'error') {
                return data;
              }
            } catch (e) {
              console.warn('Failed to parse SSE data:', line);
            }
          }
        }
      }
    } finally {
      reader.releaseLock();
    }
  }

  async mitreHealth() {
    return this.get('/mitre/health');
  }

  async mitreTechniquesCount() {
    return this.get('/mitre/techniques/count');
  }

  async mitreCleanup() {
    return this.delete('/mitre/techniques/cleanup');
  }

  // File upload
  async uploadFile(endpoint, file, additionalData = {}) {
    const formData = new FormData();
    formData.append('file', file);
    
    Object.keys(additionalData).forEach(key => {
      formData.append(key, additionalData[key]);
    });

    const headers = {};
    if (this.token) {
      headers.Authorization = `Bearer ${this.token}`;
    }

    const response = await fetch(`${this.baseURL}${endpoint}`, {
      method: 'POST',
      headers,
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
    }

    return await response.json();
  }
}

export const apiClient = new ApiClient(); 