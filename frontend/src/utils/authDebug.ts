// Function to clear invalid cookies
export const clearInvalidCookies = async (): Promise<boolean> => {
  try {
    await axios.post('http://localhost:5000/api/auth/clear-cookies', {}, {
      withCredentials: true
    });

    console.log('Cookies cleared successfully');
    // Reload the page to clear any cached state
    window.location.reload();
    return true;
  } catch (error) {
    console.error('Clear cookies failed:', error);
    return false;
  }
};

// Function to check authentication status using httpOnly cookies
export const checkAuthToken = async (): Promise<boolean> => {
  try {
    // Try to make an authenticated request to check if we're logged in
    await axios.get('http://localhost:5000/api/auth/me', {
      withCredentials: true
    });
    console.log('Auth check successful');
    return true;
  } catch {
    console.log('Auth check failed - not authenticated');
    return false;
  }
};

// Function to test API connection with httpOnly cookies
export const testAPIConnection = async (): Promise<boolean> => {
  try {
    console.log('Testing API connection with httpOnly cookies...');

    const response = await axios.get(
      'http://localhost:5000/api/feature-flags',
      {
        withCredentials: true, // Include httpOnly cookies
      }
    );

    console.log('API test successful:', response.data);
    return true;
  } catch (error) {
    const axiosError = error as AxiosError;
    console.error(
      'API test failed:',
      axiosError.response ? axiosError.response.data : axiosError.message
    );
    return false;
  }
};

// Function to test login (replaces manual token setting)
export const testLogin = async (email: string, password: string): Promise<boolean> => {
  try {
    const response = await axios.post('http://localhost:5000/api/auth/login', {
      email,
      password
    }, {
      withCredentials: true
    });

    console.log('Test login successful:', response.status);
    return true;
  } catch (error) {
    console.error('Test login failed:', error);
    return false;
  }
};
