/**
 * API Service with Authentication Interceptor
 *
 * This utility provides a centralized way to make API calls with automatic
 * JWT token handling to fix the "No JWT token available" errors.
 */

// API base URL from environment variable
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

/**
 * API request options interface
 */
interface ApiOptions extends RequestInit {
  headers?: Record<string, string>;
}

/**
 * Get JWT token from storage
 * Will throw an error if token is not found
 */
const getToken = (): string => {
  // Try to get token from localStorage first
  let token = localStorage.getItem('jwt-token');

  // If not found, check auth-storage from Zustand
  if (!token) {
    try {
      const authStorage = localStorage.getItem('auth-storage');
      if (authStorage) {
        const parsedStorage = JSON.parse(authStorage);
        token = parsedStorage.state?.token;
      }
    } catch (error) {
      console.error('Failed to parse auth storage:', error);
    }
  }

  // DEVELOPMENT ONLY: If we're in development mode and no token is found,
  // return a test token for easier debugging
  if (!token && import.meta.env.DEV) {
    console.warn('⚠️ DEV MODE: Using test token since no authentication found');
    // This is a fake token that will be acceptable for bypass auth in development
    return 'dev-token-for-testing';
  }

  if (!token) {
    throw new Error('Authentication required - Please log in again');
  }

  return token;
};

/**
 * Centralized API call function with automatic token handling
 */
