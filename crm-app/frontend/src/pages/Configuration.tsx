import React, { useState, useEffect } from 'react';
import { Settings, IndianRupee, Save } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '../components/common/Card';
import { Input } from '../components/common/Input';
import { Button } from '../components/common/Button';
import { Toast } from '../components/common/Toast';
import { useAuthStore } from '../store/authStore';
import { Equipment, OrderType } from '../types/equipment';
import { getEquipment, updateEquipment } from '../services/equipmentService';
import {
  getQuotationConfig,
  updateQuotationConfig,
  getConfig,
  updateConfig,
} from '../services/configService';
import { formatCurrency } from '../utils/formatters';

export function Configuration() {
  const { user } = useAuthStore();
  const [equipment, setEquipment] = useState<Equipment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [editedRates, setEditedRates] = useState<Record<string, Record<OrderType, number>>>({});
  const [activeRateType, setActiveRateType] = useState<OrderType>('micro');
  const [orderTypeLimits, setOrderTypeLimits] = useState({
    micro: { minDays: 1, maxDays: 10 },
    small: { minDays: 11, maxDays: 25 },
    monthly: { minDays: 26, maxDays: 365 },
    yearly: { minDays: 366, maxDays: 3650 },
  });
  const [toast, setToast] = useState<{
    show: boolean;
    title: string;
    variant?: 'success' | 'error' | 'warning';
  }>({ show: false, title: '' });

  const showToast = (title: string, variant: 'success' | 'error' | 'warning' = 'success') => {
    setToast({ show: true, title, variant });
    setTimeout(() => setToast({ show: false, title: '' }), 3000);
  };

  useEffect(() => {
    fetchEquipment();
    fetchConfig();
  }, []);

  const fetchConfig = async () => {
    try {
      const config = await getQuotationConfig();
      if (config && config.orderTypeLimits) {
        setOrderTypeLimits(config.orderTypeLimits);
      }
    } catch (error) {
      console.error('Error fetching configuration:', error);
      showToast('Error fetching configuration', 'error');
    }
  };

  const fetchEquipment = async () => {
    try {
      const data = await getEquipment();
      setEquipment(data);

      // Initialize edited rates with current base rates
      const rates: Record<string, Record<OrderType, number>> = {};
      data.forEach(eq => {
        rates[eq.id] = { ...eq.baseRates };
      });
      setEditedRates(rates);
      setIsLoading(false);
    } catch (error) {
      console.error('Error fetching equipment:', error);
      showToast('Error fetching equipment', 'error');
    }
  };

  const handleRateChange = (equipmentId: string, value: string) => {
    const numValue = parseFloat(value) || 0;
    setEditedRates(prev => ({
      ...prev,
      [equipmentId]: {
        ...prev[equipmentId],
        [activeRateType]: numValue,
      },
    }));
  };

  const handleLimitChange = (
    orderType: string,
    limitType: 'minDays' | 'maxDays',
    value: string
  ) => {
    const numValue = parseInt(value) || 0;
    setOrderTypeLimits(prev => ({
      ...prev,
      [orderType]: {
        ...prev[orderType as keyof typeof prev],
        [limitType]: numValue,
      },
    }));
  };

  const handleSaveConfig = async () => {
    try {
      await updateQuotationConfig({ orderTypeLimits });
      showToast('Configuration updated successfully', 'success');
    } catch (error) {
      console.error('Error updating configuration:', error);
      showToast('Error updating configuration', 'error');
    }
  };

  const handleSave = async (equipmentId: string) => {
    try {
      const updatedEquipment = await updateEquipment(equipmentId, {
        baseRates: editedRates[equipmentId],
      });

      if (updatedEquipment) {
        showToast('Base rate updated successfully', 'success');

        // Update local equipment state
        setEquipment(prev => prev.map(eq => (eq.id === equipmentId ? updatedEquipment : eq)));
      }
    } catch (error) {
      console.error('Error updating base rate:', error);
      showToast('Error updating base rate', 'error');
    }
  };

  if (!user || user.role !== 'admin') {
    return (
      <div className="p-4 text-center text-gray-500">
        You don't have permission to access this page.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Configuration</h1>
        <Settings className="h-6 w-6 text-gray-400" />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Equipment Base Rates</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="mb-4 flex space-x-2">
            {(['micro', 'small', 'monthly', 'yearly'] as OrderType[]).map(rateType => (
              <Button
                key={rateType}
                variant={activeRateType === rateType ? 'default' : 'outline'}
                size="sm"
                onClick={() => setActiveRateType(rateType)}
              >
                {rateType.charAt(0).toUpperCase() + rateType.slice(1)}
              </Button>
            ))}
          </div>

          {isLoading ? (
            <div className="text-center py-4">Loading equipment...</div>
          ) : (
            <div className="space-y-4">
              {equipment.map(eq => (
                <div
                  key={eq.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50"
                >
                  <div className="space-y-1">
                    <div className="font-medium">{eq.name}</div>
                    <div className="text-sm text-gray-500">{eq.equipmentId}</div>
                    <div className="text-sm text-gray-500">
                      Current Rate: {formatCurrency(eq.baseRates[activeRateType])}/
                      {activeRateType === 'yearly' || activeRateType === 'monthly' ? 'month' : 'hr'}
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <IndianRupee className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <Input
                        type="number"
                        value={editedRates[eq.id]?.[activeRateType] || 0}
                        onChange={e => handleRateChange(eq.id, e.target.value)}
                        className="pl-9 w-32"
                        min={0}
                      />
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleSave(eq.id)}
                      disabled={
                        eq.baseRates[activeRateType] === editedRates[eq.id]?.[activeRateType]
                      }
                    >
                      <Save size={16} className="mr-2" />
                      Save
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Order Type Limits</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {Object.entries(orderTypeLimits).map(([orderType, limits]) => (
              <div key={orderType} className="p-4 border rounded-lg bg-gray-50">
                <div className="font-medium capitalize">{orderType}</div>
                <div className="mt-3 grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Min Days</label>
                    <Input
                      type="number"
                      value={limits.minDays}
                      onChange={e => handleLimitChange(orderType, 'minDays', e.target.value)}
                      min={1}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Max Days</label>
                    <Input
                      type="number"
                      value={limits.maxDays}
                      onChange={e => handleLimitChange(orderType, 'maxDays', e.target.value)}
                      min={1}
                    />
                  </div>
                </div>
              </div>
            ))}

            <div className="mt-4 flex justify-end">
              <Button onClick={handleSaveConfig}>
                <Save size={16} className="mr-2" />
                Save Configuration
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

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
