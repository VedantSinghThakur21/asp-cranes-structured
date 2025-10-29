import { useEffect } from 'react';
import { useAuthStore } from '../store/authStore';
import { useNavigate } from 'react-router-dom';
import EnhancedTemplateManager from './quotations/EnhancedTemplateManager';

export function QuotationTemplates() {
  const { user, isAuthenticated } = useAuthStore();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isAuthenticated || !user) {
      navigate('/login');
      return;
    }

    if (user.role !== 'admin' && user.role !== 'sales_agent') {
      navigate('/dashboard');
      return;
    }
  }, [isAuthenticated, user, navigate]);

  if (!isAuthenticated || !user || (user.role !== 'admin' && user.role !== 'sales_agent')) {
    return null;
  }

  // Use the enhanced template manager directly
  return <EnhancedTemplateManager />;
}
