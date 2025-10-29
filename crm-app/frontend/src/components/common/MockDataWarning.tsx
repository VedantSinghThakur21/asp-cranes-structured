/**
 * Mock Data Warning Banner
 * Displays a prominent warning when mock data is being used instead of real API data
 */

import React, { useState, useEffect } from 'react';

interface MockDataWarningProps {
  data: any[] | null;
  dataType: 'leads' | 'quotations' | 'deals' | 'customers';
  className?: string;
}

const MockDataWarning: React.FC<MockDataWarningProps> = ({ data, dataType, className }) => {
  const [isMockData, setIsMockData] = useState(false);

  // Check if the data is mock data
  useEffect(() => {
    if (!data || data.length === 0) return;

    // Check if any item has the mock flag
    const hasMockFlag = data.some(item => item._mockFlag || item._source === 'mock_data');

    // Check if all items have mock IDs
    const hasMockIds = data.some(item => {
      const id = String(item.id || '');
      return id.startsWith('mock-') || id.includes('MOCK');
    });

    setIsMockData(hasMockFlag || hasMockIds);
  }, [data]);

  if (!isMockData) return null;

  return (
    <div
      className={`bg-orange-500 text-white p-3 mb-4 rounded-md shadow-md ${className || ''}`}
      style={{ border: '2px dashed #e53e3e' }}
    >
      <div className="flex items-center">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-6 w-6 mr-2"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
          />
        </svg>
        <div>
          <h3 className="font-bold text-lg">Mock Data In Use</h3>
          <p>
            You are currently viewing <strong>mock {dataType}</strong> data because the API
            connection failed. This data does not reflect real database content.
          </p>
        </div>
      </div>{' '}
      <div className="mt-2 text-sm">
        To fix this issue:
        <ul className="list-disc ml-5 mt-1">
          <li>Check that the API server is running</li>
          <li>Verify database connection settings</li>
          <li>
            Run <code className="bg-orange-700 p-1 rounded">npm run diagnose</code> to diagnose API
            issues
          </li>
          <li>
            Run <code className="bg-orange-700 p-1 rounded">npm run dev:full</code> to start both
            servers at once
          </li>
        </ul>
      </div>
      <div className="mt-2 p-2 bg-orange-600 rounded text-xs">
        <strong>TIP:</strong> The API server must be running at http://localhost:3001/api for real
        data to appear.
      </div>
    </div>
  );
};

export default MockDataWarning;
