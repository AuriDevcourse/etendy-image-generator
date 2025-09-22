import { createClient } from '@base44/sdk';
// import { getAccessToken } from '@base44/sdk/utils/auth-utils';

// Create a client with optional authentication (no forced login on load)
export const base44 = createClient({
  appId: "68c817ede0a14cfc96a932fc", 
  requiresAuth: false // Allow viewing the app without logging in; protected ops will still require auth
});
