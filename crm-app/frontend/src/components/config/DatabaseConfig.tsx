import React, { useState, useEffect } from 'react';
import { Database, Server, Save, RefreshCw, CheckCircle } from 'lucide-react';
import { Input } from '../common/Input';
import { Button } from '../common/Button';
import { Toast } from '../common/Toast';
import { getHeaders } from '../../utils/apiHeaders';

export interface DbConfig {
  host: string;
  port: number;
  database: string;
  user: string;
  password?: string;
  ssl: boolean;
}

export const DatabaseConfig = () => {
  const [config, setConfig] = useState<DbConfig>({
    host: 'localhost',
    port: 5432,
    database: 'asp_crm',
    user: 'postgres',
    password: '',
    ssl: false,
  });

  const [loading, setLoading] = useState(true);
  const [testing, setTesting] = useState(false);
  const [saving, setSaving] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'untested' | 'success' | 'failed'>(
    'untested'
  );

  const [toast, setToast] = useState<{
    show: boolean;
    title: string;
    variant?: 'success' | 'error' | 'warning';
  }>({ show: false, title: '' });
  const showToast = (title: string, variant: 'success' | 'error' | 'warning' = 'success') => {
    setToast({ show: true, title, variant });
    // Longer timeout for success messages regarding configuration changes
    const timeout = variant === 'success' ? 5000 : 3000;
    setTimeout(() => setToast({ show: false, title: '' }), timeout);
  };

  useEffect(() => {
    fetchDbConfig();
  }, []);
  const fetchDbConfig = async () => {
    setLoading(true);
    try {
      // Fetch database configuration from our API endpoint
      const response = await fetch('/api/dbconfig', {
        method: 'GET',
        headers: getHeaders(),
      });

      if (!response.ok) {
        throw new Error('Failed to fetch database configuration');
      }

      const data = await response.json();

      if (data.success && data.data) {
        setConfig({
          host: data.data.host || 'localhost',
          port: data.data.port || 5432,
          database: data.data.database || 'asp_crm',
          user: data.data.user || 'postgres',
          password: '', // Don't set password from API for security reasons
          ssl: data.data.ssl || false,
        });
      }
    } catch (error) {
      console.error('Failed to fetch database config:', error);
      showToast('Failed to load database configuration', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setConfig(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : type === 'number' ? parseInt(value) || 0 : value,
    }));
  };
  const handleSave = async () => {
    setSaving(true);
    try {
      // Save directly to our enhanced API endpoint
      const response = await fetch('/api/dbconfig', {
        method: 'PUT',
        headers: getHeaders(),
        body: JSON.stringify(config),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        // Show success message with a note about server restart
        showToast(
          'Database configuration saved successfully. Please restart the server for changes to take effect.',
          'success'
        );

        // Reset connection status since configuration has changed
        setConnectionStatus('untested');
      } else {
        throw new Error(data.message || 'Unknown error');
      }
    } catch (error) {
      console.error('Failed to save database config:', error);
      showToast(
        `Failed to save database configuration: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'error'
      );
    } finally {
      setSaving(false);
    }
  };
  const testConnection = async () => {
    setTesting(true);
    setConnectionStatus('untested');

    try {
      // Use our enhanced API endpoint to test the connection with current settings
      const response = await fetch('/api/dbconfig/test', {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(config),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setConnectionStatus('success');
        showToast(
          `Connection successful! PostgreSQL ${data.data?.version?.split(' ')[1] || 'server'} is running.`,
          'success'
        );
      } else {
        setConnectionStatus('failed');
        showToast(`Connection failed: ${data.message || 'Unknown error'}`, 'error');
      }
    } catch (error) {
      console.error('Connection test error:', error);
      setConnectionStatus('failed');
      showToast('Connection test failed. See console for details.', 'error');
    } finally {
      setTesting(false);
    }
  };

  if (loading) {
    return <div className="p-4 text-center">Loading database configuration...</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="font-medium mb-2">Database Connection Settings</h3>
        <p className="text-sm text-gray-500 mb-4">
          Configure the PostgreSQL database connection parameters. Changes will take effect after
          server restart.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Host</label>
          <Input
            name="host"
            value={config.host}
            onChange={handleChange}
            placeholder="localhost"
            leftIcon={<Server className="h-4 w-4" />}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Port</label>
          <Input
            name="port"
            type="number"
            value={config.port}
            onChange={handleChange}
            placeholder="5432"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Database Name</label>
          <Input
            name="database"
            value={config.database}
            onChange={handleChange}
            placeholder="asp_crm"
            leftIcon={<Database className="h-4 w-4" />}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Username</label>
          <Input name="user" value={config.user} onChange={handleChange} placeholder="postgres" />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
          <Input
            name="password"
            type="password"
            value={config.password || ''}
            onChange={handleChange}
            placeholder="Leave blank to keep existing password"
          />
        </div>

        <div className="flex items-center space-x-2 mt-8">
          <input
            type="checkbox"
            id="dbConfig-ssl"
            name="ssl"
            checked={config.ssl}
            onChange={handleChange}
            className="h-4 w-4 text-blue-600 rounded"
          />
          <label htmlFor="dbConfig-ssl" className="text-sm text-gray-700">
            Enable SSL/TLS
          </label>
        </div>
      </div>
      <div className="flex justify-between pt-4 border-t">
        <Button
          variant="outline"
          onClick={testConnection}
          disabled={testing}
          leftIcon={testing ? <RefreshCw className="h-4 w-4 animate-spin" /> : undefined}
          rightIcon={
            connectionStatus === 'success' ? (
              <CheckCircle className="h-4 w-4 text-green-500" />
            ) : undefined
          }
        >
          {testing ? 'Testing...' : 'Test Connection'}
        </Button>

        <Button
          onClick={handleSave}
          disabled={saving}
          leftIcon={
            saving ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />
          }
        >
          {saving ? 'Saving...' : 'Save Configuration'}
        </Button>
      </div>

      {toast.show && (
        <Toast
          title={toast.title}
          variant={toast.variant}
          onClose={() => setToast({ show: false, title: '' })}
        />
      )}
    </div>
  );
};
