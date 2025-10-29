/**
 * Job List Component - Simple component to test job scheduling API
 */
import { useState, useEffect } from 'react';
import { Card, CardContent } from '../common/Card';
import { Button } from '../common/Button';
import { jobApiClient } from '../../services/jobApiClient';
import { Job, Equipment, Operator } from '../../types/job';

export function JobList() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [equipment, setEquipment] = useState<Equipment[]>([]);
  const [operators, setOperators] = useState<Operator[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [jobsData, equipmentData, operatorsData] = await Promise.all([
        jobApiClient.getAllJobs(),
        jobApiClient.getAllEquipment(),
        jobApiClient.getAllOperators(),
      ]);

      setJobs(jobsData);
      setEquipment(equipmentData);
      setOperators(operatorsData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      console.error('Error loading data:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="p-4">Loading job data...</div>;
  }

  if (error) {
    return (
      <div className="p-4">
        <div className="text-red-600 mb-4">Error: {error}</div>
        <Button onClick={loadData}>Try Again</Button>
      </div>
    );
  }

  return (
    <div className="p-4">
      <h2 className="text-2xl font-bold mb-4">Job Scheduling System</h2>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card>
          <CardContent className="p-4">
            <h3 className="font-semibold mb-2">Jobs</h3>
            <p className="text-2xl font-bold">{jobs.length}</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <h3 className="font-semibold mb-2">Equipment</h3>
            <p className="text-2xl font-bold">{equipment.length}</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <h3 className="font-semibold mb-2">Operators</h3>
            <p className="text-2xl font-bold">{operators.length}</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-4">
        <Card>
          <CardContent className="p-4">
            <h3 className="font-semibold mb-4">Recent Jobs</h3>
            {jobs.length === 0 ? (
              <p className="text-gray-500">No jobs found.</p>
            ) : (
              <div className="space-y-2">
                {jobs.slice(0, 5).map(job => (
                  <div
                    key={job.id}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded"
                  >
                    <div>
                      <h4 className="font-medium">{job.title}</h4>
                      <p className="text-sm text-gray-600">{job.customerName}</p>
                      <p className="text-sm text-gray-500">{job.location}</p>
                    </div>
                    <span
                      className={`px-2 py-1 rounded text-xs font-medium ${
                        job.status === 'completed'
                          ? 'bg-green-100 text-green-800'
                          : job.status === 'in_progress'
                            ? 'bg-blue-100 text-blue-800'
                            : job.status === 'scheduled'
                              ? 'bg-yellow-100 text-yellow-800'
                              : 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      {job.status}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <h3 className="font-semibold mb-4">Available Equipment</h3>
            {equipment.length === 0 ? (
              <p className="text-gray-500">No equipment found.</p>
            ) : (
              <div className="space-y-2">
                {equipment.slice(0, 5).map(item => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded"
                  >
                    <div>
                      <h4 className="font-medium">{item.name}</h4>
                      <p className="text-sm text-gray-600">{item.type}</p>
                    </div>
                    <p className="text-sm font-medium">${item.baseRate}/day</p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <h3 className="font-semibold mb-4">Available Operators</h3>
            {operators.length === 0 ? (
              <p className="text-gray-500">No operators found.</p>
            ) : (
              <div className="space-y-2">
                {operators.slice(0, 5).map(operator => (
                  <div
                    key={operator.id}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded"
                  >
                    <div>
                      <h4 className="font-medium">{operator.name}</h4>
                      <p className="text-sm text-gray-600">{operator.specialization}</p>
                    </div>
                    <span
                      className={`px-2 py-1 rounded text-xs font-medium ${
                        operator.availability === 'available'
                          ? 'bg-green-100 text-green-800'
                          : operator.availability === 'assigned'
                            ? 'bg-blue-100 text-blue-800'
                            : operator.availability === 'on_leave'
                              ? 'bg-yellow-100 text-yellow-800'
                              : 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      {operator.availability || 'available'}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
