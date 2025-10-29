import { getHeaders } from './apiHeaders';
// Update a customer by ID via backend API
export async function updateCustomer(
  customerId: string,
  updates: Partial<Customer>
): Promise<Customer> {
  const apiUrl = import.meta.env.VITE_API_URL || '/api';
  const response = await fetch(`${apiUrl}/customers/${customerId}`, {
    method: 'PATCH',
    headers: { ...getHeaders(), 'Content-Type': 'application/json' },
    body: JSON.stringify(updates),
    credentials: 'include',
  });
  if (!response.ok) {
    throw new Error('Failed to update customer');
  }
  return response.json();
}
// Fetch all contacts for a customer by customer ID from backend API
export async function getContactsByCustomer(customerId: string): Promise<any[]> {
  const apiUrl = import.meta.env.VITE_API_URL || '/api';
  const response = await fetch(`${apiUrl}/customers/${customerId}/contacts`, {
    method: 'GET',
    headers: getHeaders(),
    credentials: 'include',
  });
  if (!response.ok) {
    throw new Error('Failed to fetch contacts for customer');
  }
  return response.json();
}
// Delete a customer by ID via backend API
export async function deleteCustomer(customerId: string): Promise<void> {
  const apiUrl = import.meta.env.VITE_API_URL || '/api';
  const response = await fetch(`${apiUrl}/customers/${customerId}`, {
    method: 'DELETE',
    headers: getHeaders(),
    credentials: 'include',
  });
  if (!response.ok) {
    throw new Error('Failed to delete customer');
  }
}
// API client object for customer-related functions
export const customerApiClient = {
  getCustomers,
  createCustomer,
  deleteContact,
};
// Delete a customer contact by ID via backend API
export async function deleteContact(contactId: string): Promise<void> {
  const apiUrl = import.meta.env.VITE_API_URL || '/api';
  const response = await fetch(`${apiUrl}/customers/${contactId}`, {
    method: 'DELETE',
    headers: getHeaders(),
    credentials: 'include',
  });
  if (!response.ok) {
    throw new Error('Failed to delete contact');
  }
}
// Fetch all customers from backend API
export async function getCustomers(): Promise<Customer[]> {
  const apiUrl = import.meta.env.VITE_API_URL || '/api';
  const res = await fetch(`${apiUrl}/customers`, {
    method: 'GET',
    headers: getHeaders(),
    credentials: 'include',
  });
  if (!res.ok) throw new Error('Failed to fetch customers');
  return await res.json();
}
// Create a customer via backend API
export async function createCustomer(
  customer: Omit<Customer, 'id' | 'createdAt' | 'updatedAt'>
): Promise<Customer> {
  const apiUrl = import.meta.env.VITE_API_URL || '/api';
  const res = await fetch(`${apiUrl}/customers`, {
    method: 'POST',
    headers: { ...getHeaders(), 'Content-Type': 'application/json' },
    body: JSON.stringify(customer),
    credentials: 'include',
  });
  if (!res.ok) throw new Error('Failed to create customer');
  return await res.json();
}
/**
 * Types related to customers
 */

export interface Customer {
  id: string;
  name: string;
  contactName: string;
  email: string;
  phone: string;
  address: string;
  type: CustomerType;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export type CustomerType =
  | 'construction'
  | 'property_developer'
  | 'manufacturing'
  | 'government'
  | 'other';
