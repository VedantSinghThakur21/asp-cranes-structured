import { useState, useEffect } from 'react';
import {
  Plus,
  Search,
  Calendar,
  User,
  CheckCircle,
  AlertCircle,
  Circle,
  MoreHorizontal,
  Flag,
} from 'lucide-react';

export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent';
export type TaskStatus = 'pending' | 'in_progress' | 'completed' | 'cancelled';
export type TaskType =
  | 'call'
  | 'meeting'
  | 'email'
  | 'follow_up'
  | 'site_visit'
  | 'quotation'
  | 'other';

export interface Task {
  id: string;
  title: string;
  description: string;
  type: TaskType;
  priority: TaskPriority;
  status: TaskStatus;
  dueDate: string;
  assignedTo: string;
  assignedToName: string;
  createdBy: string;
  createdByName: string;
  createdAt: string;
  updatedAt: string;
  relatedTo?: {
    type: 'lead' | 'deal' | 'customer' | 'quotation';
    id: string;
    name: string;
  };
  completedAt?: string;
  notes: string;
}

const TASK_TYPES = [
  { value: 'call', label: 'Phone Call', icon: '📞' },
  { value: 'meeting', label: 'Meeting', icon: '🤝' },
  { value: 'email', label: 'Email', icon: '📧' },
  { value: 'follow_up', label: 'Follow Up', icon: '📋' },
  { value: 'site_visit', label: 'Site Visit', icon: '🏗️' },
  { value: 'quotation', label: 'Quotation', icon: '💰' },
  { value: 'other', label: 'Other', icon: '📝' },
];

const STATUS_COLORS = {
  pending: 'bg-gray-100 text-gray-800 border-gray-200',
  in_progress: 'bg-blue-100 text-blue-800 border-blue-200',
  completed: 'bg-green-100 text-green-800 border-green-200',
  cancelled: 'bg-red-100 text-red-800 border-red-200',
};

