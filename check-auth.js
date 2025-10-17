// Check authentication status
console.log('=== Authentication Check ===');
console.log('localStorage token:', localStorage.getItem('token'));
console.log('localStorage authToken:', localStorage.getItem('authToken'));
console.log('localStorage workplaceId:', localStorage.getItem('workplaceId'));
console.log('document.cookie:', document.cookie);

// Test API call
async function testAuth() {
    try {
        const response = await fetch('/api/auth/me', {
            credentials: 'include'
        });
        const data = await response.json();
        console.log('Auth check result:', data);
        
        if (data.success) {
            console.log('✅ User is authenticated');
            console.log('User info:', data.user);
        } else {
            console.log('❌ User is not authenticated');
        }
    } catch (error) {
        console.error('Auth check error:', error);
    }
}

testAuth();