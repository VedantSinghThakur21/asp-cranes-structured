/**
 * React Hook for Quotation Components
 * Ensures quotations always use the latest configuration values
 */

import { useEffect, useCallback } from 'react';
import { useConfigStore } from '../store/configStore';

interface QuotationConfigHookReturn {
  // Configuration data
  quotationConfig: {
    orderTypeLimits: {
      micro: { minDays: number; maxDays: number };
      small: { minDays: number; maxDays: number };
      monthly: { minDays: number; maxDays: number };
      yearly: { minDays: number; maxDays: number };
    };
  } | null;
  resourceRates: {
    foodRatePerMonth: number;
    accommodationRatePerMonth: number;
    transportRate: number;
  } | null;
  additionalParams: {
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
  } | null;

  // State
  isLoading: boolean;
  errors: Record<string, string>;

  // Actions
  refreshConfigurations: () => Promise<void>;
  refreshSpecificConfig: (
    configType: 'quotation' | 'resourceRates' | 'additionalParams'
  ) => Promise<void>;
}

/**
 * Hook for components that create or calculate quotations
 * Automatically fetches fresh configuration data and subscribes to changes
 */
export const useQuotationConfig = (): QuotationConfigHookReturn => {
  const {
    quotationConfig,
    resourceRatesConfig,
    additionalParamsConfig,
    isLoading,
    errors,
    fetchAllConfigs,
    fetchQuotationConfig,
    fetchResourceRatesConfig,
    fetchAdditionalParamsConfig,
    subscribeToConfigChanges,
    isConfigStale,
  } = useConfigStore();

  // Refresh all configurations
  const refreshConfigurations = useCallback(async () => {
    await fetchAllConfigs();
  }, [fetchAllConfigs]);

  // Refresh specific configuration
  const refreshSpecificConfig = useCallback(
    async (configType: 'quotation' | 'resourceRates' | 'additionalParams') => {
      switch (configType) {
        case 'quotation':
          await fetchQuotationConfig();
          break;
        case 'resourceRates':
          await fetchResourceRatesConfig();
          break;
        case 'additionalParams':
          await fetchAdditionalParamsConfig();
          break;
      }
    },
    [fetchQuotationConfig, fetchResourceRatesConfig, fetchAdditionalParamsConfig]
  );

  // Initial fetch and subscription setup
  useEffect(() => {
    // Fetch configurations on mount if not already loaded or if stale
    const fetchIfNeeded = async () => {
      if (!quotationConfig || isConfigStale('quotation')) {
        await fetchQuotationConfig();
      }
      if (!resourceRatesConfig || isConfigStale('resourceRates')) {
        await fetchResourceRatesConfig();
      }
      if (!additionalParamsConfig || isConfigStale('additionalParams')) {
        await fetchAdditionalParamsConfig();
      }
    };

    fetchIfNeeded();

    // Subscribe to configuration changes
    const unsubscribe = subscribeToConfigChanges(configType => {
      console.log(
        `Configuration changed: ${configType}. Quotation components will use updated values.`
      );

      // You could dispatch a custom event here to notify other parts of the app
      window.dispatchEvent(
        new CustomEvent('configurationChanged', {
          detail: { configType },
        })
      );
    });

    return unsubscribe;
  }, [
    quotationConfig,
    resourceRatesConfig,
    additionalParamsConfig,
    fetchQuotationConfig,
    fetchResourceRatesConfig,
    fetchAdditionalParamsConfig,
    subscribeToConfigChanges,
    isConfigStale,
  ]);

  return {
    quotationConfig,
    resourceRates: resourceRatesConfig,
    additionalParams: additionalParamsConfig
      ? {
          ...additionalParamsConfig,
        }
      : null,
    isLoading,
    errors,
    refreshConfigurations,
    refreshSpecificConfig,
  };
};

/**
 * Hook for components that manage configuration settings
 * Provides update functions that automatically notify dependent components
 */
export const useConfigManagement = () => {
  const {
    quotationConfig,
    resourceRatesConfig,
    additionalParamsConfig,
    isLoading,
    errors,
    updateQuotationConfig,
    updateResourceRatesConfig,
    updateAdditionalParamsConfig,
    fetchAllConfigs,
  } = useConfigStore();

  // Update quotation configuration and notify dependents
  const updateQuotationConfigWithNotification = useCallback(
    async (orderTypeLimits: any) => {
      try {
        await updateQuotationConfig(orderTypeLimits);

        // Dispatch event to notify quotation forms to recalculate
        window.dispatchEvent(
          new CustomEvent('quotationConfigUpdated', {
            detail: { orderTypeLimits },
          })
        );

        return true;
      } catch (error) {
        console.error('Failed to update quotation config:', error);
        return false;
      }
    },
    [updateQuotationConfig]
  );

  // Update resource rates and notify dependents
  const updateResourceRatesWithNotification = useCallback(
    async (rates: any) => {
      try {
        await updateResourceRatesConfig(rates);

        // Dispatch event to notify quotation forms to recalculate
        window.dispatchEvent(
          new CustomEvent('resourceRatesUpdated', {
            detail: { rates },
          })
        );

        return true;
      } catch (error) {
        console.error('Failed to update resource rates:', error);
        return false;
      }
    },
    [updateResourceRatesConfig]
  );

  // Update additional parameters and notify dependents
  const updateAdditionalParamsWithNotification = useCallback(
    async (params: any) => {
      try {
        await updateAdditionalParamsConfig(params);

        // Dispatch event to notify quotation forms to recalculate
        window.dispatchEvent(
          new CustomEvent('additionalParamsUpdated', {
            detail: { params },
          })
        );

        return true;
      } catch (error) {
        console.error('Failed to update additional params:', error);
        return false;
      }
    },
    [updateAdditionalParamsConfig]
  );

  return {
    quotationConfig,
    resourceRatesConfig,
    additionalParamsConfig,
    isLoading,
    errors,
    updateQuotationConfig: updateQuotationConfigWithNotification,
    updateResourceRatesConfig: updateResourceRatesWithNotification,
    updateAdditionalParamsConfig: updateAdditionalParamsWithNotification,
    refreshAllConfigs: fetchAllConfigs,
  };
};

/**
 * Custom event listener hook for configuration changes
 * Components can use this to react to configuration updates
 */
export const useConfigChangeListener = (
  eventType:
    | 'configurationChanged'
    | 'quotationConfigUpdated'
    | 'resourceRatesUpdated'
    | 'additionalParamsUpdated',
  callback: (detail: any) => void
) => {
  useEffect(() => {
    const handleConfigChange = (event: CustomEvent) => {
      callback(event.detail);
    };

    window.addEventListener(eventType, handleConfigChange as EventListener);

    return () => {
      window.removeEventListener(eventType, handleConfigChange as EventListener);
    };
  }, [eventType, callback]);
};
