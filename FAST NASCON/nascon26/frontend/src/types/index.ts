export type UserRole = 'owner' | 'admin' | 'user';

export type UserStatus = 'available' | 'busy' | 'on_leave' | 'offline';

export interface UserPermissions {
  view: boolean;
  create: boolean;
  edit: boolean;
  delete: boolean;
  export: boolean;
  manage_integrations: boolean;
}

export interface AuthUser {
  id: number;
  username: string;
  email: string;
  role: UserRole;
  workspace: string; // UUID
  workspace_name: string;
  permissions: UserPermissions;
  status?: UserStatus;
  max_open_leads?: number;
}

export interface WorkspaceConfig {
  id: string;
  name: string;
  slug: string;
  ack_window_minutes: number;
  max_escalations: number;
  whatsapp_number?: string;
}

export type OpportunityStage = 'lead' | 'qualified' | 'proposal' | 'negotiation' | 'won' | 'lost';

export type PaymentStatus = 'unpaid' | 'pending' | 'partial' | 'paid' | 'failed';

export interface Opportunity {
  id: string;
  name: string;
  contact: string; // Contact UUID
  contact_name?: string;
  company?: string | null;
  company_name?: string;
  owner?: number | null;
  owner_name?: string;
  stage: OpportunityStage;
  value: string | number;
  currency: string;
  expected_close_date?: string | null;
  custom_data: Record<string, any>;
  created_at: string;
  updated_at: string;
  
  // Escalation & acknowledgment tracking
  assigned_at?: string | null;
  acknowledged_at?: string | null;
  escalation_count?: number;
  last_escalated_at?: string | null;
  in_recovery_queue?: boolean;
  recovery_reason?: string;
  
  // Stripe integration payment tracking
  payment_status?: PaymentStatus;
  amount_collected?: string | number;
}

export type CustomFieldEntityType = 'contact' | 'company' | 'opportunity';
export type CustomFieldDataType = 'text' | 'number' | 'date' | 'dropdown' | 'checkbox';

export interface CustomFieldDefinition {
  id: string;
  name: string;
  key: string;
  entity_type: CustomFieldEntityType;
  data_type: CustomFieldDataType;
  options: string[];
  is_required: boolean;
  position: number;
  created_at?: string;
  updated_at?: string;
}

export interface AuditLogEntry {
  id: number;
  actor: number | null;
  actor_repr: string;
  action: 'create' | 'update' | 'delete' | 'export' | 'permission_change' | 'other';
  target_type: string;
  target_id: string;
  target_repr: string;
  before: Record<string, any> | null;
  after: Record<string, any> | null;
  ip_address: string | null;
  timestamp: string;
  prev_hash?: string;
  entry_hash?: string;
}

export interface Contact {
  id: string;
  first_name: string;
  last_name: string;
  full_name: string;
  email: string;
  phone: string;
  job_title: string;
  company?: string | null;
  custom_data: Record<string, any>;
}

export interface Company {
  id: string;
  name: string;
  domain: string;
  industry: string;
  custom_data: Record<string, any>;
}
