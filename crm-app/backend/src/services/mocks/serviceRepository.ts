/**
 * Service Mock Repository
 *
 * This file provides mock data for the ServiceRepository when running in browser mode
 * to prevent errors with database access from the frontend.
 */

import type { Service } from '../postgres/serviceRepository';

// Mock service data
export const mockServices: Service[] = [
  {
    id: 'service-1',
    name: 'Crane Operation',
    type: 'Equipment',
    baseRate: 150.0,
    unit: 'hour',
    description: 'Standard crane operation service',
    isActive: true,
    createdAt: '2023-10-15T10:00:00.000Z',
    updatedAt: '2023-10-15T10:00:00.000Z',
  },
  {
    id: 'service-2',
    name: 'Equipment Transport',
    type: 'Logistics',
    baseRate: 250.0,
    unit: 'day',
    description: 'Transportation of equipment to and from job site',
    isActive: true,
    createdAt: '2023-10-15T10:00:00.000Z',
    updatedAt: '2023-10-15T10:00:00.000Z',
  },
  {
    id: 'service-3',
    name: 'Site Preparation',
    type: 'Labor',
    baseRate: 75.0,
    unit: 'hour',
    description: 'Preparation of job site before equipment arrival',
    isActive: true,
    createdAt: '2023-10-15T10:00:00.000Z',
    updatedAt: '2023-10-15T10:00:00.000Z',
  },
  {
    id: 'service-4',
    name: 'Safety Inspection',
    type: 'Compliance',
    baseRate: 120.0,
    unit: 'shift',
    description: 'Safety inspection and compliance verification',
    isActive: true,
    createdAt: '2023-10-15T10:00:00.000Z',
    updatedAt: '2023-10-15T10:00:00.000Z',
  },
];

// Service API calls
export const getServicesFromApi = async (): Promise<Service[]> => {
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 300));
  return mockServices;
};

export const getServiceById = async (id: string): Promise<Service | null> => {
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 200));
  return mockServices.find(service => service.id === id) || null;
};

export const createService = async (
  service: Omit<Service, 'id' | 'createdAt' | 'updatedAt'>
): Promise<Service> => {
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 500));

  const now = new Date().toISOString();
  const newService: Service = {
    ...service,
    id: `service-${Math.floor(Math.random() * 1000)}`,
    createdAt: now,
    updatedAt: now,
  };

  return newService;
};

export const updateService = async (id: string, updates: Partial<Service>): Promise<Service> => {
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 400));

  const service = mockServices.find(s => s.id === id);
  if (!service) {
    throw new Error(`Service with ID ${id} not found`);
  }

  return {
    ...service,
    ...updates,
    updatedAt: new Date().toISOString(),
  };
};

export const deleteService = async (_id: string): Promise<boolean> => {
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 300));
  return true;
};
