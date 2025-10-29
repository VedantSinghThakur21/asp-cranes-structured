export interface Notification {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  read: boolean;
  createdAt: string;
  link?: string;
}
export type NotificationType =
  | 'job_assigned'
  | 'job_rejected'
  | 'job_completed'
  | 'job_rescheduled'
  | 'job_created'
  | 'feedback_requested'
  | 'lead_status_change'
  | 'quotation_created';

export interface Notification {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  read: boolean;
  createdAt: string;
  link?: string;
}
