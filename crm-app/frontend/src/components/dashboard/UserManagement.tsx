import { useState, useEffect } from 'react';
import { Card } from '../common/Card';
import { Badge } from '../common/Badge';
import { Button } from '../common/Button';
import {
  Users,
  Plus,
  Search,
  MoreVertical,
  User as UserIcon,
  Mail,
  Phone,
  Shield,
  Edit2,
  Trash2,
  AlertCircle,
  RefreshCw,
} from 'lucide-react';
import { UserForm } from './UserForm';
import userService, { User, UserListParams } from '../../services/userService';

interface UserManagementProps {
  className?: string;
}

export function UserManagement({ className }: UserManagementProps) {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalUsers, setTotalUsers] = useState(0);
  const [selectedRole, setSelectedRole] = useState<string>('');
  const [selectedStatus, setSelectedStatus] = useState<string>('');
  const [filterDebounce, setFilterDebounce] = useState<NodeJS.Timeout | null>(null);

  const fetchUsers = async () => {
    setLoading(true);
    setError(null);

    try {
      // Continue with authenticated request directly
      const params: UserListParams = {
        page,
        limit: 10,
        search: searchTerm,
      };

      if (selectedRole) params.role = selectedRole;
      if (selectedStatus) params.status = selectedStatus;

      const response = await userService.getUsers(params);
      setUsers(response.users);
      setTotalPages(response.pagination.pages);
      setTotalUsers(response.pagination.total);
    } catch (err) {
      console.error('Error fetching users:', err);
      setError('Failed to load users. Please try again.');
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);

  // Handle filter changes with debounce
  useEffect(() => {
    if (filterDebounce) clearTimeout(filterDebounce);

    const timeout = setTimeout(() => {
      setPage(1); // Reset to first page
      fetchUsers();
    }, 400);

    setFilterDebounce(timeout);

    return () => {
      if (filterDebounce) clearTimeout(filterDebounce);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchTerm, selectedRole, selectedStatus]);

  const handleEditUser = (user: User) => {
    setSelectedUser(user);
    setShowEditForm(true);
  };

  const handleDeleteUser = async (userId: string) => {
    if (
      window.confirm('Are you sure you want to delete this user? This action cannot be undone.')
    ) {
      setIsDeleting(userId);
      try {
        await userService.deleteUser(userId);
        setUsers(prevUsers => prevUsers.filter(user => user.id !== userId));
      } catch (err) {
        console.error('Error deleting user:', err);
        alert('Failed to delete user. Please try again.');
      } finally {
        setIsDeleting(null);
      }
    }
  };

  const handleSaveUser = (user: User) => {
    if (showEditForm) {
      setUsers(prevUsers => prevUsers.map(u => (u.id === user.id ? user : u)));
      setShowEditForm(false);
    } else {
      setUsers(prevUsers => [user, ...prevUsers]);
      setShowAddForm(false);
    }
    setSelectedUser(null);
  };

  const formatLastActive = (date: string) => {
    if (!date) return 'Never';

    const lastActive = new Date(date);
    const now = new Date();
    const diffMs = now.getTime() - lastActive.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return lastActive.toLocaleDateString();
  };

  const formatRole = (role: User['role']): string => {
    switch (role) {
      case 'admin':
        return 'Admin';
      case 'sales_agent':
        return 'Sales Agent';
      case 'operations_manager':
        return 'Operations Manager';
      case 'operator':
        return 'Operator';
      case 'support':
        return 'Support';
      default:
        return role;
    }
  };

  const formatStatus = (status: User['status']): string => {
    switch (status) {
      case 'active':
        return 'Active';
      case 'inactive':
        return 'Inactive';
      case 'pending':
        return 'Pending';
      default:
        return status;
    }
  };

  const getRoleColor = (role: User['role']): string => {
    switch (role) {
      case 'admin':
        return 'bg-purple-100 text-purple-800';
      case 'sales_agent':
        return 'bg-blue-100 text-blue-800';
      case 'operations_manager':
        return 'bg-green-100 text-green-800';
      case 'operator':
        return 'bg-orange-100 text-orange-800';
      case 'support':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusColor = (status: User['status']): string => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'inactive':
        return 'bg-red-100 text-red-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <Card className={`p-6 ${className}`}>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <Users className="h-5 w-5 text-gray-600" />
          <h3 className="text-lg font-semibold text-gray-900">User Management</h3>
        </div>

        <Button
          onClick={() => setShowAddForm(true)}
          size="sm"
          className="flex items-center space-x-2"
        >
          <Plus className="h-4 w-4" />
          <span>Add User</span>
        </Button>
      </div>

      {/* Search and Filters */}
      <div className="space-y-4 mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search users..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        <div className="flex items-center space-x-4">
          <div className="w-1/2">
            <select
              value={selectedRole}
              onChange={e => setSelectedRole(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
            >
              <option value="">All Roles</option>
              <option value="admin">Admin</option>
              <option value="sales_agent">Sales Agent</option>
              <option value="operations_manager">Operations Manager</option>
              <option value="operator">Operator</option>
              <option value="support">Support</option>
            </select>
          </div>

          <div className="w-1/2">
            <select
              value={selectedStatus}
              onChange={e => setSelectedStatus(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
            >
              <option value="">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="pending">Pending</option>
            </select>
          </div>
        </div>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="text-center py-8">
          <RefreshCw className="h-8 w-8 mx-auto mb-2 text-blue-500 animate-spin" />
          <p className="text-gray-500">Loading users...</p>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="text-center py-8">
          <AlertCircle className="h-8 w-8 mx-auto mb-2 text-red-500" />
          <p className="text-red-500 mb-2">{error}</p>
          <Button onClick={fetchUsers} size="sm">
            Try Again
          </Button>
        </div>
      )}

      {/* Empty State */}
      {!loading && !error && users.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          <UserIcon className="h-8 w-8 mx-auto mb-2 text-gray-400" />
          <p>No users found matching your filters.</p>
        </div>
      )}

      {/* Users List */}
      {!loading && !error && users.length > 0 && (
        <div className="space-y-4">
          {users.map(user => (
            <div
              key={user.id}
              className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-center space-x-4">
                <div className="flex-shrink-0">
                  <div className="w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center">
                    <UserIcon className="h-6 w-6 text-gray-600" />
                  </div>
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-2 mb-1">
                    <p className="text-sm font-medium text-gray-900 truncate">{user.name}</p>
                    <Badge className={`${getRoleColor(user.role)}`}>{formatRole(user.role)}</Badge>
                    <Badge className={`${getStatusColor(user.status)}`}>
                      {formatStatus(user.status)}
                    </Badge>
                  </div>

                  <div className="flex items-center space-x-4 text-xs text-gray-500">
                    <div className="flex items-center space-x-1">
                      <Mail className="h-3 w-3" />
                      <span className="truncate">{user.email}</span>
                    </div>

                    {user.phone && (
                      <div className="flex items-center space-x-1">
                        <Phone className="h-3 w-3" />
                        <span>{user.phone}</span>
                      </div>
                    )}

                    <div className="flex items-center space-x-1">
                      <Shield className="h-3 w-3" />
                      <span>Last active: {formatLastActive(user.updated_at)}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center space-x-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleEditUser(user)}
                  className="p-2 h-8 w-8"
                >
                  <Edit2 className="h-4 w-4" />
                </Button>

                {user.role !== 'admin' && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDeleteUser(user.id)}
                    className="p-2 h-8 w-8 text-red-600 hover:text-red-800"
                    disabled={isDeleting === user.id}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}

                <Button variant="ghost" size="sm" className="p-2 h-8 w-8">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {!loading && !error && users.length > 0 && (
        <div className="mt-6 pt-4 border-t border-gray-200 flex items-center justify-between">
          <p className="text-sm text-gray-600">
            Showing {users.length} of {totalUsers} users
          </p>

          <div className="flex items-center space-x-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setPage(p => Math.max(p - 1, 1))}
              disabled={page === 1}
            >
              Previous
            </Button>

            <span className="text-sm text-gray-600">
              Page {page} of {totalPages}
            </span>

            <Button
              variant="ghost"
              size="sm"
              onClick={() => setPage(p => Math.min(p + 1, totalPages))}
              disabled={page === totalPages}
            >
              Next
            </Button>
          </div>
        </div>
      )}

      {/* Add/Edit User Forms */}
      {showAddForm && <UserForm onSave={handleSaveUser} onCancel={() => setShowAddForm(false)} />}

      {showEditForm && selectedUser && (
        <UserForm
          user={selectedUser}
          onSave={handleSaveUser}
          onCancel={() => {
            setShowEditForm(false);
            setSelectedUser(null);
          }}
        />
      )}
    </Card>
  );
}
