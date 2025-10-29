import { ConfigAuditTrail } from '../components/config/ConfigAuditTrail';
import { ArrowLeft } from 'lucide-react';
import { Button } from '../components/common/Button';
import { useNavigate } from 'react-router-dom';

export function ConfigAuditPage() {
  const navigate = useNavigate();

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate('/admin')}
          leftIcon={<ArrowLeft size={16} />}
        >
          Back to Admin
        </Button>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Configuration Audit Trail</h1>
          <p className="text-gray-600 mt-1">
            Track all configuration changes with detailed audit logs
          </p>
        </div>
      </div>

      {/* Audit Trail Component */}
      <ConfigAuditTrail />
    </div>
  );
}
