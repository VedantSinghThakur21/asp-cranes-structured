import React, { useState, useEffect } from 'react';
import { getLeads } from '../../services/leadService';
import { getDeals } from '../../services/dealService';
import { getJobs } from '../../services/jobService';

export function DashboardDebug() {
  const [debugInfo, setDebugInfo] = useState({
    leads: { loading: true, data: null as any, error: null as string | null },
    deals: { loading: true, data: null as any, error: null as string | null },
    jobs: { loading: true, data: null as any, error: null as string | null },
  });

  useEffect(() => {
    const fetchDebugData = async () => {
      console.log('🔍 DashboardDebug: Starting data fetch...');

      // Test leads
      try {
        console.log('Fetching leads...');
        const leadsData = await getLeads();
        console.log('Leads data:', leadsData);
        setDebugInfo(prev => ({
          ...prev,
          leads: { loading: false, data: leadsData, error: null },
        }));
      } catch (error) {
        console.error('Leads error:', error);
        setDebugInfo(prev => ({
          ...prev,
          leads: { loading: false, data: null, error: error.message },
        }));
      }

      // Test deals
      try {
        console.log('Fetching deals...');
        const dealsData = await getDeals();
        console.log('Deals data:', dealsData);
        setDebugInfo(prev => ({
          ...prev,
          deals: { loading: false, data: dealsData, error: null },
        }));
      } catch (error) {
        console.error('Deals error:', error);
        setDebugInfo(prev => ({
          ...prev,
          deals: { loading: false, data: null, error: (error as any)?.message || String(error) },
        }));
      }

      // Test jobs
      try {
        console.log('Fetching jobs...');
        const jobsData = await getJobs();
        console.log('Jobs data:', jobsData);
        setDebugInfo(prev => ({
          ...prev,
          jobs: { loading: false, data: jobsData, error: null },
        }));
      } catch (error) {
        console.error('Jobs error:', error);
        setDebugInfo(prev => ({
          ...prev,
          jobs: { loading: false, data: null, error: (error as any)?.message || String(error) },
        }));
      }
    };

    fetchDebugData();
  }, []);

  return (
    <div className="p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-4">Dashboard Debug Info</h2>

      <div className="space-y-4">
        <div className="border p-4 rounded">
          <h3 className="font-semibold text-lg">Leads</h3>
          {debugInfo.leads.loading ? (
            <p>Loading...</p>
          ) : debugInfo.leads.error ? (
            <p className="text-red-600">Error: {debugInfo.leads.error}</p>
          ) : (
            <div>
              <p className="text-green-600">✅ Loaded {debugInfo.leads.data?.length || 0} leads</p>
              {debugInfo.leads.data && debugInfo.leads.data.length > 0 && (
                <pre className="mt-2 bg-gray-100 p-2 rounded text-xs overflow-auto">
                  {JSON.stringify(debugInfo.leads.data[0], null, 2)}
                </pre>
              )}
            </div>
          )}
        </div>

        <div className="border p-4 rounded">
          <h3 className="font-semibold text-lg">Deals</h3>
          {debugInfo.deals.loading ? (
            <p>Loading...</p>
          ) : debugInfo.deals.error ? (
            <p className="text-red-600">Error: {debugInfo.deals.error}</p>
          ) : (
            <div>
              <p className="text-green-600">✅ Loaded {debugInfo.deals.data?.length || 0} deals</p>
              {debugInfo.deals.data && debugInfo.deals.data.length > 0 && (
                <pre className="mt-2 bg-gray-100 p-2 rounded text-xs overflow-auto">
                  {JSON.stringify(debugInfo.deals.data[0], null, 2)}
                </pre>
              )}
            </div>
          )}
        </div>

        <div className="border p-4 rounded">
          <h3 className="font-semibold text-lg">Jobs</h3>
          {debugInfo.jobs.loading ? (
            <p>Loading...</p>
          ) : debugInfo.jobs.error ? (
            <p className="text-red-600">Error: {debugInfo.jobs.error}</p>
          ) : (
            <div>
              <p className="text-green-600">✅ Loaded {debugInfo.jobs.data?.length || 0} jobs</p>
              {debugInfo.jobs.data && debugInfo.jobs.data.length > 0 && (
                <pre className="mt-2 bg-gray-100 p-2 rounded text-xs overflow-auto">
                  {JSON.stringify(debugInfo.jobs.data[0], null, 2)}
                </pre>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
