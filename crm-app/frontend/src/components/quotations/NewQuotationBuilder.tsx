import React, { useState, useEffect, useCallback } from 'react';
import { 
  ArrowLeft, 
  Save, 
  Calculator,
  Building,
  Truck,
  MapPin,
  CheckCircle,
  AlertCircle,
  Loader2
} from 'lucide-react';
import { getEquipment } from '../../services/equipment';
import { Equipment } from '../../types/equipment';

interface NewQuotationBuilderProps {
  onClose: () => void;
  onSave: () => void;
  dealId?: string;
  quotationData?: any;
}

interface SelectedMachine {
  id: string;
  type: string;
  label: string;
  baseRate: number;
  quantity: number;
}

interface QuotationFormData {
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  customerAddress: string;
  machineType: string;
  selectedMachines: SelectedMachine[];
  orderType: string;
  numberOfDays: number;
  workingHours: number;
  siteDistance: number;
  usage: string;
  shift: string;
  foodResources: string;
  accomResources: string;
  riskFactor: string;
  extraCharge: number;
  notes: string;
}

const initialFormData: QuotationFormData = {
  customerName: '',
  customerEmail: '',
  customerPhone: '',
  customerAddress: '',
  machineType: 'mobile_crane',
  selectedMachines: [],
  orderType: 'micro',
  numberOfDays: 0,
  workingHours: 8,
  siteDistance: 0,
  usage: 'Construction',
  shift: 'Day Shift',
  foodResources: 'Client Provided',
  accomResources: 'Client Provided',
  riskFactor: 'Medium',
  extraCharge: 0,
  notes: ''
};


const orderTypeOptions = [
  { value: 'micro', label: 'Micro (1-10 days)', multiplier: 1, minDays: 1, maxDays: 10 },
  { value: 'small', label: 'Small (11-25 days)', multiplier: 1, minDays: 11, maxDays: 25 },
  { value: 'monthly', label: 'Monthly (26-365 days)', multiplier: 1, minDays: 26, maxDays: 365 },
  { value: 'yearly', label: 'Yearly (366+ days)', multiplier: 1, minDays: 366, maxDays: 3650 },
];

