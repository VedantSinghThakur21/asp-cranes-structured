import React, { useState } from 'react';
import userService, { CreateUserData } from '../../services/userService';

interface SimpleUserFormProps {
  onSuccess: () => void;
  onCancel: () => void;
}

export const SimpleUserForm: React.FC<SimpleUserFormProps> = ({ onSuccess, onCancel }) => {
  const [formData, setFormData] = useState<CreateUserData>({
    email: '',
    password: '',
    name: '',
    role: 'operator',
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      await userService.createUser(formData);
      onSuccess();
    } catch (err: any) {
      setError(err.message || 'Failed to create user');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="p-4 bg-white rounded-lg shadow">
      <h2 className="text-xl font-semibold mb-4">Add New User</h2>

      {error && <div className="mb-4 p-3 bg-red-100 text-red-800 rounded-md">{error}</div>}

      <form onSubmit={handleSubmit}>
        <div className="mb-4">
          <label className="block text-sm font-medium mb-1">Name</label>
          <input
            type="text"
            name="name"
            value={formData.name}
            onChange={handleChange}
            className="w-full p-2 border rounded"
            required
          />
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium mb-1">Email</label>
          <input
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            className="w-full p-2 border rounded"
            required
          />
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium mb-1">Password</label>
          <input
            type="password"
            name="password"
            value={formData.password}
            onChange={handleChange}
            className="w-full p-2 border rounded"
            required
          />
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium mb-1">Role</label>
          <select
            name="role"
            value={formData.role}
            onChange={handleChange}
            className="w-full p-2 border rounded"
          >
            <option value="admin">Admin</option>
            <option value="sales_agent">Sales Agent</option>
            <option value="operations_manager">Operations Manager</option>
            <option value="operator">Operator</option>
            <option value="support">Support</option>
          </select>
        </div>

        <div className="flex justify-end space-x-3 mt-6">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 border rounded"
            disabled={isSubmitting}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-4 py-2 bg-blue-600 text-white rounded"
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Creating...' : 'Create User'}
          </button>
        </div>
      </form>
    </div>
  );
};
