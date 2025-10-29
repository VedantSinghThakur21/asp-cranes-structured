/**
 * Company Settings Hook
 * Manage company information and letterhead functionality
 */

import { useState, useEffect, useCallback } from 'react';

interface CompanySettings {
  name: string;
  address: string;
  phone: string;
  email: string;
  website: string;
  gstNumber: string;
  letterheadUrl: string | null;
  letterheadPosition: {
    x: number;
    y: number;
    width: string;
    height: string;
    opacity: number;
    zIndex: number;
    enabled?: boolean;
  };
}

interface UseCompanySettingsReturn {
  settings: CompanySettings | null;
  loading: boolean;
  error: string | null;
  updateSettings: (newSettings: Partial<CompanySettings>) => Promise<boolean>;
  uploadLetterhead: (file: File, position?: any) => Promise<boolean>;
  removeLetterhead: () => Promise<boolean>;
  refetch: () => Promise<void>;
}

export const useCompanySettings = (): UseCompanySettingsReturn => {
  const [settings, setSettings] = useState<CompanySettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSettings = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/company-settings', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();

      if (result.success) {
        setSettings(result.data);
      } else {
        throw new Error(result.error || 'Failed to fetch company settings');
      }
    } catch (err) {
      console.error('Error fetching company settings:', err);
      setError(err instanceof Error ? err.message : 'Unknown error occurred');

      // Set default settings on error
      setSettings({
        name: 'ASP Cranes Pvt. Ltd.',
        address: 'Industrial Area, Pune, Maharashtra 411019',
        phone: '+91 99999 88888',
        email: 'sales@aspcranes.com',
        website: 'www.aspcranes.com',
        gstNumber: '07XXXXX1234X1XX',
        letterheadUrl: null,
        letterheadPosition: {
          x: 0,
          y: 0,
          width: '100%',
          height: 'auto',
          opacity: 0.3,
          zIndex: -1,
          enabled: false,
        },
      });
    } finally {
      setLoading(false);
    }
  }, []);

  const updateSettings = useCallback(
    async (newSettings: Partial<CompanySettings>): Promise<boolean> => {
      try {
        setError(null);

        const response = await fetch('/api/company-settings', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(newSettings),
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const result = await response.json();

        if (result.success) {
          setSettings(prev => (prev ? { ...prev, ...newSettings } : null));
          return true;
        } else {
          throw new Error(result.error || 'Failed to update company settings');
        }
      } catch (err) {
        console.error('Error updating company settings:', err);
        setError(err instanceof Error ? err.message : 'Failed to update settings');
        return false;
      }
    },
    []
  );

  const uploadLetterhead = useCallback(async (file: File, position?: any): Promise<boolean> => {
    try {
      setError(null);

      const formData = new FormData();
      formData.append('letterhead', file);

      if (position) {
        formData.append('position', JSON.stringify(position));
      }

      const response = await fetch('/api/company-settings/letterhead', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();

      if (result.success) {
        setSettings(prev =>
          prev
            ? {
                ...prev,
                letterheadUrl: result.data.letterheadUrl,
                letterheadPosition: result.data.letterheadPosition,
              }
            : null
        );
        return true;
      } else {
        throw new Error(result.error || 'Failed to upload letterhead');
      }
    } catch (err) {
      console.error('Error uploading letterhead:', err);
      setError(err instanceof Error ? err.message : 'Failed to upload letterhead');
      return false;
    }
  }, []);

  const removeLetterhead = useCallback(async (): Promise<boolean> => {
    try {
      setError(null);

      const response = await fetch('/api/company-settings/letterhead', {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();

      if (result.success) {
        setSettings(prev =>
          prev
            ? {
                ...prev,
                letterheadUrl: null,
                letterheadPosition: {
                  ...prev.letterheadPosition,
                  enabled: false,
                },
              }
            : null
        );
        return true;
      } else {
        throw new Error(result.error || 'Failed to remove letterhead');
      }
    } catch (err) {
      console.error('Error removing letterhead:', err);
      setError(err instanceof Error ? err.message : 'Failed to remove letterhead');
      return false;
    }
  }, []);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  return {
    settings,
    loading,
    error,
    updateSettings,
    uploadLetterhead,
    removeLetterhead,
    refetch: fetchSettings,
  };
};
