import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  Calendar,
  Clipboard,
  Cog,
  CreditCard,
  FileText,
  Home,
  Image,
  MessageSquare,
  Settings,
  Users,
  Building2,
  Handshake,
  LogOut,
  Menu,
  BarChart3,
  CheckSquare,
  Megaphone,
  FileImage,
  Users2,
} from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { motion, AnimatePresence } from 'framer-motion';

// Import logo with error handling
import aspLogo from '../../assets/asp-logo.jpg';

// Fallback logo path in case the import fails
const logoFallback = '/crane-icon.svg';

interface SidebarProps {
  isMobileOpen?: boolean;
  onMobileClose?: () => void;
  isCollapsed?: boolean;
  onCollapseToggle?: (collapsed: boolean) => void;
}

interface NavItem {
  label: string;
  icon: React.ReactNode;
  href: string;
  roles: string[];
  end?: boolean;
}

const navItems: NavItem[] = [
  {
    label: 'Dashboard',
    icon: <Home size={18} />,
    href: '/dashboard',
    roles: ['admin', 'sales_agent', 'operations_manager', 'operator'],
    end: true,
  },
  {
    label: 'Leads',
    icon: <Clipboard size={18} />,
    href: '/leads',
    roles: ['admin', 'sales_agent'],
  },
  {
    label: 'Deals',
    icon: <Handshake size={18} />,
    href: '/deals',
    roles: ['admin', 'sales_agent'],
  },
  {
    label: 'Quotations',
    icon: <CreditCard size={18} />,
    href: '/quotations',
    roles: ['admin', 'sales_agent'],
  },
  {
    label: 'Customers',
    icon: <Building2 size={18} />,
    href: '/customers',
    roles: ['admin', 'sales_agent', 'operations_manager'],
  },
  {
    label: 'Analytics',
    icon: <BarChart3 size={18} />,
    href: '/analytics',
    roles: ['admin', 'sales_agent', 'operations_manager'],
  },
  {
    label: 'Contacts',
    icon: <Users2 size={18} />,
    href: '/contacts',
    roles: ['admin', 'sales_agent', 'operations_manager'],
  },
  {
    label: 'Tasks',
    icon: <CheckSquare size={18} />,
    href: '/tasks',
    roles: ['admin', 'sales_agent', 'operations_manager', 'operator'],
  },
  {
    label: 'Campaigns',
    icon: <Megaphone size={18} />,
    href: '/campaigns',
    roles: ['admin', 'sales_agent', 'operations_manager'],
  },
  {
    label: 'Documents',
    icon: <FileImage size={18} />,
    href: '/documents',
    roles: ['admin', 'sales_agent', 'operations_manager', 'operator'],
  },
  {
    label: 'Job Scheduling',
    icon: <Calendar size={18} />,
    href: '/jobs',
    roles: ['admin', 'operations_manager', 'operator'],
  },
  {
    label: 'Site Assessment',
    icon: <Image size={18} />,
    href: '/site-assessments',
    roles: ['admin', 'operations_manager', 'operator'],
  },
  {
    label: 'Configuration',
    icon: <Cog size={18} />,
    href: '/admin/config',
    roles: ['admin', 'operations_manager'],
  },
  {
    label: 'User Management',
    icon: <Users size={18} />,
    href: '/admin/users',
    roles: ['admin'],
  },
  {
    label: 'Equipment',
    icon: <Settings size={18} />,
    href: '/admin/equipment',
    roles: ['admin', 'operations_manager'],
  },
  {
    label: 'Services',
    icon: <FileText size={18} />,
    href: '/admin/services',
    roles: ['admin', 'operations_manager'],
  },
  {
    label: 'Feedback',
    icon: <MessageSquare size={18} />,
    href: '/job-summary',
    roles: ['admin', 'operations_manager', 'operator'],
  },
  // Removed old 'Templates' entry for legacy quotation templates
  {
    label: 'Template Builder',
    icon: <FileText size={18} />,
    href: '/admin/templates',
    roles: ['admin', 'sales_agent'],
  },
];

