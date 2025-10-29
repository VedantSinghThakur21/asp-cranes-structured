/**
 * Global Configuration Store
 * Manages all configuration types and ensures data consistency across modules
 */

import { create } from 'zustand';
import {
  getQuotationConfig,
  getResourceRatesConfig,
  getAdditionalParamsConfig,
  updateQuotationConfig,
  updateResourceRatesConfig,
  updateAdditionalParamsConfig,
} from '../services/configService';

interface QuotationConfig {
  orderTypeLimits: {
    micro: { minDays: number; maxDays: number };
    small: { minDays: number; maxDays: number };
    monthly: { minDays: number; maxDays: number };
    yearly: { minDays: number; maxDays: number };
  };
  updatedAt?: string;
}

interface ResourceRatesConfig {
  foodRatePerMonth: number;
  accommodationRatePerMonth: number;
  transportRate: number;
  updatedAt?: string;
}

interface AdditionalParamsConfig {
  riggerAmount: number;
  helperAmount: number;
  incidentalOptions: Array<{
    value: string;
    label: string;
    amount: number;
  }>;
  usageFactors: {
    normal: number;
    medium: number;
    heavy: number;
  };
  riskFactors: {
    low: number;
    medium: number;
    high: number;
  };
  shiftFactors: {
    single: number;
    double: number;
  };
  dayNightFactors: {
    day: number;
    night: number;
  };

  updatedAt?: string;
}

interface ConfigState {
  // Configuration data
  quotationConfig: QuotationConfig | null;
  resourceRatesConfig: ResourceRatesConfig | null;
  additionalParamsConfig: AdditionalParamsConfig | null;

  // Loading states
  isLoading: boolean;
  errors: Record<string, string>;

  // Last fetch timestamps for cache invalidation
  lastFetchTimes: Record<string, number>;

  // Actions
  fetchAllConfigs: () => Promise<void>;
  fetchQuotationConfig: () => Promise<void>;
  fetchResourceRatesConfig: () => Promise<void>;
  fetchAdditionalParamsConfig: () => Promise<void>;

  updateQuotationConfig: (config: QuotationConfig['orderTypeLimits']) => Promise<void>;
  updateResourceRatesConfig: (config: Partial<ResourceRatesConfig>) => Promise<void>;
  updateAdditionalParamsConfig: (config: Partial<AdditionalParamsConfig>) => Promise<void>;

  // Utility methods
  invalidateConfig: (configType: string) => void;
  isConfigStale: (configType: string, maxAgeMs?: number) => boolean;
  subscribeToConfigChanges: (callback: (configType: string) => void) => () => void;
}

// Default configurations
// Fallbacks for first load or error only
const DEFAULT_QUOTATION_CONFIG: QuotationConfig = {
  orderTypeLimits: {
    micro: { minDays: 1, maxDays: 10 },
    small: { minDays: 11, maxDays: 25 },
    monthly: { minDays: 26, maxDays: 365 },
    yearly: { minDays: 366, maxDays: 3650 },
  },
};
// No default resource rates - must be configured in database
const DEFAULT_ADDITIONAL_PARAMS: AdditionalParamsConfig = {
  riggerAmount: 40000,
  helperAmount: 12000,
  incidentalOptions: [
    { value: 'incident1', label: 'Incident 1 - ₹5,000', amount: 5000 },
    { value: 'incident2', label: 'Incident 2 - ₹10,000', amount: 10000 },
    { value: 'incident3', label: 'Incident 3 - ₹15,000', amount: 15000 },
  ],
  usageFactors: { normal: 0, medium: 20, heavy: 50 },
  riskFactors: { low: 0, medium: 10, high: 20 },
  shiftFactors: { single: 1.0, double: 1.8 },
  dayNightFactors: { day: 1.0, night: 1.3 },
};

const CONFIG_CACHE_TIME = 5 * 60 * 1000; // 5 minutes

