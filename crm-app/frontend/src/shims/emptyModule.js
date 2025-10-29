/**
 * Empty Module Shim
 * Used to replace development-only modules in production builds
 *
 * IMPORTANT: This file is used in production to replace development modules.
 * Make sure all exported functions match the original module signatures
 * but return safe null values to prevent any execution of dev code.
 */

// Generic async function that returns null
const asyncNull = async () => null;
// Generic async function that returns empty array
const asyncEmptyArray = async () => [];
// Generic async function that returns success object
const asyncSuccess = async () => ({ success: true });
// Generic async function that returns error object
const asyncError = async () => ({ success: false, error: 'Service disabled in production' });
// Generic no-op function
const noop = () => {};

// Export empty/no-op functions for any commonly used exports from devLogin.ts
export const createDevToken = noop;

// Export no-op functions for authDebug.ts
export const initAuthDebug = noop;
export const logAuthState = noop;
export const debugAuth = noop;
export const checkAuthStatus = noop;

// Export functions from devCleanup.ts
export const cleanupDevArtifacts = noop;
export const checkForDevTokens = () => false;
export const removeDevTokens = noop;

// Auth service functions
export const signIn = asyncError;
export const signOutUser = asyncSuccess;
export const getCurrentUser = asyncNull;
export const getUserById = asyncNull;
export const updateUser = asyncNull;
export const createUser = asyncNull;
export const deleteUser = asyncNull;

// Template service functions
export const getTemplate = asyncNull;
export const updateTemplate = asyncNull;
export const createTemplate = asyncNull;
export const getTemplates = asyncEmptyArray;
export const deleteTemplate = asyncNull;
export const getTemplateById = asyncNull;

// Lead service functions
export const getLead = asyncNull;
export const updateLead = asyncNull;
export const createLead = asyncNull;
export const getLeads = asyncEmptyArray;
export const deleteLead = asyncNull;
export const updateLeadStatus = asyncNull;
export const updateLeadAssignment = asyncNull;

// Job service functions
export const getJob = asyncNull;
export const getJobById = asyncNull;
export const updateJob = asyncNull;
export const createJob = asyncNull;
export const getJobs = asyncEmptyArray;
export const deleteJob = asyncNull;
export const getJobsByOperator = asyncEmptyArray;
export const getEquipmentById = asyncNull;
export const getAllEquipment = asyncEmptyArray;
export const getAllOperators = asyncEmptyArray;

// Customer service functions
export const getCustomer = asyncNull;
export const updateCustomer = asyncNull;
export const createCustomer = asyncNull;
export const getCustomers = asyncEmptyArray;
export const deleteCustomer = asyncNull;
export const getContactsByCustomer = asyncEmptyArray;
export const deleteContact = asyncNull;

// Quotation service functions
export const getQuotation = asyncNull;
export const updateQuotation = asyncNull;
export const createQuotation = asyncNull;
export const getQuotations = asyncEmptyArray;
export const deleteQuotation = asyncNull;
export const getQuotationById = asyncNull;
export const getQuotationsForLead = asyncEmptyArray;

// Deal service functions
export const getDeal = asyncNull;
export const updateDeal = asyncNull;
export const updateDealStage = asyncNull;
export const createDeal = asyncNull;
export const getDeals = asyncEmptyArray;
export const deleteDeal = asyncNull;
export const getDealById = asyncNull;

// Equipment service functions
export const getEquipment = asyncEmptyArray;
export const getEquipmentByCategory = asyncEmptyArray;
export const updateEquipment = asyncNull;
export const createEquipment = asyncNull;
export const deleteEquipment = asyncNull;

// Config service functions
export const getConfig = asyncNull;
export const updateConfig = asyncNull;
export const getQuotationConfig = asyncNull;
export const updateQuotationConfig = asyncNull;
export const getResourceRatesConfig = asyncNull;
export const updateResourceRatesConfig = asyncNull;
export const getAdditionalParamsConfig = asyncNull;
export const updateAdditionalParamsConfig = asyncNull;
export const getDefaultTemplateConfig = asyncNull;
export const updateDefaultTemplateConfig = asyncNull;

// Notification service functions
export const getUserNotifications = asyncEmptyArray;
export const markNotificationAsRead = asyncNull;
export const createNotification = asyncNull;
export const deleteNotification = asyncNull;

// Debug helper functions
export const monitorOperation = noop;

// Activity service functions
export const getRecentActivities = asyncEmptyArray;
export const createActivity = asyncNull;
export const updateActivity = asyncNull;
export const deleteActivity = asyncNull;

// Site assessment service functions
export const getSiteAssessments = asyncEmptyArray;
export const createSiteAssessment = asyncNull;
export const updateSiteAssessment = asyncNull;
export const deleteSiteAssessment = asyncNull;

// Service management functions
export const getServices = asyncEmptyArray;
export const createService = asyncNull;
export const updateService = asyncNull;
export const deleteService = asyncNull;
export const toggleServiceStatus = asyncNull;

// Utils functions
export const mergeTemplate = asyncNull;
export const mergeQuotationWithTemplate = (quotation, template) => template?.content || '';
export const getAvailablePlaceholders = () => [];
export const getHeaders = () => ({});
export const formatCurrency = value => `₹${value || 0}`;
export const formatDate = date => (date ? new Date(date).toLocaleDateString() : '');
export const validateEmail = () => true;
export const validatePhone = () => true;

// Customer utils functions
export const extractDataFromApiResponse = data => data || {};
export const getCustomerIdentifier = customer => customer?.id || '';

// API client exports
export const jobApiClient = {
  get: asyncNull,
  post: asyncNull,
  put: asyncNull,
  delete: asyncNull,
  create: asyncNull,
  update: asyncNull,
  list: asyncEmptyArray,
};

// Type exports (will be empty objects in production)
export const Activity = {};
export const User = {};
export const Lead = {};
export const Job = {};
export const Customer = {};
export const Quotation = {};
export const Deal = {};
export const Equipment = {};
export const Template = {};
export const Service = {};
export const SiteAssessment = {};
export const Notification = {};

// Default export as empty object for any default imports
export default {
  // Auth
  signIn: asyncError,
  signOutUser: asyncSuccess,
  getCurrentUser: asyncNull,

  // Generic CRUD operations
  create: asyncNull,
  read: asyncNull,
  update: asyncNull,
  delete: asyncNull,
  list: asyncEmptyArray,

  // Dev functions
  createDevToken: noop,
  initAuthDebug: noop,
  logAuthState: noop,

  // Utils
  noop,
  asyncNull,
  asyncEmptyArray,
  asyncSuccess,
  asyncError,
};
