// Mock activities storage
const MOCK_ACTIVITIES = [
  {
    id: '1',
    type: 'lead',
    title: 'New lead created',
    description: 'John Doe submitted a crane rental inquiry',
    timestamp: new Date(Date.now() - 1000 * 60 * 15), // 15 minutes ago
    status: 'info',
    user: 'System',
  },
  {
    id: '2',
    type: 'deal',
    title: 'Deal closed',
    description: 'Construction project deal worth ₹2,50,000 closed successfully',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2), // 2 hours ago
    status: 'success',
    user: 'Sales Agent',
  },
  {
    id: '3',
    type: 'job',
    title: 'Job scheduled',
    description: 'Crane deployment for Site A scheduled for tomorrow',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 4), // 4 hours ago
    status: 'info',
    user: 'Operations Manager',
  },
  {
    id: '4',
    type: 'equipment',
    title: 'Maintenance alert',
    description: 'Crane CR-001 requires scheduled maintenance',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 6), // 6 hours ago
    status: 'warning',
    user: 'System',
  },
  {
    id: '5',
    type: 'user',
    title: 'New user registered',
    description: 'New operator account created for Mike Johnson',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24), // 1 day ago
    status: 'info',
    user: 'Admin',
  },
];

// Get recent activities
export const getRecentActivities = async (limit = 10) => {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 300));

  return MOCK_ACTIVITIES.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
    .slice(0, limit)
    .map(activity => ({ ...activity }));
};

// Create a new activity
export const createActivity = async activity => {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 200));

  const newActivity = {
    ...activity,
    id: Math.random().toString(36).substring(2, 9),
    timestamp: new Date(),
  };

  MOCK_ACTIVITIES.push(newActivity);
  return { ...newActivity };
};

// Helper function to create job-related activity
export const createJobActivity = async (customerName, action, user) => {
  const titles = {
    created: 'Job scheduled',
    updated: 'Job updated',
    completed: 'Job completed',
    cancelled: 'Job cancelled',
  };

  const descriptions = {
    created: `New job scheduled for ${customerName}`,
    updated: `Job for ${customerName} has been updated`,
    completed: `Job for ${customerName} has been completed`,
    cancelled: `Job for ${customerName} has been cancelled`,
  };

  const statuses = {
    created: 'info',
    updated: 'info',
    completed: 'success',
    cancelled: 'warning',
  };

  return createActivity({
    type: 'job',
    title: titles[action],
    description: descriptions[action],
    status: statuses[action],
    user,
  });
};