export function TaskManagement() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<TaskStatus | 'all'>('all');
  const [priorityFilter, setPriorityFilter] = useState<TaskPriority | 'all'>('all');
  const [typeFilter, setTypeFilter] = useState<TaskType | 'all'>('all');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [viewMode, setViewMode] = useState<'list' | 'calendar'>('list');

  useEffect(() => {
    fetchTasks();
  }, []);

  const fetchTasks = async () => {
    setLoading(true);
    try {
      // TODO: Replace with actual API call
      // Simulated data for now
      await new Promise(resolve => setTimeout(resolve, 1000));

      const mockTasks: Task[] = [
        {
          id: '1',
          title: 'Follow up with ABC Construction',
          description: 'Check on quotation status and next steps',
          type: 'follow_up',
          priority: 'high',
          status: 'pending',
          dueDate: '2025-08-28T10:00:00.000Z',
          assignedTo: 'user1',
          assignedToName: 'John Doe',
          createdBy: 'user2',
          createdByName: 'Jane Smith',
          createdAt: '2025-08-25T09:00:00.000Z',
          updatedAt: '2025-08-25T09:00:00.000Z',
          relatedTo: {
            type: 'lead',
            id: 'lead1',
            name: 'ABC Construction - Crane Rental',
          },
          notes: 'Important client - expedite follow up',
        },
        {
          id: '2',
          title: 'Site visit for new project',
          description: 'Assess site requirements for upcoming project',
          type: 'site_visit',
          priority: 'medium',
          status: 'in_progress',
          dueDate: '2025-08-29T14:00:00.000Z',
          assignedTo: 'user1',
          assignedToName: 'John Doe',
          createdBy: 'user1',
          createdByName: 'John Doe',
          createdAt: '2025-08-26T11:00:00.000Z',
          updatedAt: '2025-08-27T08:00:00.000Z',
          relatedTo: {
            type: 'deal',
            id: 'deal1',
            name: 'XYZ Corp - Tower Crane',
          },
          notes: 'Bring safety equipment and measurement tools',
        },
        {
          id: '3',
          title: 'Prepare quotation for tower crane',
          description: 'Create detailed quotation based on site assessment',
          type: 'quotation',
          priority: 'urgent',
          status: 'pending',
          dueDate: '2025-08-30T17:00:00.000Z',
          assignedTo: 'user2',
          assignedToName: 'Jane Smith',
          createdBy: 'user1',
          createdByName: 'John Doe',
          createdAt: '2025-08-27T15:00:00.000Z',
          updatedAt: '2025-08-27T15:00:00.000Z',
          relatedTo: {
            type: 'deal',
            id: 'deal2',
            name: 'Metro Construction - Tower Crane',
          },
          notes: 'Include mobilization costs and operator fees',
        },
      ];

      setTasks(mockTasks);
    } catch (error) {
      console.error('Failed to fetch tasks:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredTasks = tasks.filter(task => {
    const matchesSearch =
      task.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      task.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      task.assignedToName.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === 'all' || task.status === statusFilter;
    const matchesPriority = priorityFilter === 'all' || task.priority === priorityFilter;
    const matchesType = typeFilter === 'all' || task.type === typeFilter;

    return matchesSearch && matchesStatus && matchesPriority && matchesType;
  });

  const getTaskIcon = (status: TaskStatus) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-5 w-5 text-green-600" />;
      case 'in_progress':
        return <AlertCircle className="h-5 w-5 text-blue-600" />;
      case 'cancelled':
        return <Circle className="h-5 w-5 text-red-600" />;
      default:
        return <Circle className="h-5 w-5 text-gray-400" />;
    }
  };

  const getPriorityIcon = (priority: TaskPriority) => {
    switch (priority) {
      case 'urgent':
        return <Flag className="h-4 w-4 text-red-600" />;
      case 'high':
        return <Flag className="h-4 w-4 text-orange-600" />;
      case 'medium':
        return <Flag className="h-4 w-4 text-yellow-600" />;
      default:
        return <Flag className="h-4 w-4 text-green-600" />;
    }
  };

  const isOverdue = (dueDate: string) => {
    return new Date(dueDate) < new Date();
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="space-y-4">
            {[1, 2, 3, 4, 5].map(i => (
              <div key={i} className="h-24 bg-gray-200 rounded-lg"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Task Management</h1>
          <p className="text-gray-600">Manage your tasks and activities</p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex rounded-lg border border-gray-300 overflow-hidden">
            <button
              onClick={() => setViewMode('list')}
              className={`px-3 py-2 text-sm font-medium ${
                viewMode === 'list'
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-50'
              }`}
            >
              List
            </button>
            <button
              onClick={() => setViewMode('calendar')}
              className={`px-3 py-2 text-sm font-medium ${
                viewMode === 'calendar'
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-50'
              }`}
            >
              Calendar
            </button>
          </div>

          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="h-4 w-4" />
            New Task
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search tasks..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value as TaskStatus | 'all')}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="all">All Status</option>
            <option value="pending">Pending</option>
            <option value="in_progress">In Progress</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </select>

          {/* Priority Filter */}
          <select
            value={priorityFilter}
            onChange={e => setPriorityFilter(e.target.value as TaskPriority | 'all')}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="all">All Priority</option>
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
            <option value="urgent">Urgent</option>
          </select>

          {/* Type Filter */}
          <select
            value={typeFilter}
            onChange={e => setTypeFilter(e.target.value as TaskType | 'all')}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="all">All Types</option>
            {TASK_TYPES.map(type => (
              <option key={type.value} value={type.value}>
                {type.label}
              </option>
            ))}
          </select>

          {/* Clear Filters */}
          <button
            onClick={() => {
              setSearchTerm('');
              setStatusFilter('all');
              setPriorityFilter('all');
              setTypeFilter('all');
            }}
            className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Clear Filters
          </button>
        </div>
      </div>

      {/* Tasks List */}
      <div className="space-y-4">
        {filteredTasks.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
            <Circle className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No tasks found</h3>
            <p className="text-gray-600 mb-4">
              {searchTerm ||
              statusFilter !== 'all' ||
              priorityFilter !== 'all' ||
              typeFilter !== 'all'
                ? 'Try adjusting your filters to see more tasks.'
                : 'Get started by creating your first task.'}
            </p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Plus className="h-4 w-4" />
              Create Task
            </button>
          </div>
        ) : (
          filteredTasks.map(task => (
            <div
              key={task.id}
              className={`bg-white p-6 rounded-lg shadow-sm border-l-4 ${
                isOverdue(task.dueDate) && task.status !== 'completed'
                  ? 'border-l-red-500 bg-red-50'
                  : task.priority === 'urgent'
                    ? 'border-l-red-500'
                    : task.priority === 'high'
                      ? 'border-l-orange-500'
                      : task.priority === 'medium'
                        ? 'border-l-yellow-500'
                        : 'border-l-green-500'
              } border-r border-t border-b border-gray-200 hover:shadow-md transition-shadow`}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-4 flex-1">
                  {/* Status Icon */}
                  <div className="flex-shrink-0 mt-1">{getTaskIcon(task.status)}</div>

                  {/* Task Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="text-lg font-semibold text-gray-900 truncate">{task.title}</h3>
                      {getPriorityIcon(task.priority)}
                      <span
                        className={`text-xs px-2 py-1 rounded-full font-medium border ${TASK_TYPES.find(t => t.value === task.type)?.icon}`}
                      >
                        {TASK_TYPES.find(t => t.value === task.type)?.label}
                      </span>
                    </div>

                    <p className="text-gray-600 mb-3 line-clamp-2">{task.description}</p>

                    <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500">
                      <div className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        <span
                          className={
                            isOverdue(task.dueDate) && task.status !== 'completed'
                              ? 'text-red-600 font-medium'
                              : ''
                          }
                        >
                          {new Date(task.dueDate).toLocaleDateString()} at{' '}
                          {new Date(task.dueDate).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                        {isOverdue(task.dueDate) && task.status !== 'completed' && (
                          <span className="text-red-600 font-medium ml-1">(Overdue)</span>
                        )}
                      </div>

                      <div className="flex items-center gap-1">
                        <User className="h-4 w-4" />
                        <span>{task.assignedToName}</span>
                      </div>

                      {task.relatedTo && (
                        <div className="flex items-center gap-1">
                          <span className="text-blue-600">Related to: {task.relatedTo.name}</span>
                        </div>
                      )}
                    </div>

                    {task.notes && (
                      <div className="mt-3 p-2 bg-gray-50 rounded border-l-2 border-gray-300">
                        <p className="text-sm text-gray-700">{task.notes}</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 ml-4">
                  <span
                    className={`text-xs px-2 py-1 rounded-full font-medium border ${STATUS_COLORS[task.status]}`}
                  >
                    {task.status.replace('_', ' ').toUpperCase()}
                  </span>

                  <div className="relative">
                    <button className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100">
                      <MoreHorizontal className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* TODO: Add CreateTaskModal and TaskDetailModal components */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-semibold mb-4">Create New Task</h2>
            <p className="text-gray-600">Task creation modal will be implemented here.</p>
            <button
              onClick={() => setShowCreateModal(false)}
              className="mt-4 px-4 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