const NewQuotationBuilder: React.FC<NewQuotationBuilderProps> = ({ 
  onClose, 
  onSave, 
  dealId, 
  quotationData 
}) => {
  const [formData, setFormData] = useState<QuotationFormData>(initialFormData);
  const [currentStep, setCurrentStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [dealData, setDealData] = useState<any>(null);
  const [isEditMode] = useState(!!quotationData);
  const [equipmentTypes, setEquipmentTypes] = useState<{value: string, label: string, originalCategory?: string}[]>([]);
  const [availableEquipment, setAvailableEquipment] = useState<Equipment[]>([]);
  const [equipmentByType, setEquipmentByType] = useState<{[key: string]: Equipment[]}>({});
  const [calculations, setCalculations] = useState({
    baseRate: 0,
    totalRent: 0,
    mobDemobCost: 0,
    foodAccomCost: 0,
    gstAmount: 0,
    totalCost: 0
  });
  const [notification, setNotification] = useState<{
    show: boolean;
    type: 'success' | 'error' | 'info';
    message: string;
  }>({ show: false, type: 'info', message: '' });

  // Function to determine order type based on number of days
  const getOrderTypeByDays = useCallback((days: number): string => {
    if (days >= 1 && days <= 10) return 'micro';
    if (days >= 11 && days <= 25) return 'small';
    if (days >= 26 && days <= 365) return 'monthly';
    if (days >= 366) return 'yearly';
    return 'micro'; // Default fallback
  }, []);

  // Fetch equipment data on mount
  useEffect(() => {
    const fetchEquipmentData = async () => {
      // Set fallback equipment types immediately for better UX
      const fallbackTypes = [
        { value: 'mobile_crane', label: 'Mobile Crane', originalCategory: 'Mobile Crane' },
        { value: 'tower_crane', label: 'Tower Crane', originalCategory: 'Tower Crane' },
        { value: 'crawler_crane', label: 'Crawler Crane', originalCategory: 'Crawler Crane' },
        { value: 'pick_and_carry_crane', label: 'Pick And Carry Crane', originalCategory: 'Pick And Carry Crane' }
      ];
      setEquipmentTypes(fallbackTypes);
      
      try {
        console.log('🔄 Fetching equipment data...');
        const equipment = await getEquipment();
        console.log('✅ Equipment fetched:', equipment);
        setAvailableEquipment(equipment);
        
        if (equipment && equipment.length > 0) {
          // Extract unique equipment types - handle both formats (spaces and underscores)
          const categories = [...new Set(equipment.map(e => e.category))];
          const types = categories.map(category => {
            // Normalize category to underscore format for value
            const normalizedValue = category.toLowerCase().replace(/\s+/g, '_');
            // Keep original format for label, or format it nicely
            const formattedLabel = category.includes('_') 
              ? category.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
              : category;
            
            return {
              value: normalizedValue,
              label: formattedLabel,
              originalCategory: category // Keep original for lookup
            };
          });
          console.log('📋 Equipment types extracted:', types);
          setEquipmentTypes(types);
          
          // Group equipment by normalized type (underscore format)
          const grouped = equipment.reduce((acc, eq) => {
            const normalizedCategory = eq.category.toLowerCase().replace(/\s+/g, '_');
            if (!acc[normalizedCategory]) acc[normalizedCategory] = [];
            acc[normalizedCategory].push(eq);
            return acc;
          }, {} as {[key: string]: Equipment[]});
          console.log('🏗️ Equipment grouped by type:', grouped);
          setEquipmentByType(grouped);
        } else {
          console.warn('⚠️ No equipment data received, using fallback types');
        }
      } catch (error) {
        console.error('❌ Failed to fetch equipment:', error);
        // Fallback types already set above
      }
    };
    
    fetchEquipmentData();
  }, []);

  // Load deal data or quotation data on mount
  useEffect(() => {
    const loadInitialData = async () => {
      try {
        if (dealId) {
          // Load deal data for creating quotation from deal
          const response = await fetch(`/api/deals/${dealId}`);
          if (response.ok) {
            const result = await response.json();
            if (result.success) {
              const deal = result.data;
              setDealData(deal);
              
              // Pre-populate form with deal data
              setFormData(prev => ({
                ...prev,
                customerName: deal.customer?.company || deal.customer?.name || '',
                customerEmail: deal.customer?.email || '',
                customerPhone: deal.customer?.phone || '',
                customerAddress: deal.customer?.address || '',
                notes: `Quotation for deal: ${deal.title}\n${deal.description}`
              }));
            }
          }
        } else if (quotationData) {
          // Load existing quotation data for editing
          setFormData({
            customerName: quotationData.customer_name || '',
            customerEmail: quotationData.customer_email || '',
            customerPhone: quotationData.customer_phone || '',
            customerAddress: quotationData.customer_address || '',
            machineType: quotationData.machine_type || 'mobile_crane',
            selectedMachines: quotationData.selected_machines || [],
            orderType: quotationData.order_type || 'rental',
            numberOfDays: quotationData.number_of_days || 1,
            workingHours: quotationData.working_hours || 8,
            siteDistance: quotationData.site_distance || 0,
            usage: quotationData.usage || 'Construction',
            shift: quotationData.shift || 'Day Shift',
            foodResources: quotationData.food_resources || 'Client Provided',
            accomResources: quotationData.accom_resources || 'Client Provided',
            riskFactor: quotationData.risk_factor || 'Medium',
            extraCharge: quotationData.extra_charge || 0,
            notes: quotationData.notes || ''
          });
        }
      } catch (error) {
        console.error('Error loading initial data:', error);
        showNotification('error', 'Failed to load data');
      }
    };

    loadInitialData();
  }, [dealId, quotationData]);

  // Calculate costs whenever form data changes
  useEffect(() => {
    calculateCosts();
  }, [formData]);

  // Recalculate machine base rates when order type changes
  useEffect(() => {
    if (formData.selectedMachines.length > 0) {
      const orderType = formData.orderType as 'micro' | 'small' | 'monthly' | 'yearly';
      const updatedMachines = formData.selectedMachines.map(machine => {
        const equipment = availableEquipment.find(eq => eq.id === machine.id);
        if (equipment) {
          let newDefaultRate = 0;
          
          switch (orderType) {
            case 'micro':
              newDefaultRate = equipment.baseRateMicro || equipment.baseRates?.micro || 0;
              break;
            case 'small':
              newDefaultRate = equipment.baseRateSmall || equipment.baseRates?.small || 0;
              break;
            case 'monthly':
              newDefaultRate = equipment.baseRateMonthly || equipment.baseRates?.monthly || 0;
              break;
            case 'yearly':
              newDefaultRate = equipment.baseRateYearly || equipment.baseRates?.yearly || 0;
              break;
            default:
              newDefaultRate = equipment.baseRateMicro || equipment.baseRates?.micro || 0;
          }
          
          // Check if the current rate is a default rate (matches any of the base rates for the equipment)
          const currentRateIsDefault = 
            machine.baseRate === (equipment.baseRateMicro || equipment.baseRates?.micro || 0) ||
            machine.baseRate === (equipment.baseRateSmall || equipment.baseRates?.small || 0) ||
            machine.baseRate === (equipment.baseRateMonthly || equipment.baseRates?.monthly || 0) ||
            machine.baseRate === (equipment.baseRateYearly || equipment.baseRates?.yearly || 0);
          
          // Only update the rate if it's currently using a default rate, preserve custom rates
          return { 
            ...machine, 
            baseRate: currentRateIsDefault ? newDefaultRate : machine.baseRate 
          };
        }
        return machine;
      });
      
      setFormData(prev => ({
        ...prev,
        selectedMachines: updatedMachines
      }));
    }
  }, [formData.orderType, availableEquipment]);

  // Auto-update order type based on number of days
  useEffect(() => {
    if (formData.numberOfDays > 0) {
      const autoOrderType = getOrderTypeByDays(formData.numberOfDays);
      if (autoOrderType !== formData.orderType) {
        setFormData(prev => ({
          ...prev,
          orderType: autoOrderType
        }));
      }
    }
  }, [formData.numberOfDays, getOrderTypeByDays]);

  const calculateCosts = () => {
    const orderType = orderTypeOptions.find(ot => ot.value === formData.orderType);
    
    if (!orderType || formData.selectedMachines.length === 0) return;

    // Calculate total equipment cost from selected machines
    const totalEquipmentRatePerHour = formData.selectedMachines.reduce((total, machine) => 
      total + (machine.baseRate * machine.quantity), 0
    );
    const baseRate = totalEquipmentRatePerHour * orderType.multiplier;
    const totalRent = baseRate * formData.workingHours * formData.numberOfDays;
    
    // Mobilization/Demobilization based on distance
    const mobDemobCost = Math.max(15000, formData.siteDistance * 200);
    
    // Food and accommodation
    const foodCost = formData.foodResources === 'ASP Provided' ? 2500 * formData.numberOfDays : 0;
    const accomCost = formData.accomResources === 'ASP Provided' ? 4000 * formData.numberOfDays : 0;
    const foodAccomCost = foodCost + accomCost;
    
    // Risk factor adjustment
    const riskMultiplier = {
      'Low': 0.95,
      'Medium': 1.0,
      'High': 1.1,
      'Very High': 1.2
    }[formData.riskFactor] || 1.0;
    
    const subtotal = (totalRent + mobDemobCost + foodAccomCost + formData.extraCharge) * riskMultiplier;
    const gstAmount = subtotal * 0.18;
    const totalCost = subtotal + gstAmount;

    setCalculations({
      baseRate,
      totalRent,
      mobDemobCost,
      foodAccomCost,
      gstAmount,
      totalCost
    });
  };

  const showNotification = (type: 'success' | 'error' | 'info', message: string) => {
    setNotification({ show: true, type, message });
    setTimeout(() => setNotification({ show: false, type: 'info', message: '' }), 5000);
  };

  const handleInputChange = (field: keyof QuotationFormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const validateStep = (step: number): boolean => {
    switch (step) {
      case 1:
        return !!(formData.customerName && formData.customerEmail && formData.customerPhone);
      case 2:
        return !!(formData.machineType && formData.selectedMachines.length > 0 && formData.orderType && formData.numberOfDays > 0);
      case 3:
        return true; // Optional step
      default:
        return true;
    }
  };

  const handleNextStep = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => Math.min(prev + 1, 4));
    } else {
      showNotification('error', 'Please fill in all required fields');
    }
  };

  const handlePrevStep = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
  };

  const handleSave = async () => {
    if (!validateStep(1) || !validateStep(2)) {
      showNotification('error', 'Please complete all required information');
      return;
    }

    setIsLoading(true);
    try {
      // Prepare data for API
      const quotationData = {
        customerName: formData.customerName,
        customerEmail: formData.customerEmail,
        customerPhone: formData.customerPhone,
        customerAddress: formData.customerAddress,
        machineType: formData.machineType,
        selectedMachines: formData.selectedMachines,
        orderType: formData.orderType,
        numberOfDays: formData.numberOfDays,
        workingHours: formData.workingHours,
        siteDistance: formData.siteDistance,
        usage: formData.usage,
        shift: formData.shift,
        foodResources: formData.foodResources,
        accomResources: formData.accomResources,
        riskFactor: formData.riskFactor,
        extraCharge: formData.extraCharge,
        totalCost: calculations.totalCost,
        gstRate: 18,
        items: formData.selectedMachines.map(machine => ({
          description: `${machine.label} x${machine.quantity}`,
          qty: formData.numberOfDays,
          price: machine.baseRate * machine.quantity * formData.workingHours,
          equipmentId: machine.id
        })),
        terms: [
          'Payment Terms: 50% advance payment required, balance to be paid on completion of work',
          'Equipment will be delivered within 2-3 working days from advance payment receipt',
          'Fuel charges will be extra as per actual consumption and current market rates',
          'All rates are subject to site conditions, accessibility, and final inspection',
          'This quotation is valid for 15 days from date of issue'
        ]
      };

      const response = await fetch('/api/quotations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(quotationData),
      });

      const result = await response.json();

      if (response.ok && result.success) {
        showNotification('success', 'Quotation created successfully!');
        setTimeout(() => {
          onSave(); // Refresh the list
          onClose(); // Close the builder
        }, 1500);
      } else {
        throw new Error(result.message || 'Failed to create quotation');
      }
    } catch (error) {
      console.error('Error creating quotation:', error);
      showNotification('error', error instanceof Error ? error.message : 'Failed to create quotation');
    } finally {
      setIsLoading(false);
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-6">
            <div className="flex items-center space-x-3 mb-6">
              <div className="bg-blue-600 text-white p-2 rounded-lg">
                <Building className="h-5 w-5" />
              </div>
              <h2 className="text-xl font-semibold text-gray-900">Customer Information</h2>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Company Name *
                </label>
                <input
                  type="text"
                  value={formData.customerName}
                  onChange={(e) => handleInputChange('customerName', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="ABC Construction Ltd."
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email Address *
                </label>
                <input
                  type="email"
                  value={formData.customerEmail}
                  onChange={(e) => handleInputChange('customerEmail', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="contact@company.com"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Phone Number *
                </label>
                <input
                  type="tel"
                  value={formData.customerPhone}
                  onChange={(e) => handleInputChange('customerPhone', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="+91-9876543210"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Address
                </label>
                <textarea
                  value={formData.customerAddress}
                  onChange={(e) => handleInputChange('customerAddress', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Complete address..."
                  rows={3}
                />
              </div>
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            <div className="flex items-center space-x-3 mb-6">
              <div className="bg-green-600 text-white p-2 rounded-lg">
                <Truck className="h-5 w-5" />
              </div>
              <h2 className="text-xl font-semibold text-gray-900">Equipment & Project Details</h2>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Equipment Type *
                </label>
                <select
                  value={formData.machineType}
                  onChange={(e) => {
                    handleInputChange('machineType', e.target.value);
                    // Clear selected machines when changing type
                    setFormData(prev => ({ ...prev, selectedMachines: [] }));
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                >
                  <option value="">Select equipment type...</option>
                  {equipmentTypes.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              {formData.machineType && (
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Add Equipment to Quotation
                  </label>
                  <div className="flex gap-2">
                    <select
                      value=""
                      onChange={(e) => {
                        if (e.target.value) {
                          const selectedEquipment = availableEquipment.find(eq => eq.id === e.target.value);
                          if (selectedEquipment) {
                            const existingIndex = formData.selectedMachines.findIndex(m => m.id === selectedEquipment.id);
                            if (existingIndex >= 0) {
                              // Increase quantity
                              setFormData(prev => ({
                                ...prev,
                                selectedMachines: prev.selectedMachines.map((m, i) => 
                                  i === existingIndex ? { ...m, quantity: m.quantity + 1 } : m
                                )
                              }));
                            } else {
                              // Add new machine - use direct base rate properties
                              const orderType = formData.orderType as 'micro' | 'small' | 'monthly' | 'yearly';
                              let baseRate = 0;
                              
                              switch (orderType) {
                                case 'micro':
                                  baseRate = selectedEquipment.baseRateMicro || selectedEquipment.baseRates?.micro || 0;
                                  break;
                                case 'small':
                                  baseRate = selectedEquipment.baseRateSmall || selectedEquipment.baseRates?.small || 0;
                                  break;
                                case 'monthly':
                                  baseRate = selectedEquipment.baseRateMonthly || selectedEquipment.baseRates?.monthly || 0;
                                  break;
                                case 'yearly':
                                  baseRate = selectedEquipment.baseRateYearly || selectedEquipment.baseRates?.yearly || 0;
                                  break;
                                default:
                                  baseRate = selectedEquipment.baseRateMicro || selectedEquipment.baseRates?.micro || 0;
                              }
                              
                              console.log('📊 Adding equipment with rate:', {
                                equipmentName: selectedEquipment.name,
                                orderType,
                                baseRate,
                                rawRates: {
                                  micro: selectedEquipment.baseRateMicro,
                                  small: selectedEquipment.baseRateSmall,
                                  monthly: selectedEquipment.baseRateMonthly,
                                  yearly: selectedEquipment.baseRateYearly
                                },
                                baseRatesObject: selectedEquipment.baseRates
                              });
                              
                              const newMachine: SelectedMachine = {
                                id: selectedEquipment.id,
                                type: selectedEquipment.category,
                                label: selectedEquipment.name,
                                baseRate: baseRate,
                                quantity: 1
                              };
                              setFormData(prev => ({
                                ...prev,
                                selectedMachines: [...prev.selectedMachines, newMachine]
                              }));
                            }
                          } else {
                            console.error('Equipment not found:', e.target.value);
                          }
                        }
                      }}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="">Select equipment to add...</option>
                      {formData.machineType && equipmentByType[formData.machineType]?.length > 0 ? (
                        equipmentByType[formData.machineType].map(equipment => {
                          const orderType = formData.orderType as 'micro' | 'small' | 'monthly' | 'yearly';
                          let baseRate = 0;
                          
                          switch (orderType) {
                            case 'micro':
                              baseRate = equipment.baseRateMicro || equipment.baseRates?.micro || 0;
                              break;
                            case 'small':
                              baseRate = equipment.baseRateSmall || equipment.baseRates?.small || 0;
                              break;
                            case 'monthly':
                              baseRate = equipment.baseRateMonthly || equipment.baseRates?.monthly || 0;
                              break;
                            case 'yearly':
                              baseRate = equipment.baseRateYearly || equipment.baseRates?.yearly || 0;
                              break;
                            default:
                              baseRate = equipment.baseRateMicro || equipment.baseRates?.micro || 0;
                          }
                          
                          console.log('🏗️ Equipment option:', {
                            name: equipment.name,
                            orderType,
                            displayRate: baseRate,
                            rawData: equipment
                          });
                          
                          return (
                            <option key={equipment.id} value={equipment.id}>
                              {equipment.name} - ₹{baseRate.toLocaleString()}/hr
                            </option>
                          );
                        })
                      ) : formData.machineType ? (
                        <option value="" disabled>No equipment available for this type</option>
                      ) : (
                        <option value="" disabled>Please select equipment type first</option>
                      )}
                    </select>
                  </div>
                  
                  {formData.selectedMachines.length > 0 && (
                    <div className="mt-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <h4 className="text-sm font-medium text-gray-900">
                          Selected Equipment ({formData.selectedMachines.length} item{formData.selectedMachines.length !== 1 ? 's' : ''})
                        </h4>
                        <button
                          type="button"
                          onClick={() => {
                            setFormData(prev => ({
                              ...prev,
                              selectedMachines: prev.selectedMachines.map(machine => {
                                const equipment = availableEquipment.find(eq => eq.id === machine.id);
                                if (equipment) {
                                  const orderType = formData.orderType as 'micro' | 'small' | 'monthly' | 'yearly';
                                  let defaultRate = 0;
                                  
                                  switch (orderType) {
                                    case 'micro':
                                      defaultRate = equipment.baseRateMicro || equipment.baseRates?.micro || 0;
                                      break;
                                    case 'small':
                                      defaultRate = equipment.baseRateSmall || equipment.baseRates?.small || 0;
                                      break;
                                    case 'monthly':
                                      defaultRate = equipment.baseRateMonthly || equipment.baseRates?.monthly || 0;
                                      break;
                                    case 'yearly':
                                      defaultRate = equipment.baseRateYearly || equipment.baseRates?.yearly || 0;
                                      break;
                                  }
                                  
                                  return { ...machine, baseRate: defaultRate };
                                }
                                return machine;
                              })
                            }));
                          }}
                          className="text-xs text-blue-600 hover:text-blue-800 underline"
                          title="Reset all equipment rates to defaults"
                        >
                          Reset All Rates
                        </button>
                      </div>
                      {formData.selectedMachines.map((machine, index) => (
                        <div key={`${machine.id}-${index}`} className="bg-gray-50 p-4 rounded-lg border space-y-3">
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <div className="font-medium text-gray-900">{machine.label}</div>
                              <div className="text-sm text-gray-600">
                                Equipment ID: {machine.id}
                              </div>
                              {(() => {
                                const equipment = availableEquipment.find(eq => eq.id === machine.id);
                                if (equipment) {
                                  const orderType = formData.orderType as 'micro' | 'small' | 'monthly' | 'yearly';
                                  let defaultRate = 0;
                                  
                                  switch (orderType) {
                                    case 'micro':
                                      defaultRate = equipment.baseRateMicro || equipment.baseRates?.micro || 0;
                                      break;
                                    case 'small':
                                      defaultRate = equipment.baseRateSmall || equipment.baseRates?.small || 0;
                                      break;
                                    case 'monthly':
                                      defaultRate = equipment.baseRateMonthly || equipment.baseRates?.monthly || 0;
                                      break;
                                    case 'yearly':
                                      defaultRate = equipment.baseRateYearly || equipment.baseRates?.yearly || 0;
                                      break;
                                  }
                                  
                                  const isCustomRate = machine.baseRate !== defaultRate;
                                  return isCustomRate ? (
                                    <div className="text-xs text-orange-600 font-medium">
                                      ⚡ Custom Rate (Default: ₹{defaultRate.toLocaleString()}/hr)
                                    </div>
                                  ) : (
                                    <div className="text-xs text-green-600">
                                      ✓ Using Default Rate
                                    </div>
                                  );
                                }
                                return null;
                              })()}
                            </div>
                            <button
                              type="button"
                              onClick={() => {
                                setFormData(prev => ({
                                  ...prev,
                                  selectedMachines: prev.selectedMachines.filter((_, i) => i !== index)
                                }));
                              }}
                              className="w-8 h-8 rounded-full bg-red-100 hover:bg-red-200 flex items-center justify-center text-red-600"
                              title="Remove equipment"
                            >
                              ×
                            </button>
                          </div>
                          
                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <label className="block text-xs font-medium text-gray-700 mb-1">
                                Rate per Hour (₹)
                              </label>
                              <input
                                type="number"
                                min="0"
                                step="100"
                                value={machine.baseRate || ''}
                                onChange={(e) => {
                                  const newRate = parseFloat(e.target.value) || 0;
                                  setFormData(prev => ({
                                    ...prev,
                                    selectedMachines: prev.selectedMachines.map((m, i) => 
                                      i === index ? { ...m, baseRate: newRate } : m
                                    )
                                  }));
                                }}
                                className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                placeholder="Enter rate"
                              />
                              <button
                                type="button"
                                onClick={() => {
                                  const equipment = availableEquipment.find(eq => eq.id === machine.id);
                                  if (equipment) {
                                    const orderType = formData.orderType as 'micro' | 'small' | 'monthly' | 'yearly';
                                    let defaultRate = 0;
                                    
                                    switch (orderType) {
                                      case 'micro':
                                        defaultRate = equipment.baseRateMicro || equipment.baseRates?.micro || 0;
                                        break;
                                      case 'small':
                                        defaultRate = equipment.baseRateSmall || equipment.baseRates?.small || 0;
                                        break;
                                      case 'monthly':
                                        defaultRate = equipment.baseRateMonthly || equipment.baseRates?.monthly || 0;
                                        break;
                                      case 'yearly':
                                        defaultRate = equipment.baseRateYearly || equipment.baseRates?.yearly || 0;
                                        break;
                                    }
                                    
                                    setFormData(prev => ({
                                      ...prev,
                                      selectedMachines: prev.selectedMachines.map((m, i) => 
                                        i === index ? { ...m, baseRate: defaultRate } : m
                                      )
                                    }));
                                  }
                                }}
                                className="mt-1 text-xs text-blue-600 hover:text-blue-800 underline"
                                title="Reset to default rate from database"
                              >
                                Reset to Default
                              </button>
                            </div>
                            
                            <div>
                              <label className="block text-xs font-medium text-gray-700 mb-1">
                                Quantity
                              </label>
                              <div className="flex items-center gap-1">
                                <button
                                  type="button"
                                  onClick={() => {
                                    setFormData(prev => ({
                                      ...prev,
                                      selectedMachines: prev.selectedMachines.map((m, i) => 
                                        i === index ? { ...m, quantity: Math.max(1, m.quantity - 1) } : m
                                      )
                                    }));
                                  }}
                                  className="w-7 h-7 rounded bg-gray-200 hover:bg-gray-300 flex items-center justify-center text-gray-600 text-sm"
                                >
                                  -
                                </button>
                                <input
                                  type="number"
                                  min="1"
                                  value={machine.quantity}
                                  onChange={(e) => {
                                    const newQuantity = Math.max(1, parseInt(e.target.value) || 1);
                                    setFormData(prev => ({
                                      ...prev,
                                      selectedMachines: prev.selectedMachines.map((m, i) => 
                                        i === index ? { ...m, quantity: newQuantity } : m
                                      )
                                    }));
                                  }}
                                  className="w-12 px-1 py-1 text-sm text-center border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                />
                                <button
                                  type="button"
                                  onClick={() => {
                                    setFormData(prev => ({
                                      ...prev,
                                      selectedMachines: prev.selectedMachines.map((m, i) => 
                                        i === index ? { ...m, quantity: m.quantity + 1 } : m
                                      )
                                    }));
                                  }}
                                  className="w-7 h-7 rounded bg-gray-200 hover:bg-gray-300 flex items-center justify-center text-gray-600 text-sm"
                                >
                                  +
                                </button>
                              </div>
                            </div>
                          </div>
                          
                          <div className="flex justify-between items-center pt-2 border-t border-gray-200">
                            <span className="text-sm text-gray-600">Cost per hour:</span>
                            <span className="text-sm font-medium text-gray-900">
                              ₹{(machine.baseRate * machine.quantity).toLocaleString()}/hr
                            </span>
                          </div>
                        </div>
                      ))}
                      <div className="mt-3 pt-3 border-t border-gray-200 bg-blue-50 p-3 rounded-lg">
                        <div className="flex justify-between items-center">
                          <span className="font-medium text-gray-900">Total Equipment Cost:</span>
                          <span className="font-bold text-blue-600 text-lg">
                            ₹{formData.selectedMachines.reduce((total, machine) => 
                              total + (machine.baseRate * machine.quantity), 0
                            ).toLocaleString()}/hr
                          </span>
                        </div>
                        <div className="mt-2 text-xs text-gray-600">
                          💡 <strong>Tip:</strong> You can adjust individual equipment rates above to customize pricing for this specific quotation. 
                          Custom rates are preserved when changing other settings.
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Order Type * 
                  <span className="text-xs text-gray-500 font-normal ml-2">
                    (Auto-selected based on number of days)
                  </span>
                </label>
                <select
                  value={formData.orderType}
                  onChange={(e) => handleInputChange('orderType', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-gray-50"
                  required
                  disabled={formData.numberOfDays > 0}
                >
                  {orderTypeOptions.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
                {formData.numberOfDays > 0 && (
                  <p className="text-xs text-blue-600 mt-1">
                    Order type automatically set based on {formData.numberOfDays} days
                  </p>
                )}
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Number of Days *
                </label>
                <input
                  type="number"
                  min="1"
                  value={formData.numberOfDays || ''}
                  onChange={(e) => {
                    const value = e.target.value;
                    if (value === '') {
                      handleInputChange('numberOfDays', 0);
                    } else {
                      const days = parseInt(value);
                      if (!isNaN(days) && days >= 0) {
                        handleInputChange('numberOfDays', days);
                      }
                    }
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                  placeholder="Enter number of days"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Working Hours per Day
                </label>
                <input
                  type="number"
                  min="1"
                  max="24"
                  value={formData.workingHours}
                  onChange={(e) => handleInputChange('workingHours', parseInt(e.target.value) || 8)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Usage Type
                </label>
                <input
                  type="text"
                  value={formData.usage}
                  onChange={(e) => handleInputChange('usage', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Construction, Infrastructure, etc."
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Work Shift
                </label>
                <select
                  value={formData.shift}
                  onChange={(e) => handleInputChange('shift', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="Day Shift">Day Shift</option>
                  <option value="Night Shift">Night Shift</option>
                  <option value="Double Shift">Double Shift</option>
                  <option value="Round the Clock">Round the Clock</option>
                </select>
              </div>
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-6">
            <div className="flex items-center space-x-3 mb-6">
              <div className="bg-purple-600 text-white p-2 rounded-lg">
                <MapPin className="h-5 w-5" />
              </div>
              <h2 className="text-xl font-semibold text-gray-900">Site & Additional Details</h2>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Site Distance (km)
                </label>
                <input
                  type="number"
                  min="0"
                  value={formData.siteDistance}
                  onChange={(e) => handleInputChange('siteDistance', parseInt(e.target.value) || 0)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Risk Factor
                </label>
                <select
                  value={formData.riskFactor}
                  onChange={(e) => handleInputChange('riskFactor', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="Low">Low</option>
                  <option value="Medium">Medium</option>
                  <option value="High">High</option>
                  <option value="Very High">Very High</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Food Resources
                </label>
                <select
                  value={formData.foodResources}
                  onChange={(e) => handleInputChange('foodResources', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="Client Provided">Client Provided</option>
                  <option value="ASP Provided">ASP Provided</option>
                  <option value="To be discussed">To be discussed</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Accommodation Resources
                </label>
                <select
                  value={formData.accomResources}
                  onChange={(e) => handleInputChange('accomResources', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="Client Provided">Client Provided</option>
                  <option value="ASP Provided">ASP Provided</option>
                  <option value="To be discussed">To be discussed</option>
                </select>
              </div>
              
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Extra Charges (₹)
                </label>
                <input
                  type="number"
                  min="0"
                  value={formData.extraCharge}
                  onChange={(e) => handleInputChange('extraCharge', parseInt(e.target.value) || 0)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Additional charges if any"
                />
              </div>
              
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Notes
                </label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => handleInputChange('notes', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Any additional notes or requirements..."
                  rows={3}
                />
              </div>
            </div>
          </div>
        );

      case 4:
        return (
          <div className="space-y-6">
            <div className="flex items-center space-x-3 mb-6">
              <div className="bg-orange-600 text-white p-2 rounded-lg">
                <Calculator className="h-5 w-5" />
              </div>
              <h2 className="text-xl font-semibold text-gray-900">Review & Cost Summary</h2>
            </div>
            
            <div className="bg-gray-50 rounded-lg p-6">
              <h3 className="text-lg font-semibold mb-4">Cost Breakdown</h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">Equipment Rental ({formData.numberOfDays} days × {formData.workingHours} hrs)</span>
                  <span className="font-medium">₹{calculations.totalRent.toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Mobilization & Demobilization</span>
                  <span className="font-medium">₹{calculations.mobDemobCost.toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Food & Accommodation</span>
                  <span className="font-medium">₹{calculations.foodAccomCost.toLocaleString('en-IN')}</span>
                </div>
                {formData.extraCharge > 0 && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Extra Charges</span>
                    <span className="font-medium">₹{formData.extraCharge.toLocaleString('en-IN')}</span>
                  </div>
                )}
                <div className="flex justify-between border-t pt-3">
                  <span className="text-gray-600">Subtotal</span>
                  <span className="font-medium">₹{(calculations.totalCost - calculations.gstAmount).toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">GST (18%)</span>
                  <span className="font-medium">₹{calculations.gstAmount.toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between border-t pt-3 text-lg font-bold">
                  <span>Total Amount</span>
                  <span className="text-blue-600">₹{calculations.totalCost.toLocaleString('en-IN')}</span>
                </div>
              </div>
            </div>

            <div className="bg-blue-50 rounded-lg p-6">
              <h3 className="text-lg font-semibold mb-4">Quotation Summary</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-medium">Customer:</span> {formData.customerName}
                </div>
                <div>
                  <span className="font-medium">Equipment Type:</span> {equipmentTypes.find(eq => eq.value === formData.machineType)?.label}
                </div>
                <div className="md:col-span-2">
                  <span className="font-medium">Selected Equipment:</span>
                  <div className="mt-2 space-y-1">
                    {formData.selectedMachines.map((machine, index) => (
                      <div key={index} className="text-sm text-gray-600">
                        • {machine.label} × {machine.quantity} (₹{(machine.baseRate * machine.quantity).toLocaleString()}/hr)
                      </div>
                    ))}
                  </div>
                </div>
                <div>
                  <span className="font-medium">Duration:</span> {formData.numberOfDays} days
                </div>
                <div>
                  <span className="font-medium">Shift:</span> {formData.shift}
                </div>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={onClose}
                className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
              >
                <ArrowLeft className="h-5 w-5" />
              </button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  {isEditMode ? 'Edit Quotation' : dealId ? 'New Quotation from Deal' : 'New Quotation'}
                </h1>
                <p className="text-gray-600">
                  {isEditMode ? 'Update quotation details' : dealId ? 'Create quotation for selected deal' : 'Create a professional quotation'}
                </p>
                {dealData && (
                  <p className="text-sm text-blue-600 mt-1">
                    Deal: {dealData.title}
                  </p>
                )}
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              <button
                onClick={handleSave}
                disabled={isLoading}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center space-x-2"
              >
                {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                <span>{isLoading ? 'Saving...' : isEditMode ? 'Update Quotation' : 'Save Quotation'}</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Step indicator */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          {[1, 2, 3, 4].map((step) => (
            <div key={step} className="flex items-center">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                step <= currentStep 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-gray-200 text-gray-600'
              }`}>
                {step < currentStep ? <CheckCircle className="h-4 w-4" /> : step}
              </div>
              <div className="ml-3 text-sm">
                {step === 1 && 'Customer Info'}
                {step === 2 && 'Equipment Details'}
                {step === 3 && 'Site Details'}
                {step === 4 && 'Review & Save'}
              </div>
              {step < 4 && <div className="w-12 h-px bg-gray-300 ml-4" />}
            </div>
          ))}
        </div>
      </div>

      {/* Notifications */}
      {notification.show && (
        <div className="fixed top-4 right-4 z-50">
          <div className={`p-4 rounded-lg shadow-lg border-l-4 max-w-sm ${
            notification.type === 'success' ? 'bg-green-50 border-green-500 text-green-800' :
            notification.type === 'error' ? 'bg-red-50 border-red-500 text-red-800' :
            'bg-blue-50 border-blue-500 text-blue-800'
          }`}>
            <div className="flex items-start space-x-3">
              {notification.type === 'success' && <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />}
              {notification.type === 'error' && <AlertCircle className="h-5 w-5 text-red-500 mt-0.5" />}
              {notification.type === 'info' && <AlertCircle className="h-5 w-5 text-blue-500 mt-0.5" />}
              <p className="text-sm font-medium">{notification.message}</p>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-6 py-8">
        <div className="bg-white rounded-lg shadow-sm border p-8">
          {renderStepContent()}
          
          {/* Navigation */}
          <div className="flex items-center justify-between mt-8 pt-6 border-t border-gray-200">
            <button
              onClick={handlePrevStep}
              disabled={currentStep === 1}
              className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            
            <div className="text-sm text-gray-500">
              Step {currentStep} of 4
            </div>
            
            {currentStep < 4 ? (
              <button
                onClick={handleNextStep}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Next
              </button>
            ) : (
              <button
                onClick={handleSave}
                disabled={isLoading}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 flex items-center space-x-2"
              >
                {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                <span>{isLoading ? 'Saving...' : isEditMode ? 'Update Quotation' : 'Create Quotation'}</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default NewQuotationBuilder;
