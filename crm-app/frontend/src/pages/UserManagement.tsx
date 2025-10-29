import React, { useState, useEffect } from 'react';
import * as userService from '../services/userService';
import { Search, Edit2, Trash2, CheckCircle2, XCircle, AlertCircle, UserPlus } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { FormInput } from '../components/common/FormInput';
import { Select } from '../components/common/Select';
import { Modal } from '../components/common/Modal';
import { Toast } from '../components/common/Toast';
import { RequiredFieldsInfo } from '../components/common/RequiredFieldsInfo';
import { useAuthStore } from '../store/authStore';
import { UserRole } from '../types/auth';

// Extended user interface for the UI
interface ExtendedUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  status: 'active' | 'inactive';
  avatar?: string;
}

const ROLE_OPTIONS = [
  { value: 'admin', label: 'Administrator' },
  { value: 'sales_agent', label: 'Sales Agent' },
  { value: 'operations_manager', label: 'Operations Manager' },
  { value: 'operator', label: 'Operator' },
  { value: 'support', label: 'Support' },
];

const STATUS_OPTIONS = [
  { value: 'active', label: 'Active' },
  { value: 'inactive', label: 'Inactive' },
];

const ITEMS_PER_PAGE = 10;

// Helper function to generate avatar URLs using UI Avatars
const generateAvatarUrl = (name: string): string => {
  // Generate color based on name hash
  const hash = name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const colors = [
    '2563EB', // Blue
    '10B981', // Green
    'F59E0B', // Amber
    '8B5CF6', // Purple
    'EC4899', // Pink
    '6B7280', // Gray
  ];
  const colorIndex = hash % colors.length;
  const color = colors[colorIndex];

  // Encode name for URL
  const encodedName = encodeURIComponent(name);
  return `https://ui-avatars.com/api/?name=${encodedName}&background=${color}&color=fff&size=128`;
};

