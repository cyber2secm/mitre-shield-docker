import { createClient } from '@base44/sdk';
// import { getAccessToken } from '@base44/sdk/utils/auth-utils';

// Create a client with authentication required
export const base44 = createClient({
  appId: "685c008d54a87bb4b532b6c8", 
  requiresAuth: true // Ensure authentication is required for all operations
});
