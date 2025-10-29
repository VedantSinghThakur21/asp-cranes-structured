import { useState, useEffect, memo } from 'react';
import { Bell, LogOut, Menu, Search, Settings, User } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { useNavigate } from 'react-router-dom';
import { getUserNotifications, markNotificationAsRead } from '../../services/notificationService';
import { Notification } from '../../types/notification';
import { Badge } from '../common/Badge';

interface HeaderProps {
  onMobileMenuClick?: () => void;
}

// Memoized notification item to prevent unnecessary re-renders
const NotificationItem = memo(
  ({
    notification,
    onClick,
  }: {
    notification: Notification;
    onClick: (notification: Notification) => void;
  }) => (
    <button
      onClick={() => onClick(notification)}
      className={`w-full text-left p-3 rounded-lg hover:bg-gray-50 transition-colors ${
        !notification.read
          ? 'bg-gradient-to-r from-blue-50 to-indigo-50 border-l-4 border-brand-blue'
          : ''
      }`}
      aria-describedby={`notification-${notification.id}`}
    >
      <div className="flex items-start space-x-3">
        <div
          className={`w-2 h-2 rounded-full mt-2 ${!notification.read ? 'bg-brand-blue' : 'bg-gray-300'}`}
        />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-gray-900 line-clamp-1">{notification.title}</p>
          {notification.message && (
            <p className="text-xs text-gray-600 mt-1 line-clamp-2">{notification.message}</p>
          )}
          <p className="text-xs text-gray-500 mt-1">
            {new Date(notification.createdAt || Date.now()).toLocaleDateString()}
          </p>
        </div>
      </div>
    </button>
  )
);

NotificationItem.displayName = 'NotificationItem';