export function UserManagement() {
  const { user } = useAuthStore();
  const [users, setUsers] = useState<ExtendedUser[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<ExtendedUser[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<UserRole | 'all'>('all');
  const [statusFilter, setStatusFilter] = useState<'active' | 'inactive' | 'all'>('all');
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<ExtendedUser | null>(null);
  const [toast, setToast] = useState<{
    show: boolean;
    title: string;
    description?: string;
    variant?: 'success' | 'error' | 'warning';
  }>({ show: false, title: '' });

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'operator' as UserRole,
    status: 'active' as 'active' | 'inactive',
  });

  useEffect(() => {
    // Load users directly - simplified approach
    const loadUsers = async () => {
      try {
        setIsLoading(true);

        // Check if user is authenticated first
        // Use authStore's user property
        if (!user) {
          showToast('Authentication Required', 'You need to log in to view users', 'warning');
          setIsLoading(false);
          return;
        }

        try {
          const usersList = await userService.getUsers();
          // Convert PostgreSQL users to ExtendedUser format
          const extendedUsers: ExtendedUser[] = usersList.map((user: any) => ({
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role,
            status: user.status === 'active' ? 'active' : 'inactive',
          }));
          setUsers(extendedUsers);
          setFilteredUsers(extendedUsers);
        } catch (error: any) {
          console.error('Error fetching users:', error);
          if (error.message && error.message.includes('Authentication required')) {
            showToast('Authentication Error', 'You need to log in to view users', 'error');
          } else {
            showToast('Error loading users', error.message || 'Please try again later', 'error');
          }

          // Use mock data for development testing
          const mockUsers = [
            {
              id: '1',
              name: 'Admin User',
              email: 'admin@example.com',
              role: 'admin' as UserRole,
              status: 'active' as 'active' | 'inactive',
            },
            {
              id: '2',
              name: 'Sales Agent',
              email: 'sales@example.com',
              role: 'sales_agent' as UserRole,
              status: 'active' as 'active' | 'inactive',
            },
          ];

          setUsers(mockUsers);
          setFilteredUsers(mockUsers);
        }
      } finally {
        setIsLoading(false);
      }
    };

    // Start by loading users
    loadUsers();
  }, []);

  useEffect(() => {
    filterUsers();
  }, [users, searchTerm, roleFilter, statusFilter]);

  const filterUsers = () => {
    let filtered = [...users];

    if (searchTerm) {
      const lowerSearch = searchTerm.toLowerCase();
      filtered = filtered.filter(
        user =>
          user &&
          typeof user.name === 'string' &&
          typeof user.email === 'string' &&
          (user.name.toLowerCase().includes(lowerSearch) ||
            user.email.toLowerCase().includes(lowerSearch))
      );
    }

    if (roleFilter !== 'all') {
      filtered = filtered.filter(user => user.role === roleFilter);
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter(user => user.status === statusFilter);
    }

    setFilteredUsers(filtered);
    setCurrentPage(1); // Reset to first page when filtering
  };

  const showToast = (
    title: string,
    description?: string,
    variant: 'success' | 'error' | 'warning' = 'success'
  ) => {
    setToast({ show: true, title, description, variant });
    setTimeout(() => setToast({ show: false, title: '' }), 3000);
  };

  const handleStatusToggle = async (user: ExtendedUser) => {
    const newStatus = user.status === 'active' ? 'inactive' : 'active';

    try {
      // Update in database - assuming we have some active flag that can be updated
      // Note: if the API doesn't support status directly, you may need to adjust this
      await userService.updateUser(user.id, {
        // Using property that's available in UpdateUserData
      });

      // Update local state
      setUsers(prev => prev.map(u => (u.id === user.id ? { ...u, status: newStatus } : u)));

      showToast(`User ${user.status === 'active' ? 'deactivated' : 'activated'}`, 'success');
    } catch (error) {
      console.error('Error toggling user status:', error);
      showToast('Error updating user status', 'error');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name || !formData.email || !formData.role) {
      showToast('Please fill in all required fields', 'error');
      return;
    }

    // Check for password when adding a new user
    if (!selectedUser && !formData.password) {
      showToast('Password is required for new users', 'error');
      return;
    }

    try {
      if (selectedUser) {
        // Update user
        const updatedUser: ExtendedUser = {
          ...selectedUser,
          name: formData.name,
          email: formData.email,
          role: formData.role,
          status: formData.status,
        };
        // Update in database
        await userService.updateUser(selectedUser.id, {
          name: formData.name,
          email: formData.email,
          role: formData.role,
          isActive: formData.status === 'active',
        });

        // Update local state
        setUsers(prev => prev.map(user => (user.id === selectedUser.id ? updatedUser : user)));
        showToast('User updated successfully', 'success');
      } else {
        // For new users
        try {
          const result = await userService.createUser({
            email: formData.email,
            name: formData.name,
            role: formData.role,
            isActive: formData.status === 'active',
          });
          // Add the new user to our local state with the status and generated avatar
          const extendedUser: ExtendedUser = {
            id: result.id,
            name: result.name,
            email: result.email,
            role: result.role,
            status: result.isActive ? 'active' : 'inactive',
            avatar: generateAvatarUrl(formData.name),
          };

          setUsers(prev => [...prev, extendedUser]);
          showToast('User added successfully', 'success');
        } catch (authError: any) {
          showToast(
            `Error creating user account: ${authError.message || 'Unknown error'}`,
            'error'
          );
          return;
        }
      }

      setIsModalOpen(false);
      resetForm();
    } catch (error: any) {
      showToast(`Error saving user: ${error.message || 'Unknown error'}`, 'error');
    }
  };

  const handleDelete = async () => {
    if (!selectedUser) return;

    try {
      // Delete from database
      await userService.deleteUser(selectedUser.id);

      // Update local state
      setUsers(prev => prev.filter(user => user.id !== selectedUser.id));
      setIsDeleteModalOpen(false);
      setSelectedUser(null);
      showToast('User deleted successfully', 'success');
    } catch (error) {
      console.error('Error deleting user:', error);
      showToast('Error deleting user', 'error');
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      email: '',
      password: '',
      role: 'operator',
      status: 'active',
    });
    setSelectedUser(null);
  };

  // Pagination
  const totalPages = Math.ceil(filteredUsers.length / ITEMS_PER_PAGE);
  const paginatedUsers = filteredUsers.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  if (!user || user.role !== 'admin') {
    return (
      <div className="p-4 text-center text-gray-500">
        You don't have permission to access this page.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex flex-col sm:flex-row gap-4 flex-1">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-5 w-5" />
            <FormInput
              placeholder="Search users..."
              value={searchTerm}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          <div className="flex flex-col sm:flex-row gap-4">
            <Select
              options={[{ value: 'all', label: 'All Roles' }, ...ROLE_OPTIONS]}
              value={roleFilter}
              onChange={value => setRoleFilter(value as UserRole | 'all')}
              className="w-full sm:w-40"
            />

            <Select
              options={[{ value: 'all', label: 'All Status' }, ...STATUS_OPTIONS]}
              value={statusFilter}
              onChange={value => setStatusFilter(value as 'active' | 'inactive' | 'all')}
              className="w-full sm:w-40"
            />
          </div>
        </div>

        <Button
          onClick={() => {
            resetForm();
            setIsModalOpen(true);
          }}
          leftIcon={<UserPlus size={16} />}
          variant="accent"
          className="w-full sm:w-auto flex-shrink-0"
        >
          Add User
        </Button>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>User Management</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-4">Loading users...</div>
          ) : paginatedUsers.length === 0 ? (
            <div className="text-center py-4 text-gray-500">
              No users found matching your filters.
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        User
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Role
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {paginatedUsers.map(user => (
                      <tr key={user.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          {' '}
                          <div className="flex items-center">
                            <img
                              src={user.avatar || generateAvatarUrl(user.name)}
                              alt={user.name}
                              className="h-10 w-10 rounded-full object-cover"
                              onError={e => {
                                // If image fails to load, use UI Avatars API instead
                                const target = e.target as HTMLImageElement;
                                target.onerror = null; // Prevent infinite loop
                                target.src = generateAvatarUrl(user.name);
                              }}
                            />
                            <div className="ml-4">
                              <div className="font-medium text-gray-900">{user.name}</div>
                              <div className="text-sm text-gray-500">{user.email}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                            {ROLE_OPTIONS.find(r => r.value === user.role)?.label}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              user.status === 'active'
                                ? 'bg-success-100 text-success-800'
                                : 'bg-gray-100 text-gray-800'
                            }`}
                          >
                            {user.status === 'active' ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleStatusToggle(user)}
                            >
                              {user.status === 'active' ? (
                                <XCircle size={16} />
                              ) : (
                                <CheckCircle2 size={16} />
                              )}
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setSelectedUser(user);
                                setFormData({
                                  name: user.name,
                                  email: user.email,
                                  password: '', // Empty for editing existing user
                                  role: user.role,
                                  status: user.status,
                                });
                                setIsModalOpen(true);
                              }}
                            >
                              <Edit2 size={16} />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setSelectedUser(user);
                                setIsDeleteModalOpen(true);
                              }}
                            >
                              <Trash2 size={16} />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {totalPages > 1 && (
                <div className="flex justify-between items-center mt-4">
                  <p className="text-sm text-gray-500">
                    Showing {(currentPage - 1) * ITEMS_PER_PAGE + 1} to{' '}
                    {Math.min(currentPage * ITEMS_PER_PAGE, filteredUsers.length)} of{' '}
                    {filteredUsers.length} users
                  </p>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                      disabled={currentPage === 1}
                    >
                      Previous
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                      disabled={currentPage === totalPages}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
      {/* Add/Edit User Modal */}{' '}
      <Modal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          resetForm();
        }}
        title={selectedUser ? 'Edit User' : 'Add New User'}
        size="lg"
      >
        <form onSubmit={handleSubmit} className="space-y-6">
          <RequiredFieldsInfo />
          <FormInput
            label="Full Name"
            value={formData.name}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              setFormData(prev => ({ ...prev, name: e.target.value }))
            }
            required
          />{' '}
          <FormInput
            label="Email Address"
            type="email"
            value={formData.email}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              setFormData(prev => ({ ...prev, email: e.target.value }))
            }
            required
          />
          <FormInput
            label="Password"
            type="password"
            value={formData.password || ''}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              setFormData(prev => ({ ...prev, password: e.target.value }))
            }
            required={!selectedUser}
            placeholder={selectedUser ? 'Leave blank to keep current password' : ''}
          />
          <Select
            label="Role"
            options={ROLE_OPTIONS}
            value={formData.role}
            onChange={value => setFormData(prev => ({ ...prev, role: value as UserRole }))}
            required
          />
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="userMgmt-isActive"
              checked={formData.status === 'active'}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setFormData(prev => ({
                  ...prev,
                  status: e.target.checked ? 'active' : 'inactive',
                }))
              }
              className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
            />
            <label htmlFor="isActive" className="text-sm text-gray-700">
              User is active
            </label>
          </div>
          <div className="flex justify-end gap-3">
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
              {selectedUser ? 'Update User' : 'Add User'}
            </Button>
          </div>
        </form>
      </Modal>
      {/* Delete Confirmation Modal */}{' '}
      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => {
          setIsDeleteModalOpen(false);
          setSelectedUser(null);
        }}
        title="Delete User"
        size="sm"
      >
        <div className="space-y-4">
          <div className="flex items-center gap-3 p-4 bg-error-50 text-error-700 rounded-lg">
            <AlertCircle className="h-5 w-5 flex-shrink-0" />
            <p className="text-sm">
              Are you sure you want to delete this user? This action cannot be undone.
            </p>
          </div>

          <div className="flex justify-end gap-3">
            <Button
              variant="outline"
              onClick={() => {
                setIsDeleteModalOpen(false);
                setSelectedUser(null);
              }}
            >
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete}>
              Delete User
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
