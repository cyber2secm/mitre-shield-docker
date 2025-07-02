import { apiClient } from './apiClient';

// Base Entity class for common CRUD operations
class BaseEntity {
  constructor(endpoint) {
    this.endpoint = endpoint;
  }

  async list(sort = '', limit = 1000, filters = {}) {
    const params = { 
      limit,
      ...filters
    };
    
    if (sort) {
      // Handle sort parameter - convert base44 format (-created_date) to our format
      const sortDirection = sort.startsWith('-') ? 'desc' : 'asc';
      const sortField = sort.replace('-', '');
      params.sort = sortField;
      params.order = sortDirection;
    }
    
    return apiClient.get(this.endpoint, params);
  }

  async create(data) {
    return apiClient.post(this.endpoint, data);
  }

  async update(id, data) {
    return apiClient.put(`${this.endpoint}/${id}`, data);
  }

  async delete(id) {
    return apiClient.delete(`${this.endpoint}/${id}`);
  }

  async get(id) {
    return apiClient.get(`${this.endpoint}/${id}`);
  }

  async bulkCreate(dataArray, allowUpdate = false) {
    return apiClient.post(`${this.endpoint}/bulk`, { 
      items: dataArray, 
      allowUpdate 
    });
  }
}

// Detection Rules Entity
export const DetectionRule = new BaseEntity('/rules');

// MITRE Techniques Entity  
export const MitreTechnique = new BaseEntity('/techniques');

// Future Rules Entity
export const FutureRule = new BaseEntity('/future-rules');

// Auth service
export const User = {
  async login(credentials) {
    const response = await apiClient.post('/auth/login', credentials);
    if (response.token) {
      apiClient.setToken(response.token);
    }
    return response;
  },

  async logout() {
    const response = await apiClient.post('/auth/logout');
    apiClient.setToken(null);
    return response;
  },

  async getCurrentUser() {
    return apiClient.get('/auth/me');
  },

  async refreshToken() {
    const response = await apiClient.post('/auth/refresh');
    if (response.token) {
      apiClient.setToken(response.token);
    }
    return response;
  },

  isAuthenticated() {
    return !!apiClient.token;
  }
};