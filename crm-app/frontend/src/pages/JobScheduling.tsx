import React, { useState, useEffect } from 'react';
import { 
  ChevronLeft,
  ChevronRight,
  Plus,
} from 'lucide-react';
import { format, addDays, startOfWeek, endOfWeek, eachDayOfInterval, addHours, isSameDay, isWithinInterval } from 'date-fns';
import { Card, CardContent } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { Input } from '../components/common/Input';
import { Select } from '../components/common/Select';
import { TextArea } from '../components/common/TextArea';
import { Modal } from '../components/common/Modal';
import { StatusBadge } from '../components/common/StatusBadge';
import { Toast } from '../components/common/Toast';
import { useAuthStore } from '../store/authStore';
import { getJobs, getAllEquipment, getAllOperators, createJob, getEquipmentById, getLeadsWithWonDeals } from '../services/job';
import { getDealById } from '../services/deal';
import { getQuotationsForLead } from '../services/quotation';
import { Job, Equipment, Operator } from '../types/job';
import { useLocation, useNavigate } from 'react-router-dom';
import { jobApiClient } from '../services/job';

const TIME_SLOTS = Array.from({ length: 15 }, (_, i) => addHours(new Date().setHours(6, 0, 0, 0), i));

export function JobScheduling() {
  const { user } = useAuthStore();
  const [view, setView] = useState<'week' | 'month'>('week');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [jobs, setJobs] = useState<Job[]>([]);
  const [equipment, setEquipment] = useState<Equipment[]>([]);
  const [operators, setOperators] = useState<Operator[]>([]);  const [leads, setLeads] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [wonDealId, setWonDealId] = useState<string | null>(null);
  const [wonDealCustomerName, setWonDealCustomerName] = useState<string | null>(null);
  const [dealEquipment, setDealEquipment] = useState<Equipment[]>([]);
  const [isLoadingEquipment, setIsLoadingEquipment] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const [toast, setToast] = useState<{
    show: boolean;
    title: string;
    description?: string;
    variant?: 'success' | 'error' | 'warning';
  }>({ show: false, title: '' });

  const [formData, setFormData] = useState({
    leadId: '',
    equipmentId: '',
    operatorId: '',
    startDate: '',
    endDate: '',
    location: '',
    notes: '',
  });

  const [operatorFilter, setOperatorFilter] = useState<string>(''); // '' means all operators

  useEffect(() => {
    fetchData();
    
    // Check for URL parameters indicating a won deal
    const params = new URLSearchParams(location.search);
    const dealId = params.get('dealId');
    const action = params.get('action');
    const customerName = params.get('customerName');
    
    if (dealId && action === 'schedule') {
      setWonDealId(dealId);
      if (customerName) {
        const decodedName = decodeURIComponent(customerName);
        setWonDealCustomerName(decodedName);
        
        // Check the definition of showToast to see what parameters it accepts
        setToast({
          show: true,
          title: `Deal won with ${decodedName}!`,
          variant: 'success',
          description: 'Please schedule a job for this customer using the form.'
        });
      }
      
      // Fetch deal data and populate form
      handleOpenFromDeal(dealId);
      
      // Clear the URL parameters
      navigate('/jobs', { replace: true });
    }
  }, [location]);

  // Reset operator selection if the selected operator becomes unavailable when dates change
  useEffect(() => {
    if (formData.operatorId && formData.startDate && formData.endDate) {
      const availableOperators = getAvailableOperators();
      const isSelectedOperatorAvailable = availableOperators.some(op => op.id === formData.operatorId);
      
      if (!isSelectedOperatorAvailable) {
        setFormData(prev => ({ ...prev, operatorId: '' }));
      }
    }
  }, [formData.startDate, formData.endDate, jobs]);

  const fetchData = async () => {
    try {
      console.log('🔄 Fetching job scheduling data...');
      
      const [jobsData, equipmentData, operatorsData, leadsData] = await Promise.all([
        getJobs(),
        getAllEquipment(),
        getAllOperators(),
        getLeadsWithWonDeals(), // Use the new dedicated endpoint
      ]);

      console.log('📊 Data fetched:', {
        jobs: jobsData?.length || 0,
        equipment: equipmentData?.length || 0,
        operators: operatorsData?.length || 0,
        leads: leadsData?.length || 0
      });

      setJobs(jobsData || []);
      setEquipment(equipmentData || []);
      setOperators(operatorsData || []);
      setLeads(leadsData || []);
      
      // If we have a won deal ID from URL parameters, fetch deal details
      if (wonDealId) {
        try {
          const dealData = await getDealById(wonDealId);
          if (dealData) {
            // Set form data based on won deal
            setFormData(prevData => ({
              ...prevData,
              leadId: dealData.leadId || '',
              location: dealData.customer?.address || '',
              notes: dealData.description || '',
            }));
            
            // Set today's date as default start date and add 7 days for end date
            const today = new Date();
            const nextWeek = new Date();
            nextWeek.setDate(today.getDate() + 7);
            
            setFormData(prevData => ({
              ...prevData,
              startDate: today.toISOString().slice(0, 16), // Include time component
              endDate: nextWeek.toISOString().slice(0, 16) // Include time component
            }));
          }
        } catch (dealError) {
          console.error('Error fetching deal data:', dealError);
        }
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      showToast('Error fetching data', 'error');
    } finally {
      setIsLoading(false);
    }
  };
  const handleOpenFromDeal = async (dealId: string) => {
    try {
      const deal = await getDealById(dealId);

      if (deal) {
        // Set today's date as default start date and add 7 days for end date
        const today = new Date();
        const nextWeek = new Date();
        nextWeek.setDate(today.getDate() + 7);
        
        const formattedStartDate = today.toISOString().slice(0, 16);
        const formattedEndDate = nextWeek.toISOString().slice(0, 16);

        // Set the won deal ID to associate it with the job
        setWonDealId(dealId);
        
        // Set the customer name from the deal
        if (deal.customer?.name) {
          setWonDealCustomerName(deal.customer.name);
        }
          // Fetch quotations associated with this deal's lead ID
        setIsLoadingEquipment(true);
        try {
          const quotations = await getQuotationsForLead(deal.leadId);
          
          if (quotations && quotations.length > 0) {
            // Extract equipment from quotations
            const dealSpecificEquipment: Equipment[] = [];
            
            // Process all quotations to get their equipment
            quotations.forEach(quotation => {
              // Handle single equipment
              if (quotation.selectedEquipment && quotation.selectedEquipment.equipmentId) {
                // Find the equipment in the global equipment list
                const existingEquipment = equipment.find(e => e.id === quotation.selectedEquipment.equipmentId);
                
                if (existingEquipment && !dealSpecificEquipment.some(e => e.id === existingEquipment.id)) {
                  dealSpecificEquipment.push(existingEquipment);
                }
              }
              
              // Handle multiple machines if available
              if (quotation.selectedMachines && quotation.selectedMachines.length > 0) {
                quotation.selectedMachines.forEach((machine: any) => {
                  if (machine.equipmentId) {
                    const existingEquipment = equipment.find(e => e.id === machine.equipmentId);
                    
                    if (existingEquipment && !dealSpecificEquipment.some(e => e.id === existingEquipment.id)) {
                      dealSpecificEquipment.push(existingEquipment);
                    }
                  }
                });
              }
            });
            
            // Update the deal equipment state
            setDealEquipment(dealSpecificEquipment);
            
            // Auto-select the first equipment if available
            if (dealSpecificEquipment.length > 0) {
              setFormData({
                leadId: deal.leadId,
                equipmentId: dealSpecificEquipment[0].id, // Pre-select the first equipment
                operatorId: '',
                startDate: formattedStartDate,
                endDate: formattedEndDate,
                location: deal.customer?.address || '',
                notes: deal.description || '',
              });
            } else {
              setFormData({
                leadId: deal.leadId,
                equipmentId: '',
                operatorId: '',
                startDate: formattedStartDate,
                endDate: formattedEndDate,
                location: deal.customer?.address || '',
                notes: deal.description || '',
              });
            }
          } else {
            // No quotations found, proceed without equipment pre-selection
            setFormData({
              leadId: deal.leadId,
              equipmentId: '',
              operatorId: '',
              startDate: formattedStartDate,
              endDate: formattedEndDate,
              location: deal.customer?.address || '',
              notes: deal.description || '',
            });
          }        } catch (quotationError) {
          console.error('Error fetching quotations:', quotationError);
            // Continue without equipment pre-selection
          setFormData({
            leadId: deal.leadId,
            equipmentId: '',
            operatorId: '',
            startDate: formattedStartDate,
            endDate: formattedEndDate,
            location: deal.customer?.address || '',
            notes: deal.description || '',
          });
        } finally {
          setIsLoadingEquipment(false);
        }
        
        setIsCreateModalOpen(true);
      } else {
        showToast('Deal not found', 'error');
      }
    } catch (error) {
      console.error('Error fetching deal:', error);
      showToast('Error fetching deal', 'error');
    }
  };

  const handleCreateJob = async () => {
    try {
      // Validate required fields
      if (!formData.leadId || !formData.equipmentId || !formData.operatorId || 
          !formData.startDate || !formData.endDate || !formData.location) {
        showToast('Please fill in all required fields', 'error');
        return;
      }
      
      // Get customer name either from lead or from won deal
      let customerName = "";
      
      const lead = leads.find(l => l.id === formData.leadId);
      if (lead) {
        customerName = lead.customerName;
      } else if (wonDealCustomerName) {
        customerName = wonDealCustomerName;
      } else {
        showToast('Customer information is missing', 'error');
        return;
      }

      await createJob({
        title: 'Scheduled Job',
        leadId: formData.leadId,
        customerId: lead?.customerId || '',
        customerName,
        equipmentIds: [formData.equipmentId],
        operatorIds: [formData.operatorId],
        scheduledStartDate: formData.startDate,
        scheduledEndDate: formData.endDate,
        location: formData.location,
        status: 'scheduled',
        notes: formData.notes,
        dealId: wonDealId || undefined,
        createdBy: user?.id || '',
      });

      // Instead of setJobs, refetch all jobs from backend
      await fetchData();
      setIsCreateModalOpen(false);
      resetForm();
      
      // Clear won deal data
      setWonDealId(null);
      setWonDealCustomerName(null);
      
      showToast('Job scheduled successfully', 'success');
    } catch (error) {
      console.error('Error creating job:', error);
      showToast('Error creating job', 'error');
    }
  };

  const resetForm = () => {
    setFormData({
      leadId: '',
      equipmentId: '',
      operatorId: '',
      startDate: '',
      endDate: '',
      location: '',
      notes: '',
    });
    // Reset deal equipment as well
    setDealEquipment([]);
  };

  const showToast = (title: string, variant: 'success' | 'error' | 'warning' = 'success') => {
    setToast({ show: true, title, variant });
    setTimeout(() => setToast({ show: false, title: '' }), 3000);
  };

  const checkAvailability = (equipmentId: string, operatorId: string, startDate: string, endDate: string) => {
    const conflictingJobs = jobs.filter(job => {
      const jobStart = new Date(job.scheduledStartDate);
      const jobEnd = new Date(job.scheduledEndDate);
      const newStart = new Date(startDate);
      const newEnd = new Date(endDate);

      return (
        (job.equipmentIds.includes(equipmentId) || job.operatorIds.includes(operatorId)) &&
        job.status !== 'completed' &&
        job.status !== 'cancelled' &&
        ((newStart >= jobStart && newStart < jobEnd) ||
          (newEnd > jobStart && newEnd <= jobEnd) ||
          (newStart <= jobStart && newEnd >= jobEnd))
      );
    });

    return conflictingJobs;
  };

  // Get available operators for the selected time slot
  const getAvailableOperators = () => {
    if (!formData.startDate || !formData.endDate) {
      return operators; // Return all operators if no time selected
    }

    const start = new Date(formData.startDate);
    const end = new Date(formData.endDate);

    return operators.filter(operator => {
      const conflictingJobs = jobs.filter(job => {
        const jobStart = new Date(job.scheduledStartDate);
        const jobEnd = new Date(job.scheduledEndDate);
        
        return (
          job.operatorIds.includes(operator.id) &&
          job.status !== 'completed' &&
          job.status !== 'cancelled' &&
          ((start >= jobStart && start < jobEnd) || (end > jobStart && end <= jobEnd) || (start <= jobStart && end >= jobEnd))
        );
      });

      return conflictingJobs.length === 0;
    });
  };

  const renderWeekView = () => {
    const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 });
    const weekEnd = endOfWeek(currentDate, { weekStartsOn: 1 });
    const days = eachDayOfInterval({ start: weekStart, end: weekEnd });

    return (
      <div className="relative">
        <div className="grid grid-cols-[100px_1fr] gap-4">
          <div className="sticky left-0 bg-white z-10">
            <div className="h-12" />
            {TIME_SLOTS.map((time, i) => (
              <div
                key={i}
                className="h-20 border-b border-gray-100 flex items-center justify-end pr-2 text-sm text-gray-900"
              >
                {format(time, 'h:mm a')}
              </div>
            ))}
          </div>

          <div className="overflow-x-auto">
            <div className="grid grid-cols-7 min-w-[900px]">
              {days.map((day, i) => (
                <div
                  key={i}
                  className="h-12 flex items-center justify-center border-b border-gray-200 font-medium"
                >
                  <div className="text-center">
                    <div className="text-sm text-gray-900">{format(day, 'EEE')}</div>
                    <div className="text-xs text-gray-700">{format(day, 'MMM d')}</div>
                  </div>
                </div>
              ))}

              {TIME_SLOTS.map((time, timeIndex) => (
                <React.Fragment key={timeIndex}>
                  {days.map((day, dayIndex) => {
                    const currentSlotStart = new Date(day.setHours(time.getHours(), time.getMinutes()));
                    // Calculate slot end time for future use if needed
                    // const currentSlotEnd = addHours(currentSlotStart, 1);

                    const slotJobs = jobs.filter(job => {
                      const jobStart = new Date(job.scheduledStartDate);
                      const jobEnd = new Date(job.scheduledEndDate);
                      const matchesOperator = !operatorFilter || job.operatorIds.includes(operatorFilter);
                      return (
                        matchesOperator &&
                        isSameDay(currentSlotStart, jobStart) &&
                        isWithinInterval(currentSlotStart, { start: jobStart, end: jobEnd })
                      );
                    });

                    return (
                      <div
                        key={`${timeIndex}-${dayIndex}`}
                        className={`border-b border-r border-gray-100 relative ${
                          timeIndex === 0 ? 'border-t' : ''
                        } ${dayIndex === 0 ? 'border-l' : ''}`}
                        style={{
                          minHeight: `${Math.max(80, slotJobs.length * 44 + 8)}px`, // Dynamic height based on number of jobs
                        }}
                        onClick={() => {
                          setIsCreateModalOpen(true);
                          setFormData(prev => ({
                            ...prev,
                            startDate: currentSlotStart.toISOString().slice(0, 16),
                            endDate: addHours(currentSlotStart, 2).toISOString().slice(0, 16),
                          }));
                        }}
                      >
                        {slotJobs.map((job, jobIndex) => (
                          <div
                            key={job.id}
                            className="absolute inset-x-0 mx-1 bg-primary-100 border border-primary-200 rounded-md p-2 cursor-pointer hover:bg-primary-200 transition-colors"
                            style={{
                              top: `${4 + (jobIndex * 44)}px`, // Stack jobs vertically with 44px offset
                              minHeight: '40px',
                              zIndex: 10 + jobIndex,
                              right: jobIndex > 0 ? `${jobIndex * 8}px` : '4px', // Slight horizontal offset for visibility
                            }}
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedJob(job);
                            }}
                          >
                            <div className="flex items-center justify-between">
                              <span className="font-medium text-sm truncate">
                                {job.customerName}
                              </span>
                              <StatusBadge status={job.status as any} className="ml-2" />
                            </div>
                            <div className="text-xs text-black mt-1">
                              {/* Use scheduledStartDate and scheduledEndDate for display */}
                              {format(new Date(job.scheduledStartDate), 'h:mm a')} - {format(new Date(job.scheduledEndDate), 'h:mm a')}
                            </div>
                          </div>
                        ))}
                      </div>
                    );
                  })}
                </React.Fragment>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  };

  if (!user || (user.role !== 'operations_manager' && user.role !== 'admin')) {
    return (
      <div className="p-4 text-center text-gray-500">
        You don't have permission to access this page.
      </div>
    );
  }

  // Show loading state while data is being fetched
  if (isLoading) {
    return (
      <div className="p-8 text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-gray-900">Loading job scheduling data...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 font-sans">
      <div className="flex flex-wrap items-center mb-2 justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentDate(prev => addDays(prev, -7))}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <h2 className="text-lg font-semibold font-sans">
            {format(currentDate, 'MMMM yyyy')}
          </h2>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentDate(prev => addDays(prev, 7))}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
        <div className="flex items-center gap-2 flex-1 justify-end min-w-0">
          <Select
            options={[{ value: 'week', label: 'Week View' }, { value: 'month', label: 'Month View' }]}
            value={view}
            onChange={(value: string) => setView(value as 'week' | 'month')}
            className="w-24 min-w-0"
          />
          <Select
            label="Operator"
            options={[
              { value: '', label: 'All Operators' },
              ...operators.map(op => ({ value: op.id, label: op.name }))
            ]}
            value={operatorFilter}
            onChange={setOperatorFilter}
            className="w-32 min-w-0"
          />
          <Button
            size="lg"
            className="ml-2 font-bold px-6 py-2"
            onClick={() => {
              if (leads.length === 0) {
                setToast({
                  show: true,
                  title: 'No Won Deals Available',
                  variant: 'warning',
                  description: 'You need to have at least one won deal before scheduling a job.'
                });
              } else {
                setIsCreateModalOpen(true);
              }
            }}
            leftIcon={<Plus size={20} />}
          >
            New Job
          </Button>
        </div>
      </div>
      <Card>
        <CardContent className="p-6">
          <div className="mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Job Schedule</h3>
          </div>
          {isLoading ? (
            <div className="text-center py-4">Loading schedule...</div>
          ) : leads.length === 0 ? (
            <div className="text-center py-12 bg-gray-50 rounded-lg">
              <h3 className="text-lg font-medium text-gray-900 mb-2 font-sans">No Won Deals Yet</h3>
              <p className="text-gray-700 font-sans">
                Jobs can only be scheduled for deals that have been marked as "won". 
                Return to the Deals page and move a deal to the "won" stage first.
              </p>
            </div>
          ) : (
            renderWeekView()
          )}
        </CardContent>
      </Card>

      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => {
          setIsCreateModalOpen(false);
          resetForm();
        }}
        title={wonDealId ? `Schedule Job for Won Deal: ${wonDealCustomerName || ''}` : "Schedule Job for Won Deal"}
        size="lg"
      >
        <div className="space-y-6">
          {/* Display won deal notice at the top */}
          {wonDealId && (
            <div className="bg-green-50 border border-green-200 p-4 rounded-md mb-4">
              <h4 className="font-medium mb-2 text-green-800">Creating Job from Won Deal</h4>
              <p className="text-green-700">
                <span className="font-medium">Customer:</span> {wonDealCustomerName || 'Unknown customer'}
              </p>
              <p className="text-green-700 text-sm mt-2">
                Please select equipment, operators, and schedule dates for this job.
              </p>
            </div>
          )}
          
          <Select
            label="Select Customer (Won Deals)"
            options={[
              { value: '', label: '-- Select a customer with a won deal --' },
              ...(Array.isArray(leads) ? leads.map(lead => ({
                value: lead.id,
                label: `${lead.companyName || lead.contactName || 'Unknown Company'} - Won Deal (₹${lead.dealValue?.toLocaleString() || '0'})`,
              })) : [])
            ]}
            value={formData.leadId}
            onChange={(value: string) => {
              setFormData(prev => ({ ...prev, leadId: value }));
                // When lead selection changes, try to load associated equipment
              if (value) {
                const loadEquipmentFromLead = async () => {
                  setIsLoadingEquipment(true);
                  try {
                    const quotations = await getQuotationsForLead(value);
                    if (quotations && quotations.length > 0) {
                      const leadSpecificEquipment: Equipment[] = [];
                      
                      quotations.forEach(quotation => {
                        // Handle single equipment
                        if (quotation.selectedEquipment && quotation.selectedEquipment.equipmentId) {
                          const existingEquipment = equipment.find(e => e.id === quotation.selectedEquipment.equipmentId);
                          
                          if (existingEquipment && !leadSpecificEquipment.some(e => e.id === existingEquipment.id)) {
                            leadSpecificEquipment.push(existingEquipment);
                          }
                        }
                        
                        // Handle multiple machines
                        if (quotation.selectedMachines && quotation.selectedMachines.length > 0) {
                          quotation.selectedMachines.forEach((machine: any) => {
                            if (machine.equipmentId) {
                              const existingEquipment = equipment.find(e => e.id === machine.equipmentId);
                              
                              if (existingEquipment && !leadSpecificEquipment.some(e => e.id === existingEquipment.id)) {
                                leadSpecificEquipment.push(existingEquipment);
                              }
                            }
                          });
                        }
                      });
                      
                      setDealEquipment(leadSpecificEquipment);
                      
                      // Auto-select the first equipment if available
                      if (leadSpecificEquipment.length > 0) {
                        setFormData(prev => ({
                          ...prev,
                          equipmentId: leadSpecificEquipment[0].id
                        }));
                      }
                    }                  } catch (error) {
                    console.error('Error loading equipment for lead:', error);
                  } finally {
                    setIsLoadingEquipment(false);
                  }
                };
                
                loadEquipmentFromLead();
              } else {
                // Reset equipment selection if no lead is selected
                setDealEquipment([]);
                setFormData(prev => ({
                  ...prev,
                  equipmentId: ''
                }));
              }
            }}
            required
            className="text-black"
          />

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Select
              label="Equipment"
              options={
                // If we have deal-specific equipment and a wonDealId, use that equipment list
                (dealEquipment.length > 0 && wonDealId) 
                ? [
                    { value: '', label: '-- Select deal-specific equipment --' },
                    ...(Array.isArray(dealEquipment) ? dealEquipment.map(item => ({
                      value: item.id,
                      label: `${item.name} (From Deal)`,
                    })) : [])
                  ] 
                : [
                    { value: '', label: '-- Select equipment --' },
                    ...(Array.isArray(equipment) ? equipment.map(item => ({
                      value: item.id,
                      label: item.name,
                    })) : [])
                  ]
              }
              value={formData.equipmentId}
              onChange={(value: string) => setFormData(prev => ({ ...prev, equipmentId: value }))}
              required
              className="text-black"
            />
                {/* Information about equipment selection */}
              {isLoadingEquipment ? (
                <p className="mt-1 text-xs text-blue-600">
                  Loading equipment from quotations...
                </p>
              ) : dealEquipment.length > 0 ? (
                <p className="mt-1 text-xs text-green-600">
                  {dealEquipment.length} equipment item{dealEquipment.length !== 1 ? 's' : ''} from deal quotation{dealEquipment.length !== 1 ? 's' : ''}
                </p>
              ) : formData.leadId ? (
                <p className="mt-1 text-xs text-gray-500">
                  No specific equipment found in deal quotations
                </p>
              ) : null}
            </div>

            <Select
              label="Operator"
              options={[
                { value: '', label: '-- Select operator --' },
                ...getAvailableOperators().map(op => ({
                  value: op.id,
                  label: op.name,
                }))
              ]}
              value={formData.operatorId}
              onChange={(value: string) => setFormData(prev => ({ ...prev, operatorId: value }))}
              required
              className="text-black"
            />
            {formData.startDate && formData.endDate && (
              <p className="mt-1 text-xs text-gray-600">
                {(() => {
                  const availableOperators = getAvailableOperators();
                  const totalOperators = operators.length;
                  const unavailableCount = totalOperators - availableOperators.length;
                  
                  if (unavailableCount === 0) {
                    return `All ${totalOperators} operators are available`;
                  } else if (availableOperators.length === 0) {
                    return `No operators available for this time slot`;
                  } else {
                    return `${availableOperators.length} of ${totalOperators} operators available (${unavailableCount} busy)`;
                  }
                })()}
              </p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Input
              type="datetime-local"
              label="Start Date & Time"
              value={formData.startDate}
              onChange={(e) => setFormData(prev => ({ ...prev, startDate: e.target.value }))}
              required
              className="text-black"
            />

            <Input
              type="datetime-local"
              label="End Date & Time"
              value={formData.endDate}
              onChange={(e) => setFormData(prev => ({ ...prev, endDate: e.target.value }))}
              required
              className="text-black"
            />
          </div>

          <Input
            label="Location"
            value={formData.location}
            onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
            required
            className="text-black"
          />

          <TextArea
            label="Notes"
            value={formData.notes}
            onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
            rows={4}
            className="text-black"
          />

          {formData.equipmentId && formData.operatorId && formData.startDate && formData.endDate && (
            <div className="bg-gray-50 p-4 rounded-md">
              <h4 className="font-medium mb-2">Availability Check</h4>
              {(() => {
                const conflicts = checkAvailability(
                  formData.equipmentId,
                  formData.operatorId,
                  formData.startDate,
                  formData.endDate
                );

                return conflicts.length > 0 ? (
                  <div className="text-error-600">
                    <p>Conflicts found:</p>
                    <ul className="list-disc list-inside text-sm">
                      {/* Use equipmentIds and operatorIds for conflict display */}
                      {conflicts.map(conflict => (
                        <li key={conflict.id}>
                          {conflict.customerName} - {format(new Date(conflict.scheduledStartDate), 'MMM d, h:mm a')}
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : (
                  <p className="text-success-600">Equipment and operator are available for the selected time slot.</p>
                );
              })()}
            </div>
          )}
        </div>

        <div className="flex justify-end gap-3 mt-6">
          <Button
            variant="outline"
            onClick={() => {
              setIsCreateModalOpen(false);
              resetForm();
            }}
          >
            Cancel
          </Button>
          <Button onClick={handleCreateJob} variant="accent">Schedule Job</Button>
        </div>
      </Modal>

      <Modal
        isOpen={!!selectedJob}
        onClose={() => setSelectedJob(null)}
        title="Job Details"
        size="lg"
      >
        {selectedJob && (
          <JobDetailsContent selectedJob={selectedJob} />
        )}
      </Modal>

      {toast.show && (
        <Toast
          title={toast.title}
          description={toast.description}
          variant={toast.variant}
          isVisible={toast.show}
          duration={3000}
          onClose={() => setToast({ show: false, title: '' })}
        />
      )}
    </div>
  );
}

// New component for Job Details modal content
function JobDetailsContent({ selectedJob }: { selectedJob: any }) {
  const [equipmentNames, setEquipmentNames] = React.useState<string>('');
  const [operatorNames, setOperatorNames] = React.useState<string>('');

  React.useEffect(() => {
    async function fetchEquipmentNames() {
      try {
        // Use API client to get job equipment mapping
        const jobEquipment = await jobApiClient.getJobEquipment(selectedJob.id);
        if (!jobEquipment || jobEquipment.length === 0) {
          setEquipmentNames('No equipment assigned');
          return;
        }
        
        const names: string[] = [];
        for (const eq of jobEquipment) {
          // eq.id is the equipment ID from job_equipment table
          const eqData = await getEquipmentById(eq.id);
          if (eqData && eqData.name) {
            names.push(eqData.name);
          }
        }
        setEquipmentNames(names.length > 0 ? names.join(', ') : 'No equipment assigned');
      } catch (error) {
        console.error('Error fetching equipment names:', error);
        setEquipmentNames('Error loading equipment');
      }
    }
    fetchEquipmentNames();
  }, [selectedJob.id]);

  React.useEffect(() => {
    async function fetchOperatorNames() {
      try {
        // Use API client to get job operators mapping
        const jobOperators = await jobApiClient.getJobOperators(selectedJob.id);
        if (!jobOperators || jobOperators.length === 0) {
          setOperatorNames('No operator assigned');
          return;
        }
        
        const names: string[] = [];
        for (const op of jobOperators) {
          // op.operator_id is the operator ID from job_operators table
          // Fetch all operators to get the name by ID
          const allOperators = await getAllOperators();
          const operatorData = allOperators.find((o: any) => o.id === op.id);
          if (operatorData && operatorData.name) {
            names.push(operatorData.name);
          }
        }
        setOperatorNames(names.length > 0 ? names.join(', ') : 'No operator assigned');
      } catch (error) {
        console.error('Error fetching operator names:', error);
        setOperatorNames('Error loading operators');
      }
    }
    fetchOperatorNames();
  }, [selectedJob.id]);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-6">
        <div>
          <h4 className="text-sm font-medium text-black">Customer</h4>
          <input
            type="text"
            className="mt-1 text-black bg-gray-100 border border-gray-300 rounded px-2 py-1 w-full"
            value={selectedJob.customerName}
            disabled
            readOnly
          />
        </div>
        <div>
          <h4 className="text-sm font-medium text-black">Status</h4>
          <input
            type="text"
            className="mt-1 text-black bg-gray-100 border border-gray-300 rounded px-2 py-1 w-full"
            value={selectedJob.status}
            disabled
            readOnly
          />
        </div>
        <div>
          <h4 className="text-sm font-medium text-black">Equipment</h4>
          <input
            type="text"
            className="mt-1 text-black bg-gray-100 border border-gray-300 rounded px-2 py-1 w-full"
            value={equipmentNames}
            disabled
            readOnly
          />
        </div>
        <div>
          <h4 className="text-sm font-medium text-black">Operator</h4>
          <input
            type="text"
            className="mt-1 text-black bg-gray-100 border border-gray-300 rounded px-2 py-1 w-full"
            value={operatorNames}
            disabled
            readOnly
          />
        </div>
        <div>
          <h4 className="text-sm font-medium text-black">Start Date</h4>
          <input
            type="text"
            className="mt-1 text-black bg-gray-100 border border-gray-300 rounded px-2 py-1 w-full"
            value={format(new Date(selectedJob.scheduledStartDate), 'MMM d, yyyy h:mm a')}
            disabled
            readOnly
          />
        </div>
        <div>
          <h4 className="text-sm font-medium text-black">End Date</h4>
          <input
            type="text"
            className="mt-1 text-black bg-gray-100 border border-gray-300 rounded px-2 py-1 w-full"
            value={format(new Date(selectedJob.scheduledEndDate), 'MMM d, yyyy h:mm a')}
            disabled
            readOnly
          />
        </div>
        <div className="col-span-2">
          <h4 className="text-sm font-medium text-black">Location</h4>
          <input
            type="text"
            className="mt-1 text-black bg-gray-100 border border-gray-300 rounded px-2 py-1 w-full"
            value={selectedJob.location}
            disabled
            readOnly
          />
        </div>
        <div className="col-span-2">
          <h4 className="text-sm font-medium text-black">Notes</h4>
          <input
            type="text"
            className="mt-1 text-black bg-gray-100 border border-gray-300 rounded px-2 py-1 w-full"
            value={selectedJob.notes || 'No notes'}
            disabled
            readOnly
          />
        </div>
      </div>
    </div>
  );
}
