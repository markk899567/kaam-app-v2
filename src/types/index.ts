export type UserRole = 'worker' | 'employer' | 'admin';
export type VerificationStatus = 'unverified' | 'pending' | 'verified' | 'rejected';
export type JobStatus = 'active' | 'paused' | 'closed';
export type WorkPeriod = 'full_time' | 'part_time' | 'one_time';
export type PaymentType = 'per_hour' | 'per_day' | 'per_week' | 'per_month' | 'fixed' | 'negotiable';
export type ApplicationStatus = 'under_review' | 'interview' | 'accepted' | 'rejected' | 'job_closed';
export type ActiveWorkStatus = 'active' | 'completed' | 'cancelled';
export type ConversationType = 'general' | 'application' | 'interview';

export interface Profile {
  id: string;
  email: string;
  phone: string | null;
  name: string;
  profile_photo: string | null;
  location: string | null;
  latitude: number | null;
  longitude: number | null;
  qualification: string | null;
  skills: string[];
  experience: string | null;
  languages: string[];
  work_preferences: string[];
  availability: string;
  role: UserRole;
  verification_status: VerificationStatus;
  phone_verified: boolean;
  created_at: string;
  updated_at: string;
}

export interface Business {
  id: string;
  owner_id: string;
  name: string;
  category: string | null;
  description: string | null;
  address: string | null;
  latitude: number | null;
  longitude: number | null;
  contact_phone: string | null;
  contact_email: string | null;
  logo_url: string | null;
  verification_status: VerificationStatus;
  created_at: string;
  updated_at: string;
}

export interface Job {
  id: string;
  business_id: string;
  employer_id: string;
  title: string;
  description: string | null;
  category: string | null;
  work_period: WorkPeriod;
  is_instant: boolean;
  status: JobStatus;
  location: string | null;
  latitude: number | null;
  longitude: number | null;
  start_date: string | null;
  end_date: string | null;
  time_from: string | null;
  time_to: string | null;
  total_hours: string | null;
  flexible_timing: boolean;
  payment_type: PaymentType;
  payment_amount: number | null;
  vacancies: number;
  rating: number;
  rating_count: number;
  created_at: string;
  updated_at: string;
}

export interface JobRequirement {
  id: string;
  job_id: string;
  qualification: string | null;
  skills: string[];
  experience: string | null;
  languages: string[];
  age_min: number | null;
  age_max: number | null;
  num_workers: number;
  created_at: string;
}

export interface Application {
  id: string;
  applicant_id: string;
  job_id: string;
  employer_id: string;
  business_id: string;
  status: ApplicationStatus;
  cover_note: string | null;
  created_at: string;
  updated_at: string;
}

export interface Conversation {
  id: string;
  job_id: string | null;
  application_id: string | null;
  conversation_type: ConversationType;
  created_at: string;
  updated_at: string;
}

export interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  body: string;
  read_at: string | null;
  created_at: string;
}

export interface Notification {
  id: string;
  user_id: string;
  type: string;
  title: string;
  body: string;
  data: Record<string, unknown>;
  is_read: boolean;
  created_at: string;
}

export interface ActiveWork {
  id: string;
  job_id: string;
  application_id: string;
  worker_id: string;
  employer_id: string;
  business_id: string;
  status: ActiveWorkStatus;
  started_at: string;
  completed_at: string | null;
  created_at: string;
}

export interface CompletedWork {
  id: string;
  job_id: string;
  active_work_id: string;
  worker_id: string;
  employer_id: string;
  business_id: string;
  completed_at: string;
  created_at: string;
}

export interface Review {
  id: string;
  reviewer_id: string;
  reviewed_id: string;
  job_id: string | null;
  completed_work_id: string | null;
  business_id: string | null;
  rating: number;
  review_text: string | null;
  created_at: string;
}

export interface VerificationRecord {
  id: string;
  user_id: string;
  id_type: string | null;
  id_number: string | null;
  document_url: string | null;
  selfie_url: string | null;
  status: 'pending' | 'approved' | 'rejected';
  reviewed_by: string | null;
  review_note: string | null;
  submitted_at: string;
  reviewed_at: string | null;
  created_at: string;
}

export interface Report {
  id: string;
  reporter_id: string;
  reported_user_id: string | null;
  reported_job_id: string | null;
  report_type: string;
  description: string | null;
  status: string;
  created_at: string;
}

export interface BlockedUser {
  id: string;
  blocker_id: string;
  blocked_id: string;
  created_at: string;
}

export interface UserPreferences {
  id: string;
  user_id: string;
  push_notifications: boolean;
  email_notifications: boolean;
  sms_notifications: boolean;
  language: string;
  distance_unit: string;
}

export interface JobWithBusiness extends Job {
  businesses?: { name: string; logo_url: string | null };
  distance_km?: number;
}

export interface NearbyJob {
  id: string;
  title: string;
  description: string | null;
  category: string | null;
  work_period: WorkPeriod;
  is_instant: boolean;
  status: JobStatus;
  location: string | null;
  latitude: number | null;
  longitude: number | null;
  start_date: string | null;
  end_date: string | null;
  time_from: string | null;
  time_to: string | null;
  total_hours: string | null;
  flexible_timing: boolean;
  payment_type: PaymentType;
  payment_amount: number | null;
  vacancies: number;
  rating: number;
  rating_count: number;
  business_id: string;
  employer_id: string;
  created_at: string;
  distance_km: number;
  business_name: string;
  business_logo: string | null;
}

export interface SearchJobResult {
  id: string;
  title: string;
  description: string | null;
  category: string | null;
  work_period: WorkPeriod;
  is_instant: boolean;
  status: JobStatus;
  location: string | null;
  latitude: number | null;
  longitude: number | null;
  start_date: string | null;
  end_date: string | null;
  time_from: string | null;
  time_to: string | null;
  total_hours: string | null;
  flexible_timing: boolean;
  payment_type: PaymentType;
  payment_amount: number | null;
  vacancies: number;
  rating: number;
  rating_count: number;
  business_id: string;
  employer_id: string;
  created_at: string;
  business_name: string;
  business_logo: string | null;
}
