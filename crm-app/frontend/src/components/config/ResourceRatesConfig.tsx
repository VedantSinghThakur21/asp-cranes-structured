import React, { useState, useEffect } from 'react';
import { Save, RefreshCw, Users, AlertTriangle, Wrench } from 'lucide-react';
import { Input } from '../common/Input';
import { Button } from '../common/Button';
import { Toast } from '../common/Toast';
import {
  getResourceRatesConfig,
  updateResourceRatesConfig,
  getAdditionalParamsConfig,
  updateAdditionalParamsConfig,
} from '../../services/configService';

export function ResourceRatesConfig() {
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [rates, setRates] = useState({
    foodRatePerMonth: 2500,
    accommodationRatePerMonth: 4000,
  });

  const [additionalParams, setAdditionalParams] = useState({
    riggerAmount: 40000,
    helperAmount: 12000,
    incidentalOptions: [
      { value: 'incident1', label: 'Incident 1', amount: 5000 },
      { value: 'incident2', label: 'Incident 2', amount: 10000 },
      { value: 'incident3', label: 'Incident 3', amount: 15000 },
    ],
  });
  const [toast, setToast] = useState<{
    show: boolean;
    title: string;
    variant?: 'success' | 'error' | 'warning';
  }>({ show: false, title: '' });

  useEffect(() => {
    fetchConfig();
  }, []);

  const fetchConfig = async () => {
    try {
      setIsLoading(true);
      const [ratesConfig, paramsConfig] = await Promise.all([
        getResourceRatesConfig(),
        getAdditionalParamsConfig(),
      ]);

      setRates({
        foodRatePerMonth: ratesConfig.foodRatePerMonth || 2500,
        accommodationRatePerMonth: ratesConfig.accommodationRatePerMonth || 4000,
      });

      setAdditionalParams({
        riggerAmount: paramsConfig.riggerAmount || 40000,
        helperAmount: paramsConfig.helperAmount || 12000,
        incidentalOptions: paramsConfig.incidentalOptions || [
          { value: 'incident1', label: 'Incident 1', amount: 5000 },
          { value: 'incident2', label: 'Incident 2', amount: 10000 },
          { value: 'incident3', label: 'Incident 3', amount: 15000 },
        ],
      });
    } catch (error) {
      showToast('Error loading configuration', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const showToast = (title: string, variant: 'success' | 'error' | 'warning' = 'success') => {
    setToast({ show: true, title, variant });
    setTimeout(() => setToast({ show: false, title: '' }), 3000);
  };

  const handleSave = async () => {
    try {
      setIsSaving(true);

      // Validate rates - now required, no fallbacks
      if (
        !rates.foodRatePerMonth ||
        rates.foodRatePerMonth <= 0 ||
        !rates.accommodationRatePerMonth ||
        rates.accommodationRatePerMonth <= 0
      ) {
        showToast(
          'Food Rate and Accommodation Rate are required and must be greater than 0',
          'error'
        );
        return;
      }

      // Validate additional parameters
      if (
        !additionalParams.riggerAmount ||
        additionalParams.riggerAmount <= 0 ||
        !additionalParams.helperAmount ||
        additionalParams.helperAmount <= 0
      ) {
        showToast('Rigger and Helper amounts are required and must be greater than 0', 'error');
        return;
      }

      // Validate incident amounts
      const hasInvalidIncident = additionalParams.incidentalOptions.some(
        incident => !incident.amount || incident.amount <= 0
      );
      if (hasInvalidIncident) {
        showToast('All incident amounts must be greater than 0', 'error');
        return;
      }

      // Save both configurations
      await Promise.all([
        updateResourceRatesConfig(rates),
        updateAdditionalParamsConfig(additionalParams),
      ]);

      showToast(
        'All configuration updated successfully - Quotation calculations will now use these values'
      );
    } catch (error) {
      showToast(
        'Error saving configuration - Database configuration is required for quotations to work',
        'error'
      );
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-48">
        <RefreshCw className="w-6 h-6 animate-spin text-primary-600" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Resource Rates Section */}
      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Resource Rates</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-sm transition-shadow duration-200">
            <div className="flex items-center gap-2 mb-4">
              <Users className="h-5 w-5 text-primary-500" />
              <h3 className="font-medium text-gray-900">Food Allowance</h3>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Monthly Rate</label>
                <div className="relative mt-1">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <span className="text-gray-500 sm:text-sm">₹</span>
                  </div>
                  <Input
                    type="number"
                    value={rates.foodRatePerMonth}
                    onChange={e =>
                      setRates(prev => ({
                        ...prev,
                        foodRatePerMonth: Number(e.target.value),
                      }))
                    }
                    className="pl-7"
                    min="0"
                  />
                </div>
              </div>
              <div className="text-xs text-gray-500">Per person per month</div>
            </div>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-sm transition-shadow duration-200">
            <div className="flex items-center gap-2 mb-4">
              <Users className="h-5 w-5 text-primary-500" />
              <h3 className="font-medium text-gray-900">Accommodation Allowance</h3>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Monthly Rate</label>
                <div className="relative mt-1">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <span className="text-gray-500 sm:text-sm">₹</span>
                  </div>
                  <Input
                    type="number"
                    value={rates.accommodationRatePerMonth}
                    onChange={e =>
                      setRates(prev => ({
                        ...prev,
                        accommodationRatePerMonth: Number(e.target.value),
                      }))
                    }
                    className="pl-7"
                    min="0"
                  />
                </div>
              </div>
              <div className="text-xs text-gray-500">Per person per month</div>
            </div>
          </div>
        </div>
      </div>

      {/* Other Factors Section */}
      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Other Factors</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-sm transition-shadow duration-200">
            <div className="flex items-center gap-2 mb-4">
              <Wrench className="h-5 w-5 text-blue-500" />
              <h3 className="font-medium text-gray-900">Rigger Amount</h3>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Amount</label>
                <div className="relative mt-1">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <span className="text-gray-500 sm:text-sm">₹</span>
                  </div>
                  <Input
                    type="number"
                    value={additionalParams.riggerAmount}
                    onChange={e =>
                      setAdditionalParams(prev => ({
                        ...prev,
                        riggerAmount: Number(e.target.value),
                      }))
                    }
                    className="pl-7"
                    min="0"
                  />
                </div>
              </div>
              <div className="text-xs text-gray-500">Per rigger per project</div>
            </div>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-sm transition-shadow duration-200">
            <div className="flex items-center gap-2 mb-4">
              <Wrench className="h-5 w-5 text-green-500" />
              <h3 className="font-medium text-gray-900">Helper Amount</h3>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Amount</label>
                <div className="relative mt-1">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <span className="text-gray-500 sm:text-sm">₹</span>
                  </div>
                  <Input
                    type="number"
                    value={additionalParams.helperAmount}
                    onChange={e =>
                      setAdditionalParams(prev => ({
                        ...prev,
                        helperAmount: Number(e.target.value),
                      }))
                    }
                    className="pl-7"
                    min="0"
                  />
                </div>
              </div>
              <div className="text-xs text-gray-500">Per helper per project</div>
            </div>
          </div>
        </div>
      </div>

      {/* Incident Charges Section */}
      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Incident Charges</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {additionalParams.incidentalOptions.map((incident, index) => (
            <div
              key={incident.value}
              className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-sm transition-shadow duration-200"
            >
              <div className="flex items-center gap-2 mb-4">
                <AlertTriangle className="h-5 w-5 text-orange-500" />
                <h3 className="font-medium text-gray-900">{incident.label}</h3>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Amount</label>
                  <div className="relative mt-1">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <span className="text-gray-500 sm:text-sm">₹</span>
                    </div>
                    <Input
                      type="number"
                      value={incident.amount}
                      onChange={e => {
                        const newOptions = [...additionalParams.incidentalOptions];
                        newOptions[index] = { ...incident, amount: Number(e.target.value) };
                        setAdditionalParams(prev => ({
                          ...prev,
                          incidentalOptions: newOptions,
                        }));
                      }}
                      className="pl-7"
                      min="0"
                    />
                  </div>
                </div>
                <div className="text-xs text-gray-500">Per incident occurrence</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="flex justify-end pt-4 border-t border-gray-200">
        <Button
          onClick={handleSave}
          disabled={isSaving}
          leftIcon={isSaving ? <RefreshCw className="animate-spin" /> : <Save />}
          className="w-full sm:w-auto"
        >
          {isSaving ? 'Saving Changes...' : 'Save Changes'}
        </Button>
      </div>

      {toast.show && (
        <Toast
          title={toast.title}
          variant={toast.variant}
          isVisible={toast.show}
          onClose={() => setToast({ show: false, title: '' })}
        />
      )}
    </div>
  );
}
