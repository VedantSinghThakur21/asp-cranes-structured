export type UserRole = 'admin' | 'sales_agent' | 'operations_manager' | 'operator' | 'support';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  phone?: string;
  avatar?: string;
  isActive?: boolean;
}

export interface CreateUserData {
  name: string;
  email: string;
  role: UserRole;
  phone?: string;
  password: string;
  avatar?: string;
}

export interface UpdateUserData {
  name?: string;
  email?: string;
  role?: UserRole;
  phone?: string;
  password?: string;
  isActive?: boolean;
  avatar?: string;
}

export interface AuthState {
  token: string | null;
  user: User | null;
  isAuthenticated: boolean;
  error: string | null;
}
