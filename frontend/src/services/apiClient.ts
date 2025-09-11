import axios from 'axios';

// Create axios instance with base configuration
export const apiClient = axios.create({
   baseURL: process.env.REACT_APP_API_URL || 'http://localhost:5000',
   timeout: 10000,
   headers: {
      'Content-Type': 'application/json',
   },
   withCredentials: true, // Include cookies for authentication
});

// Request interceptor (no longer needs token from localStorage)
apiClient.interceptors.request.use(
   (config) => {
      // Authentication is handled via httpOnly cookies
      // No need to manually add Authorization header
      return config;
   },
   (error) => {
      return Promise.reject(error);
   }
);

// Store pending requests when refreshing token
let isRefreshing = false;
let refreshSubscribers: ((token: string) => void)[] = [];

// Function to add callbacks to the queue
const subscribeTokenRefresh = (cb: (token: string) => void) => {
   refreshSubscribers.push(cb);
};

// Function to execute all callbacks when token refresh is complete
const onTokenRefreshed = (token: string) => {
   refreshSubscribers.forEach((cb) => cb(token));
   refreshSubscribers = [];
};

// Response interceptor with enhanced token refresh logic
apiClient.interceptors.response.use(
   (response) => {
      return response;
   },
   async (error) => {
      const originalRequest = error.config;

      // Only try to refresh for 401 errors that aren't from the auth endpoints
      if (
         error.response?.status === 401 &&
         !originalRequest._retry &&
         !originalRequest.url?.includes('/auth/login') &&
         !originalRequest.url?.includes('/auth/refresh-token')
      ) {
         if (!isRefreshing) {
            // Set flag to indicate we're refreshing
            isRefreshing = true;
            originalRequest._retry = true;

            try {
               // Try to refresh the token
               const res = await axios.post(
                  `${
                     process.env.REACT_APP_API_URL || 'http://localhost:5000'
                  }/api/auth/refresh-token`,
                  {},
                  { withCredentials: true }
               );

               if (res.status === 200) {
                  // Token is refreshed and automatically set as a cookie
                  // Resume requests
                  onTokenRefreshed('refreshed');
                  isRefreshing = false;

                  // Retry the original request
                  return apiClient(originalRequest);
               } else {
                  // If refresh failed, redirect to login
                  window.location.href = '/login?session=expired';
                  return Promise.reject(error);
               }
            } catch (refreshError) {
               // If refresh failed, redirect to login
               isRefreshing = false;
               window.location.href = '/login?session=expired';
               return Promise.reject(refreshError);
            }
         } else {
            // If refresh is already happening, wait for it to complete
            return new Promise((resolve) => {
               subscribeTokenRefresh(() => {
                  resolve(apiClient(originalRequest));
               });
            });
         }
      }
      return Promise.reject(error);
   }
);

export default apiClient;
