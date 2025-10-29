import { useState, useEffect } from 'react';
import {
  Plus,
  Search,
  Phone,
  Mail,
  Building,
  MapPin,
  Calendar,
  User,
  Eye,
  Edit,
  Trash2,
  Star,
  Filter,
  Download,
  Upload,
  MessageSquare,
} from 'lucide-react';

export type ContactType = 'prospect' | 'customer' | 'partner' | 'vendor' | 'other';
export type ContactStatus = 'active' | 'inactive' | 'qualified' | 'unqualified';

export interface Contact {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  mobile?: string;
  title: string;
  company: string;
  companyId?: string;
  department?: string;
  contactType: ContactType;
  status: ContactStatus;
  address: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
  };
  website?: string;
  linkedIn?: string;
  twitter?: string;
  tags: string[];
  notes: string;
  leadSource: string;
  assignedTo: string;
  assignedToName: string;
  isStarred: boolean;
  lastContactDate?: string;
  nextContactDate?: string;
  totalDeals: number;
  totalRevenue: number;
  createdBy: string;
  createdByName: string;
  createdAt: string;
  updatedAt: string;
}

export interface ContactActivity {
  id: string;
  contactId: string;
  type: 'call' | 'email' | 'meeting' | 'note' | 'task';
  subject: string;
  description: string;
  date: string;
  createdBy: string;
  createdByName: string;
}

const CONTACT_TYPES = [
  { value: 'prospect', label: 'Prospect', color: 'bg-blue-100 text-blue-800' },
  { value: 'customer', label: 'Customer', color: 'bg-green-100 text-green-800' },
  { value: 'partner', label: 'Partner', color: 'bg-purple-100 text-purple-800' },
  { value: 'vendor', label: 'Vendor', color: 'bg-orange-100 text-orange-800' },
  { value: 'other', label: 'Other', color: 'bg-gray-100 text-gray-800' },
];

const STATUS_COLORS = {
  active: 'bg-green-100 text-green-800 border-green-200',
  inactive: 'bg-gray-100 text-gray-800 border-gray-200',
  qualified: 'bg-blue-100 text-blue-800 border-blue-200',
  unqualified: 'bg-red-100 text-red-800 border-red-200',
};

