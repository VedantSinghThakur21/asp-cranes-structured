import React, { useState, useEffect, useMemo } from 'react';
import {
  Plus,
  Search,
  Edit2,
  Trash2,
  Building2,
  Users,
  Mail,
  Phone,
  MapPin,
  ChevronDown,
  ChevronRight,
  User,
  Grid,
  List,
  ChevronLeft,
  ChevronFirst,
  ChevronLast,
} from 'lucide-react';
import { Card, CardContent } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { FormInput } from '../components/common/FormInput';
import { Modal } from '../components/common/Modal';
import { Toast } from '../components/common/Toast';

import { useAuthStore } from '../store/authStore';
import { Customer } from '../types/customer';
import {
  getCustomers,
  createCustomer,
  updateCustomer,
  deleteCustomer,
} from '../services/api/customerService';

export function Customers() {
  const { user } = useAuthStore();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [expandedCustomers, setExpandedCustomers] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(true);

  // Enhanced filtering and pagination state
  const [viewMode, setViewMode] = useState<'cards' | 'table'>('cards');
  const [sortBy, setSortBy] = useState<'name' | 'company' | 'type' | 'contacts'>('company');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(20);

  const [toast, setToast] = useState<{
    show: boolean;
    title: string;
    description?: string;
    variant?: 'success' | 'error' | 'warning';
  }>({ show: false, title: '' });
  const [formData, setFormData] = useState<Omit<Customer, 'id' | 'createdAt' | 'updatedAt'>>({
    name: '',
    companyName: '',
    contactName: '',
    email: '',
    phone: '',
    address: '',
    type: 'other',
    designation: '',
    notes: '',
  });

  useEffect(() => {
    fetchCustomers();
  }, []);

  const fetchCustomers = async () => {
    try {
      const data = await getCustomers();
      if (data && Array.isArray(data)) {
        setCustomers(data);
      } else {
        showToast('Error fetching customers: Invalid data format', 'error');
      }
    } catch (error) {
      showToast('Error fetching customers', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const toggleCustomerExpansion = (customerId: string) => {
    const newExpanded = new Set(expandedCustomers);
    if (newExpanded.has(customerId)) {
      newExpanded.delete(customerId);
    } else {
      newExpanded.add(customerId);
    }
    setExpandedCustomers(newExpanded);
  };

  // Group customers by company name to eliminate duplicates
  const groupedCustomers = useMemo(() => {
    return customers.reduce(
      (acc, customer) => {
        const companyKey = customer.companyName || customer.name;
        if (!acc[companyKey]) {
          acc[companyKey] = {
            company: companyKey,
            type: customer.type,
            address: customer.address,
            contacts: [],
          };
        }
        acc[companyKey].contacts.push({
          id: customer.id,
          name: customer.contactName || customer.name,
          email: customer.email,
          phone: customer.phone,
          designation: customer.designation,
          notes: customer.notes,
        });
        return acc;
      },
      {} as Record<
        string,
        {
          company: string;
          type: string;
          address: string;
          contacts: Array<{
            id: string;
            name: string;
            email: string;
            phone: string;
            designation?: string;
            notes?: string;
          }>;
        }
      >
    );
  }, [customers]);

  // Enhanced filtering and sorting
  const filteredAndSortedCompanies = useMemo(() => {
    let companies = Object.values(groupedCustomers);

    // Apply search filter
    if (searchTerm) {
      companies = companies.filter(
        company =>
          company.company.toLowerCase().includes(searchTerm.toLowerCase()) ||
          company.contacts.some(
            contact =>
              contact.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
              contact.email.toLowerCase().includes(searchTerm.toLowerCase())
          )
      );
    }

    // Apply type filter
    if (typeFilter !== 'all') {
      companies = companies.filter(company => company.type === typeFilter);
    }

    // Apply sorting
    companies.sort((a, b) => {
      let aValue, bValue;

      switch (sortBy) {
        case 'company':
          aValue = a.company.toLowerCase();
          bValue = b.company.toLowerCase();
          break;
        case 'type':
          aValue = a.type;
          bValue = b.type;
          break;
        case 'contacts':
          aValue = a.contacts.length;
          bValue = b.contacts.length;
          break;
        default:
          aValue = a.company.toLowerCase();
          bValue = b.company.toLowerCase();
      }

      if (sortOrder === 'asc') {
        return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
      } else {
        return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
      }
    });

    return companies;
  }, [groupedCustomers, searchTerm, typeFilter, sortBy, sortOrder]);

  // Pagination
  const totalItems = filteredAndSortedCompanies.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedCompanies = filteredAndSortedCompanies.slice(startIndex, endIndex);

  // Utility functions
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    setExpandedCustomers(new Set()); // Collapse all when changing pages
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (
      !formData.name ||
      !formData.companyName ||
      !formData.contactName ||
      !formData.email ||
      !formData.phone ||
      !formData.address ||
      !formData.type
    ) {
      showToast('Please fill in all required fields', 'error');
      return;
    }

    try {
      if (selectedCustomer) {
        const updatedCustomer = await updateCustomer(selectedCustomer.id, formData);
        if (updatedCustomer) {
          setCustomers(prev =>
            prev.map(customer => (customer.id === selectedCustomer.id ? updatedCustomer : customer))
          );
        }
        showToast('Customer updated successfully', 'success');
      } else {
        const newCustomer = await createCustomer(formData);
        setCustomers(prev => [...prev, newCustomer]);
        showToast('Customer added successfully', 'success');
      }

      setIsModalOpen(false);
      resetForm();
    } catch (error) {
      showToast('Error saving customer', 'error');
    }
  };

  const handleDelete = async () => {
    if (!selectedCustomer) return;

    try {
      await deleteCustomer(selectedCustomer.id);
      setCustomers(prev => prev.filter(c => c.id !== selectedCustomer.id));
      setIsDeleteModalOpen(false);
      setSelectedCustomer(null);
      showToast('Customer deleted successfully', 'success');
    } catch (error) {
      showToast('Error deleting customer', 'error');
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      companyName: '',
      contactName: '',
      email: '',
      phone: '',
      address: '',
      type: 'other' as const,
      designation: '',
      notes: '',
    });
    setSelectedCustomer(null);
  };

  const showToast = (title: string, variant: 'success' | 'error' | 'warning' = 'success') => {
    setToast({ show: true, title, variant });
    setTimeout(() => setToast({ show: false, title: '' }), 3000);
  };

  if (!user || (user.role !== 'admin' && user.role !== 'sales_agent')) {
    return (
      <div className="p-4 text-center text-gray-500">
        You don't have permission to access this page.
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Enhanced Header Section */}
      <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
        <div className="flex flex-col space-y-4">
          {/* Title and Summary */}
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 flex items-center">
                <Building2 className="mr-3 text-blue-600" size={28} />
                Customer Management
              </h1>
              <p className="text-gray-600 mt-1">
                {totalItems} {totalItems === 1 ? 'company' : 'companies'} •{customers.length} total
                contacts
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              {/* View Mode Toggle */}
              <div className="flex rounded-lg border border-gray-200 p-1">
                <button
                  onClick={() => setViewMode('cards')}
                  className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    viewMode === 'cards'
                      ? 'bg-blue-500 text-white'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  <Grid size={16} className="mr-1" />
                  Cards
                </button>
                <button
                  onClick={() => setViewMode('table')}
                  className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    viewMode === 'table'
                      ? 'bg-blue-500 text-white'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  <List size={16} className="mr-1" />
                  Table
                </button>
              </div>

              <Button
                onClick={() => {
                  resetForm();
                  setIsModalOpen(true);
                }}
                leftIcon={<Plus size={16} />}
                variant="accent"
                className="w-full sm:w-auto flex-shrink-0"
              >
                Add Customer
              </Button>
            </div>
          </div>

          {/* Search and Filters */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-5 w-5" />
              <FormInput
                placeholder="Search companies, contacts, or emails..."
                value={searchTerm}
                onChange={e => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1); // Reset to first page when searching
                }}
                className="pl-10 w-full"
              />
            </div>

            <div className="flex gap-2">
              {/* Type Filter */}
              <select
                value={typeFilter}
                onChange={e => {
                  setTypeFilter(e.target.value);
                  setCurrentPage(1);
                }}
                className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Types</option>
                <option value="construction">Construction</option>
                <option value="property_developer">Property Developer</option>
                <option value="manufacturing">Manufacturing</option>
                <option value="government">Government</option>
                <option value="other">Other</option>
              </select>

              {/* Sort Options */}
              <select
                value={`${sortBy}-${sortOrder}`}
                onChange={e => {
                  const [field, order] = e.target.value.split('-');
                  setSortBy(field as typeof sortBy);
                  setSortOrder(order as 'asc' | 'desc');
                }}
                className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="company-asc">Company A-Z</option>
                <option value="company-desc">Company Z-A</option>
                <option value="type-asc">Type A-Z</option>
                <option value="contacts-desc">Most Contacts</option>
                <option value="contacts-asc">Least Contacts</option>
              </select>

              {/* Items per page */}
              <select
                value={itemsPerPage}
                onChange={e => {
                  setItemsPerPage(Number(e.target.value));
                  setCurrentPage(1);
                }}
                className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value={10}>10 per page</option>
                <option value={20}>20 per page</option>
                <option value={50}>50 per page</option>
                <option value={100}>100 per page</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      <Card>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">Loading customers...</div>
          ) : paginatedCompanies.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              {filteredAndSortedCompanies.length === 0 ? (
                searchTerm || typeFilter !== 'all' ? (
                  <>
                    <Building2 size={48} className="mx-auto text-gray-300 mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No customers found</h3>
                    <p className="text-gray-500 mb-4">
                      Try adjusting your search terms or filters.
                    </p>
                    <Button
                      onClick={() => {
                        setSearchTerm('');
                        setTypeFilter('all');
                        setCurrentPage(1);
                      }}
                      variant="outline"
                    >
                      Clear Filters
                    </Button>
                  </>
                ) : (
                  <>
                    <Building2 size={48} className="mx-auto text-gray-300 mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No customers yet</h3>
                    <p className="text-gray-500 mb-4">Get started by adding your first customer.</p>
                    <Button
                      onClick={() => {
                        resetForm();
                        setIsModalOpen(true);
                      }}
                      leftIcon={<Plus size={16} />}
                      variant="accent"
                    >
                      Add Customer
                    </Button>
                  </>
                )
              ) : (
                'No customers found for this page.'
              )}
            </div>
          ) : (
            <>
              <div className="space-y-4">
                {paginatedCompanies.map(company => (
                  <div
                    key={company.company}
                    className="border border-gray-200 rounded-lg bg-white shadow-sm"
                  >
                    {/* Company Header */}
                    <div className="p-4 border-b border-gray-100 bg-gray-50">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <button
                            onClick={() => toggleCustomerExpansion(company.company)}
                            className="p-1 hover:bg-gray-200 rounded transition-colors"
                          >
                            {expandedCustomers.has(company.company) ? (
                              <ChevronDown size={16} className="text-gray-600" />
                            ) : (
                              <ChevronRight size={16} className="text-gray-600" />
                            )}
                          </button>
                          <Building2 size={20} className="text-blue-600" />
                          <div>
                            <h3 className="font-semibold text-gray-900">{company.company}</h3>
                            <div className="flex items-center space-x-4 text-sm text-gray-500 mt-1">
                              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                {company.type}
                              </span>
                              <span className="flex items-center">
                                <Users size={14} className="mr-1" />
                                {company.contacts.length} contact
                                {company.contacts.length !== 1 ? 's' : ''}
                              </span>
                              {company.address && (
                                <span className="flex items-center">
                                  <MapPin size={14} className="mr-1" />
                                  {company.address}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              const firstContact = company.contacts[0];
                              if (firstContact) {
                                const customer = customers.find(c => c.id === firstContact.id);
                                if (customer) {
                                  setSelectedCustomer(customer);
                                  setFormData({
                                    name: customer.name,
                                    companyName: customer.companyName,
                                    contactName: customer.contactName,
                                    email: customer.email,
                                    phone: customer.phone,
                                    address: customer.address,
                                    type: customer.type,
                                    designation: customer.designation || '',
                                    notes: customer.notes || '',
                                  });
                                  setIsModalOpen(true);
                                }
                              }
                            }}
                            title="Edit Company"
                          >
                            <Edit2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>

                    {/* Contacts List (Expandable) */}
                    {expandedCustomers.has(company.company) && (
                      <div className="p-4 space-y-3">
                        {company.contacts.map(contact => (
                          <div
                            key={contact.id}
                            className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                          >
                            <div className="flex items-center space-x-3">
                              <User size={16} className="text-gray-400" />
                              <div>
                                <h4 className="font-medium text-gray-900">{contact.name}</h4>
                                <div className="flex items-center space-x-4 text-sm text-gray-500">
                                  {contact.designation && <span>{contact.designation}</span>}
                                  <a
                                    href={`mailto:${contact.email}`}
                                    className="flex items-center hover:text-blue-600 transition-colors"
                                  >
                                    <Mail size={14} className="mr-1" />
                                    {contact.email}
                                  </a>
                                  <a
                                    href={`tel:${contact.phone}`}
                                    className="flex items-center hover:text-blue-600 transition-colors"
                                  >
                                    <Phone size={14} className="mr-1" />
                                    {contact.phone}
                                  </a>
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center space-x-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  const customer = customers.find(c => c.id === contact.id);
                                  if (customer) {
                                    setSelectedCustomer(customer);
                                    setFormData({
                                      name: customer.name,
                                      companyName: customer.companyName,
                                      contactName: customer.contactName,
                                      email: customer.email,
                                      phone: customer.phone,
                                      address: customer.address,
                                      type: customer.type,
                                      designation: customer.designation || '',
                                      notes: customer.notes || '',
                                    });
                                    setIsModalOpen(true);
                                  }
                                }}
                                title="Edit Contact"
                              >
                                <Edit2 className="h-3 w-3" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                onClick={() => {
                                  const customer = customers.find(c => c.id === contact.id);
                                  if (customer) {
                                    setSelectedCustomer(customer);
                                    setIsDeleteModalOpen(true);
                                  }
                                }}
                                title="Delete Contact"
                              >
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* Pagination Controls */}
              {totalPages > 1 && (
                <div className="mt-6 flex items-center justify-between border-t border-gray-200 pt-4">
                  <div className="text-sm text-gray-700">
                    Showing {startIndex + 1} to {Math.min(endIndex, totalItems)} of {totalItems}{' '}
                    companies
                  </div>

                  <div className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePageChange(1)}
                      disabled={currentPage === 1}
                      title="First page"
                    >
                      <ChevronFirst size={16} />
                    </Button>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePageChange(currentPage - 1)}
                      disabled={currentPage === 1}
                      title="Previous page"
                    >
                      <ChevronLeft size={16} />
                    </Button>

                    <div className="flex space-x-1">
                      {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                        let pageNum;
                        if (totalPages <= 5) {
                          pageNum = i + 1;
                        } else if (currentPage <= 3) {
                          pageNum = i + 1;
                        } else if (currentPage >= totalPages - 2) {
                          pageNum = totalPages - 4 + i;
                        } else {
                          pageNum = currentPage - 2 + i;
                        }

                        return (
                          <Button
                            key={pageNum}
                            variant={currentPage === pageNum ? 'accent' : 'outline'}
                            size="sm"
                            onClick={() => handlePageChange(pageNum)}
                            className="w-10"
                          >
                            {pageNum}
                          </Button>
                        );
                      })}
                    </div>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePageChange(currentPage + 1)}
                      disabled={currentPage === totalPages}
                      title="Next page"
                    >
                      <ChevronRight size={16} />
                    </Button>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePageChange(totalPages)}
                      disabled={currentPage === totalPages}
                      title="Last page"
                    >
                      <ChevronLast size={16} />
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Add/Edit Customer Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          resetForm();
        }}
        title={selectedCustomer ? 'Edit Customer' : 'Add New Customer'}
        size="lg"
      >
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormInput
              label="Customer Name"
              value={formData.name}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setFormData(prev => ({ ...prev, name: e.target.value }))
              }
              required
              placeholder="Enter customer name"
            />
            <FormInput
              label="Company Name"
              value={formData.companyName}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setFormData(prev => ({ ...prev, companyName: e.target.value }))
              }
              required
              placeholder="Enter company name"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormInput
              label="Contact Name"
              value={formData.contactName}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setFormData(prev => ({ ...prev, contactName: e.target.value }))
              }
              required
              placeholder="Enter contact person name"
            />
            <FormInput
              label="Designation"
              value={formData.designation}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setFormData(prev => ({ ...prev, designation: e.target.value }))
              }
              placeholder="e.g., Project Manager, CEO"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormInput
              label="Email"
              type="email"
              value={formData.email}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setFormData(prev => ({ ...prev, email: e.target.value }))
              }
              required
              placeholder="contact@company.com"
            />
            <FormInput
              label="Phone"
              value={formData.phone}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setFormData(prev => ({ ...prev, phone: e.target.value }))
              }
              required
              placeholder="+1-555-0123"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Company Type</label>
              <select
                value={formData.type}
                onChange={e => setFormData(prev => ({ ...prev, type: e.target.value as any }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
              >
                <option value="construction">Construction Company</option>
                <option value="property_developer">Property Developer</option>
                <option value="manufacturing">Manufacturing</option>
                <option value="government">Government</option>
                <option value="other">Other</option>
              </select>
            </div>
            <FormInput
              label="Address"
              value={formData.address}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setFormData(prev => ({ ...prev, address: e.target.value }))
              }
              required
              placeholder="Company address"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Notes (Optional)</label>
            <textarea
              value={formData.notes}
              onChange={e => setFormData(prev => ({ ...prev, notes: e.target.value }))}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Additional notes about this customer..."
            />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setIsModalOpen(false);
                resetForm();
              }}
            >
              Cancel
            </Button>
            <Button type="submit" variant="accent">
              {selectedCustomer ? 'Update Customer' : 'Add Customer'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => {
          setIsDeleteModalOpen(false);
          setSelectedCustomer(null);
        }}
        title="Delete Customer"
        size="sm"
      >
        <div className="space-y-4">
          <p className="text-gray-600">
            Are you sure you want to delete this customer? This action cannot be undone.
          </p>

          <div className="flex justify-end gap-3">
            <Button
              variant="outline"
              onClick={() => {
                setIsDeleteModalOpen(false);
                setSelectedCustomer(null);
              }}
            >
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete}>
              Delete
            </Button>
          </div>
        </div>
      </Modal>

      {/* Toast Notifications */}
      {toast.show && (
        <Toast
          title={toast.title}
          variant={toast.variant}
          isVisible={toast.show}
          onClose={() => setToast({ show: false, title: '' })}
        />
      )}
    </div>
  );
}
