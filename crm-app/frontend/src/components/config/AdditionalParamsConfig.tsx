import { useState, useEffect } from 'react';
import { Save, RefreshCw, Percent, AlertTriangle, Clock, Moon, Wrench } from 'lucide-react';
import { Input } from '../common/Input';
import { Button } from '../common/Button';
import { Toast } from '../common/Toast';
import {
  getAdditionalParamsConfig,
  updateAdditionalParamsConfig,
} from '../../services/configService';
import { Card, CardHeader, CardTitle, CardContent } from '../common/Card';

export function AdditionalParamsConfig() {
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [params, setParams] = useState({
    riggerAmount: 40000,
    helperAmount: 12000,
    incidentalOptions: [
      { value: 'incident1', label: 'Incident 1 - ₹5,000', amount: 5000 },
      { value: 'incident2', label: 'Incident 2 - ₹10,000', amount: 10000 },
      { value: 'incident3', label: 'Incident 3 - ₹15,000', amount: 15000 },
    ],
    usageFactors: {
      normal: 0,
      medium: 20,
      heavy: 50,
    },
    riskFactors: {
      low: 0,
      medium: 10,
      high: 20,
    },
    shiftFactors: {
      single: 1.0,
      double: 1.8,
    },
    dayNightFactors: {
      day: 1.0,
      night: 1.3,
    },
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
      const config = await getAdditionalParamsConfig();

      // Ensure we have default values for all required fields
      const safeConfig = {
        ...params, // Start with current default values
        ...config, // Override with any values from API
        // Ensure nested objects have defaults if missing
        usageFactors: {
          ...params.usageFactors,
          ...(config?.usageFactors || {}),
        },
        riskFactors: {
          ...params.riskFactors,
          ...(config?.riskFactors || {}),
        },
        shiftFactors: {
          ...params.shiftFactors,
          ...(config?.shiftFactors || {}),
        },
        dayNightFactors: {
          ...params.dayNightFactors,
          ...(config?.dayNightFactors || {}),
        },
        incidentalOptions: config?.incidentalOptions || params.incidentalOptions,
        riggerAmount:
          config?.riggerAmount !== undefined ? config.riggerAmount : params.riggerAmount,
        helperAmount:
          config?.helperAmount !== undefined ? config.helperAmount : params.helperAmount,
      };

      setParams(safeConfig);
    } catch (error) {
      // Keep using default values defined in useState
      showToast('Error loading configuration, using defaults', 'warning');
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
      await updateAdditionalParamsConfig(params);
      showToast('Parameters updated successfully');
    } catch (error) {
      showToast('Error saving parameters', 'error');
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

  const RateInput = ({
    value,
    onChange,
    label,
    isPercentage = false,
  }: {
    value: number;
    onChange: (value: number) => void;
    label: string;
    isPercentage?: boolean;
  }) => (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      <div className="relative mt-1">
        {!isPercentage && (
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <span className="text-gray-500 sm:text-sm">₹</span>
          </div>
        )}
        <Input
          type="number"
          value={value}
          onChange={e => onChange(Number(e.target.value))}
          className={isPercentage ? 'pr-8' : 'pl-7'}
          min="0"
        />
        {isPercentage && (
          <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
            <Percent className="h-4 w-4 text-gray-400" />
          </div>
        )}
      </div>
    </div>
  );

  const MultiplierInput = ({
    value,
    onChange,
    label,
  }: {
    value: number;
    onChange: (value: number) => void;
    label: string;
  }) => (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      <div className="relative mt-1">
        <Input
          type="number"
          value={value}
          onChange={e => onChange(Number(e.target.value))}
          className="pr-8"
          min="0.1"
          step="0.1"
        />
        <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
          <span className="text-gray-500 sm:text-sm">x</span>
        </div>
      </div>
      <p className="text-xs text-gray-500 mt-1">
        {value === 1.0
          ? 'No change'
          : `${((value - 1) * 100).toFixed(0)}% ${value > 1 ? 'increase' : 'decrease'}`}
      </p>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Usage Rates */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Wrench className="h-5 w-5 text-primary-500" />
              <CardTitle>Usage Rates</CardTitle>
            </div>
          </CardHeader>{' '}
          <CardContent className="space-y-4">
            <RateInput
              label="Normal Usage Factor"
              value={params.usageFactors.normal}
              onChange={value =>
                setParams(prev => ({
                  ...prev,
                  usageFactors: { ...prev.usageFactors, normal: value },
                }))
              }
              isPercentage
            />
            <RateInput
              label="Medium Usage Factor"
              value={params.usageFactors.medium}
              onChange={value =>
                setParams(prev => ({
                  ...prev,
                  usageFactors: { ...prev.usageFactors, medium: value },
                }))
              }
              isPercentage
            />
            <RateInput
              label="Heavy Usage Factor"
              value={params.usageFactors.heavy}
              onChange={value =>
                setParams(prev => ({
                  ...prev,
                  usageFactors: { ...prev.usageFactors, heavy: value },
                }))
              }
              isPercentage
            />
          </CardContent>
        </Card>
        {/* Risk Factors */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-primary-500" />
              <CardTitle>Risk Factors</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <RateInput
              label="Low Risk"
              value={params.riskFactors.low}
              onChange={value =>
                setParams(prev => ({
                  ...prev,
                  riskFactors: { ...prev.riskFactors, low: value },
                }))
              }
              isPercentage
            />
            <RateInput
              label="Medium Risk"
              value={params.riskFactors.medium}
              onChange={value =>
                setParams(prev => ({
                  ...prev,
                  riskFactors: { ...prev.riskFactors, medium: value },
                }))
              }
              isPercentage
            />
            <RateInput
              label="High Risk"
              value={params.riskFactors.high}
              onChange={value =>
                setParams(prev => ({
                  ...prev,
                  riskFactors: { ...prev.riskFactors, high: value },
                }))
              }
              isPercentage
            />
          </CardContent>
        </Card>{' '}
        {/* Shift Factors */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-primary-500" />
              <CardTitle>Shift Factors</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <MultiplierInput
              label="Single Shift Factor"
              value={params.shiftFactors.single}
              onChange={value =>
                setParams(prev => ({
                  ...prev,
                  shiftFactors: { ...prev.shiftFactors, single: value },
                }))
              }
            />
            <MultiplierInput
              label="Double Shift Factor"
              value={params.shiftFactors.double}
              onChange={value =>
                setParams(prev => ({
                  ...prev,
                  shiftFactors: { ...prev.shiftFactors, double: value },
                }))
              }
            />
          </CardContent>
        </Card>
        {/* Other Factors */}{' '}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Moon className="h-5 w-5 text-primary-500" />
              <CardTitle>Day/Night Factors</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <MultiplierInput
              label="Day Factor"
              value={params.dayNightFactors.day}
              onChange={value =>
                setParams(prev => ({
                  ...prev,
                  dayNightFactors: { ...prev.dayNightFactors, day: value },
                }))
              }
            />
            <MultiplierInput
              label="Night Factor"
              value={params.dayNightFactors.night}
              onChange={value =>
                setParams(prev => ({
                  ...prev,
                  dayNightFactors: { ...prev.dayNightFactors, night: value },
                }))
              }
            />
          </CardContent>
        </Card>
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
