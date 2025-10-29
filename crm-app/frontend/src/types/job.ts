export type JobStatus = 'pending' | 'scheduled' | 'in_progress' | 'completed' | 'cancelled';
export type OperatorAvailability = 'available' | 'assigned' | 'on_leave' | 'inactive';

export interface Equipment {
  id: string;
  name: string;
  type: string;
  description: string;
  baseRate: number;
}

export interface Operator {
  id: string;
  name: string;
  email: string;
  phone: string;
  specialization: string;
  certifications?: string[];
  availability?: OperatorAvailability;
  createdAt?: string;
  updatedAt?: string;
}

export interface JobLocation {
  address: string;
  coordinates?: {
    latitude: number;
    longitude: number;
  };
}

export interface Job {
  id: string;
  title: string;
  leadId: string;
  customerId: string;
  customerName: string;
  equipmentIds: string[];
  operatorIds: string[];
  dealId?: string;
  status: JobStatus;
  scheduledStartDate: string;
  scheduledEndDate: string;
  actualStartDate?: string | null;
  actualEndDate?: string | null;
  location: string;
  notes?: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  assignedTo?: string;
}
