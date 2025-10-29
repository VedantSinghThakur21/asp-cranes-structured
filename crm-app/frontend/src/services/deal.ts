import { api } from '../lib/apiService';

// Get all deals from the backend API with optional stage filtering
export async function getDeals(stages?: string[]): Promise<Deal[]> {
  try {
    let endpoint = '/deals';
    if (stages && stages.length > 0) {
      const stagesParam = stages.join(',');
      endpoint += `?stages=${encodeURIComponent(stagesParam)}`;
    }

    console.log('🔧 getDeals: Making request to:', endpoint);

    const response = await api.get<Deal[]>(endpoint);
    console.log('🔧 getDeals: Response received:', response);

    return response || [];
  } catch (error) {
    console.error('🔧 getDeals: Error fetching deals:', error);
    return [];
  }
}

// Get a deal by its ID from the backend API
export async function getDealById(dealId: string): Promise<Deal> {
  try {
    const response = await api.get<Deal>(`/deals/${dealId}`);
    return response;
  } catch (error) {
    console.error('Error fetching deal by ID:', error);
    throw new Error('Failed to fetch deal by ID');
  }
}

// Create a deal via backend API
export async function createDeal(
  deal: Omit<Deal, 'id' | 'createdAt' | 'updatedAt'>
): Promise<Deal> {
  try {
    const response = await api.post<Deal>('/deals', deal);
    return response;
  } catch (error) {
    console.error('Error creating deal:', error);
    throw new Error('Failed to create deal');
  }
}

// Update the stage of a deal by ID via backend API
export async function updateDealStage(dealId: string, stage: DealStage): Promise<Deal> {
  try {
    const response = await api.patch<Deal>(`/deals/${dealId}/stage`, { stage });
    return response;
  } catch (error) {
    console.error('Error updating deal stage:', error);
    throw new Error('Failed to update deal stage');
  }
}

// API client object for deal-related functions
export const dealApiClient = {
  getDeals,
  getDealById,
  createDeal,
  updateDealStage,
};

export type DealStage = 'qualification' | 'proposal' | 'negotiation' | 'won' | 'lost';

export interface Deal {
  id: string;
  leadId: string;
  customerId: string;
  customer: {
    name: string;
    email: string;
    phone: string;
    company: string;
    address: string;
    designation?: string;
  };
  title: string;
  description: string;
  value: number;
  stage: DealStage;
  createdAt: string;
  updatedAt: string;
  createdBy?: string;
  assignedTo: string;
  assignedToName?: string;
  probability: number;
  expectedCloseDate: string;
  notes?: string;
}
