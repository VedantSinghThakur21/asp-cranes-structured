import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, useLocation } from 'react-router-dom';
import { 
  ArrowLeft,
  Save,
  Calculator,
  Truck,
  Users,
  Clock,
  IndianRupee,
  Settings,
  Calendar,
  Package
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { FormInput } from '../components/common/FormInput';
import { Select } from '../components/common/Select';
import { Toast } from '../components/common/Toast';
import { RequiredFieldsInfo } from '../components/common/RequiredFieldsInfo';
import { QuotationSummary } from './QuotationSummary';
import { useAuthStore } from '../store/authStore';
import { Deal } from '../types/deal';
import { Equipment, OrderType, CraneCategory, BaseRates } from '../types/equipment';
import { QuotationInputs } from '../types/quotation';
import { getDealById } from '../services/deal';
import { getEquipment, getEquipmentByCategory } from '../services/equipment';
import { createQuotation, updateQuotation, getQuotationById } from '../services/quotation';
import { formatCurrency } from '../utils/formatters';
import { useQuotationConfig, useConfigChangeListener } from '../hooks/useQuotationConfig';

const SHIFT_OPTIONS = [
  { value: 'single', label: 'Single Shift' },
  { value: 'double', label: 'Double Shift' },
];

const TIME_OPTIONS = [
  { value: 'day', label: 'Day' },
  { value: 'night', label: 'Night' },
];

const USAGE_OPTIONS = [
  { value: 'normal', label: 'Normal' },
  { value: 'medium', label: 'Medium' },
  { value: 'heavy', label: 'Heavy' },
];

const DEAL_TYPES = [
  { value: 'no_advance', label: 'No Advance' },
  { value: 'credit', label: 'Credit' },
  { value: 'long_credit', label: 'Long Credit' },
];

const RISK_LEVELS = [
  { value: 'high', label: 'High Risk' },
  { value: 'medium', label: 'Medium Risk' },
  { value: 'low', label: 'Low Risk' },
];

const OTHER_FACTORS = [
  { value: 'area', label: 'Area' },
  { value: 'condition', label: 'Condition' },
  { value: 'customer_reputation', label: 'Customer Reputation' },
  { value: 'rigger', label: 'Rigger' },
  { value: 'helper', label: 'Helper' },
];



interface SelectedMachine {
  id: string;
  machineType: string;
  equipmentId: string;
  name: string;
  baseRates: BaseRates;
  baseRate: number;
  runningCostPerKm: number;
  quantity: number;
}

interface QuotationFormState extends QuotationInputs {
  version: number;
  createdBy: string;
  status: 'draft' | 'sent' | 'accepted' | 'rejected';
  selectedMachines: SelectedMachine[];
  customerName?: string;
  customerContact?: {
    name?: string;
    email?: string;
    phone?: string;
    company?: string;
    address?: string;
    designation?: string;
  };
}

// Enhanced UI v2.0 - Clean design with inline custom amounts - Updated 2025
export function QuotationCreation() {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const location = useLocation();
  const navState = location.state as any;
  const dealId = searchParams.get('dealId') || navState?.dealId || '';
  const leadId = searchParams.get('leadId') || navState?.leadId || '';
  const quotationId = searchParams.get('quotationId') || searchParams.get('edit');

  // Configuration management with auto-refresh
  const {
    quotationConfig,
    resourceRates,
    additionalParams
  } = useQuotationConfig();
  const [deal, setDeal] = useState<Deal | null>(null);
  const [availableEquipment, setAvailableEquipment] = useState<Equipment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [selectedEquipmentBaseRate, setSelectedEquipmentBaseRate] = useState<number>(0);
  const [isLoadingExistingData, setIsLoadingExistingData] = useState(false);

  const [toast, setToast] = useState<{
    show: boolean;
    title: string;
    description?: string;
    variant?: 'success' | 'error' | 'warning';
  }>({ show: false, title: '' });

  const [formData, setFormData] = useState<QuotationFormState>({
    machineType: '',
    selectedEquipment: {
      id: '',
      equipmentId: '',
      name: '',
      baseRates: {
        micro: 0,
        small: 0,
        monthly: 0,
        yearly: 0
      }
    },
    selectedMachines: [],
    orderType: 'micro',
    numberOfDays: 0,
    workingHours: 8,
    foodResources: 0,  // Always number (number of people)
    accomResources: 0, // Always number (number of people)
    siteDistance: 0,
    usage: 'normal',
    riskFactor: 'low',
    extraCharge: 0,
    incidentalCharges: [],
    otherFactorsCharge: 0,
    billing: 'gst',
    includeGst: true,
    shift: 'single',
    dayNight: 'day',
    mobDemob: 0,
    mobRelaxation: 0,
    runningCostPerKm: 0,
    version: 1,
    createdBy: user?.id || '',
    status: 'draft',
    otherFactors: [],
    dealType: DEAL_TYPES[0].value,
    sundayWorking: 'no',
    // Custom amounts for this quotation (override config defaults)
    customIncidentAmounts: {
      incident1: null,
      incident2: null,
      incident3: null,
    },
    customRiggerAmount: null,
    customHelperAmount: null,
  });

  const [calculations, setCalculations] = useState({
    baseRate: 0,
    totalHours: 0,
    workingCost: 0,
    mobDemobCost: 0,
    foodAccomCost: 0,
    usageLoadFactor: 0,
    extraCharges: 0,
    riskAdjustment: 0,
    gstAmount: 0,
    totalAmount: 0,
  });

  // Listen for configuration changes and recalculate quotations
  useConfigChangeListener('resourceRatesUpdated', () => {
    console.log('Resource rates updated, recalculating quotation...');
    calculateQuotation();
  });

  useConfigChangeListener('additionalParamsUpdated', () => {
    console.log('Additional parameters updated, recalculating quotation...');
    calculateQuotation();
  });

  useConfigChangeListener('quotationConfigUpdated', (detail) => {
    console.log('Quotation configuration updated, checking order type...', detail);
    // Only auto-update order type if we're not loading existing quotation data AND config is available
    if (formData.numberOfDays > 0 && !isLoadingExistingData && quotationConfig?.orderTypeLimits) {
      const newOrderType = determineOrderType(formData.numberOfDays);
      if (newOrderType !== formData.orderType) {
        console.log('[QuotationCreation] Auto-updating order type from config change:', newOrderType);
        setFormData(prev => ({ ...prev, orderType: newOrderType }));
      }
    }
    calculateQuotation();
  });

  useEffect(() => {
    fetchData();
  }, [dealId, quotationId]);

  useEffect(() => {
    calculateQuotation();
  }, [formData, selectedEquipmentBaseRate]);

  // Force recalculation after component mounts and configuration is loaded
  useEffect(() => {
    if (resourceRates && additionalParams && quotationConfig) {
      console.log("🔄 Configuration loaded, forcing recalculation...");
      setTimeout(() => {
        setIsLoadingExistingData(false); // Ensure loading flag is cleared
        calculateQuotation();
      }, 100);
    }
  }, [resourceRates, additionalParams, quotationConfig]);

  useEffect(() => {
    if (formData.workingHours !== undefined) {
      calculateQuotation();
    }
  }, [formData.workingHours]);
  
  useEffect(() => {
    if (formData.orderType && formData.selectedEquipment?.id && Array.isArray(availableEquipment) && availableEquipment.length > 0) {
      const selected = availableEquipment.find(eq => eq.id === formData.selectedEquipment.id);
      if (selected) {
        const baseRate = getEquipmentBaseRate(selected, formData.orderType);
        setSelectedEquipmentBaseRate(baseRate);
      }
    }
    
    if (formData.selectedMachines.length > 0 && Array.isArray(availableEquipment) && availableEquipment.length > 0) {
      setFormData(prev => ({
        ...prev,
        selectedMachines: prev.selectedMachines.map(machine => {
          const equipmentDetails = availableEquipment.find(eq => eq.id === machine.id);
          if (equipmentDetails) {
            return {
              ...machine,
              baseRate: getEquipmentBaseRate(equipmentDetails, formData.orderType),
              baseRates: getEquipmentBaseRates(equipmentDetails),
              runningCostPerKm: equipmentDetails.runningCostPerKm || machine.runningCostPerKm || 0
            };
          }
          return machine;
        })
      }));
    }
  }, [formData.orderType, availableEquipment.length]);

  useEffect(() => {
    if (formData.machineType) {
      const fetchEquipment = async () => {
        try {
          const equipment = await getEquipmentByCategory(formData.machineType as CraneCategory);
          setAvailableEquipment(Array.isArray(equipment) ? equipment : []);
        } catch (error) {
          console.error('Error fetching equipment:', error);
          setAvailableEquipment([]);
        }
      };
      fetchEquipment();
    } else {
      setAvailableEquipment([]);
    }
  }, [formData.machineType]);

  const fetchData = async () => {
    try {
      setIsLoading(true);
      console.log('[QuotationCreation] Fetching data with dealId:', dealId, 'quotationId:', quotationId);

      const navState = location.state as any;
      let existingQuotation = null;
      let dealData = null;

      if (navState) {
        if (navState.quotation) {
          existingQuotation = navState.quotation;
          console.log('[QuotationCreation] Found quotation in navigation state:', existingQuotation);
        }
        if (navState.deal || navState.selectedDeal) {
          dealData = navState.deal || navState.selectedDeal;
          console.log('[QuotationCreation] Found deal in navigation state:', dealData);
          setDeal(dealData);
        }
      }

      if (!dealData && dealId) {
        try {
          dealData = await getDealById(dealId);
          console.log('[QuotationCreation] Fetched deal data:', dealData);
          setDeal(dealData);
        } catch (err) {
          console.error('[QuotationCreation] Error fetching deal by ID:', err);
          showToast('Warning: Could not load deal details. You can still create a quotation.', 'warning');
          setDeal({
            id: dealId,
            customer: {
              name: 'Unknown Customer',
              email: '',
              phone: '',
              company: 'Unknown Company',
              address: '',
              designation: ''
            },
            title: 'Unknown Deal',
            description: '',
            value: 0,
            stage: 'qualification',
            leadId: '',
            customerId: '',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            assignedTo: '',
            probability: 0,
            expectedCloseDate: new Date().toISOString()
          } as Deal);
        }
      } else if (!dealData) {
        setDeal({
          id: 'new',
          customer: {
            name: 'New Customer',
            email: '',
            phone: '',
            company: '',
            address: '',
            designation: ''
          },
          title: 'New Quotation',
          description: '',
          value: 0,
          stage: 'qualification',
          leadId: '',
          customerId: '',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          assignedTo: '',
          probability: 0,
          expectedCloseDate: new Date().toISOString()
        } as Deal);
      }

      const equipmentData = await getEquipment();
      console.log('Fetched equipment data:', equipmentData);
      console.log('🔧 Equipment baseRates check:', equipmentData?.map(eq => ({
        id: eq.id,
        name: eq.name,
        baseRates: eq.baseRates,
        baseRateMonthly: eq.baseRateMonthly
      })));
      setAvailableEquipment(equipmentData);

      if (quotationId) {
        let quotationToLoad = existingQuotation;
        
        if (!quotationToLoad) {
          try {
            console.log('[QuotationCreation] Fetching existing quotation from API:', quotationId);
            quotationToLoad = await getQuotationById(quotationId);
          } catch (err) {
            console.error('[QuotationCreation] Error fetching quotation:', err);
            showToast('Error loading quotation data', 'error');
          }
        }
        
        if (quotationToLoad) {
          console.log('[QuotationCreation] Loading quotation data for ID:', quotationToLoad.id);
          console.log('[QuotationCreation] Full quotation data received:', quotationToLoad);
          console.log('[QuotationCreation] Customer data:', quotationToLoad.customerContact);
          console.log('[QuotationCreation] Working hours:', quotationToLoad.workingHours);
          console.log('[QuotationCreation] Number of days:', quotationToLoad.numberOfDays);
          console.log('[QuotationCreation] Order type:', quotationToLoad.orderType);
          console.log('[QuotationCreation] Food resources:', quotationToLoad.foodResources);
          
          // Set loading flag to prevent auto-calculations from overriding loaded data
          setIsLoadingExistingData(true);
          
          // Use proper null/undefined checks and data type conversion for all fields
          const updatedFormData = {
            ...formData,
            machineType: quotationToLoad.machineType || '',
            selectedEquipment: quotationToLoad.selectedEquipment || formData.selectedEquipment,
            selectedMachines: quotationToLoad.selectedMachines || [],
            orderType: quotationToLoad.orderType || 'micro',
            numberOfDays: Number(quotationToLoad.numberOfDays) || 1,
            workingHours: Number(quotationToLoad.workingHours) || 8,
            foodResources: typeof quotationToLoad.foodResources === 'number' ? quotationToLoad.foodResources : (quotationToLoad.foodResources === 'ASP Provided' ? 2 : 0),
            accomResources: typeof quotationToLoad.accomResources === 'number' ? quotationToLoad.accomResources : (quotationToLoad.accomResources === 'ASP Provided' ? 2 : 0),
            siteDistance: Number(quotationToLoad.siteDistance) || 0,
            usage: quotationToLoad.usage || 'normal',
            riskFactor: quotationToLoad.riskFactor || 'low',
            extraCharge: Number(quotationToLoad.extraCharge) || 0,
            incidentalCharges: quotationToLoad.incidentalCharges || [],
            otherFactorsCharge: Number(quotationToLoad.otherFactorsCharge) || 0,
            billing: quotationToLoad.billing || 'gst',
            includeGst: quotationToLoad.includeGst !== undefined ? quotationToLoad.includeGst : true,
            shift: quotationToLoad.shift || 'single', // Use database value directly ('single' or 'double')
            dayNight: quotationToLoad.dayNight || 'day',
            mobDemob: Number(quotationToLoad.mobDemob) || 0,
            mobRelaxation: Number(quotationToLoad.mobRelaxation) || 0,
            runningCostPerKm: quotationToLoad.runningCostPerKm || 0,
            otherFactors: quotationToLoad.otherFactors || [],
            dealType: quotationToLoad.dealType || DEAL_TYPES[0].value,
            sundayWorking: quotationToLoad.sundayWorking || 'no',
            version: quotationToLoad.version || 1,
            status: quotationToLoad.status || 'draft',
            notes: quotationToLoad.notes || '',
            customerName: quotationToLoad.customerName || (dealData?.customer?.name || ''),
            customerContact: quotationToLoad.customerContact || {
              name: dealData?.customer?.name || '',
              email: dealData?.customer?.email || '',
              phone: dealData?.customer?.phone || '',
              company: dealData?.customer?.company || '',
              address: dealData?.customer?.address || '',
              designation: dealData?.customer?.designation || ''
            },
            // Load custom amounts from database - preserve as custom only if different from config default
            customIncidentAmounts: {
              incident1: quotationToLoad.incident1 && Number(quotationToLoad.incident1) > 0 ? Number(quotationToLoad.incident1) : null,
              incident2: quotationToLoad.incident2 && Number(quotationToLoad.incident2) > 0 ? Number(quotationToLoad.incident2) : null,
              incident3: quotationToLoad.incident3 && Number(quotationToLoad.incident3) > 0 ? Number(quotationToLoad.incident3) : null,
            },
            customRiggerAmount: quotationToLoad.riggerAmount && Number(quotationToLoad.riggerAmount) > 0 ? Number(quotationToLoad.riggerAmount) : null,
            customHelperAmount: quotationToLoad.helperAmount && Number(quotationToLoad.helperAmount) > 0 ? Number(quotationToLoad.helperAmount) : null,
            // Load date fields
            startDate: quotationToLoad.startDate || null,
            endDate: quotationToLoad.endDate || null,
            createdAt: quotationToLoad.createdAt || new Date().toISOString(),
            updatedAt: quotationToLoad.updatedAt || new Date().toISOString(),
            expectedCloseDate: quotationToLoad.expectedCloseDate || null,
            // Ensure all calculation-related fields are loaded
            totalRent: Number(quotationToLoad.totalRent) || 0,
            totalCost: Number(quotationToLoad.totalCost) || 0,
            workingCost: Number(quotationToLoad.workingCost) || 0,
            mobDemobCost: Number(quotationToLoad.mobDemobCost) || 0,
            foodAccomCost: Number(quotationToLoad.foodAccomCost) || 0,
            gstAmount: Number(quotationToLoad.gstAmount) || 0
          };
          
          console.log('[QuotationCreation] Form data populated with', Object.keys(updatedFormData).length, 'fields');
          console.log('[QuotationCreation] Updated form data preview:', {
            numberOfDays: updatedFormData.numberOfDays,
            workingHours: updatedFormData.workingHours,
            foodResources: updatedFormData.foodResources,
            orderType: updatedFormData.orderType,
            customerName: updatedFormData.customerName,
            customerContact: updatedFormData.customerContact
          });
          
          // Reconstruct incidentalCharges array based on loaded values
          const reconstructedIncidentalCharges = [];
          if (quotationToLoad.incident1 && Number(quotationToLoad.incident1) > 0) {
            reconstructedIncidentalCharges.push('incident1');
          }
          if (quotationToLoad.incident2 && Number(quotationToLoad.incident2) > 0) {
            reconstructedIncidentalCharges.push('incident2');
          }
          if (quotationToLoad.incident3 && Number(quotationToLoad.incident3) > 0) {
            reconstructedIncidentalCharges.push('incident3');
          }
          
          // Reconstruct otherFactors array based on loaded values
          const reconstructedOtherFactors = [];
          if (quotationToLoad.riggerAmount && Number(quotationToLoad.riggerAmount) > 0) {
            reconstructedOtherFactors.push('rigger');
          }
          if (quotationToLoad.helperAmount && Number(quotationToLoad.helperAmount) > 0) {
            reconstructedOtherFactors.push('helper');
          }
          
          // Update the form data with reconstructed arrays
          updatedFormData.incidentalCharges = quotationToLoad.incidentalCharges?.length > 0 
            ? quotationToLoad.incidentalCharges 
            : reconstructedIncidentalCharges;
          updatedFormData.otherFactors = quotationToLoad.otherFactors?.length > 0 
            ? quotationToLoad.otherFactors 
            : reconstructedOtherFactors;
          
          console.log('[QuotationCreation] Incident values loading:', {
            incident1: quotationToLoad.incident1,
            incident2: quotationToLoad.incident2,
            incident3: quotationToLoad.incident3,
            reconstructedIncidentalCharges,
            finalIncidentalCharges: updatedFormData.incidentalCharges
          });
          
          console.log('[QuotationCreation] Helper/Rigger values loading:', {
            riggerAmount: quotationToLoad.riggerAmount,
            helperAmount: quotationToLoad.helperAmount,
            reconstructedOtherFactors,
            finalOtherFactors: updatedFormData.otherFactors
          });
          
          console.log('[QuotationCreation] Before setFormData - Current formData:', {
            numberOfDays: formData.numberOfDays,
            workingHours: formData.workingHours,
            orderType: formData.orderType
          });
          
          setFormData(updatedFormData);
          
          console.log('[QuotationCreation] After setFormData call completed');

          // Set calculations from the loaded quotation data
          const loadedCalculations = {
            baseRate: Number(quotationToLoad.calculations?.baseRate) || 0,
            totalHours: Number(quotationToLoad.calculations?.totalHours) || (Number(quotationToLoad.numberOfDays) * Number(quotationToLoad.workingHours)),
            workingCost: Number(quotationToLoad.workingCost) || Number(quotationToLoad.calculations?.workingCost) || 0,
            mobDemobCost: Number(quotationToLoad.mobDemobCost) || Number(quotationToLoad.calculations?.mobDemobCost) || 0,
            foodAccomCost: Number(quotationToLoad.foodAccomCost) || Number(quotationToLoad.calculations?.foodAccomCost) || 0,
            usageLoadFactor: Number(quotationToLoad.usageLoadFactor) || Number(quotationToLoad.calculations?.usageLoadFactor) || 0,
            extraCharges: Number(quotationToLoad.extraCharge) || Number(quotationToLoad.calculations?.extraCharges) || 0,
            riskAdjustment: Number(quotationToLoad.riskAdjustment) || Number(quotationToLoad.calculations?.riskAdjustment) || 0,
            riskUsageTotal: Number(quotationToLoad.riskUsageTotal) || Number(quotationToLoad.calculations?.riskUsageTotal) || 0,
            incidentalCost: Number(quotationToLoad.calculations?.incidentalCost) || 0,
            otherFactorsCost: Number(quotationToLoad.otherFactorsCharge) || Number(quotationToLoad.calculations?.otherFactorsCost) || 0,
            subtotal: Number(quotationToLoad.totalRent) || Number(quotationToLoad.calculations?.subtotal) || 0,
            gstAmount: Number(quotationToLoad.gstAmount) || Number(quotationToLoad.calculations?.gstAmount) || 0,
            totalAmount: Number(quotationToLoad.totalCost) || Number(quotationToLoad.calculations?.totalAmount) || 0,
          };
          
          console.log('[QuotationCreation] Setting calculations from loaded quotation:', loadedCalculations);
          setCalculations(loadedCalculations);

          if (quotationToLoad.selectedEquipment?.id && equipmentData) {
            const selected = equipmentData.find((eq: any) => eq.id === quotationToLoad.selectedEquipment.id);
            if (selected) {
              const baseRate = getEquipmentBaseRate(selected, quotationToLoad.orderType as OrderType || 'micro');
              setSelectedEquipmentBaseRate(baseRate);
            }
          }

          // Don't force recalculation - preserve loaded database values
          setTimeout(() => {
            console.log('[QuotationCreation] Data loading complete - preserving database calculations');
            
            // Refresh selectedMachines with correct baseRates from availableEquipment
            if (equipmentData && equipmentData.length > 0) {
              setFormData(prev => ({
                ...prev,
                selectedMachines: prev.selectedMachines.map(machine => {
                  const equipmentDetails = equipmentData.find(eq => eq.id === machine.id || eq.id === machine.equipmentId);
                  if (equipmentDetails) {
                    console.log(`🔧 Refreshing baseRates for ${machine.name}:`, {
                      old: machine.baseRates,
                      new: getEquipmentBaseRates(equipmentDetails)
                    });
                    return {
                      ...machine,
                      baseRates: getEquipmentBaseRates(equipmentDetails),
                      runningCostPerKm: equipmentDetails.runningCostPerKm || machine.runningCostPerKm || 0
                    };
                  }
                  return machine;
                })
              }));
            }
            
            // Trigger full recalculation when equipment data changes (fixes exponential Risk & Usage growth)
            setTimeout(() => {
              console.log('[QuotationCreation] Equipment data updated, triggering full recalculation to fix exponential growth');
              calculateQuotation();
              setIsLoadingExistingData(false);
            }, 500);
          }, 100);

          if (!dealData && quotationToLoad.dealId) {
            try {
              console.log('[QuotationCreation] Loading deal from quotation dealId:', quotationToLoad.dealId);
              const quotationDeal = await getDealById(quotationToLoad.dealId);
              if (quotationDeal) {
                console.log('[QuotationCreation] Loaded deal from quotation:', quotationDeal);
                setDeal(quotationDeal);
              } else {
                console.warn('[QuotationCreation] Deal not found for ID:', quotationToLoad.dealId);
              }
            } catch (dealError) {
              console.warn('[QuotationCreation] Could not load deal for quotation:', dealError);
            }
          } else {
            console.log('[QuotationCreation] Skipping deal load - dealData exists:', !!dealData, 'quotation dealId:', quotationToLoad.dealId);
          }
        } else {
          console.warn('[QuotationCreation] No quotation found with ID:', quotationId);
          showToast('Quotation not found', 'warning');
        }
      } else {
        setAvailableEquipment(equipmentData);
      }

      console.log('Quotation config managed by centralized store');
    } catch (error) {
      console.error('Error fetching data:', error);
      showToast('Error fetching data', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  // Helper function to get the correct rate unit based on order type
  const getRateUnit = (orderType: OrderType): string => {
    switch (orderType) {
      case 'micro': return '/hr';
      case 'small': return '/hr';
      case 'monthly': return '/month';
      case 'yearly': return '/year';
      default: return '/hr';
    }
  };

  // Helper function to get base rate from equipment based on order type
  const getEquipmentBaseRate = (equipment: Equipment, orderType: OrderType): number => {
    console.log(`🔧 Getting base rate for ${equipment.name} with order type: ${orderType}`);
    console.log(`🔧 Equipment baseRates:`, equipment.baseRates);

    // The backend should already provide the baseRates object
    if (equipment.baseRates && equipment.baseRates[orderType] !== undefined) {
      const rate = equipment.baseRates[orderType];
      console.log(`🔧 Found rate from baseRates: ${rate}`);
      return rate;
    }

    console.log(`🔧 Warning: No baseRates found for ${equipment.name}, returning 0`);
    return 0;
  };

  // Helper function to get base rates object from equipment
  const getEquipmentBaseRates = (equipment: Equipment): BaseRates => {
    console.log(`🔧 Getting base rates object for ${equipment.name}`);
    
    // The backend should already provide the baseRates object
    if (equipment.baseRates) {
      console.log(`🔧 Using baseRates from backend:`, equipment.baseRates);
      return equipment.baseRates;
    }

    console.log(`🔧 Warning: No baseRates found for ${equipment.name}, returning zeros`);
    return { micro: 0, small: 0, monthly: 0, yearly: 0 };
  };

  const determineOrderType = (days: number): OrderType => {
    console.log('[determineOrderType] Called with days:', days, 'configLoaded:', !!quotationConfig?.orderTypeLimits);
    console.log('[determineOrderType] Full config:', quotationConfig?.orderTypeLimits);
    
    if (!quotationConfig?.orderTypeLimits) {
      console.warn('⚠️ [determineOrderType] Configuration not loaded! Returning micro as temporary fallback.');
      return 'micro'; // Return a safe fallback, but this should not be the final saved value
    }
    
    const limits = quotationConfig.orderTypeLimits;
    if (days <= 0) {
      console.log('[determineOrderType] Invalid days (<=0), returning micro');
      return 'micro';
    }
    
    // Check in correct order: micro -> small -> monthly -> yearly
    let result: OrderType;
    if (days <= limits.micro.maxDays) result = 'micro';
    else if (days <= limits.small.maxDays) result = 'small';
    else if (days <= limits.monthly.maxDays) result = 'monthly';
    else result = 'yearly';
    
    console.log('[determineOrderType] Result for', days, 'days:', result, 'limits:', limits);
    
    // Test case verification
    if (days === 21) {
      console.log('🧪 TEST: 21 days should be "small" (11-25 range). Got:', result);
      if (result !== 'small') {
        console.error('❌ TEST FAILED: 21 days returned', result, 'instead of "small"');
        console.log('Limits check:', {
          microMax: limits.micro.maxDays,
          smallMax: limits.small.maxDays,
          monthlyMax: limits.monthly.maxDays,
          evaluation: `21 <= ${limits.micro.maxDays} = ${days <= limits.micro.maxDays}, 21 <= ${limits.small.maxDays} = ${days <= limits.small.maxDays}`
        });
      } else {
        console.log('✅ TEST PASSED: 21 days correctly mapped to "small"');
      }
    }
    
    return result;
  };

  const calculateQuotation = () => {
    console.log("Calculating quotation with working hours:", formData.workingHours);
    console.log("FormData.numberOfDays:", formData.numberOfDays);
    console.log("SelectedEquipmentBaseRate:", selectedEquipmentBaseRate);
    console.log("FormData.selectedMachines:", formData.selectedMachines);
    console.log("IsLoadingExistingData:", isLoadingExistingData);
    
    // Skip recalculation if we're loading existing data to preserve database values
    // BUT allow calculation for new quotations (when quotationId is null/undefined)
    if (isLoadingExistingData && quotationId) {
      console.log("⏸️ Skipping calculation - loading existing data for quotation:", quotationId);
      return;
    }
    
    const hasMachines = formData.selectedMachines.length > 0;
    const effectiveBaseRate = selectedEquipmentBaseRate;
    
    if (!formData.numberOfDays || (!hasMachines && !effectiveBaseRate)) {
      console.log("❌ Calculation stopped - missing days or equipment", {
        numberOfDays: formData.numberOfDays,
        hasMachines,
        effectiveBaseRate
      });
      setCalculations({
        baseRate: 0,
        totalHours: 0,
        workingCost: 0,
        mobDemobCost: 0,
        foodAccomCost: 0,
        usageLoadFactor: 0,
        extraCharges: 0,
        riskAdjustment: 0,
        gstAmount: 0,
        totalAmount: 0,
      });
      return;
    }

    const numberOfDays = Number(formData.numberOfDays);
    const workingHours = Number(formData.workingHours) || 8;
    const totalHours = numberOfDays * workingHours;

    console.log("✅ Calculation inputs:", {
      numberOfDays,
      workingHours,
      totalHours,
      effectiveBaseRate,
      hasMachines,
      orderType: formData.orderType,
      shift: formData.shift,
      dayNight: formData.dayNight,
      additionalParams
    });

    // Calculate working cost based on whether we have machines or single equipment
    let workingCost = 0;
    if (hasMachines) {
      workingCost = formData.selectedMachines.reduce((total, machine) => {
        const baseRate = machine.baseRate * machine.quantity;
        if (formData.orderType === 'monthly') {
          return total + baseRate * Math.ceil(numberOfDays / 26);
        } else {
          return total + (baseRate * totalHours);
        }
      }, 0);
    } else {
      if (formData.orderType === 'monthly') {
        workingCost = effectiveBaseRate * Math.ceil(numberOfDays / 26);
      } else {
        workingCost = effectiveBaseRate * totalHours;
      }
    }

    // Apply shift type multiplier from configuration
    let shiftMultiplier = 1;
    if (additionalParams?.shiftFactors) {
      if (formData.shift === 'single') {
        shiftMultiplier = additionalParams.shiftFactors.single;
      } else if (formData.shift === 'double') {
        shiftMultiplier = additionalParams.shiftFactors.double;
      }
    }
    workingCost = workingCost * shiftMultiplier;

    // Apply day/night time multiplier from configuration  
    let timeMultiplier = 1;
    if (additionalParams?.dayNightFactors) {
      if (formData.dayNight === 'day') {
        timeMultiplier = additionalParams.dayNightFactors.day;
      } else if (formData.dayNight === 'night') {
        timeMultiplier = additionalParams.dayNightFactors.night;
      }
    }
    workingCost = workingCost * timeMultiplier;

    console.log("💰 Working cost calculated:", {
      baseWorkingCost: workingCost / (shiftMultiplier * timeMultiplier),
      shiftMultiplier,
      timeMultiplier,
      finalWorkingCost: workingCost
    });

    // Food & Accommodation costs - convert monthly rates to daily rates
    const foodRatePerMonth = resourceRates?.foodRatePerMonth;
    const accomRatePerMonth = resourceRates?.accommodationRatePerMonth;
    
    // Convert monthly rates to daily rates (assuming 26 working days per month)
    const foodRatePerDay = foodRatePerMonth ? foodRatePerMonth / 26 : 0;
    const accomRatePerDay = accomRatePerMonth ? accomRatePerMonth / 26 : 0;
    
    const foodCost = foodRatePerDay ? (formData.foodResources || 0) * foodRatePerDay * numberOfDays : 0;
    const accomCost = accomRatePerDay ? (formData.accomResources || 0) * accomRatePerDay * numberOfDays : 0;
    const foodAccomCost = foodCost + accomCost;

    console.log("🍽️ Food & Accommodation:", {
      foodResources: formData.foodResources,
      accomResources: formData.accomResources,
      foodRatePerMonth,
      accomRatePerMonth,
      foodRatePerDay,
      accomRatePerDay,
      numberOfDays,
      foodCost,
      accomCost,
      foodAccomCost,
      resourceRates
    });

    // Warn if resource rates are not configured
    if ((formData.foodResources > 0 || formData.accomResources > 0) && (!foodRatePerMonth || !accomRatePerMonth)) {
      console.warn("⚠️ Resource rates not configured! Food & Accommodation costs will be ₹0. Please configure rates in Settings.");
    }

    // Mobilization/Demobilization costs
    let mobDemobCost = 0;
    
    console.log("🚚 MOB/DEMOB CALCULATION DEBUG:", {
      mobDemobManual: formData.mobDemob,
      siteDistance: formData.siteDistance,
      hasMachines,
      selectedMachinesCount: formData.selectedMachines?.length,
      selectedMachinesData: formData.selectedMachines?.map(m => ({
        name: m.name,
        quantity: m.quantity,
        runningCostPerKm: m.runningCostPerKm,
        hasRunningCost: !!m.runningCostPerKm
      }))
    });
    
    if (formData.mobDemob > 0) {
      mobDemobCost = formData.mobDemob;
      console.log("🚚 Using manual mob/demob cost:", mobDemobCost);
    } else if (formData.siteDistance > 0) {
      if (hasMachines) {
        console.log("🚚 Calculating mob/demob for machines...");
        mobDemobCost = formData.selectedMachines.reduce((total, machine) => {
          const distance = formData.siteDistance || 0;
          const runningCostPerKm = machine.runningCostPerKm || 0;
          const machineCost = distance * 2 * runningCostPerKm; // Round trip cost only
          const totalForMachine = machineCost * machine.quantity;
          
          // Warn if equipment has no running cost data
          if (!runningCostPerKm) {
            console.warn(`⚠️ Equipment "${machine.name}" has no running cost per km configured! Mob/demob will be ₹0 for this equipment.`);
          }
          
          console.log(`  - Machine: ${machine.name}, Distance: ${distance}km, Running Cost: ₹${runningCostPerKm}/km, Qty: ${machine.quantity}`);
          console.log(`    Calculation: ${distance} * 2 * ${runningCostPerKm} = ₹${machineCost} per machine`);
          console.log(`    Total for ${machine.quantity} machine(s): ₹${totalForMachine}`);
          
          return total + totalForMachine;
        }, 0);
        console.log("🚚 Total mob/demob cost from machines:", mobDemobCost);
      } else {
        console.log("🚚 No machines selected, using fallback calculation...");
        const distance = formData.siteDistance || 0;
        const runningCostPerKm = formData.runningCostPerKm || 0;
        mobDemobCost = distance * 2 * runningCostPerKm; // Round trip cost only
        console.log(`  Fallback calculation: ${distance} * 2 * ${runningCostPerKm} = ₹${mobDemobCost}`);
      }
      
      if (formData.mobRelaxation > 0) {
        const beforeRelaxation = mobDemobCost;
        mobDemobCost = Math.max(0, mobDemobCost - formData.mobRelaxation);
        console.log(`🚚 Applied ₹${formData.mobRelaxation} relaxation discount: ₹${beforeRelaxation} -> ₹${mobDemobCost}`);
      }
    } else {
      console.log("🚚 No mob/demob calculation: siteDistance =", formData.siteDistance);
    }

    console.log("🚚 FINAL Mob-Demob calculation result:", {
      mobDemobManual: formData.mobDemob,
      siteDistance: formData.siteDistance,
      mobRelaxation: formData.mobRelaxation,
      finalMobDemobCost: mobDemobCost,
      hasMachines,
      selectedMachines: formData.selectedMachines?.map(m => ({ 
        name: m.name, 
        quantity: m.quantity, 
        runningCostPerKm: m.runningCostPerKm 
      })),
      conditionChecks: {
        hasManualMobDemob: formData.mobDemob > 0,
        hasDistance: formData.siteDistance > 0,
        shouldCalculate: (formData.mobDemob === 0 && formData.siteDistance > 0)
      }
    });

    // Risk & Usage calculation based on Monthly Base Rate of Equipment(s)
    // Calculate total monthly base rate for all selected equipment
    // Always use the monthly base rate from availableEquipment to ensure accuracy
    const totalMonthlyBaseRate = formData.selectedMachines.reduce((total, machine) => {
      // Find the equipment in availableEquipment to get the latest monthly rate
      const equipmentDetails = availableEquipment.find(eq => eq.id === machine.id);
      const monthlyRate = equipmentDetails?.baseRates?.monthly || equipmentDetails?.baseRateMonthly || machine.baseRates?.monthly || 0;
      
      console.log(`🔧 Risk & Usage - Equipment ${machine.name}:`, {
        machineId: machine.id,
        quantity: machine.quantity,
        monthlyRateFromMachine: machine.baseRates?.monthly,
        monthlyRateFromAvailable: equipmentDetails?.baseRates?.monthly,
        monthlyRateFromAvailableAlt: equipmentDetails?.baseRateMonthly,
        finalMonthlyRate: monthlyRate,
        contribution: monthlyRate * machine.quantity
      });
      
      return total + (monthlyRate * machine.quantity);
    }, 0);

    // Get individual Risk and Usage factors from configuration - NO hardcoded defaults
    const riskFactors = additionalParams?.riskFactors || {};
    const usageFactors = additionalParams?.usageFactors || {};
    
    // Warn if config not loaded
    if (!additionalParams?.riskFactors || !additionalParams?.usageFactors) {
      console.warn('⚠️ Risk/Usage factors not loaded from config! Risk & Usage calculation will be 0.');
    }
    
    // Use the ACTUAL selected risk and usage values from the form
    const selectedRiskType = formData.riskFactor || 'low'; // Use actual form value
    const selectedUsageType = formData.usage || 'normal'; // Use actual form value
    
    const riskPercentage = riskFactors[selectedRiskType as keyof typeof riskFactors] || 0;
    const usagePercentage = usageFactors[selectedUsageType as keyof typeof usageFactors] || 0;

    console.log("🔧 Risk & Usage calculation (individual factors):", {
      selectedMachines: formData.selectedMachines.length,
      totalMonthlyBaseRate,
      riskFactors,
      usageFactors,
      selectedRiskType: selectedRiskType,
      selectedUsageType: selectedUsageType,
      riskPercentage,
      usagePercentage,
      equipmentBreakdown: formData.selectedMachines.map(m => ({
        name: m.name,
        quantity: m.quantity,
        monthlyRate: m.baseRates?.monthly || 0,
        subtotal: (m.baseRates?.monthly || 0) * m.quantity
      }))
    });

    // Calculate Risk and Usage separately using individual factors
    const riskAdjustment = totalMonthlyBaseRate * (riskPercentage / 100);
    const usageLoadFactor = totalMonthlyBaseRate * (usagePercentage / 100);
    const riskUsageTotal = riskAdjustment + usageLoadFactor;

    // Additional charges
    const extraCharges = Number(formData.extraCharge) || 0;
    
    // Incidental charges - use custom amounts or config defaults, NO hardcoded fallbacks
    console.log("🔧 Config Debug - additionalParams loaded:", {
      hasAdditionalParams: !!additionalParams,
      incidentalOptions: additionalParams?.incidentalOptions,
      riggerAmount: additionalParams?.riggerAmount,
      helperAmount: additionalParams?.helperAmount,
      riskFactors: additionalParams?.riskFactors,
      usageFactors: additionalParams?.usageFactors,
      configSource: 'DATABASE_CONFIG_TABLE'
    });
    
    // CRITICAL: Validate all config is loaded from database
    const missingConfig = [];
    if (!additionalParams?.riggerAmount) missingConfig.push('riggerAmount');
    if (!additionalParams?.helperAmount) missingConfig.push('helperAmount');
    if (!additionalParams?.incidentalOptions?.length) missingConfig.push('incidentalOptions');
    if (!additionalParams?.riskFactors) missingConfig.push('riskFactors');
    if (!additionalParams?.usageFactors) missingConfig.push('usageFactors');
    
    if (missingConfig.length > 0) {
      console.error('❌ MISSING CONFIG VALUES from database:', missingConfig);
      console.error('⚠️ Some calculations will use 0 instead of proper config defaults!');
    } else {
      console.log('✅ All config values successfully loaded from database config table');
    }
    
    const incidentalTotal = formData.incidentalCharges.reduce((sum, val) => {
      let amount = 0;
      
      // Use custom amount if provided, otherwise use config default
      if (val === 'incident1') {
        const custom = formData.customIncidentAmounts?.incident1;
        const config = additionalParams?.incidentalOptions?.find(opt => opt.value === 'incident1')?.amount;
        amount = custom ?? config ?? 0;
        console.log(`💰 Incident1 amount resolution: custom=${custom}, config=${config}, final=${amount}`);
      } else if (val === 'incident2') {
        const custom = formData.customIncidentAmounts?.incident2;
        const config = additionalParams?.incidentalOptions?.find(opt => opt.value === 'incident2')?.amount;
        amount = custom ?? config ?? 0;
        console.log(`💰 Incident2 amount resolution: custom=${custom}, config=${config}, final=${amount}`);
      } else if (val === 'incident3') {
        const custom = formData.customIncidentAmounts?.incident3;
        const config = additionalParams?.incidentalOptions?.find(opt => opt.value === 'incident3')?.amount;
        amount = custom ?? config ?? 0;
        console.log(`💰 Incident3 amount resolution: custom=${custom}, config=${config}, final=${amount}`);
      } else {
        // Only use config, no hardcoded fallback
        const found = additionalParams?.incidentalOptions?.find(opt => opt.value === val);
        amount = found ? found.amount : 0;
        console.log(`💰 Other incident ${val} amount resolution: config=${found?.amount}, final=${amount}`);
      }
      
      return sum + amount;
    }, 0);

    console.log("📋 Incidental charges:", {
      incidentalCharges: formData.incidentalCharges,
      customIncidentAmounts: formData.customIncidentAmounts,
      incidentalTotal
    });

    // Only use custom amounts or config table values - NO hardcoded defaults
    const riggerAmount = formData.customRiggerAmount ?? additionalParams?.riggerAmount ?? 0;
    const helperAmount = formData.customHelperAmount ?? additionalParams?.helperAmount ?? 0;
    
    // Warn if config not available when needed
    if (formData.otherFactors.includes('rigger') && !formData.customRiggerAmount && !additionalParams?.riggerAmount) {
      console.warn('⚠️ Rigger selected but no config value available! Using ₹0.');
    }
    if (formData.otherFactors.includes('helper') && !formData.customHelperAmount && !additionalParams?.helperAmount) {
      console.warn('⚠️ Helper selected but no config value available! Using ₹0.');
    }
    
    console.log("👷 Rigger/Helper amount resolution:", {
      customRiggerAmount: formData.customRiggerAmount,
      configRiggerAmount: additionalParams?.riggerAmount,
      finalRiggerAmount: riggerAmount,
      customHelperAmount: formData.customHelperAmount,
      configHelperAmount: additionalParams?.helperAmount,
      finalHelperAmount: helperAmount,
      riggerSelected: formData.otherFactors.includes('rigger'),
      helperSelected: formData.otherFactors.includes('helper')
    });
    
    const otherFactorsTotal = (formData.otherFactors.includes('rigger') ? riggerAmount : 0) + 
                            (formData.otherFactors.includes('helper') ? helperAmount : 0);

    console.log("👷 Other factors (Rigger & Helper):", {
      otherFactors: formData.otherFactors,
      riggerAmountUsed: riggerAmount,
      helperAmountUsed: helperAmount,
      customRiggerAmount: formData.customRiggerAmount,
      customHelperAmount: formData.customHelperAmount,
      riggerSelected: formData.otherFactors.includes('rigger'),
      helperSelected: formData.otherFactors.includes('helper'),
      otherFactorsTotal
    });

    // Calculate subtotal using the combined Risk & Usage total
    const subtotal = workingCost + foodAccomCost + mobDemobCost + riskUsageTotal + extraCharges + incidentalTotal + otherFactorsTotal;

    // GST calculation
    const gstAmount = formData.includeGst ? subtotal * 0.18 : 0;
    const totalAmount = subtotal + gstAmount;

    const newCalculations = {
      baseRate: effectiveBaseRate,
      totalHours,
      workingCost,
      mobDemobCost,
      foodAccomCost,
      usageLoadFactor,
      extraCharges,
      riskAdjustment,
      riskUsageTotal, // New combined Risk & Usage total
      totalMonthlyBaseRate, // For debugging/reference
      incidentalCost: incidentalTotal, // Add incidental cost to calculations
      otherFactorsCost: otherFactorsTotal,
      subtotal,
      gstAmount,
      totalAmount,
    };

    console.log("🎯 Final calculations:", newCalculations);

    setCalculations(newCalculations);
  };

  const showToast = (title: string, variant: 'success' | 'error' | 'warning' = 'success', description?: string) => {
    setToast({ show: true, title, description, variant });
    setTimeout(() => setToast({ show: false, title: '' }), 5000);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.numberOfDays || formData.numberOfDays === 0) {
      showToast('Please enter the number of days', 'error');
      return;
    }

    // Ensure configuration is loaded before submitting
    if (!quotationConfig?.orderTypeLimits) {
      showToast('Configuration is still loading. Please wait a moment and try again.', 'error');
      return;
    }

    if (formData.selectedMachines.length === 0) {
      showToast('Please select at least one equipment', 'error');
      return;
    }

    try {
      setIsSaving(true);
      
      // Ensure we have either a deal or lead ID (for updates, deal should be loaded from quotation)
      const currentDealId = dealId || deal?.id;
      console.log('🔍 DEBUG: Submit validation - dealId:', dealId, 'deal?.id:', deal?.id, 'currentDealId:', currentDealId, 'quotationId:', quotationId);
      
      if (!currentDealId && !quotationId) {
        showToast('A deal must be selected to create a quotation', 'error');
        return;
      }

      // Validate deal stage (skip validation for updates if deal couldn't be loaded)
      if (deal && (!deal?.stage || !['qualification', 'proposal', 'negotiation'].includes(deal.stage))) {
        showToast('Quotations can only be created for deals in Qualification, Proposal, or Negotiation stages', 'error');
        return;
      }

      console.log('🔍 DEBUG: About to submit quotation with EXACT form values:', {
        orderType: formData.orderType,
        numberOfDays: formData.numberOfDays,
        usage: formData.usage,
        riskFactor: formData.riskFactor,
        foodResources: formData.foodResources,
        accomResources: formData.accomResources,
        configurationLoaded: !!quotationConfig?.orderTypeLimits,
        quotationConfigLimits: quotationConfig?.orderTypeLimits,
        determineOrderTypeResult: determineOrderType(formData.numberOfDays),
        customRiggerAmount: formData.customRiggerAmount,
        customHelperAmount: formData.customHelperAmount,
        otherFactors: formData.otherFactors
      });

      // Double-check that the order type is correctly determined
      const finalOrderType = determineOrderType(formData.numberOfDays);
      if (finalOrderType !== formData.orderType) {
        console.warn('⚠️ Order type mismatch! Form has:', formData.orderType, 'but determination gives:', finalOrderType);
        // Update form data to use the correctly determined order type
        setFormData(prev => ({ ...prev, orderType: finalOrderType }));
      }

      console.log('🎯 CRITICAL DEBUG: Custom amounts before creating quotationData:', {
        customRiggerAmount: formData.customRiggerAmount,
        customHelperAmount: formData.customHelperAmount,
        otherFactors: formData.otherFactors,
        riggerSelected: formData.otherFactors.includes('rigger'),
        helperSelected: formData.otherFactors.includes('helper')
      });

      // Calculate the exact amounts that will be sent to backend
      // Only use config table values as defaults - NO hardcoded fallbacks
      const incident1Amount = formData.incidentalCharges.includes('incident1') ? 
        (formData.customIncidentAmounts?.incident1 ?? additionalParams?.incidentalOptions?.find(opt => opt.value === 'incident1')?.amount ?? 0) : null;
      const incident2Amount = formData.incidentalCharges.includes('incident2') ? 
        (formData.customIncidentAmounts?.incident2 ?? additionalParams?.incidentalOptions?.find(opt => opt.value === 'incident2')?.amount ?? 0) : null;
      const incident3Amount = formData.incidentalCharges.includes('incident3') ? 
        (formData.customIncidentAmounts?.incident3 ?? additionalParams?.incidentalOptions?.find(opt => opt.value === 'incident3')?.amount ?? 0) : null;
        
      // Log incident amount sources for validation
      (['incident1', 'incident2', 'incident3'] as const).forEach((incident, index) => {
        if (formData.incidentalCharges.includes(incident)) {
          const customAmount = formData.customIncidentAmounts?.[incident];
          const configAmount = additionalParams?.incidentalOptions?.find(opt => opt.value === incident)?.amount;
          const finalAmount = [incident1Amount, incident2Amount, incident3Amount][index];
          console.log(`🔍 ${incident} amount source:`, {
            customAmount,
            configTableAmount: configAmount,
            finalAmount,
            source: customAmount ? 'CUSTOM' : (configAmount ? 'CONFIG_TABLE' : 'MISSING_CONFIG')
          });
        }
      });
      // Only send config table values as defaults - NO hardcoded fallbacks
      const riggerAmountToSend = formData.otherFactors.includes('rigger') ? 
        (formData.customRiggerAmount ?? additionalParams?.riggerAmount ?? 0) : null;
      const helperAmountToSend = formData.otherFactors.includes('helper') ? 
        (formData.customHelperAmount ?? additionalParams?.helperAmount ?? 0) : null;
        
      // Log config source validation
      if (formData.otherFactors.includes('rigger')) {
        console.log('🔍 Rigger amount source:', {
          customAmount: formData.customRiggerAmount,
          configTableAmount: additionalParams?.riggerAmount,
          finalAmount: riggerAmountToSend,
          source: formData.customRiggerAmount ? 'CUSTOM' : (additionalParams?.riggerAmount ? 'CONFIG_TABLE' : 'MISSING_CONFIG')
        });
      }
      if (formData.otherFactors.includes('helper')) {
        console.log('🔍 Helper amount source:', {
          customAmount: formData.customHelperAmount,
          configTableAmount: additionalParams?.helperAmount,
          finalAmount: helperAmountToSend,
          source: formData.customHelperAmount ? 'CUSTOM' : (additionalParams?.helperAmount ? 'CONFIG_TABLE' : 'MISSING_CONFIG')
        });
      }

      console.log('🚀 SUBMISSION DEBUG - Exact amounts being sent to backend:', {
        incidentChargesSelected: formData.incidentalCharges,
        otherFactorsSelected: formData.otherFactors,
        incident1Amount,
        incident2Amount,
        incident3Amount,
        riggerAmountToSend,
        helperAmountToSend,
        customAmounts: {
          rigger: formData.customRiggerAmount,
          helper: formData.customHelperAmount,
          incident1: formData.customIncidentAmounts?.incident1,
          incident2: formData.customIncidentAmounts?.incident2,
          incident3: formData.customIncidentAmounts?.incident3
        },
        configAmounts: {
          rigger: additionalParams?.riggerAmount,
          helper: additionalParams?.helperAmount,
          incident1: additionalParams?.incidentalOptions?.find(opt => opt.value === 'incident1')?.amount,
          incident2: additionalParams?.incidentalOptions?.find(opt => opt.value === 'incident2')?.amount,
          incident3: additionalParams?.incidentalOptions?.find(opt => opt.value === 'incident3')?.amount
        }
      });

      const quotationData = {
        ...formData,  // Use EXACT form data without overrides
        dealId: currentDealId,
        leadId: leadId,
        customerName: formData.customerName || deal?.customer?.name || '',
        customerContact: {
          name: formData.customerContact?.name || deal?.customer?.name || '',
          email: formData.customerContact?.email || deal?.customer?.email || '',
          phone: formData.customerContact?.phone || deal?.customer?.phone || '',
          company: formData.customerContact?.company || deal?.customer?.company || '',
          address: formData.customerContact?.address || deal?.customer?.address || '',
          designation: formData.customerContact?.designation || deal?.customer?.designation || ''
        },
        // Include all calculation fields directly in the quotation data
        calculations,
        totalAmount: calculations.totalAmount,
        totalCost: calculations.totalAmount,
        workingCost: calculations.workingCost,
        mobDemobCost: calculations.mobDemobCost,
        foodAccomCost: calculations.foodAccomCost,
        usageLoadFactor: calculations.usageLoadFactor,
        riskAdjustment: calculations.riskAdjustment,
        gstAmount: calculations.gstAmount,
        createdBy: user?.id || '',
        updatedAt: new Date().toISOString(),
        // Equipment information for database storage
        primaryEquipmentId: formData.selectedEquipment?.equipmentId || formData.selectedEquipment?.id || null,
        equipmentSnapshot: formData.selectedEquipment || null,
        // Send the APPLIED amounts (what's actually being used in calculations)
        incident1: incident1Amount,
        incident2: incident2Amount,
        incident3: incident3Amount,
        riggerAmount: riggerAmountToSend,
        helperAmount: helperAmountToSend,
        // Also send custom amounts for reference
        customRiggerAmount: formData.customRiggerAmount || null,
        customHelperAmount: formData.customHelperAmount || null
      };

      console.log('🚀 FINAL DEBUG: About to send quotation data to backend:', {
        customRiggerAmount: quotationData.customRiggerAmount,
        riggerAmount: quotationData.riggerAmount,
        customHelperAmount: quotationData.customHelperAmount,
        helperAmount: quotationData.helperAmount,
        otherFactors: quotationData.otherFactors,
        formDataCustomRiggerAmount: formData.customRiggerAmount,
        fullQuotationDataForRigger: {
          customRiggerAmount: quotationData.customRiggerAmount,
          riggerAmount: quotationData.riggerAmount
        }
      });

      if (quotationId) {
        await updateQuotation(quotationId, quotationData);
        showToast('Quotation updated successfully', 'success');
      } else {
        await createQuotation(quotationData);
        showToast('Quotation created successfully', 'success');
      }
      
      navigate('/quotations');
    } catch (error) {
      console.error('Error saving quotation:', error);
      showToast('Error saving quotation', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Loading quotation form...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      <style>
        {`
          input[type="number"]::-webkit-inner-spin-button,
          input[type="number"]::-webkit-outer-spin-button {
            -webkit-appearance: none;
            margin: 0;
          }
          input[type="number"] {
            -moz-appearance: textfield;
          }
          input, select {
            color: #1a202c !important;
            background-color: #ffffff !important;
          }
          input::placeholder {
            color: #718096 !important;
            opacity: 1;
          }
          select {
            font-weight: 500 !important;
          }
          .form-input, .form-select {
            border-color: #e2e8f0;
            font-weight: 500;
          }
          option {
            color: #1a202c !important;
            background-color: #ffffff !important;
            font-weight: 500;
          }
        `}
      </style>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/quotations')}
            leftIcon={<ArrowLeft size={16} />}
            className="self-start"
          >
            Back
          </Button>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-blue-900">
              {quotationId ? 'Edit Quotation' : 'Create Quotation'}
            </h1>
            <p className="text-sm sm:text-base text-blue-700">
              For {deal?.customer?.name || 'New Customer'} - {deal?.title || 'New Quotation'}
            </p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="max-w-full mx-auto px-2 sm:px-4">
        <RequiredFieldsInfo />
        
        {/* Customer Information Card - Compact */}
        <Card className="mb-6 shadow-sm hover:shadow-md transition-shadow duration-200">
          <CardHeader className="pb-4">
            <div className="flex items-center space-x-2">
              <Users className="w-5 h-5 text-gray-500" />
              <CardTitle className="text-lg font-medium">Customer Information</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 text-sm">
              <div>
                    <div className="text-blue-700 mb-1">Customer</div>
                <div className="font-semibold text-gray-900">
                  {formData.customerName || deal?.customer?.name || 'N/A'}
                </div>
              </div>
              <div>
                    <div className="text-blue-700 mb-1">Company</div>
                <div className="font-semibold text-gray-900">
                  {formData.customerContact?.company || deal?.customer?.company || 'N/A'}
                </div>
              </div>
              <div>
                    <div className="text-blue-700 mb-1">Email</div>
                <div className="font-semibold text-gray-900 break-all">
                  {formData.customerContact?.email || deal?.customer?.email || 'N/A'}
                </div>
              </div>
              <div>
                    <div className="text-blue-700 mb-1">Phone</div>
                <div className="font-semibold text-gray-900">
                  {formData.customerContact?.phone || deal?.customer?.phone || 'N/A'}
                </div>
              </div>
              <div>
                    <div className="text-blue-700 mb-1">Designation</div>
                <div className="font-semibold text-gray-900">
                  {formData.customerContact?.designation || deal?.customer?.designation || 'N/A'}
                </div>
              </div>
              <div>
                    <div className="text-blue-700 mb-1">Address</div>
                <div className="font-semibold text-gray-900">
                  {formData.customerContact?.address || deal?.customer?.address || 'N/A'}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="flex flex-col xl:flex-row gap-6">
          {/* Left Column - Form Fields */}
          <div className="flex-1 space-y-4">
            {/* Basic Information Row */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <Card className="shadow-sm">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base font-medium flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-gray-500" />
                    Duration
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-0 space-y-3">
                  <FormInput
                    type="number"
                    label="Number of Days"
                    value={formData.numberOfDays === 0 ? '' : formData.numberOfDays}
                    style={{ color: '#1a202c', WebkitTextFillColor: '#1a202c' }}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                      const days = e.target.value === '' ? 0 : Number(e.target.value);
                      
                      setFormData(prev => {
                        // Only auto-update order type if not loading existing data AND config is loaded
                        const shouldAutoUpdateOrderType = !isLoadingExistingData && days > 0 && quotationConfig?.orderTypeLimits;
                        const newOrderType = shouldAutoUpdateOrderType ? determineOrderType(days) : prev.orderType;
                        const orderTypeChanged = shouldAutoUpdateOrderType && newOrderType !== prev.orderType;
                        
                        console.log('[QuotationCreation] numberOfDays onChange:', {
                          days,
                          isLoadingExistingData,
                          shouldAutoUpdateOrderType,
                          currentOrderType: prev.orderType,
                          newOrderType,
                          orderTypeChanged
                        });
                        
                        let updatedMachines = [...prev.selectedMachines];
                        if (orderTypeChanged) {
                          updatedMachines = prev.selectedMachines.map(machine => {
                            // Find the equipment in availableEquipment to get updated rates
                            const equipment = availableEquipment.find(eq => eq.id === machine.id);
                            if (equipment) {
                              return {
                                ...machine,
                                baseRate: getEquipmentBaseRate(equipment, newOrderType),
                                baseRates: getEquipmentBaseRates(equipment)
                              };
                            }
                            return {
                              ...machine,
                              baseRate: machine.baseRates?.[newOrderType] || machine.baseRate
                            };
                          });
                        }
                        
                        return {
                          ...prev,
                          numberOfDays: days,
                          orderType: newOrderType,
                          selectedMachines: updatedMachines
                        };
                      });
                    }}
                    required
                    min="1"
                    placeholder="Enter days"
                    className="text-gray-900"
                  />
                  
                  {/* Order Type Display */}
                  {formData.numberOfDays > 0 && (
                    <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                      <div className="text-sm font-medium text-blue-900">Order Type</div>
                      <div className="text-lg font-bold text-blue-700 capitalize">
                        {formData.orderType}
                        {formData.orderType === 'micro' && ' (1-10 days)'}
                        {formData.orderType === 'small' && ' (11-25 days)'}
                        {formData.orderType === 'monthly' && ' (26-365 days)'}
                        {formData.orderType === 'yearly' && ' (366+ days)'}
                      </div>
                    </div>
                  )}
                  
                  <FormInput
                    type="number"
                    label="Working Hours/Day"
                    value={formData.workingHours || ''}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                      const hours = Number(e.target.value) || 8;
                      setFormData(prev => ({ ...prev, workingHours: hours }));
                    }}
                    min="1"
                    max="24"
                    placeholder="8"
                  />
                </CardContent>
              </Card>

              <Card className="shadow-sm">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base font-medium flex items-center gap-2">
                    <Truck className="w-4 h-4 text-gray-500" />
                    Machine Selection
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-0 space-y-3">
                  <Select
                    label="Machine Type"
                    value={formData.machineType}
                    onChange={(value: string) => {
                      setFormData(prev => ({ 
                        ...prev, 
                        machineType: value,
                        selectedEquipment: { id: '', equipmentId: '', name: '', baseRates: { micro: 0, small: 0, monthly: 0, yearly: 0 } },
                        selectedMachines: []
                      }));
                      if (value) {
                        console.log(`🔍 Fetching equipment for category: ${value}`);
                        getEquipmentByCategory(value as CraneCategory).then(equipment => {
                          console.log(`📦 Received equipment data:`, equipment);
                          console.log(`📦 Equipment count: ${equipment?.length || 0}`);
                          if (equipment && equipment.length > 0) {
                            console.log(`📦 First equipment sample:`, equipment[0]);
                            console.log(`📦 First equipment baseRates:`, equipment[0].baseRates);
                            console.log(`📦 First equipment individual rates:`, {
                              baseRateMicro: equipment[0].baseRateMicro,
                              baseRateSmall: equipment[0].baseRateSmall,
                              baseRateMonthly: equipment[0].baseRateMonthly,
                              baseRateYearly: equipment[0].baseRateYearly
                            });
                          }
                          setAvailableEquipment(Array.isArray(equipment) ? equipment : []);
                        }).catch(error => {
                          console.error('❌ Error fetching equipment:', error);
                          setAvailableEquipment([]);
                        });
                      }
                    }}
                    options={[
                      { value: '', label: 'Select machine type...' },
                      { value: 'mobile_crane', label: 'Mobile Crane' },
                      { value: 'tower_crane', label: 'Tower Crane' },
                      { value: 'crawler_crane', label: 'Crawler Crane' },
                      { value: 'pick_and_carry_crane', label: 'Pick & Carry Crane' },
                    ]}
                    required
                    className="text-gray-900"
                  />
                  
                  {formData.machineType && availableEquipment.length > 0 && (
                    <>
                      <Select
                        label="Available Equipment"
                        value=""
                        onChange={(value: string) => {
                          const selected = availableEquipment.find(eq => eq.id === value);
                          if (selected) {
                            // Check if this machine is already selected
                            const existingIndex = formData.selectedMachines.findIndex(m => m.id === selected.id);
                            
                            if (existingIndex >= 0) {
                              // If already selected, increase quantity
                              setFormData(prev => ({
                                ...prev,
                                selectedMachines: prev.selectedMachines.map((m, i) => 
                                  i === existingIndex ? { ...m, quantity: m.quantity + 1 } : m
                                )
                              }));
                            } else {
                              // Add new machine to the list
                              const baseRates = getEquipmentBaseRates(selected);
                              const newMachine = {
                                id: selected.id,
                                machineType: formData.machineType,
                                equipmentId: selected.equipmentId,
                                name: selected.name,
                                baseRates: baseRates,
                                baseRate: getEquipmentBaseRate(selected, formData.orderType),
                                runningCostPerKm: selected.runningCostPerKm || 0,
                                quantity: 1
                              };
                              
                              console.log(`🏗️ Added equipment to selection:`, {
                                name: selected.name,
                                runningCostPerKm: selected.runningCostPerKm,
                                hasRunningCost: !!selected.runningCostPerKm,
                                equipmentData: selected
                              });
                              
                              setFormData(prev => ({
                                ...prev,
                                selectedMachines: [...prev.selectedMachines, newMachine]
                              }));
                            }
                          }
                        }}
                        options={[
                          { value: '', label: 'Select equipment to add...' },
                          ...availableEquipment.map(eq => ({ 
                            value: eq.id, 
                            label: `${eq.name} - ${formatCurrency(getEquipmentBaseRate(eq, formData.orderType))}${getRateUnit(formData.orderType)}` 
                          }))
                        ]}
                        className="text-gray-900 mb-3"
                      />

                      {/* Selected machines list */}
                      {formData.selectedMachines.length > 0 && (
                        <div className="mt-4 space-y-3">
                          <h4 className="text-sm font-medium text-gray-900 flex items-center gap-2">
                            <Package className="w-4 h-4 text-blue-600" />
                            Selected Equipment ({formData.selectedMachines.length} type{formData.selectedMachines.length !== 1 ? 's' : ''})
                          </h4>
                          <div className="space-y-3">
                            {formData.selectedMachines.map((machine, index) => (
                              <div key={`${machine.id}-${index}`} className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow">
                                {/* Equipment Header */}
                                <div className="flex items-start justify-between mb-4">
                                  <div className="flex-1">
                                    <h5 className="font-semibold text-gray-900 text-base leading-tight">{machine.name}</h5>
                                    <p className="text-sm text-gray-500 mt-1">{machine.equipmentId}</p>
                                  </div>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setFormData(prev => ({
                                        ...prev,
                                        selectedMachines: prev.selectedMachines.filter((_, i) => i !== index)
                                      }));
                                    }}
                                    className="w-7 h-7 rounded-full bg-red-100 hover:bg-red-200 flex items-center justify-center text-red-600 transition-colors ml-3 flex-shrink-0"
                                    title="Remove equipment"
                                  >
                                    ×
                                  </button>
                                </div>
                                
                                {/* Controls Row */}
                                <div className="grid grid-cols-3 gap-4">
                                  {/* Quantity */}
                                  <div className="space-y-2">
                                    <label className="block text-xs font-medium text-gray-700 uppercase tracking-wider">
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
                                        className="w-7 h-7 rounded bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-600 transition-colors text-sm font-medium"
                                      >
                                        -
                                      </button>
                                      <input
                                        type="number"
                                        value={machine.quantity}
                                        onChange={(e) => {
                                          const quantity = Math.max(1, parseInt(e.target.value) || 1);
                                          setFormData(prev => ({
                                            ...prev,
                                            selectedMachines: prev.selectedMachines.map((m, i) => 
                                              i === index ? { ...m, quantity } : m
                                            )
                                          }));
                                        }}
                                        className="w-12 text-center text-sm font-medium border border-gray-300 rounded px-1 py-1 focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                                        min="1"
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
                                        className="w-7 h-7 rounded bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-600 transition-colors text-sm font-medium"
                                      >
                                        +
                                      </button>
                                    </div>
                                  </div>

                                  {/* Rate */}
                                  <div className="space-y-2">
                                    <label className="block text-xs font-medium text-gray-700 uppercase tracking-wider">
                                      Rate{getRateUnit(formData.orderType)}
                                    </label>
                                    <div className="relative">
                                      <span className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-500 text-xs">₹</span>
                                      <input
                                        type="number"
                                        value={machine.baseRate}
                                        onChange={(e) => {
                                          const baseRate = Math.max(0, parseFloat(e.target.value) || 0);
                                          setFormData(prev => ({
                                            ...prev,
                                            selectedMachines: prev.selectedMachines.map((m, i) => 
                                              i === index ? { ...m, baseRate } : m
                                            )
                                          }));
                                        }}
                                        className="w-full pl-6 pr-2 py-1 border border-gray-300 rounded text-sm focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                                        min="0"
                                        step="100"
                                        placeholder="0"
                                      />
                                    </div>
                                    <div className="text-xs text-gray-500">
                                      Default: {formatCurrency(machine.baseRates?.[formData.orderType] || 0)}
                                    </div>
                                  </div>

                                  {/* Subtotal */}
                                  <div className="space-y-2">
                                    <label className="block text-xs font-medium text-gray-700 uppercase tracking-wider">
                                      Subtotal
                                    </label>
                                    <div className="bg-blue-50 border border-blue-200 rounded px-3 py-2">
                                      <div className="font-bold text-blue-700 text-sm">
                                        {formatCurrency(machine.baseRate * machine.quantity)}
                                      </div>
                                      <div className="text-xs text-blue-600">
                                        {machine.quantity} × {formatCurrency(machine.baseRate)}
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                          
                          {/* Total Section */}
                          <div className="bg-gradient-to-r from-blue-50 to-blue-100 border border-blue-200 rounded-lg p-4">
                            <div className="flex justify-between items-center">
                              <span className="font-semibold text-gray-900">Total Equipment Cost:</span>
                              <span className="text-xl font-bold text-blue-700">
                                {formatCurrency(
                                  formData.selectedMachines.reduce((total, machine) => 
                                    total + (machine.baseRate * machine.quantity), 0
                                  )
                                )}{getRateUnit(formData.orderType)}
                              </span>
                            </div>
                          </div>
                        </div>
                      )}
                    </>
                  )}
                  {formData.machineType && availableEquipment.length === 0 && (
                    <div className="text-gray-500 text-sm italic">
                      No equipment available for this type
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card className="shadow-sm">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base font-medium flex items-center gap-2">
                    <Settings className="w-4 h-4 text-gray-500" />
                    Configuration
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-0 space-y-3">
                  <Select
                    label="Shift Type"
                    value={formData.shift}
                    onChange={(value: string) => setFormData(prev => ({ ...prev, shift: value as 'single' | 'double' }))}
                    options={SHIFT_OPTIONS}
                  />
                  <Select
                    label="Time"
                    value={formData.dayNight}
                    onChange={(value: string) => setFormData(prev => ({ ...prev, dayNight: value as 'day' | 'night' }))}
                    options={TIME_OPTIONS}
                  />
                </CardContent>
              </Card>
            </div>

            {/* Resources & Costs Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <Card className="shadow-sm">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base font-medium flex items-center gap-2">
                    <Users className="w-4 h-4 text-gray-500" />
                    Food & Accommodation
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-0 space-y-3">
                  <FormInput
                    type="number"
                    label="Food Resources"
                    value={formData.foodResources || ''}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                      setFormData(prev => ({ ...prev, foodResources: Number(e.target.value) || 0 }));
                    }}
                    min="0"
                    placeholder="Number of people"
                  />
                  <FormInput
                    type="number"
                    label="Accommodation Resources"
                    value={formData.accomResources || ''}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                      setFormData(prev => ({ ...prev, accomResources: Number(e.target.value) || 0 }));
                    }}
                    min="0"
                    placeholder="Number of people"
                  />
                </CardContent>
              </Card>

              <Card className="shadow-sm">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base font-medium flex items-center gap-2">
                    <Truck className="w-4 h-4 text-gray-500" />
                    Transport & Site
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-0 space-y-3">
                  <FormInput
                    type="number"
                    label="Site Distance (km)"
                    value={formData.siteDistance || ''}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                      setFormData(prev => ({ ...prev, siteDistance: Number(e.target.value) || 0 }));
                    }}
                    min="0"
                    placeholder="Distance in km"
                  />
                  <FormInput
                    type="number"
                    label="Mob Relaxation"
                    value={formData.mobRelaxation || ''}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                      setFormData(prev => ({ ...prev, mobRelaxation: Number(e.target.value) || 0 }));
                    }}
                    min="0"
                    placeholder="₹0"
                  />
                  
                  <div className="grid grid-cols-2 gap-2">
                    <Select
                      label="Usage"
                      value={formData.usage}
                      onChange={(value: string) => {
                        setFormData(prev => ({ ...prev, usage: value as 'normal' | 'medium' | 'heavy' }));
                        // Trigger recalculation when usage changes
                        setTimeout(() => calculateQuotation(), 100);
                      }}
                      options={USAGE_OPTIONS}
                    />
                    <Select
                      label="Risk Level"
                      value={formData.riskFactor}
                      onChange={(value: string) => {
                        setFormData(prev => ({ ...prev, riskFactor: value as 'low' | 'medium' | 'high' }));
                        // Trigger recalculation when risk factor changes
                        setTimeout(() => calculateQuotation(), 100);
                      }}
                      options={RISK_LEVELS}
                    />
                  </div>
                  
                  <Select
                    label="Sunday Working"
                    value={formData.sundayWorking}
                    onChange={(value: string) => setFormData(prev => ({ ...prev, sundayWorking: value as 'yes' | 'no' }))}
                    options={[
                      { value: 'no', label: 'No' },
                      { value: 'yes', label: 'Yes' }
                    ]}
                  />
                </CardContent>
              </Card>
            </div>

            {/* Additional Charges Row */}
            <Card className="shadow-sm mb-6">
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-medium flex items-center gap-2">
                  <IndianRupee className="w-4 h-4 text-gray-500" />
                  Additional Charges
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <FormInput
                    type="number"
                    label="Extra Commercial Charges"
                    value={formData.extraCharge || ''}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                      setFormData(prev => ({ ...prev, extraCharge: Number(e.target.value) || 0 }));
                    }}
                    min="0"
                    placeholder="₹0"
                  />
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Incidental Charges</label>
                    <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                      {additionalParams?.incidentalOptions?.map(option => {
                        const isSelected = formData.incidentalCharges.includes(option.value);
                        const customAmountKey = option.value as 'incident1' | 'incident2' | 'incident3';
                        const customAmount = formData.customIncidentAmounts?.[customAmountKey];
                        const displayAmount = customAmount ?? option.amount;
                        
                        return (
                          <div key={option.value} className={`rounded-md border-2 p-3 transition-all duration-200 ${
                            isSelected ? 'border-blue-200 bg-blue-50' : 'border-gray-200 bg-white hover:border-gray-300'
                          }`}>
                            <div className="flex items-center justify-between">
                              <label className="flex items-center cursor-pointer flex-1">
                                <input
                                  type="checkbox"
                                  checked={isSelected}
                                  onChange={(e) => {
                                    if (e.target.checked) {
                                      setFormData(prev => ({
                                        ...prev,
                                        incidentalCharges: [...prev.incidentalCharges, option.value]
                                      }));
                                    } else {
                                      setFormData(prev => ({
                                        ...prev,
                                        incidentalCharges: prev.incidentalCharges.filter(val => val !== option.value)
                                      }));
                                    }
                                  }}
                                  className="mr-3 h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                />
                                <div className="flex-1">
                                  <div className="text-sm font-medium text-gray-900">
                                    {option.label.split(' - ')[0]}
                                  </div>
                                  <div className="text-xs text-gray-500">
                                    Default: ₹{option.amount?.toLocaleString('en-IN')}
                                  </div>
                                </div>
                              </label>
                              
                              {isSelected && (
                                <div className="ml-4 flex items-center gap-2">
                                  <span className="text-xs text-gray-600 whitespace-nowrap">Custom:</span>
                                  <input
                                    type="number"
                                    value={customAmount ?? ''}
                                    onChange={(e) => {
                                      const value = e.target.value === '' ? null : Number(e.target.value);
                                      setFormData(prev => ({
                                        ...prev,
                                        customIncidentAmounts: {
                                          ...prev.customIncidentAmounts,
                                          [customAmountKey]: value
                                        }
                                      }));
                                    }}
                                    placeholder={`${option.amount}`}
                                    className="w-24 px-2 py-1 text-xs border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                                    min="0"
                                  />
                                </div>
                              )}
                            </div>
                            
                            {isSelected && (
                              <div className="mt-2 pt-2 border-t border-gray-200">
                                <div className="text-xs font-medium text-blue-700">
                                  Amount Applied: ₹{displayAmount?.toLocaleString('en-IN')}
                                  {customAmount && customAmount !== option.amount && (
                                    <span className="ml-1 text-green-600">(Custom)</span>
                                  )}
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Other Factors</label>
                    <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                      {OTHER_FACTORS.map(factor => {
                        const isSelected = formData.otherFactors.includes(factor.value);
                        const isRigger = factor.value === 'rigger';
                        const isHelper = factor.value === 'helper';
                        const defaultAmount = isRigger ? additionalParams?.riggerAmount : 
                                            isHelper ? additionalParams?.helperAmount : null;
                        const customAmount = isRigger ? formData.customRiggerAmount : 
                                           isHelper ? formData.customHelperAmount : null;
                        const displayAmount = customAmount ?? defaultAmount;
                        
                        return (
                          <div key={factor.value} className={`rounded-md border-2 p-3 transition-all duration-200 ${
                            isSelected ? 'border-green-200 bg-green-50' : 'border-gray-200 bg-white hover:border-gray-300'
                          }`}>
                            <div className="flex items-center justify-between">
                              <label className="flex items-center cursor-pointer flex-1">
                                <input
                                  type="checkbox"
                                  checked={isSelected}
                                  onChange={(e) => {
                                    if (e.target.checked) {
                                      setFormData(prev => ({
                                        ...prev,
                                        otherFactors: [...prev.otherFactors, factor.value]
                                      }));
                                    } else {
                                      setFormData(prev => ({
                                        ...prev,
                                        otherFactors: prev.otherFactors.filter(val => val !== factor.value)
                                      }));
                                    }
                                  }}
                                  className="mr-3 h-4 w-4 rounded border-gray-300 text-green-600 focus:ring-green-500"
                                />
                                <div className="flex-1">
                                  <div className="text-sm font-medium text-gray-900">
                                    {factor.label}
                                  </div>
                                  {(isRigger || isHelper) && defaultAmount && (
                                    <div className="text-xs text-gray-500">
                                      Default: ₹{defaultAmount?.toLocaleString('en-IN')}
                                    </div>
                                  )}
                                </div>
                              </label>
                              
                              {isSelected && (isRigger || isHelper) && (
                                <div className="ml-4 flex items-center gap-2">
                                  <span className="text-xs text-gray-600 whitespace-nowrap">Custom:</span>
                                  <input
                                    type="number"
                                    value={customAmount ?? ''}
                                    onChange={(e) => {
                                      const value = e.target.value === '' ? null : Number(e.target.value);
                                      if (isRigger) {
                                        setFormData(prev => ({
                                          ...prev,
                                          customRiggerAmount: value
                                        }));
                                      } else {
                                        setFormData(prev => ({
                                          ...prev,
                                          customHelperAmount: value
                                        }));
                                      }
                                    }}
                                    placeholder={`${defaultAmount}`}
                                    className="w-24 px-2 py-1 text-xs border border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500"
                                    min="0"
                                  />
                                </div>
                              )}
                            </div>
                            
                            {isSelected && (isRigger || isHelper) && displayAmount && (
                              <div className="mt-2 pt-2 border-t border-gray-200">
                                <div className="text-xs font-medium text-green-700">
                                  Amount Applied: ₹{displayAmount?.toLocaleString('en-IN')}
                                  {customAmount && customAmount !== defaultAmount && (
                                    <span className="ml-1 text-blue-600">(Custom)</span>
                                  )}
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>


                </div>
              </CardContent>
            </Card>

          </div>

          {/* Right Column - Summary */}
          <div className="w-full xl:w-[400px] flex-shrink-0">
            <div className="sticky top-6">
              <Card className="shadow-xl border border-gray-200 bg-white">
                <CardHeader className="border-b border-gray-100 pb-4 bg-gradient-to-r from-blue-50 to-white">
                  <CardTitle className="text-lg font-bold flex items-center gap-2 text-blue-800">
                    <Calculator className="w-5 h-5 text-blue-600" />
                    <span>Quotation Summary</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-4">
                  <QuotationSummary calculations={calculations} formData={formData} additionalParams={additionalParams} />
                  <div className="mt-4">
                    <label className="flex items-start gap-3 p-3 rounded-lg bg-gray-50 cursor-pointer hover:bg-gray-100 transition-colors duration-200">
                      <input
                        type="checkbox"
                        checked={formData.includeGst}
                        onChange={(e) => setFormData(prev => ({ 
                          ...prev, 
                          includeGst: e.target.checked 
                        }))}
                        className="mt-1 h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <div>
                        <div className="font-medium text-gray-900">Include GST</div>
                        <div className="text-sm text-gray-600">
                          GST will be calculated at 18% of the total amount
                        </div>
                      </div>
                    </label>
                  </div>

                  {/* Action Buttons - Moved below QuotationSummary */}
                  <div className="flex flex-col gap-3 mt-6 pt-4 border-t border-gray-100">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => navigate('/quotations')}
                      className="w-full border-gray-300 text-gray-700 hover:bg-gray-50 hover:text-gray-900 hover:border-gray-400"
                    >
                      Cancel
                    </Button>
                    <Button 
                      type="submit"
                      disabled={isSaving || (formData.selectedMachines.length === 0 && !formData.selectedEquipment.id)}
                      className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold shadow-lg hover:shadow-xl"
                      leftIcon={isSaving ? <Clock className="animate-spin" /> : <Save />}
                      variant="default"
                    >
                      {isSaving ? 'Saving...' : quotationId ? 'Update Quotation' : 'Create Quotation'}
                    </Button>
                    {formData.selectedMachines.length === 0 && !formData.selectedEquipment.id && (
                      <div className="text-xs text-center text-amber-600">
                        Please add at least one machine
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </form>

      {/* Toast Notifications */}
      {toast.show && (
        <Toast
          title={toast.title}
          description={toast.description}
          variant={toast.variant}
          isVisible={toast.show}
          onClose={() => setToast({ show: false, title: '' })}
        />
      )}
    </div>
  );
}
