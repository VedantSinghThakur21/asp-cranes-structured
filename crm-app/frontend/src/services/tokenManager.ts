/**
 * Frontend JWT Token Management Service
 * Handles automatic token refresh and token lifecycle management
 */

interface TokenRefreshResponse {
  success: boolean;
  accessToken?: string;
  expiresIn?: number;
  error?: string;
}

interface TokenInfo {
  token: string;
  expiresAt: number;
  isExpired: boolean;
  timeUntilExpiry: number;
}

class TokenManager {
  private refreshTimer: NodeJS.Timeout | null = null;
  private isRefreshing = false;
  private refreshPromise: Promise<boolean> | null = null;
  private readonly REFRESH_THRESHOLD = 5 * 60 * 1000; // 5 minutes before expiry
  private readonly MAX_REFRESH_ATTEMPTS = 3;
  private refreshAttempts = 0;

  /**
   * Start automatic token refresh monitoring
   */
  public startAutoRefresh(): void {
    console.log('🔄 Starting automatic token refresh monitoring');
    this.scheduleNextRefresh();
  }

  /**
   * Stop automatic token refresh
   */
  public stopAutoRefresh(): void {
    if (this.refreshTimer) {
      clearTimeout(this.refreshTimer);
      this.refreshTimer = null;
      console.log('⏹️ Stopped automatic token refresh');
    }
  }