export const apiCall = async <T = any>(endpoint: string, options: ApiOptions = {}): Promise<T> => {
  try {
    console.log(`📞 API Call: ${options.method || 'GET'} ${API_BASE_URL}${endpoint}`);

    let token = '';

    try {
      // Get JWT token
      token = getToken();
    } catch (tokenError) {
      // In development mode, continue without token using bypass auth
      if (import.meta.env.DEV) {
        console.warn('⚠️ No token found, using development bypass auth');
      } else {
        throw tokenError;
      }
    }

    // Merge headers with Authorization
    const headers = {
      'Content-Type': 'application/json',
      // Only add Authorization if we have a token
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      // Add development bypass auth header when no token is available in dev mode
      ...(import.meta.env.DEV && !token ? { 'X-Bypass-Auth': 'development-only-123' } : {}),
      ...(options.headers || {}),
    };

    // Make API call
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers,
    });

    console.log(`📩 API Response: ${response.status} ${response.statusText} for ${endpoint}`);
    // For debugging - log response content for quotations endpoint
    if (endpoint === '/quotations') {
      const clonedResponse = response.clone();
      try {
        const data = await clonedResponse.json();
        console.log(`📊 Quotations API Response Data (${endpoint}):`, data);
        if (data && data.length > 0) {
          console.log('📝 First quotation details:', {
            id: data[0].id,
            customerName: data[0].customerName,
            customerId: data[0].customerId,
            customerContact: JSON.stringify(data[0].customerContact).substring(0, 100),
            selectedEquipment: data[0].selectedEquipment
              ? `${data[0].selectedEquipment.name || 'Unnamed'} (${data[0].selectedEquipment.type || 'Unknown type'})`
              : 'No equipment',
          });

          // Check if we have valid equipment data
          const hasEquipment = data[0].selectedEquipment && data[0].selectedEquipment.name;
          const hasMachines =
            data[0].selectedMachines &&
            Array.isArray(data[0].selectedMachines) &&
            data[0].selectedMachines.length > 0;

          console.log('📋 Equipment data check:', {
            hasEquipment: !!hasEquipment,
            hasMachines: !!hasMachines,
            machineCount: hasMachines ? data[0].selectedMachines.length : 0,
            firstMachine: hasMachines ? data[0].selectedMachines[0].name : 'N/A',
          });

          // Check if we have valid customer data
          const hasCustomerId = !!data[0].customerId;
          const hasCustomerName = !!data[0].customerName;
          const hasCustomerContact =
            data[0].customerContact &&
            typeof data[0].customerContact === 'object' &&
            Object.keys(data[0].customerContact).length > 0;

          console.log('👤 Customer data check:', {
            hasCustomerId,
            hasCustomerName,
            hasCustomerContact,
            customerType: hasCustomerContact ? typeof data[0].customerContact : 'N/A',
          });
        }
      } catch (e) {
        console.error('Error parsing response data:', e);
      }
    }

    // Handle response
    if (!response.ok) {
      // Try to parse error response
      let errorMessage = `API Error: ${response.status} ${response.statusText}`;
      const contentType = response.headers.get('content-type');

      // Enhanced logging for debugging
      console.error(
        `API Error: ${response.status} ${response.statusText} for ${API_BASE_URL}${endpoint}`
      );
      console.error('Response Headers:', {
        'content-type': contentType,
        'content-length': response.headers.get('content-length'),
      });

      try {
        if (contentType && contentType.includes('application/json')) {
          const errorData = await response.json();
          errorMessage = errorData.error || errorMessage;
          if (errorData.details) {
            errorMessage += ` - ${errorData.details}`;
          }
          console.error('API Error JSON:', errorData);
          // Handle token expiration
          if (response.status === 401) {
            // Enhanced debugging for 401 errors
            console.warn('👮‍♂️ Authentication Error:', {
              endpoint,
              headers: {
                'authorization': options.headers?.['Authorization']
                  ? 'Present (Token masked)'
                  : 'Missing',
                'x-bypass-auth': options.headers?.['X-Bypass-Auth'] || 'Not present',
              },
              environment: import.meta.env.MODE,
              devMode: import.meta.env.DEV,
              timestamp: new Date().toISOString(),
            });

            // In development mode, try to continue without redirecting
            if (import.meta.env.DEV) {
              console.warn('⚠️ DEV MODE: Authentication error occurred. Not redirecting to login.');
              throw new Error(
                `Authentication required for ${endpoint} - Bypassed redirect in development mode`
              );
            }

            // In production, clear token and redirect to login
            localStorage.removeItem('jwt-token');
            sessionStorage.removeItem('auth-state');

            console.warn('Authentication required - redirecting to login');
            setTimeout(() => {
              window.location.href = '/login?expired=true';
            }, 500);

            throw new Error('Authentication session expired - Please log in again');
          }
        } else {
          const errorText = await response.text();
          if (errorText) {
            console.error('API Error Text:', errorText.substring(0, 300));
            errorMessage += ` - ${errorText.substring(0, 100)}`;
          }
        }
      } catch (parseError) {
        console.error('Error parsing API error response:', parseError);
        errorMessage += ' (Error response could not be parsed)';
      }

      // Create a more descriptive error with the endpoint
      throw new Error(`${errorMessage} (${endpoint})`);
    }

    // Return successful response - handle both wrapped and direct responses
    const jsonResponse = await response.json();

    // Check if the response is wrapped in a success/data structure
    if (
      jsonResponse &&
      typeof jsonResponse === 'object' &&
      'success' in jsonResponse &&
      'data' in jsonResponse
    ) {
      return jsonResponse.data as T;
    }

    // Otherwise return the response directly
    return jsonResponse as T;
  } catch (error) {
    console.error(`API call failed: ${endpoint}`, error);
    throw error;
  }
};

// Export convenience methods for common HTTP verbs
export const api = {
  get: <T = any>(endpoint: string) => apiCall<T>(endpoint, { method: 'GET' }),

  post: <T = any>(endpoint: string, data: any) =>
    apiCall<T>(endpoint, {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  put: <T = any>(endpoint: string, data: any) =>
    apiCall<T>(endpoint, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  patch: <T = any>(endpoint: string, data: any) =>
    apiCall<T>(endpoint, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),

  delete: <T = any>(endpoint: string) => apiCall<T>(endpoint, { method: 'DELETE' }),
};
