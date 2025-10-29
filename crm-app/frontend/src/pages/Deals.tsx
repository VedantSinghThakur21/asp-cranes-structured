import { useState, useEffect, ReactNode } from 'react';
import type {
  DropResult,
  DroppableProvided,
  DraggableProvided,
  DraggableStateSnapshot,
} from '@hello-pangea/dnd';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { Search, Building2, MoreVertical, RefreshCw, AlertCircle } from 'lucide-react';
import { Badge } from '../components/common/Badge';
import { Button } from '../components/common/Button';
import { Input } from '../components/common/Input';
import { Toast } from '../components/common/Toast';
import { useAuthStore } from '../store/authStore';
import { Deal, DealStage } from '../types/deal';
import { getDeals, updateDealStage } from '../services/deal';
import { formatCurrency } from '../utils/formatters';
import { useNavigate } from 'react-router-dom';

// Stage configuration with colors and labels
const STAGE_CONFIGS = [
  { id: 'qualification', label: 'Qualification', color: 'bg-blue-50' },
  { id: 'proposal', label: 'Proposal', color: 'bg-yellow-50' },
  { id: 'negotiation', label: 'Negotiation', color: 'bg-purple-50' },
  { id: 'won', label: 'Won', color: 'bg-green-50' },
  { id: 'lost', label: 'Lost', color: 'bg-red-50' },
];