export const useConfigStore = create<ConfigState>((set, get) => {
  // List of config change listeners
  let configChangeListeners: Array<(configType: string) => void> = [];

  // Notify all listeners when a config changes
  const notifyConfigChange = (configType: string) => {
    configChangeListeners.forEach(callback => callback(configType));
  };

  return {
    // Initial state
    quotationConfig: null,
    resourceRatesConfig: null,
    additionalParamsConfig: null,
    isLoading: false,
    errors: {},
    lastFetchTimes: {},

    // Fetch all configurations
    fetchAllConfigs: async () => {
      const { fetchQuotationConfig, fetchResourceRatesConfig, fetchAdditionalParamsConfig } = get();

      set({ isLoading: true, errors: {} });

      try {
        await Promise.all([
          fetchQuotationConfig(),
          fetchResourceRatesConfig(),
          fetchAdditionalParamsConfig(),
        ]);
      } catch (error) {
        console.error('Error fetching configurations:', error);
      } finally {
        set({ isLoading: false });
      }
    },

    // Fetch quotation configuration
    fetchQuotationConfig: async () => {
      try {
        const config = await getQuotationConfig();
        set(state => ({
          quotationConfig: config || DEFAULT_QUOTATION_CONFIG,
          lastFetchTimes: { ...state.lastFetchTimes, quotation: Date.now() },
          errors: { ...state.errors, quotation: '' },
        }));
      } catch (error) {
        console.error('Error fetching quotation config:', error);
        set(state => ({
          quotationConfig: DEFAULT_QUOTATION_CONFIG,
          errors: { ...state.errors, quotation: 'Failed to fetch quotation configuration' },
        }));
      }
    },

    // Fetch resource rates configuration
    fetchResourceRatesConfig: async () => {
      try {
        const config = await getResourceRatesConfig();
        if (!config || !config.foodRatePerMonth || !config.accommodationRatePerMonth) {
          throw new Error('Resource rates not properly configured in database');
        }
        set(state => ({
          resourceRatesConfig: config,
          lastFetchTimes: { ...state.lastFetchTimes, resourceRates: Date.now() },
          errors: { ...state.errors, resourceRates: '' },
        }));
      } catch (error) {
        console.error('Error fetching resource rates config:', error);
        set(state => ({
          resourceRatesConfig: null,
          errors: {
            ...state.errors,
            resourceRates: 'Resource rates must be configured in database first',
          },
        }));
      }
    },

    // Fetch additional parameters configuration
    fetchAdditionalParamsConfig: async () => {
      try {
        const config = await getAdditionalParamsConfig();
        // Always merge with default to ensure all required fields are present
        set(state => ({
          additionalParamsConfig: { ...DEFAULT_ADDITIONAL_PARAMS, ...config },
          lastFetchTimes: { ...state.lastFetchTimes, additionalParams: Date.now() },
          errors: { ...state.errors, additionalParams: '' },
        }));
      } catch (error) {
        console.error('Error fetching additional params config:', error);
        set(state => ({
          additionalParamsConfig: DEFAULT_ADDITIONAL_PARAMS,
          errors: {
            ...state.errors,
            additionalParams: 'Failed to fetch additional parameters configuration',
          },
        }));
      }
    },

    // Update quotation configuration
    updateQuotationConfig: async (orderTypeLimits: QuotationConfig['orderTypeLimits']) => {
      try {
        const updatedConfig = await updateQuotationConfig({ orderTypeLimits });
        set(state => ({
          quotationConfig: updatedConfig,
          lastFetchTimes: { ...state.lastFetchTimes, quotation: Date.now() },
          errors: { ...state.errors, quotation: '' },
        }));

        // Notify other components that quotation config changed
        notifyConfigChange('quotation');
      } catch (error) {
        console.error('Error updating quotation config:', error);
        set(state => ({
          errors: { ...state.errors, quotation: 'Failed to update quotation configuration' },
        }));
        throw error;
      }
    },

    // Update resource rates configuration
    updateResourceRatesConfig: async (config: Partial<ResourceRatesConfig>) => {
      try {
        const updatedConfig = await updateResourceRatesConfig(config);
        set(state => ({
          resourceRatesConfig: updatedConfig,
          lastFetchTimes: { ...state.lastFetchTimes, resourceRates: Date.now() },
          errors: { ...state.errors, resourceRates: '' },
        }));

        // Notify other components that resource rates changed
        notifyConfigChange('resourceRates');
      } catch (error) {
        console.error('Error updating resource rates config:', error);
        set(state => ({
          errors: {
            ...state.errors,
            resourceRates: 'Failed to update resource rates configuration',
          },
        }));
        throw error;
      }
    },

    // Update additional parameters configuration
    updateAdditionalParamsConfig: async (config: Partial<AdditionalParamsConfig>) => {
      try {
        const updatedConfig = await updateAdditionalParamsConfig(config);
        set(state => ({
          additionalParamsConfig: { ...DEFAULT_ADDITIONAL_PARAMS, ...updatedConfig },
          lastFetchTimes: { ...state.lastFetchTimes, additionalParams: Date.now() },
          errors: { ...state.errors, additionalParams: '' },
        }));

        // Notify other components that additional params changed
        notifyConfigChange('additionalParams');
      } catch (error) {
        console.error('Error updating additional params config:', error);
        set(state => ({
          errors: {
            ...state.errors,
            additionalParams: 'Failed to update additional parameters configuration',
          },
        }));
        throw error;
      }
    },

    // Invalidate configuration cache
    invalidateConfig: (configType: string) => {
      set(state => {
        const newLastFetchTimes = { ...state.lastFetchTimes };
        delete newLastFetchTimes[configType];
        return { lastFetchTimes: newLastFetchTimes };
      });
    },

    // Check if configuration is stale
    isConfigStale: (configType: string, maxAgeMs: number = CONFIG_CACHE_TIME) => {
      const { lastFetchTimes } = get();
      const lastFetch = lastFetchTimes[configType];
      if (!lastFetch) return true;
      return Date.now() - lastFetch > maxAgeMs;
    },

    // Subscribe to configuration changes
    subscribeToConfigChanges: (callback: (configType: string) => void) => {
      configChangeListeners.push(callback);

      // Return unsubscribe function
      return () => {
        configChangeListeners = configChangeListeners.filter(cb => cb !== callback);
      };
    },
  };
});

