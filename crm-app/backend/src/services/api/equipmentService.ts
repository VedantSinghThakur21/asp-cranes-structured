/**
 * Equipment API Service
 *
 * Browser-side implementation that uses API requests instead of direct database access.
 * This service will be used by the frontend to interact with the backend API.
 */

import { Equipment, CraneCategory } from '../../types/equipment';
import { api } from '../../lib/apiService';

/**
 * Get all equipment from the API
 */
export const getEquipment = async (): Promise<Equipment[]> => {
  try {
    const response = await api.get<Equipment[]>('/equipment');
    return response;
  } catch (error: any) {
    console.error('Failed to fetch equipment:', error);
    return [];
  }
};

/**
 * Get equipment by category from the API
 */
export const getEquipmentByCategory = async (category: CraneCategory): Promise<Equipment[]> => {
  try {
    const response = await api.get<Equipment[]>(`/equipment?category=${category}`);
    return response;
  } catch (error: any) {
    console.error(`Failed to fetch equipment for category ${category}:`, error);
    return [];
  }
};

/**
 * Get equipment by ID from the API
 */
export const getEquipmentById = async (id: string): Promise<Equipment | null> => {
  try {
    const response = await api.get<Equipment>(`/equipment/${id}`);
    return response;
  } catch (error: any) {
    console.error(`Failed to fetch equipment ${id}:`, error);
    return null;
  }
};

/**
 * Create new equipment via the API
 */
export const createEquipment = async (
  equipmentData: Omit<Equipment, 'id' | 'createdAt' | 'updatedAt'>
): Promise<Equipment> => {
  try {
    const response = await api.post<Equipment>('/equipment', equipmentData);
    return response;
  } catch (error: any) {
    console.error('Failed to create equipment:', error);
    throw new Error(error.message || 'Failed to create equipment');
  }
};

/**
 * Update equipment via the API
 */
export const updateEquipment = async (
  id: string,
  equipmentData: Partial<Equipment>
): Promise<Equipment | null> => {
  try {
    const response = await api.put<Equipment>(`/equipment/${id}`, equipmentData);
    return response;
  } catch (error: any) {
    console.error(`Failed to update equipment ${id}:`, error);
    return null;
  }
};

/**
 * Delete equipment via the API
 */
export const deleteEquipment = async (id: string): Promise<boolean> => {
  try {
    await api.delete<void>(`/equipment/${id}`);
    return true;
  } catch (error: any) {
    console.error(`Failed to delete equipment ${id}:`, error);
    return false;
  }
};
