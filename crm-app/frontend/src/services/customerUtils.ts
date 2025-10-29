/**
 * Customer Data Utilities
 * Utility functions for handling customer data consistently across the application
 */

/**
 * Extract customer information from a lead object
 * Provides fallback values to ensure customer data is always available
 */
export const extractCustomerFromLead = (
  lead: any
): {
  customerName: string;
  companyName: string;
  email: string;
  phone: string;
} => {
  if (!lead) {
    return {
      customerName: 'Unknown Customer',
      companyName: 'Unknown Company',
      email: '',
      phone: '',
    };
  }

  return {
    customerName: lead.customerName || lead.customer_name || 'Unknown Customer',
    companyName:
      lead.companyName ||
      lead.company_name ||
      lead.customerName ||
      lead.customer_name ||
      'Unknown Company',
    email: lead.email || '',
    phone: lead.phone || '',
  };
};

/**
 * Extract customer information from a deal object
 * Handles various response formats and provides consistent fallbacks
 */
export const extractCustomerFromDeal = (
  deal: any
): {
  customerName: string;
  companyName: string;
  email: string;
  phone: string;
} => {
  if (!deal) {
    return {
      customerName: 'Unknown Customer',
      companyName: 'Unknown Company',
      email: '',
      phone: '',
    };
  }

  // Handle nested customer object
  if (deal.customer && typeof deal.customer === 'object') {
    return {
      customerName: deal.customer.name || deal.customer.customerName || 'Unknown Customer',
      companyName:
        deal.customer.companyName ||
        deal.customer.company_name ||
        deal.customer.name ||
        'Unknown Company',
      email: deal.customer.email || '',
      phone: deal.customer.phone || '',
    };
  }

  // Handle flat structure
  return {
    customerName: deal.customerName || deal.customer_name || 'Unknown Customer',
    companyName:
      deal.companyName ||
      deal.company_name ||
      deal.customerName ||
      deal.customer_name ||
      'Unknown Company',
    email: deal.customerEmail || deal.customer_email || deal.email || '',
    phone: deal.customerPhone || deal.customer_phone || deal.phone || '',
  };
};

/**
 * Normalize customer data for display
 * Ensures consistent formatting and handles edge cases
 */
export const normalizeCustomerData = (
  customer: any
): {
  displayName: string;
  displayCompany: string;
  displayEmail: string;
  displayPhone: string;
  fullDisplay: string;
} => {
  const name =
    customer?.name || customer?.customerName || customer?.customer_name || 'Unknown Customer';
  const company =
    customer?.companyName ||
    customer?.company_name ||
    customer?.contactName ||
    customer?.contact_name ||
    name;
  const email = customer?.email || '';
  const phone = customer?.phone || '';

  return {
    displayName: name,
    displayCompany: company !== name ? company : '',
    displayEmail: email,
    displayPhone: phone,
    fullDisplay: company !== name ? `${name} (${company})` : name,
  };
};

/**
 * Extract data from API responses with robust error handling
 * Handles wrapped responses, arrays, and various formats
 */
export const extractDataFromApiResponse = <T>(response: any): T[] => {
  // If response is null or undefined
  if (!response) {
    console.warn('API response is null or undefined');
    return [];
  }

  // If response is already an array
  if (Array.isArray(response)) {
    return response;
  }

  // If response has a data property that's an array
  if (response.data && Array.isArray(response.data)) {
    return response.data;
  }

  // If response has success and data properties
  if (response.success && response.data && Array.isArray(response.data)) {
    return response.data;
  }

  // If response has items property
  if (response.items && Array.isArray(response.items)) {
    return response.items;
  }

  // If response is an object but not an array, try to extract values
  if (typeof response === 'object' && !Array.isArray(response)) {
    const values = Object.values(response);
    if (values.length === 1 && Array.isArray(values[0])) {
      return values[0] as T[];
    }
  }

  console.warn('Unable to extract array from API response:', response);
  return [];
};

/**
 * Validate that an item has required customer information
 */
export const hasValidCustomerInfo = (item: any): boolean => {
  if (!item) return false;

  const customerName =
    item.customerName || item.customer_name || (item.customer && item.customer.name);

  return Boolean(customerName && customerName.trim() !== '' && customerName !== 'Unknown Customer');
};

/**
 * Get a display-friendly customer identifier
 * Useful for debugging and logging
 */
export const getCustomerIdentifier = (item: any): string => {
  if (!item) return 'No item';

  const name =
    item.customerName || item.customer_name || (item.customer && item.customer.name) || 'Unknown';
  const email = item.email || (item.customer && item.customer.email) || '';
  const id = item.customerId || item.customer_id || item.id || '';

  return `${name}${email ? ` (${email})` : ''}${id ? ` [${id}]` : ''}`;
};

export default {
  extractCustomerFromLead,
  extractCustomerFromDeal,
  normalizeCustomerData,
  extractDataFromApiResponse,
  hasValidCustomerInfo,
  getCustomerIdentifier,
};
