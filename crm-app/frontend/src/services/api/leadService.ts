/**
 * Lead API Service
 *
 * Browser-side implementation that uses API requests instead of direct database access.
 * This service will be used by the frontend to interact with the backend API.
 */

import { Lead, LeadStatus } from '../../types/lead';
import { api } from '../../lib/apiService';

/**
 * Get all leads from the API
 */
export const getLeads = async (): Promise<Lead[]> => {
  try {
    const response = await api.get<Lead[]>('/leads');
    return response;
  } catch (error: any) {
    console.error('Failed to fetch leads:', error);
    return [];
  }
};

/**
 * Get a lead by ID from the API
 */
export const getLeadById = async (id: string): Promise<Lead | null> => {
  try {
    const response = await api.get<Lead>(`/leads/${id}`);
    return response;
  } catch (error: any) {
    console.error(`Failed to fetch lead ${id}:`, error);
    return null;
  }
};

/**
 * Create a new lead via the API
 */
export const createLead = async (
  lead: Omit<Lead, 'id' | 'createdAt' | 'updatedAt'>
): Promise<Lead> => {
  try {
    const response = await api.post<Lead>('/leads', lead);
    return response;
  } catch (error: any) {
    console.error('Failed to create lead:', error);
    throw new Error(error.message || 'Failed to create lead');
  }
};

/**
 * Update a lead's status via the API
 */
export const updateLeadStatus = async (id: string, status: LeadStatus): Promise<Lead | null> => {
  try {
    const response = await api.patch<Lead>(`/leads/${id}/status`, { status });
    return response;
  } catch (error: any) {
    console.error(`Failed to update lead ${id} status:`, error);
    return null;
  }
};

/**
 * Update a lead's assignment via the API
 */
export const updateLeadAssignment = async (
  leadId: string,
  salesAgentId: string,
  salesAgentName: string
): Promise<Lead | null> => {
  try {
    const response = await api.patch<Lead>(`/leads/${leadId}/assign`, {
      salesAgentId,
      salesAgentName,
    });
    return response;
  } catch (error: any) {
    console.error(`Failed to update lead ${leadId} assignment:`, error);
    return null;
  }
};

/**
 * Update a lead's details via the API
 */
export const updateLead = async (id: string, leadData: Partial<Lead>): Promise<Lead | null> => {
  try {
    console.log('🔄 Updating lead:', { id, leadData });
    const response = await api.put<Lead>(`/leads/${id}`, leadData);
    console.log('✅ Lead update response:', response);
    return response;
  } catch (error: any) {
    console.error(`❌ Failed to update lead ${id}:`, error);
    return null;
  }
};
