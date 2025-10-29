import { useState, useEffect } from 'react';
import {
  Clock,
  User,
  Eye,
  FileText,
  Calendar,
  Monitor,
  MapPin,
  RefreshCw,
  AlertCircle,
  TrendingUp,
} from 'lucide-react';

interface AuditRecord {
  id: string;
  configId: string;
  configName: string;
  action: 'CREATE' | 'UPDATE' | 'DELETE';
  oldValue: any;
  newValue: any;
  changedBy: string;
  changedByEmail: string;
  changeReason: string;
  ipAddress: string;
  userAgent: string;
  createdAt: string;
  currentConfigName: string;
}

interface ChangesSummary {
  configName: string;
  action: string;
  changedBy: string;
  changeCount: number;
  latestChange: string;
}

export function ConfigAuditTrail() {
  const [auditHistory, setAuditHistory] = useState<AuditRecord[]>([]);
  const [changesSummary, setChangesSummary] = useState<ChangesSummary[]>([]);
  const [selectedConfig, setSelectedConfig] = useState<string>('all');
  const [selectedRecord, setSelectedRecord] = useState<AuditRecord | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [limit, setLimit] = useState(50);
  const [days, setDays] = useState(30);
  const [showSummary, setShowSummary] = useState(true);

  const configTypes = [
    { value: 'all', label: 'All Configurations' },
    { value: 'resourceRates', label: 'Resource Rates' },
    { value: 'additionalParams', label: 'Additional Parameters' },
    { value: 'quotation', label: 'Quotation Settings' },
    { value: 'defaultTemplate', label: 'Default Template' },
    { value: 'database', label: 'Database Config' },
  ];

  const fetchAuditData = async () => {
    setIsLoading(true);
    setError('');

    try {
      const [historyResponse, summaryResponse] = await Promise.all([
        fetch(
          selectedConfig === 'all'
            ? `/api/config/audit/all?limit=${limit}`
            : `/api/config/${selectedConfig}/audit?limit=${limit}`,
          {
            headers: { 'x-bypass-auth': 'development-only-123' },
          }
        ),
        fetch(`/api/config/audit/summary?days=${days}`, {
          headers: { 'x-bypass-auth': 'development-only-123' },
        }),
      ]);

      if (!historyResponse.ok || !summaryResponse.ok) {
        throw new Error('Failed to fetch audit data');
      }

      const historyData = await historyResponse.json();
      const summaryData = await summaryResponse.json();

      setAuditHistory(historyData.data || []);
      setChangesSummary(summaryData.data || []);
    } catch (err) {
      console.error('Error fetching audit data:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch audit data');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAuditData();
  }, [selectedConfig, limit, days]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };

  const getActionColor = (action: string) => {
    switch (action) {
      case 'CREATE':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'UPDATE':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'DELETE':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const renderJsonValue = (value: any) => {
    if (!value) return 'N/A';

    try {
      const parsed = typeof value === 'string' ? JSON.parse(value) : value;
      return (
        <pre className="text-xs bg-gray-50 p-2 rounded border max-h-32 overflow-auto whitespace-pre-wrap">
          {JSON.stringify(parsed, null, 2)}
        </pre>
      );
    } catch {
      return <span className="text-gray-600">{String(value)}</span>;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">Configuration Audit Trail</h2>
        <button
          onClick={fetchAuditData}
          disabled={isLoading}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center gap-2">
          <AlertCircle className="w-5 h-5 text-red-600" />
          <span className="text-red-800">{error}</span>
        </div>
      )}

      {/* Controls */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Configuration Type
            </label>
            <select
              value={selectedConfig}
              onChange={e => setSelectedConfig(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              {configTypes.map(type => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Records Limit</label>
            <select
              value={limit}
              onChange={e => setLimit(Number(e.target.value))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value={25}>25 records</option>
              <option value={50}>50 records</option>
              <option value={100}>100 records</option>
              <option value={200}>200 records</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Summary Period</label>
            <select
              value={days}
              onChange={e => setDays(Number(e.target.value))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value={7}>Last 7 days</option>
              <option value={30}>Last 30 days</option>
              <option value={90}>Last 90 days</option>
              <option value={365}>Last year</option>
            </select>
          </div>

          <div className="flex items-end">
            <button
              onClick={() => setShowSummary(!showSummary)}
              className={`px-4 py-2 rounded-lg border ${
                showSummary
                  ? 'bg-blue-50 border-blue-300 text-blue-700'
                  : 'bg-gray-50 border-gray-300 text-gray-700'
              }`}
            >
              <TrendingUp className="w-4 h-4 mr-2 inline" />
              {showSummary ? 'Hide' : 'Show'} Summary
            </button>
          </div>
        </div>
      </div>

      {/* Changes Summary */}
      {showSummary && changesSummary.length > 0 && (
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <TrendingUp className="w-5 h-5" />
            Changes Summary (Last {days} days)
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {changesSummary.map((summary, index) => (
              <div key={index} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium text-gray-900">{summary.configName}</span>
                  <span
                    className={`px-2 py-1 rounded text-xs border ${getActionColor(summary.action)}`}
                  >
                    {summary.action}
                  </span>
                </div>
                <div className="text-sm text-gray-600 space-y-1">
                  <div>Changes: {summary.changeCount}</div>
                  <div>By: {summary.changedBy}</div>
                  <div>Latest: {formatDate(summary.latestChange)}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Audit History */}
      <div className="bg-white rounded-lg border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <Clock className="w-5 h-5" />
            Audit History ({auditHistory.length} records)
          </h3>
        </div>

        {isLoading ? (
          <div className="p-8 text-center">
            <RefreshCw className="w-8 h-8 animate-spin mx-auto text-blue-600 mb-2" />
            <p className="text-gray-600">Loading audit history...</p>
          </div>
        ) : auditHistory.length === 0 ? (
          <div className="p-8 text-center">
            <FileText className="w-12 h-12 mx-auto text-gray-400 mb-4" />
            <p className="text-gray-600">No audit records found</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {auditHistory.map(record => (
              <div key={record.id} className="p-6 hover:bg-gray-50">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <span
                        className={`px-3 py-1 rounded-full text-sm border ${getActionColor(record.action)}`}
                      >
                        {record.action}
                      </span>
                      <span className="font-medium text-gray-900">{record.configName}</span>
                      <span className="text-sm text-gray-500">#{record.configId}</span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <User className="w-4 h-4" />
                        <span>{record.changedBy}</span>
                        {record.changedByEmail && (
                          <span className="text-gray-400">({record.changedByEmail})</span>
                        )}
                      </div>

                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Calendar className="w-4 h-4" />
                        <span>{formatDate(record.createdAt)}</span>
                      </div>

                      {record.ipAddress && (
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <MapPin className="w-4 h-4" />
                          <span>{record.ipAddress}</span>
                        </div>
                      )}
                    </div>

                    {record.changeReason && (
                      <div className="mb-4">
                        <span className="text-sm font-medium text-gray-700">Reason: </span>
                        <span className="text-sm text-gray-600">{record.changeReason}</span>
                      </div>
                    )}

                    {record.userAgent && (
                      <div className="mb-4 flex items-center gap-2 text-xs text-gray-500">
                        <Monitor className="w-3 h-3" />
                        <span className="truncate">{record.userAgent}</span>
                      </div>
                    )}
                  </div>

                  <button
                    onClick={() =>
                      setSelectedRecord(selectedRecord?.id === record.id ? null : record)
                    }
                    className="ml-4 px-3 py-1 text-sm text-blue-600 hover:text-blue-700 border border-blue-300 rounded hover:bg-blue-50"
                  >
                    <Eye className="w-4 h-4 mr-1 inline" />
                    {selectedRecord?.id === record.id ? 'Hide' : 'View'} Details
                  </button>
                </div>

                {selectedRecord?.id === record.id && (
                  <div className="mt-6 pt-4 border-t border-gray-200">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      {record.oldValue && (
                        <div>
                          <h4 className="font-medium text-gray-900 mb-2">Previous Value</h4>
                          {renderJsonValue(record.oldValue)}
                        </div>
                      )}

                      {record.newValue && (
                        <div>
                          <h4 className="font-medium text-gray-900 mb-2">New Value</h4>
                          {renderJsonValue(record.newValue)}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
