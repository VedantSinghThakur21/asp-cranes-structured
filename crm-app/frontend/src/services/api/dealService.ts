/**
 * Deal API Service
 *
 * Browser-side implementation that uses API requests instead of direct database access.
 * This service will be used by the frontend to interact with the backend API.
 */

import { Deal, DealStage } from '../../types/deal';
import { api } from '../../lib/apiService';

/**
 * Get all deals from the API
 */
export const getDeals = async (): Promise<Deal[]> => {
  try {
    const response = await api.get<Deal[]>('/deals');
    return response;
  } catch (error: any) {
    console.error('Failed to fetch deals:', error);
    return [];
  }
};

/**
 * Get a deal by ID from the API
 */
export const getDealById = async (id: string): Promise<Deal | null> => {
  try {
    const response = await api.get<Deal>(`/deals/${id}`);
    return response;
  } catch (error: any) {
    console.error(`Failed to fetch deal ${id}:`, error);
    return null;
  }
};

/**
 * Create a new deal via the API
 */
export const createDeal = async (
  deal: Omit<Deal, 'id' | 'createdAt' | 'updatedAt'>
): Promise<Deal> => {
  try {
    const response = await api.post<Deal>('/deals', deal);
    return response;
  } catch (error: any) {
    console.error('Failed to create deal:', error);
    throw new Error(error.message || 'Failed to create deal');
  }
};

/**
 * Update a deal via the API
 */
export const updateDeal = async (
  id: string,
  dealData: Partial<Omit<Deal, 'id' | 'createdAt' | 'updatedAt'>>
): Promise<Deal | null> => {
  try {
    const response = await api.put<Deal>(`/deals/${id}`, dealData);
    return response;
  } catch (error: any) {
    console.error(`Failed to update deal ${id}:`, error);
    return null;
  }
};

/**
 * Update a deal's stage via the API
 */
export const updateDealStage = async (id: string, stage: DealStage): Promise<Deal | null> => {
  try {
    const response = await api.patch<Deal>(`/deals/${id}/stage`, { stage });
    return response;
  } catch (error: any) {
    console.error(`Failed to update deal ${id} stage:`, error);
    return null;
  }
};

/**
 * Delete a deal via the API
 */
export const deleteDeal = async (id: string): Promise<boolean> => {
  try {
    await api.delete<void>(`/deals/${id}`);
    return true;
  } catch (error: any) {
    console.error(`Failed to delete deal ${id}:`, error);
    return false;
  }
};
