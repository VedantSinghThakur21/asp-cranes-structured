/**
 * Customer API Service
 *
 * Browser-side implementation that uses API requests instead of direct database access.
 * This service will be used by the frontend to interact with the backend API.
 */

import { Customer } from '../../types/customer';
import { Contact } from '../../types/lead';
import { api } from '../../lib/apiService';

/**
 * Get all customers from the API
 */
export const getCustomers = async (): Promise<Customer[]> => {
  try {
    console.log('🔍 DEBUG: customerService.getCustomers() called');
    console.log('🔍 DEBUG: About to call api.get("/customers")');
    const response = await api.get<Customer[]>('/customers');
    console.log('🔍 DEBUG: api.get response received:', response);
    console.log('🔍 DEBUG: Response type:', typeof response, 'Array?', Array.isArray(response));
    return response;
  } catch (error: any) {
    console.error('❌ DEBUG: Failed to fetch customers:', error);
    console.error('❌ DEBUG: Error details:', error.message, error.stack);
    return [];
  }
};

/**
 * Get a customer by ID from the API
 */
export const getCustomerById = async (id: string): Promise<Customer | null> => {
  try {
    const response = await api.get<Customer>(`/customers/${id}`);
    return response;
  } catch (error: any) {
    console.error(`Failed to fetch customer ${id}:`, error);
    return null;
  }
};

/**
 * Create a new customer via the API
 */
export const createCustomer = async (
  customerData: Omit<Customer, 'id' | 'createdAt' | 'updatedAt'>
): Promise<Customer> => {
  try {
    console.log('Creating customer via API:', customerData);
    const response = await api.post<Customer>('/customers', customerData);
    console.log('Customer created successfully:', response);
    return response;
  } catch (error: any) {
    console.error('Failed to create customer:', error);
    throw new Error(error.message || 'Failed to create customer');
  }
};

/**
 * Update a customer via the API
 */
export const updateCustomer = async (
  id: string,
  customerData: Partial<Customer>
): Promise<Customer | null> => {
  try {
    const response = await api.put<Customer>(`/customers/${id}`, customerData);
    return response;
  } catch (error: any) {
    console.error(`Failed to update customer ${id}:`, error);
    throw new Error(error.message || 'Failed to update customer');
  }
};

/**
 * Delete a customer via the API
 */
export const deleteCustomer = async (id: string): Promise<boolean> => {
  try {
    await api.delete(`/customers/${id}`);
    return true;
  } catch (error: any) {
    console.error(`Failed to delete customer ${id}:`, error);
    throw new Error(error.message || 'Failed to delete customer');
  }
};

/**
 * Get contacts by customer ID from the API
 */
export const getContactsByCustomer = async (customerId: string): Promise<Contact[]> => {
  try {
    const response = await api.get<Contact[]>(`/customers/${customerId}/contacts`);
    return response;
  } catch (error: any) {
    console.error(`Failed to fetch contacts for customer ${customerId}:`, error);
    return [];
  }
};

/**
 * Create a new contact via the API
 */
export const createContact = async (contactData: Omit<Contact, 'id'>): Promise<Contact> => {
  try {
    const response = await api.post<Contact>('/contacts', contactData);
    return response;
  } catch (error: any) {
    console.error('Failed to create contact:', error);
    throw new Error(error.message || 'Failed to create contact');
  }
};

/**
 * Update a contact via the API
 */
export const updateContact = async (
  id: string,
  contactData: Partial<Contact>
): Promise<Contact | null> => {
  try {
    const response = await api.put<Contact>(`/contacts/${id}`, contactData);
    return response;
  } catch (error: any) {
    console.error(`Failed to update contact ${id}:`, error);
    throw new Error(error.message || 'Failed to update contact');
  }
};

/**
 * Delete a contact via the API
 */
export const deleteContact = async (id: string): Promise<boolean> => {
  try {
    await api.delete(`/contacts/${id}`);
    return true;
  } catch (error: any) {
    console.error(`Failed to delete contact ${id}:`, error);
    throw new Error(error.message || 'Failed to delete contact');
  }
};
