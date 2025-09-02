import { authService } from '../services/authService';

// Test login with debug user
async function testAuth() {
  try {
    console.log('Testing authentication...');

    // Try to login with debug user
    const loginResult = await authService.login({
      email: 'debug@test.com',
      password: 'debug123',
    });

    console.log('Login result:', loginResult);

    // Check current user
    const currentUser = await authService.getCurrentUser();
    console.log('Current user:', currentUser);

    return { success: true, user: currentUser };
  } catch (error) {
    console.error('Auth test failed:', error);
    return { success: false, error };
  }
}

// Export for use in browser console
(window as Window & { testAuth?: typeof testAuth }).testAuth = testAuth;

export { testAuth };
