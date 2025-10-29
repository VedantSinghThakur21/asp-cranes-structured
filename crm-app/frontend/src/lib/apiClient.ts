/**
 * Returns headers including Authorization if token exists
 */
export function getHeaders(): Record<string, string> {
  const token = getAuthToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}
/**
 * Enhanced API Client
 *
 * Production-ready API client with robust error handling, authentication,
 * retry logic, and fallback mechanisms for development mode
 */

const API_URL = import.meta.env.VITE_API_URL || '/api';
const isProduction = import.meta.env.PROD || false;
const enableDebug = !isProduction;

// Type definitions for API responses
export interface ApiError {
  message: string;
  code?: string;
  details?: any;
  status?: number;
}

export interface ApiResponse<T> {
  data?: T;
  error?: ApiError;
  success: boolean;
}

/**
 * Get auth token from localStorage
 */
const getAuthToken = (): string | null => {
  try {
    // Check multiple possible storage keys for compatibility
    return (
      localStorage.getItem('jwt-token') ||
      localStorage.getItem('authToken') ||
      sessionStorage.getItem('jwt-token') ||
      sessionStorage.getItem('authToken')
    );
  } catch (e) {
    console.error('Error accessing storage for auth token:', e);
    return null;
  }
};

/**
 * Enhanced fetch wrapper with better error handling
 */
async function apiFetch<T>(endpoint: string, options: RequestInit = {}): Promise<ApiResponse<T>> {
  const url = endpoint.startsWith('http')
    ? endpoint
    : `${API_URL}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;

  // Add authentication token if available
  const token = getAuthToken();
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  };

  if (enableDebug) {
    console.log(`🔹 API Request: ${options.method || 'GET'} ${url}`);
    if (options.body) {
      try {
        console.log(
          'Request Body:',
          typeof options.body === 'string' ? JSON.parse(options.body) : options.body
        );
      } catch (e) {
        console.log('Request Body: [Unable to parse]', options.body);
      }
    }
  }

  try {
    const response = await fetch(url, {
      ...options,
      headers,
    });

    if (enableDebug) {
      console.log(`🔸 API Response: ${response.status} ${response.statusText} for ${url}`);
      console.log('Response Headers:', {
        'content-type': response.headers.get('content-type'),
        'content-length': response.headers.get('content-length'),
      });
    }

    // Clone the response so we can read it twice
    const clonedResponse = response.clone();

    // If not ok, try to get error details
    if (!response.ok) {
      try {
        // Try to parse as JSON first
        const contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
          const errorData = await response.json();
          if (enableDebug) {
            console.error('API Error Response (JSON):', errorData);
          }
          return {
            success: false,
            error: {
              message: errorData.error || errorData.message || 'API request failed',
              code: errorData.code || String(response.status),
              status: response.status,
              details: errorData.details || errorData,
            },
          };
        } else {
          // If not JSON, try to get the text response
          const errorText = await response.text();
          if (enableDebug) {
            console.error(
              'API Error Response (Text):',
              errorText.substring(0, 500) + (errorText.length > 500 ? '...' : '')
            );
          }
          return {
            success: false,
            error: {
              message: errorText || 'API request failed with non-JSON response',
              code: String(response.status),
              status: response.status,
            },
          };
        }
      } catch (parseError) {
        if (enableDebug) {
          console.error('Error parsing error response:', parseError);
        }
        return {
          success: false,
          error: {
            message: `API request failed: ${response.status} ${response.statusText}`,
            code: String(response.status),
            status: response.status,
          },
        };
      }
    }

    // For successful responses
    try {
      // If status is 204 No Content, return success with no data
      if (response.status === 204) {
        return { success: true };
      }

      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        const data = await response.json();
        if (enableDebug) {
          console.log('API Success Response:', data);
        }
        return { success: true, data };
      } else {
        const text = await response.text();
        if (enableDebug) {
          console.log(
            'API Success Response (Text):',
            text.substring(0, 500) + (text.length > 500 ? '...' : '')
          );
        }
        // Convert text response to an object for consistent return type
        return { success: true, data: text as unknown as T };
      }
    } catch (parseError) {
      if (enableDebug) {
        console.error('Error parsing success response:', parseError);
      }

      // Try to get the raw text for debugging
      try {
        const text = await clonedResponse.text();
        if (enableDebug) {
          console.error(
            'Raw response text:',
            text.substring(0, 500) + (text.length > 500 ? '...' : '')
          );
        }
      } catch (textError) {
        if (enableDebug) {
          console.error('Could not get raw response text:', textError);
        }
      }

      return {
        success: false,
        error: {
          message: 'Failed to parse API response',
          code: 'PARSE_ERROR',
        },
      };
    }
  } catch (error) {
    if (enableDebug) {
      console.error(`API Fetch Error for ${url}:`, error);
    }
    return {
      success: false,
      error: {
        message: error instanceof Error ? error.message : 'Unknown API error',
        code: 'CLIENT_ERROR',
      },
    };
  }
}

/**
 * API convenience methods with proper TypeScript generics
 */
export const api = {
  /**
   * GET request helper
   */
  get: <T>(endpoint: string, options: RequestInit = {}): Promise<ApiResponse<T>> => {
    return apiFetch<T>(endpoint, { ...options, method: 'GET' });
  },

  /**
   * POST request helper
   */
  post: <T>(endpoint: string, data: any, options: RequestInit = {}): Promise<ApiResponse<T>> => {
    return apiFetch<T>(endpoint, {
      ...options,
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  /**
   * PUT request helper
   */
  put: <T>(endpoint: string, data: any, options: RequestInit = {}): Promise<ApiResponse<T>> => {
    return apiFetch<T>(endpoint, {
      ...options,
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  /**
   * PATCH request helper
   */
  patch: <T>(endpoint: string, data: any, options: RequestInit = {}): Promise<ApiResponse<T>> => {
    return apiFetch<T>(endpoint, {
      ...options,
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  },

  /**
   * DELETE request helper
   */
  delete: <T>(endpoint: string, options: RequestInit = {}): Promise<ApiResponse<T>> => {
    return apiFetch<T>(endpoint, { ...options, method: 'DELETE' });
  },
};

/**
 * Authentication helpers
 */
export const authApi = {
  login: <T>(email: string, password: string): Promise<ApiResponse<T>> =>
    api.post<T>('/auth/login', { email, password }),

  verifyToken: <T>(token: string): Promise<ApiResponse<T>> => {
    // Always use server verification for tokens
    return api.post<T>('/auth/verify-token', { token });
  },

  logout: <T>(): Promise<ApiResponse<T>> => api.post<T>('/auth/logout', {}),
};

// Export api object as default
export default api;
