// Frontend Analytics Debug Script
// Run this in the browser console to debug analytics data flow

console.log('🔍 Frontend Analytics Debug Script');
console.log('=' .repeat(50));

// Check if we're in the right environment
if (typeof window === 'undefined') {
  console.log('❌ This script must be run in the browser console');
} else {
  console.log('✅ Running in browser environment');
}

// Debug functions
const debugAnalytics = {
  
  // Check authentication status
  checkAuth() {
    console.log('\n🔐 Checking Authentication...');
    
    const token = localStorage.getItem('token');
    if (token) {
      console.log('✅ Token found in localStorage');
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        console.log('👤 User info:', {
          userId: payload.userId,
          role: payload.role,
          workplaceId: payload.workplaceId,
          exp: new Date(payload.exp * 1000)
        });
        
        if (payload.exp * 1000 < Date.now()) {
          console.log('⚠️  Token is expired');
        } else {
          console.log('✅ Token is valid');
        }
      } catch (error) {
        console.log('❌ Invalid token format');
      }
    } else {
      console.log('❌ No token found in localStorage');
    }
  },
  
  // Check React Query cache
  checkQueryCache() {
    console.log('\n📦 Checking React Query Cache...');
    
    // Try to access the query client from window (if exposed)
    if (window.__REACT_QUERY_CLIENT__) {
      const queryClient = window.__REACT_QUERY_CLIENT__;
      const cache = queryClient.getQueryCache();
      const queries = cache.getAll();
      
      console.log(`📊 Total cached queries: ${queries.length}`);
      
      const analyticsQueries = queries.filter(query => 
        query.queryKey.some(key => 
          typeof key === 'string' && key.includes('analytics')
        )
      );
      
      console.log(`📈 Analytics queries: ${analyticsQueries.length}`);
      
      analyticsQueries.forEach(query => {
        console.log(`   - ${query.queryKey.join(' > ')}: ${query.state.status}`);
        if (query.state.error) {
          console.log(`     Error: ${query.state.error.message}`);
        }
        if (query.state.data) {
          console.log(`     Data: ${JSON.stringify(query.state.data).substring(0, 100)}...`);
        }
      });
    } else {
      console.log('⚠️  React Query client not accessible from window');
      console.log('💡 Try running this from the React DevTools console');
    }
  },
  
  // Test API endpoints directly
  async testApiEndpoints() {
    console.log('\n🌐 Testing API Endpoints...');
    
    const token = localStorage.getItem('token');
    if (!token) {
      console.log('❌ No authentication token available');
      return;
    }
    
    const baseUrl = window.location.origin.includes('localhost:3000') 
      ? 'http://localhost:5000/api' 
      : '/api';
    
    const endpoints = [
      '/appointments/analytics',
      '/follow-ups/analytics', 
      '/reminders/analytics',
      '/schedules/capacity'
    ];
    
    const params = new URLSearchParams({
      startDate: '2024-10-01',
      endDate: '2024-10-30'
    });
    
    for (const endpoint of endpoints) {
      try {
        console.log(`📡 Testing ${endpoint}...`);
        
        const response = await fetch(`${baseUrl}${endpoint}?${params}`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        
        console.log(`   Status: ${response.status}`);
        
        if (response.ok) {
          const data = await response.json();
          console.log(`   ✅ Success: ${data.success}`);
          console.log(`   📊 Data keys: ${Object.keys(data.data || {}).join(', ')}`);
        } else {
          const error = await response.text();
          console.log(`   ❌ Error: ${error}`);
        }
        
      } catch (error) {
        console.log(`   ❌ Network error: ${error.message}`);
      }
    }
  },
  
  // Check component state
  checkComponentState() {
    console.log('\n⚛️  Checking Component State...');
    
    // Look for analytics components in the DOM
    const analyticsComponents = [
      '[data-testid*="analytics"]',
      '[class*="analytics"]',
      '[class*="Analytics"]'
    ];
    
    analyticsComponents.forEach(selector => {
      const elements = document.querySelectorAll(selector);
      if (elements.length > 0) {
        console.log(`📊 Found ${elements.length} elements matching: ${selector}`);
      }
    });
    
    // Check for error messages
    const errorElements = document.querySelectorAll('[role="alert"], .error, .alert-error');
    if (errorElements.length > 0) {
      console.log(`⚠️  Found ${errorElements.length} error elements:`);
      errorElements.forEach((el, index) => {
        console.log(`   ${index + 1}. ${el.textContent?.substring(0, 100)}...`);
      });
    }
    
    // Check for loading states
    const loadingElements = document.querySelectorAll('[role="progressbar"], .loading, .spinner');
    if (loadingElements.length > 0) {
      console.log(`⏳ Found ${loadingElements.length} loading elements`);
    }
  },
  
  // Check network requests
  checkNetworkRequests() {
    console.log('\n🌐 Monitoring Network Requests...');
    console.log('💡 Open Network tab in DevTools to see requests');
    
    // Override fetch to log analytics requests
    const originalFetch = window.fetch;
    window.fetch = function(...args) {
      const url = args[0];
      if (typeof url === 'string' && url.includes('analytics')) {
        console.log(`📡 Analytics request: ${url}`);
      }
      return originalFetch.apply(this, args)
        .then(response => {
          if (typeof url === 'string' && url.includes('analytics')) {
            console.log(`📡 Analytics response: ${response.status} ${response.statusText}`);
          }
          return response;
        })
        .catch(error => {
          if (typeof url === 'string' && url.includes('analytics')) {
            console.log(`📡 Analytics error: ${error.message}`);
          }
          throw error;
        });
    };
    
    console.log('✅ Network monitoring enabled');
    console.log('💡 Navigate to analytics components to see requests');
  },
  
  // Run all checks
  async runAllChecks() {
    console.log('🚀 Running All Analytics Debug Checks\n');
    
    this.checkAuth();
    this.checkQueryCache();
    await this.testApiEndpoints();
    this.checkComponentState();
    this.checkNetworkRequests();
    
    console.log('\n✨ Debug checks complete!');
    console.log('\n💡 Next steps:');
    console.log('   1. Check the Network tab for failed requests');
    console.log('   2. Look at React DevTools for component state');
    console.log('   3. Check browser console for JavaScript errors');
    console.log('   4. Verify user permissions in the backend');
  }
};

// Auto-run basic checks
debugAnalytics.runAllChecks();

// Make debug functions available globally
window.debugAnalytics = debugAnalytics;

console.log('\n💡 Debug functions available:');
console.log('   - debugAnalytics.checkAuth()');
console.log('   - debugAnalytics.checkQueryCache()');
console.log('   - debugAnalytics.testApiEndpoints()');
console.log('   - debugAnalytics.checkComponentState()');
console.log('   - debugAnalytics.checkNetworkRequests()');
console.log('   - debugAnalytics.runAllChecks()');