export const Header = memo(function Header({ onMobileMenuClick }: HeaderProps) {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);

  useEffect(() => {
    if (user) {
      fetchNotifications();
    }
  }, [user]);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest('[data-dropdown]')) {
        setShowNotifications(false);
        setShowUserMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const fetchNotifications = async () => {
    if (user) {
      try {
        const userNotifications = await getUserNotifications(user.id);
        setNotifications(userNotifications);
      } catch (error) {
        console.error('Failed to fetch notifications:', error);
      }
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Logout error:', error);
      navigate('/login');
    }
  };

  const handleNotificationClick = async (notification: Notification) => {
    if (!notification.read) {
      try {
        await markNotificationAsRead(notification.id);
        await fetchNotifications();
      } catch (error) {
        console.error('Failed to mark notification as read:', error);
      }
    }

    if (notification.link) {
      navigate(notification.link);
    }

    setShowNotifications(false);
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-sm border-b border-gray-200/60 h-16 flex items-center justify-between px-4 lg:px-6 shadow-sm">
      {/* Left section */}
      <div className="flex items-center space-x-4">
        {onMobileMenuClick && (
          <button
            onClick={onMobileMenuClick}
            className="p-2 rounded-lg hover:bg-gray-100 lg:hidden transition-colors focus:outline-none focus:ring-2 focus:ring-brand-blue/20"
            aria-label="Toggle navigation menu"
          >
            <Menu className="h-5 w-5 text-gray-700" />
          </button>
        )}

        {/* Logo/Brand */}
        <div className="flex items-center space-x-3">
          <div className="h-8 w-8 bg-gradient-to-br from-brand-blue to-brand-blue/80 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-sm">A</span>
          </div>
          <div className="hidden sm:block">
            <h1 className="text-lg font-bold bg-gradient-to-r from-brand-blue to-brand-blue/80 bg-clip-text text-transparent">
              ASP CRM
            </h1>
            <p className="text-xs text-gray-500 -mt-1">Crane Management System</p>
          </div>
        </div>
      </div>

      {/* Center section - Search */}
      <div className="hidden md:flex flex-1 max-w-md mx-8">
        <div className="relative w-full">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search projects, customers, equipment..."
            className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-brand-blue/20 focus:border-brand-blue transition-all"
            aria-label="Search"
          />
        </div>
      </div>

      {/* Right section */}
      <div className="flex items-center space-x-2">
        {/* Quick Settings Button */}
        <button
          className="p-2 rounded-lg hover:bg-gray-100 transition-colors focus:outline-none focus:ring-2 focus:ring-brand-blue/20"
          aria-label="Quick settings"
        >
          <Settings className="h-5 w-5 text-gray-600" />
        </button>

        {/* Notifications */}
        <div className="relative" data-dropdown>
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="relative p-2 rounded-lg hover:bg-gray-100 transition-colors focus:outline-none focus:ring-2 focus:ring-brand-blue/20"
            aria-label={`Notifications ${unreadCount > 0 ? `(${unreadCount} unread)` : ''}`}
            aria-expanded={showNotifications}
            aria-haspopup="true"
          >
            <Bell className="h-5 w-5 text-gray-600" />
            {unreadCount > 0 && (
              <Badge
                variant="error"
                className="absolute -top-1 -right-1 min-w-[18px] h-[18px] text-[10px] flex items-center justify-center animate-pulse"
              >
                {unreadCount > 99 ? '99+' : unreadCount}
              </Badge>
            )}
          </button>

          {/* Notifications Dropdown */}
          {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 max-w-[calc(100vw-2rem)] bg-white rounded-xl shadow-xl border border-gray-200 z-50">
              <div className="p-4 border-b border-gray-100">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-gray-900">Notifications</h3>
                  <span className="text-xs text-gray-500">{unreadCount} unread</span>
                </div>
              </div>

              <div className="max-h-80 overflow-y-auto">
                {notifications.length === 0 ? (
                  <div className="p-6 text-center">
                    <Bell className="h-8 w-8 text-gray-300 mx-auto mb-2" />
                    <p className="text-sm text-gray-500">No notifications yet</p>
                  </div>
                ) : (
                  <div className="p-2 space-y-1">
                    {notifications.map(notification => (
                      <NotificationItem
                        key={notification.id}
                        notification={notification}
                        onClick={handleNotificationClick}
                      />
                    ))}
                  </div>
                )}
              </div>

              {notifications.length > 0 && (
                <div className="p-3 border-t border-gray-100">
                  <button className="w-full text-sm text-brand-blue hover:text-brand-blue/80 font-medium">
                    View all notifications
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* User Menu */}
        <div className="relative" data-dropdown>
          <button
            onClick={() => setShowUserMenu(!showUserMenu)}
            className="flex items-center space-x-3 p-2 rounded-lg hover:bg-gray-100 transition-colors focus:outline-none focus:ring-2 focus:ring-brand-blue/20"
            aria-label="User menu"
            aria-expanded={showUserMenu}
            aria-haspopup="true"
          >
            <div className="relative">
              <img
                src={
                  user?.avatar ||
                  'https://images.pexels.com/photos/4126743/pexels-photo-4126743.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1'
                }
                alt={user?.name || 'User'}
                className="h-8 w-8 rounded-full object-cover border-2 border-gray-200 hover:border-brand-blue/30 transition-colors"
              />
              <div className="absolute -bottom-0.5 -right-0.5 h-3 w-3 bg-green-400 border-2 border-white rounded-full"></div>
            </div>

            <div className="hidden sm:block text-left">
              <p className="text-sm font-semibold text-gray-900 leading-tight">
                {user?.name || 'User'}
              </p>
              <p className="text-xs text-gray-500 capitalize leading-tight">
                {user?.role ? user.role.replace('_', ' ') : 'User'}
              </p>
            </div>
          </button>

          {/* User Dropdown */}
          {showUserMenu && (
            <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-xl border border-gray-200 z-50">
              <div className="p-3 border-b border-gray-100">
                <div className="flex items-center space-x-3">
                  <img
                    src={
                      user?.avatar ||
                      'https://images.pexels.com/photos/4126743/pexels-photo-4126743.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1'
                    }
                    alt={user?.name || 'User'}
                    className="h-10 w-10 rounded-full object-cover"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-900 truncate">
                      {user?.name || 'User'}
                    </p>
                    <p className="text-xs text-gray-500 truncate">
                      {user?.email || 'user@example.com'}
                    </p>
                  </div>
                </div>
              </div>

              <div className="py-2">
                <button className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors">
                  <User className="h-4 w-4 mr-3 text-gray-400" />
                  View Profile
                </button>
                <button className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors">
                  <Settings className="h-4 w-4 mr-3 text-gray-400" />
                  Account Settings
                </button>
              </div>

              <div className="border-t border-gray-100 py-2">
                <button
                  onClick={handleLogout}
                  className="flex items-center w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                >
                  <LogOut className="h-4 w-4 mr-3" />
                  Sign Out
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
});
