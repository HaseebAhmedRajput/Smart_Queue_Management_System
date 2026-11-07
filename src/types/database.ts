export type UserRole = 'user' | 'token_operator' | 'operation_officer' | 'admin';

export type TokenStatus =
  | 'pending'
  | 'called'
  | 'working'
  | 'successful'
  | 'rejected'
  | 'skipped'
  | 'cancelled';

export interface Profile {
  id: string;
  email: string;
  full_name: string;
  role: UserRole;
  assigned_shelf_id?: string | null;
  created_at: string;
  updated_at: string;
}

export interface Applicant {
  id: string;
  account_id: string;
  full_name: string;
  national_id_or_passport: string;
  date_of_birth?: string | null;
  phone?: string | null;
  relationship: 'self' | 'spouse' | 'child' | 'parent' | 'sibling' | 'other';
  created_at: string;
  updated_at: string;
}

export interface Floor {
  id: string;
  name: string;
  floor_number: number;
  description: string;
  is_active: boolean;
  created_at: string;
}

export interface Shelf {
  id: string;
  floor_id: string;
  name: string;
  shelf_number: number;
  service_ids: string[];
  is_active: boolean;
  is_paused: boolean;
  current_officer_id?: string | null;
  created_at: string;
}

export interface Service {
  id: string;
  name: string;
  code: string;
  description: string;
  estimated_duration_minutes: number;
  is_active: boolean;
  created_at: string;
}

export interface Token {
  id: string;
  display_number: string;
  sequence_number: number;
  applicant_id: string;
  account_id: string;
  service_id: string;
  floor_id?: string | null;
  shelf_id?: string | null;
  officer_id?: string | null;
  status: TokenStatus;
  created_at: string;
  called_at?: string | null;
  started_at?: string | null;
  completed_at?: string | null;
  rejection_reason?: string | null;
  skip_reason?: string | null;
  is_walk_in: boolean;
}

export interface TokenAssignment {
  id: string;
  token_id: string;
  shelf_id: string;
  officer_id?: string | null;
  assigned_at: string;
  released_at?: string | null;
  assignment_type: 'auto' | 'manual' | 'reassigned';
}

export interface TokenEvent {
  id: string;
  token_id: string;
  actor_id: string;
  actor_role: string;
  actor_name?: string;
  previous_status?: TokenStatus | null;
  new_status: TokenStatus;
  event_type: string;
  notes?: string | null;
  created_at: string;
}

// Joined views for UI convenience
export interface TokenWithDetails extends Token {
  applicant?: Applicant;
  service?: Service;
  shelf?: Shelf;
  floor?: Floor;
  officer?: Profile;
  account?: Profile;
}
