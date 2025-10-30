// Debug authentication and API calls
console.log('=== DEBUGGING FRONTEND AUTHENTICATION ===');

// Check if we're in browser environment
if (typeof window !== 'undefined') {
  // Check localStorage for token
  const token = localStorage.getItem('token');
  console.log('Token in localStorage:', token ? 'Present' : 'Missing');
  
  if (token) {
    console.log('Token length:', token.length);
    console.log('Token starts with:', token.substring(0, 20) + '...');
    
    // Try to decode JWT payload (without verification)
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      console.log('Token payload:', payload);
      console.log('Token expires:', new Date(payload.exp * 1000));
      console.log('Token is expired:', Date.now() > payload.exp * 1000);
    } catch (e) {
      console.log('Could not decode token:', e.message);
    }
  }
  
  // Check other auth-related items
  console.log('User in localStorage:', localStorage.getItem('user') ? 'Present' : 'Missing');
  console.log('Workspace in localStorage:', localStorage.getItem('workspace') ? 'Present' : 'Missing');
  
  // Test API call
  const testAPI = async () => {
    try {
      const response = await fetch('/api/appointments', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      console.log('API test response status:', response.status);
      console.log('API test response headers:', Object.fromEntries(response.headers.entries()));
      
      if (!response.ok) {
        const errorText = await response.text();
        console.log('API error response:', errorText);
      } else {
        const data = await response.json();
        console.log('API success response:', data);
      }
    } catch (error) {
      console.log('API test error:', error);
    }
  };
  
  if (token) {
    testAPI();
  }
} else {
  console.log('Not in browser environment');
}