  /**
   * Get current token information
   */
  public getTokenInfo(): TokenInfo | null {
    const token = localStorage.getItem(import.meta.env.VITE_JWT_STORAGE_KEY || 'asp_cranes_jwt');

    if (!token) {
      return null;
    }

    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const expiresAt = payload.exp * 1000; // Convert to milliseconds
      const now = Date.now();

      return {
        token,
        expiresAt,
        isExpired: now >= expiresAt,
        timeUntilExpiry: expiresAt - now,
      };
    } catch (error) {
      console.error('Failed to parse token:', error);
      return null;
    }
  }

  /**
   * Check if token needs refresh (expires within threshold)
   */
  public needsRefresh(): boolean {
    const tokenInfo = this.getTokenInfo();

    if (!tokenInfo) {
      return false;
    }

    return tokenInfo.timeUntilExpiry <= this.REFRESH_THRESHOLD;
  }

  /**
   * Refresh the access token
   */
  public async refreshToken(): Promise<boolean> {
    // Prevent multiple simultaneous refresh attempts
    if (this.isRefreshing) {
      if (this.refreshPromise) {
        return await this.refreshPromise;
      }
      return false;
    }

    this.isRefreshing = true;
    this.refreshAttempts++;

    this.refreshPromise = this.performTokenRefresh();
    const result = await this.refreshPromise;

    this.isRefreshing = false;
    this.refreshPromise = null;

    if (result) {
      this.refreshAttempts = 0; // Reset on success
      this.scheduleNextRefresh();
    } else if (this.refreshAttempts >= this.MAX_REFRESH_ATTEMPTS) {
      console.error('Max refresh attempts reached. Logging out user.');
      this.handleRefreshFailure();
    }

    return result;
  }

  /**
   * Perform the actual token refresh API call
   */
  private async performTokenRefresh(): Promise<boolean> {
    try {
      console.log('🔄 Refreshing access token...');

      const response = await fetch(`${import.meta.env.VITE_API_URL}/auth/refresh`, {
        method: 'POST',
        credentials: 'include', // Include HTTP-only cookies
        headers: {
          'Content-Type': 'application/json',
          'X-Requested-With': 'XMLHttpRequest',
        },
      });

      if (!response.ok) {
        console.error('Token refresh failed:', response.status, response.statusText);
        return false;
      }

      const data: TokenRefreshResponse = await response.json();

      if (data.success && data.accessToken) {
        // Store new token
        localStorage.setItem(
          import.meta.env.VITE_JWT_STORAGE_KEY || 'asp_cranes_jwt',
          data.accessToken
        );

        console.log('✅ Token refreshed successfully');

        // Dispatch custom event for other components to update
        window.dispatchEvent(
          new CustomEvent('tokenRefreshed', {
            detail: { accessToken: data.accessToken },
          })
        );

        return true;
      } else {
        console.error('Token refresh response invalid:', data.error);
        return false;
      }
    } catch (error) {
      console.error('Token refresh error:', error);
      return false;
    }
  }

  /**
   * Schedule the next token refresh check
   */
  private scheduleNextRefresh(): void {
    const tokenInfo = this.getTokenInfo();

    if (!tokenInfo) {
      console.log('No token found, stopping refresh schedule');
      return;
    }

    // Calculate when to check next (either when token expires or in 1 minute intervals)
    const checkInterval = Math.min(
      Math.max(tokenInfo.timeUntilExpiry - this.REFRESH_THRESHOLD, 60000), // At least 1 minute
      5 * 60 * 1000 // At most 5 minutes
    );

    this.refreshTimer = setTimeout(() => {
      this.checkAndRefreshToken();
    }, checkInterval);

    console.log(`🕐 Next token check scheduled in ${Math.round(checkInterval / 60000)} minutes`);
  }

  /**
   * Check if token needs refresh and perform it if necessary
   */
  private async checkAndRefreshToken(): Promise<void> {
    const tokenInfo = this.getTokenInfo();

    if (!tokenInfo) {
      console.log('No token found during check');
      return;
    }

    if (tokenInfo.isExpired) {
      console.log('Token has expired, attempting refresh');
      await this.refreshToken();
    } else if (this.needsRefresh()) {
      console.log('Token expires soon, refreshing proactively');
      await this.refreshToken();
    } else {
      // Token is still valid, schedule next check
      this.scheduleNextRefresh();
    }
  }

  /**
   * Handle refresh failure by logging out user
   */
  private handleRefreshFailure(): void {
    console.error('Token refresh failed completely, logging out user');

    // Clear stored tokens
    localStorage.removeItem(import.meta.env.VITE_JWT_STORAGE_KEY || 'asp_cranes_jwt');
    localStorage.removeItem('user');

    // Dispatch logout event
    window.dispatchEvent(
      new CustomEvent('authenticationFailed', {
        detail: { reason: 'token_refresh_failed' },
      })
    );

    // Stop auto refresh
    this.stopAutoRefresh();

    // Redirect to login (if we're not already there)
    if (!window.location.pathname.includes('/login')) {
      window.location.href = '/login?reason=session_expired';
    }
  }

  /**
   * Initialize token management on page load
   */
  public initialize(): void {
    console.log('🚀 Initializing token manager');

    // Check if we have a valid token
    const tokenInfo = this.getTokenInfo();

    if (tokenInfo && !tokenInfo.isExpired) {
      this.startAutoRefresh();
    } else if (tokenInfo && tokenInfo.isExpired) {
      console.log('Token expired on initialization, attempting refresh');
      this.refreshToken();
    } else {
      console.log('No token found on initialization');
    }

    // Listen for page visibility changes to refresh when page becomes visible
    document.addEventListener('visibilitychange', () => {
      if (!document.hidden && this.getTokenInfo()) {
        this.checkAndRefreshToken();
      }
    });

    // Listen for storage changes (multi-tab support)
    window.addEventListener('storage', e => {
      if (e.key === (import.meta.env.VITE_JWT_STORAGE_KEY || 'asp_cranes_jwt')) {
        if (e.newValue) {
          // Token updated in another tab
          this.stopAutoRefresh();
          this.startAutoRefresh();
        } else {
          // Token removed in another tab
          this.stopAutoRefresh();
        }
      }
    });
  }

  /**
   * Manual token refresh for API calls
   */
  public async ensureValidToken(): Promise<string | null> {
    const tokenInfo = this.getTokenInfo();

    if (!tokenInfo) {
      return null;
    }

    if (tokenInfo.isExpired || this.needsRefresh()) {
      const refreshed = await this.refreshToken();
      if (!refreshed) {
        return null;
      }

      // Get the new token
      const newTokenInfo = this.getTokenInfo();
      return newTokenInfo?.token || null;
    }

    return tokenInfo.token;
  }

  /**
   * Get authorization header for API calls
   */
  public async getAuthHeader(): Promise<Record<string, string>> {
    const token = await this.ensureValidToken();

    if (!token) {
      return {};
    }

    return {
      Authorization: `Bearer ${token}`,
    };
  }
}

// Create singleton instance
export const tokenManager = new TokenManager();

// Auto-initialize when module is imported
if (typeof window !== 'undefined') {
  // Wait for DOM to be ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      tokenManager.initialize();
    });
  } else {
    tokenManager.initialize();
  }
}

export default tokenManager;
