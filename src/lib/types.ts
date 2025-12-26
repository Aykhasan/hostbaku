export type UserRole = 'admin' | 'cleaner' | 'owner';
export type TaskType = 'turnover_clean' | 'deep_clean' | 'inspection' | 'maintenance';
export type TaskStatus = 'todo' | 'in_progress' | 'done';
export type LeadStatus = 'new' | 'contacted' | 'qualified' | 'converted' | 'lost';

export interface User {
  id: string;
  email: string;
  name: string;
  phone: string | null;
  role: UserRole;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface Property {
  id: string;
  name: string;
  address: string;
  city: string | null;
  description: string | null;
  owner_id: string | null;
  owner_name?: string;
  bedrooms: number;
  bathrooms: number;
  max_guests: number;
  airbnb_link: string | null;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface PropertyUnit {
  id: string;
  property_id: string;
  unit_number: string;
  floor: number | null;
  notes: string | null;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface Reservation {
  id: string;
  property_id: string;
  property_name?: string;
  unit_id: string | null;
  guest_name: string | null;
  guest_email: string | null;
  guest_phone: string | null;
  check_in: Date;
  check_out: Date;
  num_guests: number;
  total_amount: number | null;
  platform: string;
  platform_booking_id: string | null;
  notes: string | null;
  created_at: Date;
  updated_at: Date;
}

export interface ChecklistItem {
  id: string;
  text: string;
  checked: boolean;
}

export interface Task {
  id: string;
  property_id: string;
  property_name?: string;
  property_address?: string;
  unit_id: string | null;
  reservation_id: string | null;
  assigned_to: string | null;
  assigned_name?: string;
  created_by: string | null;
  task_type: TaskType;
  status: TaskStatus;
  title: string;
  description: string | null;
  due_date: Date | null;
  due_time: string | null;
  priority: number;
  checklist: ChecklistItem[];
  notes: string | null;
  completed_at: Date | null;
  created_at: Date;
  updated_at: Date;
  photos?: TaskPhoto[];
}

export interface TaskPhoto {
  id: string;
  task_id: string;
  uploaded_by: string | null;
  file_path: string;
  file_name: string | null;
  file_size: number | null;
  photo_type: string;
  caption: string | null;
  created_at: Date;
}

export interface Expense {
  id: string;
  property_id: string;
  property_name?: string;
  task_id: string | null;
  recorded_by: string | null;
  category: string;
  description: string | null;
  amount: number;
  expense_date: Date;
  receipt_path: string | null;
  is_billable: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface OwnerStatement {
  id: string;
  owner_id: string;
  property_id: string;
  property_name?: string;
  statement_month: Date;
  total_income: number;
  total_expenses: number;
  net_amount: number;
  management_fee: number;
  pdf_path: string | null;
  notes: string | null;
  created_at: Date;
  updated_at: Date;
}

export interface MaintenanceTicket {
  id: string;
  property_id: string;
  property_name?: string;
  unit_id: string | null;
  reported_by: string | null;
  reporter_name?: string;
  assigned_to: string | null;
  assignee_name?: string;
  title: string;
  description: string | null;
  priority: number;
  status: string;
  estimated_cost: number | null;
  actual_cost: number | null;
  resolved_at: Date | null;
  created_at: Date;
  updated_at: Date;
}

export interface Lead {
  id: string;
  contact_name: string;
  contact_email: string | null;
  contact_phone: string | null;
  location: string;
  layout: string | null;
  property_link: string | null;
  num_bedrooms: number | null;
  num_bathrooms: number | null;
  notes: string | null;
  status: LeadStatus;
  assigned_to: string | null;
  assignee_name?: string;
  follow_up_date: Date | null;
  created_at: Date;
  updated_at: Date;
}

export interface CleanerAssignment {
  id: string;
  cleaner_id: string;
  cleaner_name?: string;
  property_id: string;
  property_name?: string;
  is_primary: boolean;
  created_at: Date;
}

export interface AuditLog {
  id: string;
  user_id: string | null;
  user_name?: string;
  user_email?: string;
  action: string;
  entity_type: string | null;
  entity_id: string | null;
  old_values: Record<string, any> | null;
  new_values: Record<string, any> | null;
  ip_address: string | null;
  user_agent: string | null;
  created_at: Date;
}

// API Response types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// Dashboard Stats
export interface AdminDashboardStats {
  totalProperties: number;
  activeReservations: number;
  pendingTasks: number;
  monthlyRevenue: number;
  occupancyRate: number;
  newLeads: number;
}

export interface CleanerDashboardStats {
  assignedTasks: number;
  completedToday: number;
  upcomingTasks: number;
}

export interface OwnerDashboardStats {
  totalProperties: number;
  monthlyIncome: number;
  monthlyExpenses: number;
  occupancyRate: number;
  openTickets: number;
}
