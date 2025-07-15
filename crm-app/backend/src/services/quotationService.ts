/**
 * Quotation Service
 * 
 * This file serves as a wrapper around the PostgreSQL quotation repository.
 * It replaces the Firestore implementation and provides the same interface.
 */

import * as quotationRepository from './postgres/quotationRepository';
import { Quotation, QuotationInputs } from '../types/quotation';

// Extending the QuotationStatus type to match the Quotation status field
export type QuotationStatus = 'draft' | 'sent' | 'accepted' | 'rejected';

/**
 * Get all quotations
 */
export const getQuotations = async (): Promise<Quotation[]> => {
  return quotationRepository.getQuotations();
};

/**
 * Create a new quotation
 */
export async function createQuotation(
  quotationInputs: QuotationInputs,
  leadId?: string,
  dealId?: string,
  customerId?: string,
  customerName?: string,
  customerContact?: any
): Promise<Quotation>;

export async function createQuotation(
  quotationData: any
): Promise<Quotation>;

export async function createQuotation(
  quotationInputsOrData: QuotationInputs | any,
  leadId?: string,
  dealId?: string,
  customerId?: string,
  customerName?: string,
  customerContact?: any
): Promise<Quotation> {
  try {
    // Check if it's the overload with complete data (single argument with dealId or leadId)
    if (leadId === undefined && dealId === undefined && customerId === undefined && 
        (quotationInputsOrData.dealId || quotationInputsOrData.leadId)) {
      // Complete quotation data object
      return quotationRepository.createQuotation(quotationInputsOrData);
    }
    
    // Original signature - separate parameters
    return quotationRepository.createQuotation({
      ...quotationInputsOrData,
      leadId,
      dealId,
      customerId,
      customerName,
      customerContact
    });
  } catch (error) {
    console.error('Error creating quotation:', error);
    throw error;
  }
}

/**
 * Get a quotation by ID
 */
export const getQuotationById = async (id: string): Promise<Quotation | null> => {
  return quotationRepository.getQuotationById(id);
};

/**
 * Update a quotation's status
 */
export const updateQuotationStatus = async (
  id: string, 
  status: QuotationStatus
): Promise<Quotation | null> => {
  return quotationRepository.updateQuotationStatus(id, status);
};

/**
 * Update a quotation's data
 */
export const updateQuotation = async (
  id: string,
  quotationData: Partial<Quotation>
): Promise<Quotation | null> => {
  return quotationRepository.updateQuotation(id, quotationData);
};

/**
 * Delete a quotation
 */
export const deleteQuotation = async (id: string): Promise<boolean> => {
  return quotationRepository.deleteQuotation(id);
};

/**
 * Get all quotations for a specific lead
 */
export const getQuotationsForLead = async (leadId: string): Promise<Quotation[]> => {
  console.log(`Getting quotations for lead ${leadId}`);
  const allQuotations = await getQuotations();
  return allQuotations.filter(quotation => quotation.leadId === leadId);
};
