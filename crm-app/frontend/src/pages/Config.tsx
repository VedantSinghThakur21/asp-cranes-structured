import { useState } from 'react';
import {
  Settings,
  FileText,
  Users,
  Wrench,
  Calendar,
  Shield,
  Zap,
  Palette,
  Activity,
  BarChart3,
} from 'lucide-react';
import { QuotationConfig } from '../components/config/QuotationConfig';
import { ResourceRatesConfig } from '../components/config/ResourceRatesConfig';
import { AdditionalParamsConfig } from '../components/config/AdditionalParamsConfig';
import { DefaultTemplateConfig } from '../components/config/DefaultTemplateConfig';
import { useAuthStore } from '../store/authStore';

const configTabs = [
  {
    id: 'templates',
    label: 'Templates',
    icon: FileText,
    description: 'Manage quotation templates and defaults',
    component: DefaultTemplateConfig,
    color: 'from-blue-600 to-blue-700',
  },
  {
    id: 'quotations',
    label: 'Quotations',
    icon: Calendar,
    description: 'Configure quotation order types and settings',
    component: QuotationConfig,
    color: 'from-indigo-600 to-indigo-700',
  },
  {
    id: 'resources',
    label: 'Resources',
    icon: Users,
    description: 'Set resource rates and pricing',
    component: ResourceRatesConfig,
    color: 'from-emerald-600 to-emerald-700',
  },
  {
    id: 'parameters',
    label: 'Parameters',
    icon: Wrench,
    description: 'Additional system parameters',
    component: AdditionalParamsConfig,
    color: 'from-orange-600 to-orange-700',
  },
];

export function Config() {
  const { user } = useAuthStore();
  const [activeTab, setActiveTab] = useState('templates');

  if (!user || (user.role !== 'admin' && user.role !== 'operations_manager')) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center bg-white/70 backdrop-blur-lg rounded-3xl p-12 shadow-2xl border border-white/20">
          <Shield className="h-16 w-16 text-red-500 mx-auto mb-6" />
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Access Denied</h2>
          <p className="text-gray-600 max-w-md">
            You don't have the necessary permissions to access the configuration panel. Please
            contact your administrator.
          </p>
        </div>
      </div>
    );
  }

  const ActiveComponent =
    configTabs.find(tab => tab.id === activeTab)?.component || DefaultTemplateConfig;
  const activeTabData = configTabs.find(tab => tab.id === activeTab);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="bg-blue-600 p-2 rounded-lg shadow-sm">
                <Settings className="h-5 w-5 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Configuration</h1>
                <p className="text-sm text-gray-600 mt-1">Manage your CRM system settings</p>
              </div>
            </div>
            <div className="hidden lg:flex items-center space-x-4">
              <div className="flex items-center space-x-2 bg-green-50 text-green-700 px-3 py-1 rounded-full text-sm">
                <Activity className="h-3 w-3" />
                <span>Online</span>
              </div>
              <div className="flex items-center space-x-2 text-gray-500 text-sm">
                <BarChart3 className="h-4 w-4" />
                <span>Performance: Good</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Sidebar Navigation */}
          <div className="lg:w-64 flex-shrink-0">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <Palette className="h-4 w-4 mr-2 text-blue-600" />
                Modules
              </h3>
              <nav className="space-y-2">
                {configTabs.map(tab => {
                  const Icon = tab.icon;
                  const isActive = activeTab === tab.id;

                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`w-full group relative overflow-hidden rounded-lg p-3 transition-all duration-200 ${
                        isActive
                          ? 'bg-blue-50 border border-blue-200'
                          : 'hover:bg-gray-50 border border-transparent hover:border-gray-200'
                      }`}
                    >
                      <div className="flex items-center space-x-3">
                        <div
                          className={`flex-shrink-0 p-2 rounded-md transition-all duration-200 ${
                            isActive
                              ? `bg-gradient-to-r ${tab.color} text-white`
                              : 'bg-gray-100 text-gray-600 group-hover:bg-gray-200'
                          }`}
                        >
                          <Icon className="h-4 w-4" />
                        </div>
                        <div className="flex-1 text-left min-w-0">
                          <h4
                            className={`font-medium text-sm transition-colors duration-200 ${
                              isActive ? 'text-blue-900' : 'text-gray-700 group-hover:text-gray-900'
                            }`}
                          >
                            {tab.label}
                          </h4>
                          <p
                            className={`text-xs mt-0.5 transition-colors duration-200 truncate ${
                              isActive ? 'text-blue-600' : 'text-gray-500 group-hover:text-gray-600'
                            }`}
                          >
                            {tab.description}
                          </p>
                        </div>
                      </div>
                      {isActive && (
                        <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                          <div className="w-1.5 h-1.5 bg-blue-600 rounded-full"></div>
                        </div>
                      )}
                    </button>
                  );
                })}
              </nav>

              {/* Quick Stats */}
              <div className="mt-6 p-3 bg-gray-50 rounded-lg">
                <h4 className="text-sm font-medium text-gray-900 mb-2 flex items-center">
                  <Zap className="h-3 w-3 mr-1 text-blue-600" />
                  Stats
                </h4>
                <div className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-600">Templates</span>
                    <span className="font-medium text-gray-900">3</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-600">Equipment</span>
                    <span className="font-medium text-gray-900">8</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-600">Updated</span>
                    <span className="font-medium text-gray-900">Today</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="flex-1 min-w-0">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
              {/* Content Header */}
              <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
                <div className="flex items-center space-x-3">
                  {activeTabData && (
                    <>
                      <div
                        className={`p-2 rounded-lg bg-gradient-to-r ${activeTabData.color} text-white`}
                      >
                        <activeTabData.icon className="h-5 w-5" />
                      </div>
                      <div>
                        <h2 className="text-xl font-semibold text-gray-900">
                          {activeTabData.label}
                        </h2>
                        <p className="text-sm text-gray-600 mt-0.5">{activeTabData.description}</p>
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* Content Body */}
              <div className="p-6">
                <div className="min-h-[400px]">
                  <ActiveComponent />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
