import axios from 'axios';

// Create a centralized Axios instance
const api = axios.create({
  baseURL: 'http://localhost:5000/api', // Point to the Express backend
  withCredentials: true, // IMPORTANT: Allows sending the HTTP-only JWT cookies
});

// Response interceptor to handle global errors (e.g., Token expired)
api.interceptors.response.use(
  (response) => {
    // Any status code that lie within the range of 2xx cause this function to trigger
    return response;
  },
  (error) => {
    // Any status codes that falls outside the range of 2xx cause this function to trigger
    if (error.response && error.response.status === 401) {
      // If the backend returns 401 Unauthorized, the token is likely invalid or expired
      // In the future, we could trigger a logout event here if needed
      console.warn('API returned 401 Unauthorized');
    }
    return Promise.reject(error);
  }
);

export default api;
