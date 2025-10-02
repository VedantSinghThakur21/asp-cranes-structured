import { getHeaders } from './apiHeaders';
// Get a job by its ID from the backend API
export async function getJobById(jobId: string): Promise<Job> {
  const apiUrl = import.meta.env.VITE_API_URL || '/api';
  const response = await fetch(`${apiUrl}/jobs/${jobId}`, {
    method: 'GET',
    headers: getHeaders(),
    credentials: 'include',
  });
  if (!response.ok) {
    throw new Error('Failed to fetch job by ID');
  }
  return response.json();
}
// API client object for job-related functions
export const jobApiClient = {
  getJobsByOperator,
  getEquipmentById,
  getAllEquipment,
  getJobs,
  getAllOperators,
  createJob,
  getJobEquipment,
  getJobOperators,
};
// Create a new job via backend API
export async function createJob(job: Partial<Job>): Promise<Job> {
  const apiUrl = import.meta.env.VITE_API_URL || '/api';
  const headers = {
    ...getHeaders(),
    'Content-Type': 'application/json'
  };
  
  const response = await fetch(`${apiUrl}/jobs`, {
    method: 'POST',
    headers,
    body: JSON.stringify(job),
    credentials: 'include',
  });
  
  if (!response.ok) {
    const errorText = await response.text();
    console.error('Failed to create job:', response.status, errorText);
    throw new Error(`Failed to create job: ${errorText}`);
  }
  
  return response.json();
}
// Fetch jobs by operator from backend API
export async function getJobsByOperator(operatorId: string): Promise<Job[]> {
  const apiUrl = import.meta.env.VITE_API_URL || '/api';
  const res = await fetch(`${apiUrl}/jobs?operatorId=${encodeURIComponent(operatorId)}`, {
    method: 'GET',
    headers: getHeaders(),
    credentials: 'include',
  });
  if (!res.ok) throw new Error('Failed to fetch jobs by operator');
  return await res.json();
}
// Fetch equipment by ID from backend API
export async function getEquipmentById(id: string): Promise<Equipment | null> {
  const apiUrl = import.meta.env.VITE_API_URL || '/api';
  const res = await fetch(`${apiUrl}/equipment/${encodeURIComponent(id)}`, {
    method: 'GET',
    headers: getHeaders(),
    credentials: 'include',
  });
  if (!res.ok) throw new Error('Failed to fetch equipment by id');
  return await res.json();
}
// Fetch all equipment from backend API
export async function getAllEquipment(): Promise<Equipment[]> {
  const apiUrl = import.meta.env.VITE_API_URL || '/api';
  
  const res = await fetch(`${apiUrl}/equipment`, {
    method: 'GET',
    headers: getHeaders(),
    credentials: 'include',
  });
  
  if (!res.ok) {
    console.error('Failed to fetch equipment:', res.status, await res.text());
    throw new Error('Failed to fetch equipment');
  }
  
  const result = await res.json();
  
  // Handle both direct array response and wrapped response
  if (result.success && Array.isArray(result.data)) {
    return result.data;
  } else if (Array.isArray(result)) {
    return result;
  } else {
    throw new Error('Invalid equipment data format');
  }
}
// Fetch all jobs from backend API
export async function getJobs(): Promise<Job[]> {
  const apiUrl = import.meta.env.VITE_API_URL || '/api';
  const res = await fetch(`${apiUrl}/jobs`, {
    method: 'GET',
    headers: getHeaders(),
    credentials: 'include',
  });
  if (!res.ok) throw new Error('Failed to fetch jobs');
  return await res.json();
}
// Fetch all operators from backend API
export async function getAllOperators(): Promise<Operator[]> {
  const apiUrl = import.meta.env.VITE_API_URL || '/api';
  
  const res = await fetch(`${apiUrl}/operators`, {
    method: 'GET',
    headers: getHeaders(),
    credentials: 'include',
  });
  
  if (!res.ok) {
    console.error('Failed to fetch operators:', res.status, await res.text());
    throw new Error('Failed to fetch operators');
  }
  
  const result = await res.json();
  
  // Handle both direct array response and wrapped response
  if (Array.isArray(result)) {
    return result;
  } else if (result.data && Array.isArray(result.data)) {
    return result.data;
  } else {
    throw new Error('Invalid operators data format');
  }
}

// Fetch equipment for a specific job
export async function getJobEquipment(jobId: string): Promise<Equipment[]> {
  const apiUrl = import.meta.env.VITE_API_URL || '/api';
  const res = await fetch(`${apiUrl}/jobs/${encodeURIComponent(jobId)}/equipment`, {
    method: 'GET',
    headers: getHeaders(),
    credentials: 'include',
  });
  if (!res.ok) throw new Error('Failed to fetch job equipment');
  return await res.json();
}

// Fetch operators for a specific job
export async function getJobOperators(jobId: string): Promise<Operator[]> {
  const apiUrl = import.meta.env.VITE_API_URL || '/api';
  const res = await fetch(`${apiUrl}/jobs/${encodeURIComponent(jobId)}/operators`, {
    method: 'GET',
    headers: getHeaders(),
    credentials: 'include',
  });
  if (!res.ok) throw new Error('Failed to fetch job operators');
  return await res.json();
}

// Fetch leads with won deals for job scheduling
export async function getLeadsWithWonDeals(): Promise<any[]> {
  const apiUrl = import.meta.env.VITE_API_URL || '/api';
  
  const res = await fetch(`${apiUrl}/jobs/leads/won-deals`, {
    method: 'GET',
    headers: getHeaders(),
    credentials: 'include',
  });
  
  if (!res.ok) {
    console.error('Failed to fetch leads with won deals:', res.status, await res.text());
    throw new Error('Failed to fetch leads with won deals');
  }
  
  const result = await res.json();
  
  if (result.success && Array.isArray(result.data)) {
    return result.data;
  } else if (Array.isArray(result)) {
    return result;
  } else {
    throw new Error('Invalid leads data format');
  }
}
export type JobStatus = 'pending' | 'scheduled' | 'in_progress' | 'completed' | 'cancelled';
export type OperatorAvailability = 'available' | 'assigned' | 'on_leave' | 'inactive';

export interface Equipment {
  id: string;
  name: string;
  type: string;
  description: string;
  baseRate: number;
}

export interface Operator {
  id: string;
  name: string;
  email: string;
  phone: string;
  specialization: string;
  certifications?: string[];
  availability?: OperatorAvailability;
  createdAt?: string;
  updatedAt?: string;
}

export interface JobLocation {
  address: string;
  coordinates?: {
    latitude: number;
    longitude: number;
  }
}

export interface Job {
  id: string;
  title: string;
  leadId: string;
  customerId: string;
  customerName: string;
  equipmentIds: string[];
  operatorIds: string[];
  dealId?: string;
  status: JobStatus;
  scheduledStartDate: string;
  scheduledEndDate: string;
  actualStartDate?: string | null;
  actualEndDate?: string | null;
  location: string;
  notes?: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  assignedTo?: string;
}