export function Sidebar({
  isMobileOpen = false,
  onMobileClose,
  isCollapsed: controlledCollapsed,
  onCollapseToggle,
}: SidebarProps) {
  const { user } = useAuthStore();
  const location = useLocation();
  const [internalCollapsed, setInternalCollapsed] = useState(false);
  const isControlled = controlledCollapsed !== undefined;
  const isCollapsed = isControlled ? controlledCollapsed : internalCollapsed;

  // Handle window resize events for better responsive behavior
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 1024) {
        setInternalCollapsed(true);
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  if (!user) return null;

  const filteredNavItems = navItems.filter(item => item.roles.includes(user.role));

  const isActive = (href: string, end?: boolean) => {
    if (end) {
      return location.pathname === href;
    }
    if (href === '/dashboard' && location.pathname === '/') {
      return true;
    }
    return location.pathname.startsWith(href);
  };

  const toggleCollapse = () => {
    if (isControlled && onCollapseToggle) {
      onCollapseToggle(!isCollapsed);
    } else {
      setInternalCollapsed(prev => !prev);
    }
  };

  // Enhanced mobile overlay with blur effect
  const mobileOverlay = (
    <AnimatePresence>
      {isMobileOpen && (
        <>
          <motion.div
            className="fixed inset-0 z-40 bg-black/30 backdrop-blur-sm lg:hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onMobileClose}
            aria-hidden="true"
          />
          <motion.aside
            className="fixed inset-y-0 left-0 z-50 w-72 max-w-[85%] bg-gradient-to-b from-brand-blue to-brand-blue/95 shadow-2xl overflow-y-auto lg:hidden"
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
            role="navigation"
            aria-label="Mobile navigation"
          >
            {renderSidebarContent(false)}
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );

  // Enhanced desktop sidebar with modern styling
  const desktopSidebar = (
    <aside
      className={`hidden lg:flex flex-col fixed inset-y-0 left-0 z-30 transition-all duration-300 ease-in-out ${
        isCollapsed ? 'w-16' : 'w-72'
      } bg-gradient-to-b from-brand-blue to-brand-blue/95 shadow-xl`}
      role="navigation"
      aria-label="Main navigation"
    >
      {renderSidebarContent(isCollapsed)}
    </aside>
  );

  return (
    <>
      {mobileOverlay}
      {desktopSidebar}
      {/* Removed the floating navicon button for desktop */}
    </>
  );

  function renderSidebarContent(collapsed: boolean) {
    return (
      <div className="flex flex-col h-full text-white">
        {/* Header with navicon, logo, and title in a row */}
        <div className="flex items-center gap-2 p-4 border-b border-white/10">
          <button
            onClick={toggleCollapse}
            className="flex items-center justify-center w-8 h-8 rounded hover:bg-white/10 transition-colors duration-200 focus:outline-none"
            aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            <Menu className="h-6 w-6 text-white" />
          </button>
          <Link to="/dashboard" className="flex items-center group" aria-label="Go to dashboard">
            <img
              src={aspLogo}
              alt="ASP Cranes"
              className={`object-contain transition-all duration-300 group-hover:scale-105 ${collapsed ? 'h-8 w-8' : 'h-10 w-auto'}`}
              onError={e => {
                e.currentTarget.src = logoFallback;
                e.currentTarget.onerror = null;
              }}
            />
            {!collapsed && (
              <motion.span
                className="ml-3 text-xl font-bold bg-gradient-to-r from-white to-brand-gold bg-clip-text text-transparent"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 }}
              >
                ASP CRM
              </motion.span>
            )}
          </Link>
        </div>

        {/* Navigation - Made scrollable without visible scrollbar */}
        <nav
          className="flex-1 py-6 overflow-y-auto hide-scrollbar"
          role="navigation"
          style={{
            scrollbarWidth: 'none' /* Firefox */,
            msOverflowStyle: 'none' /* Internet Explorer 10+ */,
          }}
        >
          <style>{`
            .hide-scrollbar::-webkit-scrollbar {
              display: none; /* Safari and Chrome */
            }
          `}</style>
          <ul className="space-y-1 px-3" role="list">
            {filteredNavItems.map(item => {
              const active = isActive(item.href, item.end);

              return (
                <li key={item.href} role="listitem">
                  <Link
                    to={item.href}
                    className={`group flex items-center rounded-lg transition-all duration-200 ${
                      collapsed ? 'justify-center p-3' : 'p-3'
                    } ${
                      active
                        ? 'bg-brand-gold text-brand-blue font-semibold shadow-lg scale-105'
                        : 'text-white/90 hover:bg-white/10 hover:text-white hover:scale-[1.02]'
                    }`}
                    onClick={onMobileClose}
                    aria-current={active ? 'page' : undefined}
                  >
                    <span
                      className={`flex-shrink-0 transition-transform group-hover:scale-110 ${
                        active ? 'text-brand-blue' : ''
                      }`}
                    >
                      {item.icon}
                    </span>

                    {!collapsed && (
                      <motion.span
                        className="ml-3 text-sm font-medium"
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.05 }}
                      >
                        {item.label}
                      </motion.span>
                    )}

                    {/* Tooltip for collapsed state */}
                    {collapsed && (
                      <div className="absolute left-full ml-3 px-3 py-2 bg-gray-900 text-white text-sm rounded-lg opacity-0 group-hover:opacity-100 pointer-events-none transform translate-x-2 group-hover:translate-x-0 transition-all z-50 whitespace-nowrap">
                        {item.label}
                        <div className="absolute left-0 top-1/2 transform -translate-y-1/2 -translate-x-1 w-2 h-2 bg-gray-900 rotate-45"></div>
                      </div>
                    )}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* User profile section */}
        <div className="p-4 border-t border-white/10">
          <div className={`flex items-center ${collapsed ? 'justify-center' : 'space-x-3'}`}>
            <div className="flex-shrink-0">
              <img
                src={
                  user?.avatar ||
                  'https://images.pexels.com/photos/4126743/pexels-photo-4126743.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1'
                }
                alt={user?.name || 'User'}
                className="h-10 w-10 rounded-full object-cover border-2 border-brand-gold/50 hover:border-brand-gold transition-colors"
              />
            </div>

            {!collapsed && user && (
              <motion.div
                className="flex-1 min-w-0"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 }}
              >
                <p className="text-sm font-semibold text-white truncate">{user.name || 'User'}</p>
                <p className="text-xs text-white/70 truncate capitalize">
                  {user.role ? user.role.replace('_', ' ') : 'User'}
                </p>

                <button
                  onClick={() => {
                    if (onMobileClose) onMobileClose();
                    const logoutEvent = new CustomEvent('sidebar-logout');
                    document.dispatchEvent(logoutEvent);
                  }}
                  className="mt-2 flex items-center text-xs text-white/80 hover:text-brand-gold px-2 py-1 rounded-md hover:bg-white/10 transition-all duration-200"
                  aria-label="Logout"
                >
                  <LogOut className="h-3 w-3 mr-2" />
                  Logout
                </button>
              </motion.div>
            )}
          </div>
        </div>
      </div>
    );
  }
}
