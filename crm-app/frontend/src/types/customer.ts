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

export type CustomerType = 'construction' | 'property_developer' | 'manufacturing' | 'government' | 'other';
