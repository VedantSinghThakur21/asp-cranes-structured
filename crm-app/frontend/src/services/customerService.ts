import { getHeaders } from './apiHeaders';

export interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string;
  address?: string;
  company?: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * Get all customers from backend API
 */
export async function getCustomers(): Promise<Customer[]> {
  const apiUrl = import.meta.env.VITE_API_URL || '/api';
  const response = await fetch(`${apiUrl}/customers`, {
    method: 'GET',
    headers: getHeaders(),
    credentials: 'include',
  });

  if (!response.ok) {
    throw new Error('Failed to fetch customers');
  }

  const result = await response.json();
  // Support both array and {data: array} responses
  const customers = Array.isArray(result) ? result : Array.isArray(result.data) ? result.data : [];
  return customers;
}

/**
 * Get a customer by ID
 */
export async function getCustomerById(customerId: string): Promise<Customer> {
  const apiUrl = import.meta.env.VITE_API_URL || '/api';
  const response = await fetch(`${apiUrl}/customers/${customerId}`, {
    method: 'GET',
    headers: getHeaders(),
    credentials: 'include',
  });

  if (!response.ok) {
    throw new Error('Failed to fetch customer');
  }

  const result = await response.json();
  return result.data || result;
}

/**
 * Create a new customer
 */
export async function createCustomer(customer: Partial<Customer>): Promise<Customer> {
  const apiUrl = import.meta.env.VITE_API_URL || '/api';
  const response = await fetch(`${apiUrl}/customers`, {
    method: 'POST',
    headers: { ...getHeaders(), 'Content-Type': 'application/json' },
    body: JSON.stringify(customer),
    credentials: 'include',
  });

  if (!response.ok) {
    throw new Error('Failed to create customer');
  }

  const result = await response.json();
  return result.data || result;
}

/**
 * Update an existing customer
 */
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

  const result = await response.json();
  return result.data || result;
}

/**
 * Delete a customer
 */
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