export function ContactManagement() {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [activities, setActivities] = useState<ContactActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<ContactType | 'all'>('all');
  const [statusFilter, setStatusFilter] = useState<ContactStatus | 'all'>('all');
  const [showStarredOnly, setShowStarredOnly] = useState(false);
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const [viewMode, setViewMode] = useState<'cards' | 'list'>('cards');

  // Mock data
  useEffect(() => {
    const mockContacts: Contact[] = [
      {
        id: '1',
        firstName: 'John',
        lastName: 'Smith',
        email: 'john.smith@constructcorp.com',
        phone: '+1-555-0123',
        mobile: '+1-555-0124',
        title: 'Project Manager',
        company: 'Construct Corp',
        companyId: 'company-1',
        department: 'Operations',
        contactType: 'customer',
        status: 'active',
        address: {
          street: '123 Business Ave',
          city: 'Chicago',
          state: 'IL',
          zipCode: '60601',
          country: 'USA',
        },
        website: 'www.constructcorp.com',
        linkedIn: 'linkedin.com/in/johnsmith',
        tags: ['high-value', 'repeat-customer', 'construction'],
        notes: 'Key decision maker for large construction projects. Prefers email communication.',
        leadSource: 'Website Inquiry',
        assignedTo: 'sales1',
        assignedToName: 'Sarah Johnson',
        isStarred: true,
        lastContactDate: '2024-06-10',
        nextContactDate: '2024-06-20',
        totalDeals: 5,
        totalRevenue: 450000,
        createdBy: 'sales1',
        createdByName: 'Sarah Johnson',
        createdAt: '2024-01-15',
        updatedAt: '2024-06-10',
      },
      {
        id: '2',
        firstName: 'Maria',
        lastName: 'Rodriguez',
        email: 'maria.rodriguez@industrialsolutions.com',
        phone: '+1-555-0456',
        title: 'Operations Director',
        company: 'Industrial Solutions Inc',
        contactType: 'prospect',
        status: 'qualified',
        address: {
          street: '456 Industrial Blvd',
          city: 'Houston',
          state: 'TX',
          zipCode: '77001',
          country: 'USA',
        },
        tags: ['industrial', 'heavy-lift', 'potential-high-value'],
        notes: 'Interested in heavy lifting equipment for new facility. Budget approved for Q3.',
        leadSource: 'Trade Show',
        assignedTo: 'sales2',
        assignedToName: 'Mike Chen',
        isStarred: false,
        nextContactDate: '2024-06-25',
        totalDeals: 0,
        totalRevenue: 0,
        createdBy: 'sales2',
        createdByName: 'Mike Chen',
        createdAt: '2024-05-20',
        updatedAt: '2024-06-05',
      },
      {
        id: '3',
        firstName: 'Robert',
        lastName: 'Chen',
        email: 'r.chen@megabuilders.com',
        phone: '+1-555-0789',
        title: 'Chief Engineer',
        company: 'Mega Builders LLC',
        contactType: 'customer',
        status: 'active',
        address: {
          street: '789 Construction Way',
          city: 'Los Angeles',
          state: 'CA',
          zipCode: '90001',
          country: 'USA',
        },
        tags: ['engineering', 'technical-contact', 'west-coast'],
        notes:
          'Technical expert who influences equipment selection. Focus on specifications and safety.',
        leadSource: 'Referral',
        assignedTo: 'sales1',
        assignedToName: 'Sarah Johnson',
        isStarred: true,
        lastContactDate: '2024-06-08',
        nextContactDate: '2024-06-18',
        totalDeals: 3,
        totalRevenue: 280000,
        createdBy: 'sales1',
        createdByName: 'Sarah Johnson',
        createdAt: '2024-02-10',
        updatedAt: '2024-06-08',
      },
      {
        id: '4',
        firstName: 'Lisa',
        lastName: 'Thompson',
        email: 'lisa.thompson@equipmentpartners.com',
        phone: '+1-555-0321',
        title: 'Procurement Manager',
        company: 'Equipment Partners',
        contactType: 'partner',
        status: 'active',
        address: {
          street: '321 Partner Plaza',
          city: 'Denver',
          state: 'CO',
          zipCode: '80201',
          country: 'USA',
        },
        tags: ['partner', 'procurement', 'bulk-orders'],
        notes: 'Strategic partner for equipment procurement. Volume discount agreements in place.',
        leadSource: 'Partnership',
        assignedTo: 'sales2',
        assignedToName: 'Mike Chen',
        isStarred: false,
        lastContactDate: '2024-06-12',
        nextContactDate: '2024-07-01',
        totalDeals: 8,
        totalRevenue: 620000,
        createdBy: 'admin',
        createdByName: 'Admin User',
        createdAt: '2024-01-05',
        updatedAt: '2024-06-12',
      },
    ];

    const mockActivities: ContactActivity[] = [
      {
        id: '1',
        contactId: '1',
        type: 'call',
        subject: 'Follow-up on crane rental inquiry',
        description: 'Discussed requirements for upcoming warehouse project',
        date: '2024-06-10',
        createdBy: 'sales1',
        createdByName: 'Sarah Johnson',
      },
      {
        id: '2',
        contactId: '2',
        type: 'email',
        subject: 'Heavy lift equipment proposal',
        description: 'Sent detailed proposal for industrial lifting requirements',
        date: '2024-06-05',
        createdBy: 'sales2',
        createdByName: 'Mike Chen',
      },
    ];

    setTimeout(() => {
      setContacts(mockContacts);
      setActivities(mockActivities);
      setLoading(false);
    }, 500);
  }, []);

  const filteredContacts = contacts.filter(contact => {
    const fullName = `${contact.firstName} ${contact.lastName}`.toLowerCase();
    const matchesSearch =
      fullName.includes(searchTerm.toLowerCase()) ||
      contact.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      contact.company.toLowerCase().includes(searchTerm.toLowerCase()) ||
      contact.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesType = typeFilter === 'all' || contact.contactType === typeFilter;
    const matchesStatus = statusFilter === 'all' || contact.status === statusFilter;
    const matchesStarred = !showStarredOnly || contact.isStarred;

    return matchesSearch && matchesType && matchesStatus && matchesStarred;
  });

  const getContactActivities = (contactId: string) => {
    return activities.filter(activity => activity.contactId === contactId);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-blue"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Contact Management</h1>
          <p className="text-gray-600">Manage your business contacts and relationships</p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <button
            onClick={() => setViewMode(viewMode === 'cards' ? 'list' : 'cards')}
            className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            <Filter size={18} />
            {viewMode === 'cards' ? 'List View' : 'Card View'}
          </button>

          <div className="flex gap-2">
            <button className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
              <Upload size={18} />
              Import
            </button>
            <button className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
              <Download size={18} />
              Export
            </button>
          </div>

          <button className="flex items-center gap-2 bg-brand-blue text-white px-4 py-2 rounded-lg hover:bg-brand-blue/90">
            <Plus size={18} />
            New Contact
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4 bg-white p-4 rounded-lg border border-gray-200">
        <div className="flex-1">
          <div className="relative">
            <Search
              className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
              size={18}
            />
            <input
              type="text"
              placeholder="Search contacts..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-blue focus:border-transparent"
            />
          </div>
        </div>

        <select
          value={typeFilter}
          onChange={e => setTypeFilter(e.target.value as ContactType | 'all')}
          className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-blue"
        >
          <option value="all">All Types</option>
          {CONTACT_TYPES.map(type => (
            <option key={type.value} value={type.value}>
              {type.label}
            </option>
          ))}
        </select>

        <select
          value={statusFilter}
          onChange={e => setStatusFilter(e.target.value as ContactStatus | 'all')}
          className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-blue"
        >
          <option value="all">All Statuses</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
          <option value="qualified">Qualified</option>
          <option value="unqualified">Unqualified</option>
        </select>

        <button
          onClick={() => setShowStarredOnly(!showStarredOnly)}
          className={`flex items-center gap-2 px-3 py-2 border rounded-lg ${
            showStarredOnly
              ? 'bg-yellow-50 text-yellow-700 border-yellow-200'
              : 'border-gray-300 hover:bg-gray-50'
          }`}
        >
          <Star size={16} className={showStarredOnly ? 'fill-current' : ''} />
          Starred
        </button>
      </div>

      {/* Contacts Display */}
      {viewMode === 'cards' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredContacts.map(contact => {
            const contactType = CONTACT_TYPES.find(t => t.value === contact.contactType);
            return (
              <div
                key={contact.id}
                className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-lg transition-all"
              >
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-brand-blue/10 flex items-center justify-center">
                      <User className="text-brand-blue" size={20} />
                    </div>
                    <div>
                      <h3 className="font-semibold text-lg text-gray-900">
                        {contact.firstName} {contact.lastName}
                      </h3>
                      <p className="text-gray-600 text-sm">{contact.title}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        setContacts(
                          contacts.map(c =>
                            c.id === contact.id ? { ...c, isStarred: !c.isStarred } : c
                          )
                        );
                      }}
                      className="text-gray-400 hover:text-yellow-500"
                    >
                      <Star
                        size={16}
                        className={contact.isStarred ? 'fill-current text-yellow-500' : ''}
                      />
                    </button>
                    <span
                      className={`text-xs px-2 py-1 rounded-full font-medium ${contactType?.color}`}
                    >
                      {contactType?.label}
                    </span>
                  </div>
                </div>

                <div className="space-y-3 mb-4">
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Building size={14} />
                    <span>{contact.company}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Mail size={14} />
                    <span className="truncate">{contact.email}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Phone size={14} />
                    <span>{contact.phone}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <MapPin size={14} />
                    <span>
                      {contact.address.city}, {contact.address.state}
                    </span>
                  </div>
                </div>

                <div className="flex flex-wrap gap-1 mb-4">
                  {contact.tags.slice(0, 3).map(tag => (
                    <span
                      key={tag}
                      className="text-xs px-2 py-1 bg-gray-100 text-gray-700 rounded-full"
                    >
                      {tag}
                    </span>
                  ))}
                  {contact.tags.length > 3 && (
                    <span className="text-xs px-2 py-1 bg-gray-100 text-gray-700 rounded-full">
                      +{contact.tags.length - 3}
                    </span>
                  )}
                </div>

                <div className="flex justify-between text-sm text-gray-500 mb-4">
                  <span>{contact.totalDeals} deals</span>
                  <span>₹{contact.totalRevenue.toLocaleString()}</span>
                </div>

                <div className="flex gap-2 pt-3 border-t">
                  <button
                    onClick={() => setSelectedContact(contact)}
                    className="flex-1 flex items-center justify-center gap-1 py-2 px-3 text-xs bg-blue-50 text-blue-700 rounded hover:bg-blue-100"
                  >
                    <Eye size={12} />
                    View
                  </button>
                  <button className="flex-1 flex items-center justify-center gap-1 py-2 px-3 text-xs bg-green-50 text-green-700 rounded hover:bg-green-100">
                    <MessageSquare size={12} />
                    Contact
                  </button>
                  <button className="flex items-center justify-center gap-1 py-2 px-3 text-xs bg-gray-50 text-gray-700 rounded hover:bg-gray-100">
                    <Edit size={12} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left py-3 px-4 font-medium text-gray-900">Contact</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-900">Company</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-900">Type</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-900">Status</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-900">Phone</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-900">Location</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-900">Revenue</th>
                  <th className="text-right py-3 px-4 font-medium text-gray-900">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredContacts.map(contact => {
                  const contactType = CONTACT_TYPES.find(t => t.value === contact.contactType);
                  return (
                    <tr key={contact.id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-brand-blue/10 flex items-center justify-center">
                            <User className="text-brand-blue" size={14} />
                          </div>
                          <div>
                            <div className="font-medium text-gray-900 flex items-center gap-2">
                              {contact.firstName} {contact.lastName}
                              {contact.isStarred && (
                                <Star size={12} className="fill-current text-yellow-500" />
                              )}
                            </div>
                            <div className="text-sm text-gray-500">{contact.title}</div>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-sm">{contact.company}</td>
                      <td className="py-3 px-4">
                        <span
                          className={`text-xs px-2 py-1 rounded-full font-medium ${contactType?.color}`}
                        >
                          {contactType?.label}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`text-xs px-2 py-1 rounded-full font-medium border ${STATUS_COLORS[contact.status]}`}
                        >
                          {contact.status.toUpperCase()}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-sm">{contact.phone}</td>
                      <td className="py-3 px-4 text-sm">
                        {contact.address.city}, {contact.address.state}
                      </td>
                      <td className="py-3 px-4 text-sm font-medium">
                        ₹{contact.totalRevenue.toLocaleString()}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => setSelectedContact(contact)}
                            className="p-1 text-gray-400 hover:text-blue-600 rounded"
                          >
                            <Eye size={16} />
                          </button>
                          <button className="p-1 text-gray-400 hover:text-green-600 rounded">
                            <MessageSquare size={16} />
                          </button>
                          <button className="p-1 text-gray-400 hover:text-gray-600 rounded">
                            <Edit size={16} />
                          </button>
                          <button className="p-1 text-gray-400 hover:text-red-600 rounded">
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {filteredContacts.length === 0 && (
        <div className="text-center py-12">
          <User className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No contacts found</h3>
          <p className="text-gray-600 mb-4">Get started by adding your first contact.</p>
          <button className="bg-brand-blue text-white px-4 py-2 rounded-lg hover:bg-brand-blue/90">
            Add Contact
          </button>
        </div>
      )}

      {/* Contact Detail Modal */}
      {selectedContact && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-full bg-brand-blue/10 flex items-center justify-center">
                    <User className="text-brand-blue" size={24} />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">
                      {selectedContact.firstName} {selectedContact.lastName}
                    </h2>
                    <p className="text-gray-600">
                      {selectedContact.title} at {selectedContact.company}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedContact(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ×
                </button>
              </div>
            </div>

            <div className="p-6">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-6">
                  <div>
                    <h3 className="text-lg font-medium text-gray-900 mb-4">Contact Information</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="flex items-center gap-2">
                        <Mail size={16} className="text-gray-400" />
                        <span className="text-sm">{selectedContact.email}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Phone size={16} className="text-gray-400" />
                        <span className="text-sm">{selectedContact.phone}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Building size={16} className="text-gray-400" />
                        <span className="text-sm">{selectedContact.company}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <MapPin size={16} className="text-gray-400" />
                        <span className="text-sm">
                          {selectedContact.address.city}, {selectedContact.address.state}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-lg font-medium text-gray-900 mb-4">Recent Activities</h3>
                    <div className="space-y-3">
                      {getContactActivities(selectedContact.id).map(activity => (
                        <div
                          key={activity.id}
                          className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg"
                        >
                          <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                            {activity.type === 'call' && (
                              <Phone size={14} className="text-blue-600" />
                            )}
                            {activity.type === 'email' && (
                              <Mail size={14} className="text-blue-600" />
                            )}
                            {activity.type === 'meeting' && (
                              <Calendar size={14} className="text-blue-600" />
                            )}
                            {activity.type === 'note' && (
                              <MessageSquare size={14} className="text-blue-600" />
                            )}
                          </div>
                          <div className="flex-1">
                            <div className="font-medium text-gray-900">{activity.subject}</div>
                            <div className="text-sm text-gray-600 mb-1">{activity.description}</div>
                            <div className="text-xs text-gray-500">
                              {new Date(activity.date).toLocaleDateString()} by{' '}
                              {activity.createdByName}
                            </div>
                          </div>
                        </div>
                      ))}
                      {getContactActivities(selectedContact.id).length === 0 && (
                        <p className="text-gray-500 text-center py-4">No recent activities</p>
                      )}
                    </div>
                  </div>
                </div>

                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-medium text-gray-900 mb-4">Summary</h3>
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Total Deals:</span>
                        <span className="font-medium">{selectedContact.totalDeals}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Total Revenue:</span>
                        <span className="font-medium text-green-600">
                          ₹{selectedContact.totalRevenue.toLocaleString()}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Lead Source:</span>
                        <span className="font-medium">{selectedContact.leadSource}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Assigned To:</span>
                        <span className="font-medium">{selectedContact.assignedToName}</span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-lg font-medium text-gray-900 mb-4">Tags</h3>
                    <div className="flex flex-wrap gap-2">
                      {selectedContact.tags.map(tag => (
                        <span
                          key={tag}
                          className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded-full"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>

                  {selectedContact.notes && (
                    <div>
                      <h3 className="text-lg font-medium text-gray-900 mb-4">Notes</h3>
                      <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded-lg">
                        {selectedContact.notes}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
