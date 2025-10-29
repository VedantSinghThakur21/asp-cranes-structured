import { create } from 'zustand';
import { getQuotationConfig, updateQuotationConfig } from '../services/configService';

interface OrderTypeConfig {
  minDays: number;
  maxDays: number;
}

interface OrderTypeLimits {
  micro: OrderTypeConfig;
  small: OrderTypeConfig;
  monthly: OrderTypeConfig;
  yearly: OrderTypeConfig;
}

interface QuotationConfigState {
  orderTypeLimits: OrderTypeLimits;
  isLoading: boolean;
  error: string | null;
  fetchConfig: () => Promise<void>;
  updateConfig: (config: OrderTypeLimits) => Promise<void>;
}

const defaultLimits: OrderTypeLimits = {
  micro: { minDays: 1, maxDays: 10 },
  small: { minDays: 11, maxDays: 25 },
  monthly: { minDays: 26, maxDays: 30 },
  yearly: { minDays: 31, maxDays: 366 },
};

export const useQuotationConfigStore = create<QuotationConfigState>(set => ({
  orderTypeLimits: defaultLimits,
  isLoading: false,
  error: null,
  fetchConfig: async () => {
    try {
      set({ isLoading: true, error: null });
      const config = await getQuotationConfig();

      if (config && config.orderTypeLimits) {
        set({ orderTypeLimits: config.orderTypeLimits });
      } else {
        console.log('Using default quotation config limits');
        // If no config exists, use defaults
        set({ orderTypeLimits: defaultLimits });
      }
    } catch (error) {
      console.error('Error fetching quotation config:', error);
      set({ error: 'Failed to fetch quotation configuration' });
    } finally {
      set({ isLoading: false });
    }
  },
  updateConfig: async (config: OrderTypeLimits) => {
    try {
      set({ isLoading: true, error: null });
      // Update the store immediately for better UX
      set({ orderTypeLimits: config });

      // Update in database
      await updateQuotationConfig({ orderTypeLimits: config });
    } catch (error) {
      console.error('Error updating quotation config:', error);
      set({ error: 'Failed to update quotation configuration' });

      // Revert to original config on error
      const currentConfig = await getQuotationConfig();
      if (currentConfig?.orderTypeLimits) {
        set({ orderTypeLimits: currentConfig.orderTypeLimits });
      }
    } finally {
      set({ isLoading: false });
    }
  },
}));
