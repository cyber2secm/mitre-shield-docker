import { apiClient } from './apiClient';

// Core integration services for our backend
export const Core = {
  // File upload service
  UploadFile: async ({ file }) => {
    return apiClient.uploadFile('/upload', file);
  },

  // Delete uploaded file (cleanup for failed imports)
  DeleteFile: async ({ filename }) => {
    return apiClient.delete(`/upload/${filename}`);
  },

  // Data extraction from uploaded files (CSV/Excel parsing)
  ExtractDataFromUploadedFile: async ({ file_url, json_schema }) => {
    return apiClient.post('/extract-data', {
      file_url,
      json_schema
    });
  },

  // LLM integration (if needed in future)
  InvokeLLM: async ({ prompt, model = 'gpt-3.5-turbo' }) => {
    return apiClient.post('/llm/invoke', {
      prompt,
      model
    });
  },

  // Email service (if needed in future)
  SendEmail: async ({ to, subject, body, attachments = [] }) => {
    return apiClient.post('/email/send', {
      to,
      subject,
      body,
      attachments
    });
  },

  // Image generation service (if needed in future)
  GenerateImage: async ({ prompt, size = '512x512' }) => {
    return apiClient.post('/image/generate', {
      prompt,
      size
    });
  }
};

// Export individual functions for compatibility with existing code
export const UploadFile = Core.UploadFile;
export const DeleteFile = Core.DeleteFile;
export const ExtractDataFromUploadedFile = Core.ExtractDataFromUploadedFile;
export const InvokeLLM = Core.InvokeLLM;
export const SendEmail = Core.SendEmail;
export const GenerateImage = Core.GenerateImage;






