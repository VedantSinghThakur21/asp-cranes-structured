import React, { useState } from 'react';
import { createUser, updateUser } from '../../services/userService';
import { User, CreateUserData, UpdateUserData } from '../../types/auth';
import { Button } from '../common/Button';
import { X, Save, User as UserIcon } from 'lucide-react';

interface UserFormProps {
  user?: User; // If editing existing user
  onSave: (user: User) => void;
  onCancel: () => void;
}

export function UserForm({ user, onSave, onCancel }: UserFormProps) {
  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    role: user?.role || ('operator' as User['role']),
    password: '',
    confirmPassword: '',
    phone: user?.phone || '',
    avatar: user?.avatar || '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isEditing = !!user;

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Invalid email format';
    }

    if (!isEditing && !formData.password) {
      newErrors.password = 'Password is required';
    }

    if (formData.password && formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }

    if (formData.password && formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    try {
      if (isEditing && user) {
        // Update existing user
        const updateData: UpdateUserData = {
          name: formData.name,
          email: formData.email,
          role: formData.role,
          phone: formData.phone || undefined,
          avatar: formData.avatar || undefined,
        };

        // Only include password if it was changed
        if (formData.password) {
          updateData.password = formData.password;
        }

        const response = await updateUser(user.id, updateData);
        onSave(response);
      } else {
        // Create new user
        const createData: CreateUserData = {
          name: formData.name,
          email: formData.email,
          password: formData.password,
          role: formData.role,
          phone: formData.phone || undefined,
          avatar: formData.avatar || undefined,
        };

        const response = await createUser(createData);
        onSave(response);
      }
    } catch (error: any) {
      console.error('Error saving user:', error);
      setErrors({
        submit: error.response?.data?.message || 'Failed to save user',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <UserIcon className="h-5 w-5 text-gray-600" />
            <h2 className="text-lg font-semibold text-gray-900">
              {isEditing ? 'Edit User' : 'Add New User'}
            </h2>
          </div>
          <Button variant="ghost" size="sm" onClick={onCancel} className="p-2">
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* General Error */}
          {errors.submit && (
            <div className="bg-red-50 border border-red-200 rounded-md p-3">
              <p className="text-sm text-red-600">{errors.submit}</p>
            </div>
          )}

          {/* Name */}
          <div>
            <label htmlFor="userForm-name" className="block text-sm font-medium text-gray-700 mb-1">
              Full Name *
            </label>
            <input
              type="text"
              id="userForm-name"
              value={formData.name}
              onChange={e => handleInputChange('name', e.target.value)}
              className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                errors.name ? 'border-red-300' : 'border-gray-300'
              }`}
              placeholder="Enter full name"
            />
            {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name}</p>}
          </div>

          {/* Email */}
          <div>
            <label
              htmlFor="userForm-email"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Email Address *
            </label>
            <input
              type="email"
              id="userForm-email"
              value={formData.email}
              onChange={e => handleInputChange('email', e.target.value)}
              className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                errors.email ? 'border-red-300' : 'border-gray-300'
              }`}
              placeholder="Enter email address"
            />
            {errors.email && <p className="mt-1 text-sm text-red-600">{errors.email}</p>}
          </div>

          {/* Role */}
          <div>
            <label htmlFor="userForm-role" className="block text-sm font-medium text-gray-700 mb-1">
              Role *
            </label>
            <select
              id="userForm-role"
              value={formData.role}
              onChange={e => handleInputChange('role', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="operator">Operator</option>
              <option value="sales_agent">Sales Agent</option>
              <option value="operations_manager">Operations Manager</option>
              <option value="support">Support</option>
              <option value="admin">Admin</option>
            </select>
          </div>

          {/* Phone */}
          <div>
            <label
              htmlFor="userForm-phone"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Phone Number
            </label>
            <input
              type="tel"
              id="userForm-phone"
              value={formData.phone}
              onChange={e => handleInputChange('phone', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Enter phone number"
            />
          </div>

          {/* Password */}
          <div>
            <label
              htmlFor="userForm-password"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Password {!isEditing && '*'}
              {isEditing && (
                <span className="text-gray-500 text-xs">(leave blank to keep current)</span>
              )}
            </label>
            <input
              type="password"
              id="userForm-password"
              value={formData.password}
              onChange={e => handleInputChange('password', e.target.value)}
              className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                errors.password ? 'border-red-300' : 'border-gray-300'
              }`}
              placeholder={isEditing ? 'Enter new password' : 'Enter password'}
            />
            {errors.password && <p className="mt-1 text-sm text-red-600">{errors.password}</p>}
          </div>

          {/* Confirm Password */}
          {formData.password && (
            <div>
              <label
                htmlFor="userForm-confirmPassword"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Confirm Password *
              </label>
              <input
                type="password"
                id="userForm-confirmPassword"
                value={formData.confirmPassword}
                onChange={e => handleInputChange('confirmPassword', e.target.value)}
                className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  errors.confirmPassword ? 'border-red-300' : 'border-gray-300'
                }`}
                placeholder="Confirm password"
              />
              {errors.confirmPassword && (
                <p className="mt-1 text-sm text-red-600">{errors.confirmPassword}</p>
              )}
            </div>
          )}

          {/* Form Actions */}
          <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
            <Button type="button" variant="ghost" onClick={onCancel} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting} className="flex items-center space-x-2">
              <Save className="h-4 w-4" />
              <span>{isSubmitting ? 'Saving...' : isEditing ? 'Update User' : 'Create User'}</span>
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