export function Deals() {
  const { user } = useAuthStore();
  const [deals, setDeals] = useState<Deal[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [dragInProgress, setDragInProgress] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [error, setError] = useState<Error | null>(null);
  const [toast, setToast] = useState<{
    show: boolean;
    title: string;
    variant?: 'success' | 'error' | 'warning';
    description?: string;
  }>({
    show: false,
    title: '',
  });
  const navigate = useNavigate();

  // Initial data fetch
  useEffect(() => {
    fetchDeals();
  }, []);

  // Function to fetch deals data
  const fetchDeals = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await getDeals();

      // Extract data from potentially wrapped responses
      const extractData = (response: any) => {
        if (Array.isArray(response)) {
          return response;
        } else if (
          response &&
          typeof response === 'object' &&
          response.data &&
          Array.isArray(response.data)
        ) {
          return response.data;
        } else if (
          response &&
          typeof response === 'object' &&
          response.success &&
          Array.isArray(response.data)
        ) {
          return response.data;
        }
        return [];
      };

      const data = extractData(response);

      console.log('🧪 Debug deals response:', {
        originalResponse: response,
        extractedData: data,
        isArray: Array.isArray(data),
        length: Array.isArray(data) ? data.length : 'not array',
      });

      if (!data || data.length === 0) {
        console.log('No deals returned from API or empty array');
      } else {
        console.log(`Successfully fetched ${data.length} deals`);
      }

      setDeals(data);

      // Clear any previous error toast if the fetch succeeds
      if (toast.show && toast.variant === 'error') {
        setToast({ show: false, title: '' });
      }
    } catch (error) {
      console.error('Error fetching deals:', error);

      setError(error instanceof Error ? error : new Error('Unknown error fetching deals'));

      let errorMessage = 'Please check your network connection and ensure the server is running.';
      if (error instanceof Error) {
        errorMessage += ` Error details: ${error.message}`;
      }

      showToast('Error fetching deals', 'error', errorMessage);

      // Ensure we have an empty array to prevent undefined errors
      setDeals([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Function to reset and retry when there's an error
  const resetAndRetry = () => {
    setToast({ show: false, title: '' });
    localStorage.removeItem('jwt-token');
    setTimeout(() => {
      window.location.reload();
    }, 500);
  };

  // Function to display toast messages
  const showToast = (
    title: string,
    variant: 'success' | 'error' | 'warning' = 'success',
    description?: string
  ) => {
    setToast({ show: true, title, variant, description });
    setTimeout(() => setToast({ show: false, title: '' }), 5000);
  };

  // Handle drag end event
  const handleDragEnd = async (result: DropResult) => {
    // Reset drag state
    setDragInProgress(false);

    console.log('Drag end event:', result);

    // If there's no destination or it's dropped in the same place, do nothing
    if (!result.destination) {
      console.log('No destination provided in drag result');
      return;
    }

    if (
      result.source.droppableId === result.destination.droppableId &&
      result.source.index === result.destination.index
    ) {
      console.log('Card dropped in the same location, no update needed');
      return;
    }

    const { draggableId, destination, source } = result;
    const newStage = destination.droppableId as DealStage;
    const oldStage = source.droppableId as DealStage;

    console.log(`Moving deal ${draggableId} from ${oldStage} to ${newStage}`);

    // Show pending toast
    const pendingToastMsg = `Moving deal to ${STAGE_CONFIGS.find(s => s.id === newStage)?.label || newStage}...`;
    showToast(pendingToastMsg, 'warning');

    // Save original state before making optimistic updates
    const originalDeals = [...deals];

    // Find the deal being moved
    const dealToUpdate = deals.find(d => d.id === draggableId);
    if (!dealToUpdate) {
      console.error(`Deal with ID ${draggableId} not found`);
      showToast('Error updating deal', 'error', 'Could not find the deal in the current view');
      return;
    }

    // Make an optimistic update
    const updatedDeals = deals.map(deal =>
      deal.id === draggableId ? { ...deal, stage: newStage } : deal
    );

    setDeals(updatedDeals);

    try {
      // Attempt to update the backend
      console.log(`Calling API to update deal ${draggableId} to stage ${newStage}`);
      const updatedDeal = await updateDealStage(draggableId, newStage);

      if (updatedDeal && typeof updatedDeal === 'object' && updatedDeal.id) {
        console.log('Deal updated successfully:', updatedDeal);

        // Ensure the updated deal has proper structure
        const validatedDeal = {
          ...updatedDeal,
          customer: updatedDeal.customer || {
            name: 'Unknown Customer',
            email: '',
            phone: '',
            company: '',
            address: '',
          },
        };

        // Update with actual data from server
        setDeals(prevDeals =>
          prevDeals.map(deal => (deal.id === draggableId ? validatedDeal : deal))
        );

        // Show success message
        const stageName = STAGE_CONFIGS.find(s => s.id === newStage)?.label || newStage;
        const dealTitle = validatedDeal.title || 'Deal';

        showToast(
          `Deal moved to ${stageName}`,
          'success',
          `"${dealTitle}" has been successfully moved to the ${stageName} stage.`
        );

        // Handle special case for won deals
        if (newStage === 'won') {
          handleDealWon(validatedDeal);
        }
      } else {
        // If the server returned null, revert to original state
        console.error('Server returned null for updated deal');
        setDeals(originalDeals);

        showToast(
          'Failed to update deal stage',
          'error',
          'Deal not found on the server or could not be updated'
        );
      }
    } catch (error) {
      console.error('Error updating deal stage:', error);
      console.error('Error details:', {
        dealId: draggableId,
        newStage,
        errorMessage: error instanceof Error ? error.message : 'Unknown error',
        errorStack: error instanceof Error ? error.stack : undefined,
      });

      // Revert to original state
      setDeals(originalDeals);

      // Show error message with more context
      const errorMessage =
        error instanceof Error
          ? `Error: ${error.message}`
          : 'An unknown error occurred while updating the deal';

      showToast('Error updating deal stage', 'error', errorMessage);
    }
  };

  // Function to handle drag start event
  const handleDragStart = () => {
    setDragInProgress(true);

    // Hide any active toasts when drag starts
    if (toast.show) {
      setToast({ show: false, title: '' });
    }
  };

  // Function to handle when a deal is won
  const handleDealWon = (deal: Deal) => {
    const customerName = deal.customer?.name || 'Customer';

    showToast(
      'Schedule a job for this deal',
      'success',
      `You've won the deal with ${customerName}! You'll be redirected to schedule a job.`
    );

    // Short delay before navigation to ensure the toast is seen
    setTimeout(() => {
      navigate(
        `/jobs?dealId=${deal.id}&action=schedule&customerName=${encodeURIComponent(customerName)}`
      );
    }, 1500);
  };

  // Filter deals based on search term
  const filteredDeals = Array.isArray(deals)
    ? deals.filter(deal => {
        const title = deal.title || '';
        const customerName = deal.customer?.name || '';

        return (
          title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          customerName.toLowerCase().includes(searchTerm.toLowerCase())
        );
      })
    : [];

  // Get deals for a specific stage
  const getDealsByStage = (stage: DealStage) => filteredDeals.filter(deal => deal.stage === stage);

  // Calculate total value of deals in a stage
  const calculateStageTotal = (stage: DealStage) => {
    const stageDeals = getDealsByStage(stage);
    const total = stageDeals.reduce((sum, deal) => {
      const dealValue = typeof deal.value === 'string' ? parseFloat(deal.value) : deal.value || 0;
      return sum + dealValue;
    }, 0);

    console.log(`💰 Stage ${stage} total calculation:`, {
      dealsCount: stageDeals.length,
      dealValues: stageDeals.map(d => ({
        id: d.id,
        title: d.title,
        value: d.value,
        valueType: typeof d.value,
        parsedValue: typeof d.value === 'string' ? parseFloat(d.value) : d.value,
      })),
      total,
    });

    return total;
  };

  // Check permissions
  if (!user || (user.role !== 'sales_agent' && user.role !== 'admin')) {
    return (
      <div className="p-4 text-center text-gray-500">
        You don't have permission to access this page.
      </div>
    );
  }

  // Render deal card component
  const DealCard = ({
    deal,
    provided,
    snapshot,
  }: {
    deal: Deal;
    provided: DraggableProvided;
    snapshot: DraggableStateSnapshot;
  }) => (
    <div
      ref={provided.innerRef}
      {...provided.draggableProps}
      {...provided.dragHandleProps}
      style={{
        ...provided.draggableProps.style,
        opacity: snapshot.isDragging ? 0.8 : 1,
      }}
      className={`p-3 bg-white rounded-md shadow border 
        ${snapshot.isDragging ? 'border-blue-400 ring-2 ring-blue-200' : 'border-gray-200'}`}
    >
      <div className="flex justify-between items-start mb-2">
        <h4 className="font-medium text-gray-900 text-sm line-clamp-2">
          {deal.title || `Deal for ${deal.customer?.name || 'Customer'}`}
        </h4>
        <div className="flex space-x-1">
          <Button variant="ghost" size="sm" className="h-6 w-6">
            <MoreVertical className="h-3 w-3" />
          </Button>
        </div>
      </div>

      <div className="flex items-center text-xs text-gray-500 mb-2">
        <Building2 className="h-3 w-3 mr-1" />
        <span className="line-clamp-1">{deal.customer?.name || 'Unknown Customer'}</span>
      </div>

      <div className="flex justify-between items-center">
        <div className="font-bold text-base text-primary-800">{formatCurrency(deal.value)}</div>
        <div className="text-xs bg-gray-100 px-2 py-1 rounded text-gray-600">
          {deal.probability || 50}%
        </div>
      </div>
    </div>
  );

  return (
    <div className="container mx-auto px-4 py-6 max-w-full">
      {/* Toast Notification */}
      {toast.show && (
        <Toast
          title={toast.title}
          description={toast.description}
          variant={toast.variant}
          isVisible={toast.show}
          duration={5000}
          onClose={() => setToast({ show: false, title: '' })}
        />
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <h1 className="text-xl sm:text-2xl font-semibold text-gray-900">Deals Pipeline</h1>
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchDeals}
            disabled={isLoading}
            className="flex items-center gap-1"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            {isLoading ? 'Loading...' : 'Refresh'}
          </Button>
          <div className="relative flex-grow">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="w-4 h-4 text-gray-500" />
            </div>
            <Input
              type="text"
              placeholder="Search deals..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="pl-10 w-full"
            />
          </div>
        </div>
      </div>

      {/* Error State */}
      {error && !isLoading && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-6">
          <div className="flex">
            <AlertCircle className="h-5 w-5 text-red-500 mr-3" />
            <div>
              <h3 className="text-sm font-medium text-red-800">
                There was an error loading the deals
              </h3>
              <div className="mt-2 text-sm text-red-700">
                <p>{error.message}</p>
              </div>
              <div className="mt-4">
                <Button onClick={fetchDeals} variant="outline" size="sm" className="mr-2">
                  Retry
                </Button>
                <Button onClick={resetAndRetry} variant="destructive" size="sm">
                  Reset & Reload Page
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Loading State */}
      {isLoading ? (
        <div className="flex justify-center items-center h-64">
          <div className="flex flex-col items-center">
            <RefreshCw className="h-8 w-8 animate-spin text-primary-600 mb-2" />
            <p className="text-gray-500">Loading deals...</p>
          </div>
        </div>
      ) : (
        /* Drag and Drop Context */
        <DragDropContext onDragEnd={handleDragEnd} onDragStart={handleDragStart}>
          <div className="overflow-x-auto pb-6">
            <div className="flex space-x-4 min-w-[800px] lg:min-w-full">
              {STAGE_CONFIGS.map(stage => (
                <div
                  key={stage.id}
                  className={`rounded-lg ${stage.color} p-3 sm:p-4 flex-1 min-w-[240px]`}
                >
                  <div className="flex items-center justify-between mb-3 sm:mb-4">
                    <h3 className="font-medium text-sm sm:text-base text-gray-900">
                      {stage.label}
                    </h3>
                    <Badge variant="outline" className="text-xs">
                      {formatCurrency(calculateStageTotal(stage.id as DealStage))}
                    </Badge>
                  </div>

                  <Droppable droppableId={stage.id}>
                    {(provided: DroppableProvided): ReactNode => (
                      <div
                        ref={provided.innerRef}
                        {...provided.droppableProps}
                        className="space-y-2 sm:space-y-3 min-h-[300px] sm:min-h-[500px]"
                      >
                        {getDealsByStage(stage.id as DealStage).map((deal, index) => (
                          <Draggable
                            key={deal.id}
                            draggableId={deal.id}
                            index={index}
                            isDragDisabled={dragInProgress && deal.stage !== stage.id}
                          >
                            {(provided, snapshot) => (
                              <DealCard deal={deal} provided={provided} snapshot={snapshot} />
                            )}
                          </Draggable>
                        ))}
                        {provided.placeholder}

                        {/* Empty state for each column */}
                        {getDealsByStage(stage.id as DealStage).length === 0 && !dragInProgress && (
                          <div className="py-4 px-2 text-center text-gray-400 text-xs">
                            No deals in this stage
                          </div>
                        )}
                      </div>
                    )}
                  </Droppable>
                </div>
              ))}
            </div>
          </div>
        </DragDropContext>
      )}
    </div>
  );
}
