/**
 * Deal Database Mapping Utility
 *
 * This file maps between frontend Deal properties and database column names
 */

import { Deal, DealStage } from '../types/deal';

// Map frontend stage names to database status values
export const stageToDatabaseStatus = (stage: DealStage): string => {
  return stage; // They are the same in our case, but this allows for future mapping if needed
};

// Map database status values to frontend stage names
export const databaseStatusToStage = (status: string): DealStage => {
  // Validate that status is a valid DealStage
  if (['qualification', 'proposal', 'negotiation', 'won', 'lost'].includes(status)) {
    return status as DealStage;
  }
  // Default to qualification if invalid status
  console.warn(`Invalid deal status from database: ${status}, defaulting to qualification`);
  return 'qualification';
};

// Log deals received from the API for debugging
export const logDealsFromAPI = (deals: Deal[]): void => {
  console.log(`Received ${deals.length} deals from API`);
  if (deals.length > 0) {
    console.log('Sample deal:', {
      id: deals[0].id,
      stage: deals[0].stage,
      value: deals[0].value,
    });
  }
};
