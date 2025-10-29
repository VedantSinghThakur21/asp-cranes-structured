import { getHeaders } from './apiHeaders';
// Update the status of a lead by ID
export async function updateLeadStatus(leadId: string, status: string) {
  const apiUrl = import.meta.env.VITE_API_URL || '/api';
  const response = await fetch(`${apiUrl}/leads/${leadId}/status`, {
    method: 'PATCH',
    headers: { ...getHeaders(), 'Content-Type': 'application/json' },
    body: JSON.stringify({ status }),
    credentials: 'include',
  });
  if (!response.ok) {
    throw new Error('Failed to update lead status');
  }
  const result = await response.json();
  return result.data || result;
}
// Update lead assignment via backend API
// Update lead assignment via backend API (PATCH /leads/:id/assign)
export async function updateLeadAssignment(
  id: string,
  salesAgentId: string,
  salesAgentName: string
): Promise<Lead> {
  const apiUrl = import.meta.env.VITE_API_URL || '/api';
  const res = await fetch(`${apiUrl}/leads/${encodeURIComponent(id)}/assign`, {
    method: 'PATCH',
    headers: { ...getHeaders(), 'Content-Type': 'application/json' },
    body: JSON.stringify({ salesAgentId, salesAgentName }),
    credentials: 'include',
  });
  if (!res.ok) throw new Error('Failed to update lead assignment');
  const result = await res.json();
  return result.data || result;
}
// Update a lead via backend API
export async function updateLead(id: string, lead: Partial<Lead>): Promise<Lead> {
  const apiUrl = import.meta.env.VITE_API_URL || '/api';
  const res = await fetch(`${apiUrl}/leads/${encodeURIComponent(id)}`, {
    method: 'PATCH',
    headers: { ...getHeaders(), 'Content-Type': 'application/json' },
    body: JSON.stringify(lead),
    credentials: 'include',
  });
  if (!res.ok) throw new Error('Failed to update lead');
  const result = await res.json();
  return result.data || result;
}
// Create a lead via backend API
export async function createLead(
  lead: Omit<Lead, 'id' | 'createdAt' | 'updatedAt'>
): Promise<Lead> {
  const apiUrl = import.meta.env.VITE_API_URL || '/api';
  const res = await fetch(`${apiUrl}/leads`, {
    method: 'POST',
    headers: { ...getHeaders(), 'Content-Type': 'application/json' },
    body: JSON.stringify(lead),
    credentials: 'include',
  });
  if (!res.ok) throw new Error('Failed to create lead');
  const result = await res.json();
  return result.data || result;
}
// Fetch all leads from backend API
export async function getLeads(): Promise<Lead[]> {
  const apiUrl = import.meta.env.VITE_API_URL || '/api';
  const res = await fetch(`${apiUrl}/leads`, {
    method: 'GET',
    headers: getHeaders(),
    credentials: 'include',
  });
  if (!res.ok) throw new Error('Failed to fetch leads');
  const result = await res.json();
  return result.data || result;
}
export type LeadStatus = 'new' | 'in_process' | 'qualified' | 'unqualified' | 'lost' | 'converted';
export type LeadSource = 'website' | 'referral' | 'direct' | 'social' | 'email' | 'phone' | 'other';

export interface Customer {
  id: string;
  customerId: string; // Unique business identifier
  name: string; // Customer Name
  companyName: string; // Company Name
  email: string;
  phone: string;
  address: string;
  designation: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface Contact {
  id: string;
  customerId: string;
  name: string;
  email: string;
  phone: string;
  role: string;
}

export interface Lead {
  id: string;
  customerId?: string;
  customerName: string;
  companyName?: string;
  email: string;
  phone: string;
  serviceNeeded: string;
  siteLocation: string;
  startDate: string;
  rentalDays: number;
  shiftTiming?: string;
  status: LeadStatus;
  source?: LeadSource;
  assignedTo?: string; // ID of the sales agent
  assignedToName?: string; // Name of the sales agent
  designation?: string; // Customer's designation
  createdAt: string;
  updatedAt: string;
  files?: string[];
  notes?: string;
}