// Helper hook for components that need fresh configuration data
export const useConfigWithRefresh = () => {
  const store = useConfigStore();

  const ensureFreshConfig = async (configType: string) => {
    if (store.isConfigStale(configType)) {
      switch (configType) {
        case 'quotation':
          await store.fetchQuotationConfig();
          break;
        case 'resourceRates':
          await store.fetchResourceRatesConfig();
          break;
        case 'additionalParams':
          await store.fetchAdditionalParamsConfig();
          break;
        default:
          await store.fetchAllConfigs();
      }
    }
  };

  return {
    ...store,
    ensureFreshConfig,
  };
};

// Export individual configuration getters for backward compatibility
export const useQuotationConfig = () => {
  const config = useConfigStore(state => state.quotationConfig);
  const fetchConfig = useConfigStore(state => state.fetchQuotationConfig);
  const updateConfig = useConfigStore(state => state.updateQuotationConfig);
  const isLoading = useConfigStore(state => state.isLoading);
  const error = useConfigStore(state => state.errors.quotation);
  // Always use config from store, fallback only if not loaded
  return {
    orderTypeLimits: config?.orderTypeLimits,
    fetchConfig,
    updateConfig,
    isLoading,
    error,
  };
};

export const useResourceRatesConfig = () => {
  const config = useConfigStore(state => state.resourceRatesConfig);
  const fetchConfig = useConfigStore(state => state.fetchResourceRatesConfig);
  const updateConfig = useConfigStore(state => state.updateResourceRatesConfig);
  const isLoading = useConfigStore(state => state.isLoading);
  const error = useConfigStore(state => state.errors.resourceRates);
  // Always use config from store, fallback only if not loaded
  return {
    config,
    fetchConfig,
    updateConfig,
    isLoading,
    error,
  };
};

export const useAdditionalParamsConfig = () => {
  const config = useConfigStore(state => state.additionalParamsConfig);
  const fetchConfig = useConfigStore(state => state.fetchAdditionalParamsConfig);
  const updateConfig = useConfigStore(state => state.updateAdditionalParamsConfig);
  const isLoading = useConfigStore(state => state.isLoading);
  const error = useConfigStore(state => state.errors.additionalParams);
  // Always use config from store, fallback only if not loaded
  return {
    config,
    fetchConfig,
    updateConfig,
    isLoading,
    error,
  };
};
