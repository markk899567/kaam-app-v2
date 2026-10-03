/*
# Kaam Schema — Tables, Indexes, Functions (Part 1)

Creates all tables for the Kaam jobs marketplace without RLS policies.
Policies are added in a separate migration to avoid circular dependency issues.

## Tables: profiles, businesses, jobs, job_requirements, applications,
## saved_jobs, saved_profiles, conversations, conversation_participants,
## messages, notifications, push_tokens, active_work, completed_work,
## reviews, verification_records, reports, blocked_users, user_preferences
*/

-- ============================================================
-- PROFILES
-- ============================================================
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text NOT NULL,
  phone text,
  name text NOT NULL DEFAULT '',
  profile_photo text,
  location text,
  latitude double precision,
  longitude double precision,
  qualification text,
  skills text[] DEFAULT '{}',
  experience text,
  languages text[] DEFAULT '{}',
  work_preferences text[] DEFAULT '{}',
  availability text DEFAULT 'available',
  role text NOT NULL DEFAULT 'worker' CHECK (role IN ('worker', 'employer', 'admin')),
  verification_status text NOT NULL DEFAULT 'unverified' CHECK (verification_status IN ('unverified', 'pending', 'verified', 'rejected')),
  phone_verified boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- ============================================================
-- BUSINESSES
-- ============================================================
CREATE TABLE IF NOT EXISTS businesses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  category text,
  description text,
  address text,
  latitude double precision,
  longitude double precision,
  contact_phone text,
  contact_email text,
  logo_url text,
  verification_status text NOT NULL DEFAULT 'unverified' CHECK (verification_status IN ('unverified', 'pending', 'verified', 'rejected')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- ============================================================
-- JOBS
-- ============================================================
CREATE TABLE IF NOT EXISTS jobs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  employer_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  category text,
  work_period text NOT NULL DEFAULT 'one_time' CHECK (work_period IN ('full_time', 'part_time', 'one_time')),
  is_instant boolean NOT NULL DEFAULT false,
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'paused', 'closed')),
  location text,
  latitude double precision,
  longitude double precision,
  start_date date,
  end_date date,
  time_from text,
  time_to text,
  total_hours text,
  flexible_timing boolean NOT NULL DEFAULT false,
  payment_type text NOT NULL DEFAULT 'fixed' CHECK (payment_type IN ('per_hour', 'per_day', 'per_week', 'per_month', 'fixed', 'negotiable')),
  payment_amount numeric(10,2),
  vacancies integer NOT NULL DEFAULT 1,
  rating numeric(2,1) DEFAULT 0,
  rating_count integer DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- ============================================================
-- JOB REQUIREMENTS
-- ============================================================
CREATE TABLE IF NOT EXISTS job_requirements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id uuid NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
  qualification text,
  skills text[] DEFAULT '{}',
  experience text,
  languages text[] DEFAULT '{}',
  age_min integer,
  age_max integer,
  num_workers integer NOT NULL DEFAULT 1,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- ============================================================
-- APPLICATIONS
-- ============================================================
CREATE TABLE IF NOT EXISTS applications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  applicant_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  job_id uuid NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
  employer_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  business_id uuid NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'under_review' CHECK (status IN ('under_review', 'interview', 'accepted', 'rejected', 'job_closed')),
  cover_note text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(applicant_id, job_id)
);

-- ============================================================
-- SAVED JOBS
-- ============================================================
CREATE TABLE IF NOT EXISTS saved_jobs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  job_id uuid NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, job_id)
);

-- ============================================================
-- SAVED PROFILES
-- ============================================================
CREATE TABLE IF NOT EXISTS saved_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  saved_user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, saved_user_id)
);

-- ============================================================
-- CONVERSATIONS
-- ============================================================
CREATE TABLE IF NOT EXISTS conversations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id uuid REFERENCES jobs(id) ON DELETE CASCADE,
  application_id uuid REFERENCES applications(id) ON DELETE CASCADE,
  conversation_type text NOT NULL DEFAULT 'general' CHECK (conversation_type IN ('general', 'application', 'interview')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- ============================================================
-- CONVERSATION PARTICIPANTS
-- ============================================================
CREATE TABLE IF NOT EXISTS conversation_participants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(conversation_id, user_id)
);

-- ============================================================
-- MESSAGES
-- ============================================================
CREATE TABLE IF NOT EXISTS messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  sender_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  body text NOT NULL,
  read_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- ============================================================
-- NOTIFICATIONS
-- ============================================================
CREATE TABLE IF NOT EXISTS notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  type text NOT NULL,
  title text NOT NULL,
  body text NOT NULL,
  data jsonb DEFAULT '{}',
  is_read boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- ============================================================
-- PUSH TOKENS
-- ============================================================
CREATE TABLE IF NOT EXISTS push_tokens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  token text NOT NULL,
  platform text NOT NULL DEFAULT 'web' CHECK (platform IN ('web', 'android', 'ios', 'sms')),
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, token)
);

-- ============================================================
-- ACTIVE WORK
-- ============================================================
CREATE TABLE IF NOT EXISTS active_work (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id uuid NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
  application_id uuid NOT NULL REFERENCES applications(id) ON DELETE CASCADE,
  worker_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  employer_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  business_id uuid NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'completed', 'cancelled')),
  started_at timestamptz NOT NULL DEFAULT now(),
  completed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- ============================================================
-- COMPLETED WORK
-- ============================================================
CREATE TABLE IF NOT EXISTS completed_work (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id uuid NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
  active_work_id uuid NOT NULL REFERENCES active_work(id) ON DELETE CASCADE,
  worker_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  employer_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  business_id uuid NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  completed_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now()
);

-- ============================================================
-- REVIEWS
-- ============================================================
CREATE TABLE IF NOT EXISTS reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reviewer_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  reviewed_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  job_id uuid REFERENCES jobs(id) ON DELETE CASCADE,
  completed_work_id uuid REFERENCES completed_work(id) ON DELETE CASCADE,
  business_id uuid REFERENCES businesses(id) ON DELETE CASCADE,
  rating integer NOT NULL CHECK (rating >= 1 AND rating <= 5),
  review_text text,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(reviewer_id, completed_work_id)
);

-- ============================================================
-- VERIFICATION RECORDS
-- ============================================================
CREATE TABLE IF NOT EXISTS verification_records (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  id_type text CHECK (id_type IN ('national_id', 'passport', 'driving_license', 'voter_id', 'other')),
  id_number text,
  document_url text,
  selfie_url text,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  reviewed_by uuid REFERENCES auth.users(id),
  review_note text,
  submitted_at timestamptz NOT NULL DEFAULT now(),
  reviewed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- ============================================================
-- REPORTS
-- ============================================================
CREATE TABLE IF NOT EXISTS reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  reported_user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  reported_job_id uuid REFERENCES jobs(id) ON DELETE CASCADE,
  report_type text NOT NULL CHECK (report_type IN ('fake_job', 'fake_profile', 'scam', 'inappropriate', 'harassment', 'spam', 'other')),
  description text,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'reviewing', 'resolved', 'dismissed')),
  created_at timestamptz NOT NULL DEFAULT now()
);

-- ============================================================
-- BLOCKED USERS
-- ============================================================
CREATE TABLE IF NOT EXISTS blocked_users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  blocker_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  blocked_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(blocker_id, blocked_id)
);

-- ============================================================
-- USER PREFERENCES
-- ============================================================
CREATE TABLE IF NOT EXISTS user_preferences (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  push_notifications boolean NOT NULL DEFAULT true,
  email_notifications boolean NOT NULL DEFAULT true,
  sms_notifications boolean NOT NULL DEFAULT false,
  language text NOT NULL DEFAULT 'en',
  distance_unit text NOT NULL DEFAULT 'km',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

-- ============================================================
-- ENABLE RLS ON ALL TABLES
-- ============================================================
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE businesses ENABLE ROW LEVEL SECURITY;
ALTER TABLE jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE job_requirements ENABLE ROW LEVEL SECURITY;
ALTER TABLE applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE saved_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE saved_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversation_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE push_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE active_work ENABLE ROW LEVEL SECURITY;
ALTER TABLE completed_work ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE verification_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE blocked_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- INDEXES
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);
CREATE INDEX IF NOT EXISTS idx_businesses_owner ON businesses(owner_id);
CREATE INDEX IF NOT EXISTS idx_jobs_employer ON jobs(employer_id);
CREATE INDEX IF NOT EXISTS idx_jobs_status ON jobs(status);
CREATE INDEX IF NOT EXISTS idx_jobs_category ON jobs(category);
CREATE INDEX IF NOT EXISTS idx_jobs_work_period ON jobs(work_period);
CREATE INDEX IF NOT EXISTS idx_jobs_is_instant ON jobs(is_instant);
CREATE INDEX IF NOT EXISTS idx_jobs_location ON jobs(latitude, longitude);
CREATE INDEX IF NOT EXISTS idx_jobs_created ON jobs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_job_req_job ON job_requirements(job_id);
CREATE INDEX IF NOT EXISTS idx_apps_applicant ON applications(applicant_id);
CREATE INDEX IF NOT EXISTS idx_apps_employer ON applications(employer_id);
CREATE INDEX IF NOT EXISTS idx_apps_job ON applications(job_id);
CREATE INDEX IF NOT EXISTS idx_apps_status ON applications(status);
CREATE INDEX IF NOT EXISTS idx_saved_jobs_user ON saved_jobs(user_id);
CREATE INDEX IF NOT EXISTS idx_saved_profiles_user ON saved_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_conv_part_user ON conversation_participants(user_id);
CREATE INDEX IF NOT EXISTS idx_conv_part_conv ON conversation_participants(conversation_id);
CREATE INDEX IF NOT EXISTS idx_messages_conv ON messages(conversation_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_unread ON notifications(user_id, is_read);
CREATE INDEX IF NOT EXISTS idx_active_work_worker ON active_work(worker_id);
CREATE INDEX IF NOT EXISTS idx_active_work_employer ON active_work(employer_id);
CREATE INDEX IF NOT EXISTS idx_completed_work_worker ON completed_work(worker_id);
CREATE INDEX IF NOT EXISTS idx_completed_work_employer ON completed_work(employer_id);
CREATE INDEX IF NOT EXISTS idx_reviews_reviewed ON reviews(reviewed_id);
CREATE INDEX IF NOT EXISTS idx_verification_user ON verification_records(user_id);
CREATE INDEX IF NOT EXISTS idx_reports_reporter ON reports(reporter_id);
CREATE INDEX IF NOT EXISTS idx_reports_status ON reports(status);
CREATE INDEX IF NOT EXISTS idx_blocked_blocker ON blocked_users(blocker_id);

-- ============================================================
-- UPDATED_AT TRIGGER
-- ============================================================
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS profiles_updated_at ON profiles;
CREATE TRIGGER profiles_updated_at BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS businesses_updated_at ON businesses;
CREATE TRIGGER businesses_updated_at BEFORE UPDATE ON businesses
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS jobs_updated_at ON jobs;
CREATE TRIGGER jobs_updated_at BEFORE UPDATE ON jobs
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS applications_updated_at ON applications;
CREATE TRIGGER applications_updated_at BEFORE UPDATE ON applications
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS conversations_updated_at ON conversations;
CREATE TRIGGER conversations_updated_at BEFORE UPDATE ON conversations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS user_preferences_updated_at ON user_preferences;
CREATE TRIGGER user_preferences_updated_at BEFORE UPDATE ON user_preferences
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================
-- NEARBY JOBS RPC
-- ============================================================
CREATE OR REPLACE FUNCTION get_nearby_jobs(
  p_lat double precision,
  p_lng double precision,
  p_radius_km integer DEFAULT 10,
  p_limit integer DEFAULT 20,
  p_offset integer DEFAULT 0
)
RETURNS TABLE (
  id uuid, title text, description text, category text, work_period text,
  is_instant boolean, status text, location text, latitude double precision,
  longitude double precision, start_date date, end_date date, time_from text,
  time_to text, total_hours text, flexible_timing boolean, payment_type text,
  payment_amount numeric, vacancies integer, rating numeric, rating_count integer,
  business_id uuid, employer_id uuid, created_at timestamptz,
  distance_km double precision, business_name text, business_logo text
)
LANGUAGE plpgsql AS $$
BEGIN
  RETURN QUERY
  SELECT
    j.id, j.title, j.description, j.category, j.work_period, j.is_instant, j.status,
    j.location, j.latitude, j.longitude, j.start_date, j.end_date,
    j.time_from, j.time_to, j.total_hours, j.flexible_timing,
    j.payment_type, j.payment_amount, j.vacancies, j.rating, j.rating_count,
    j.business_id, j.employer_id, j.created_at,
    ROUND((6371 * acos(
      cos(radians(p_lat)) * cos(radians(j.latitude)) *
      cos(radians(j.longitude) - radians(p_lng)) +
      sin(radians(p_lat)) * sin(radians(j.latitude))
    ))::numeric, 2) AS distance_km,
    b.name AS business_name, b.logo_url AS business_logo
  FROM jobs j
  JOIN businesses b ON j.business_id = b.id
  WHERE j.status = 'active'
    AND j.latitude IS NOT NULL AND j.longitude IS NOT NULL
    AND 6371 * acos(
      cos(radians(p_lat)) * cos(radians(j.latitude)) *
      cos(radians(j.longitude) - radians(p_lng)) +
      sin(radians(p_lat)) * sin(radians(j.latitude))
    ) <= p_radius_km
  ORDER BY distance_km ASC
  LIMIT p_limit OFFSET p_offset;
END;
$$;

-- ============================================================
-- SEARCH JOBS RPC
-- ============================================================
CREATE OR REPLACE FUNCTION search_jobs(
  p_query text DEFAULT '',
  p_category text DEFAULT NULL,
  p_work_period text DEFAULT NULL,
  p_is_instant boolean DEFAULT NULL,
  p_payment_min numeric DEFAULT NULL,
  p_payment_max numeric DEFAULT NULL,
  p_limit integer DEFAULT 20,
  p_offset integer DEFAULT 0
)
RETURNS TABLE (
  id uuid, title text, description text, category text, work_period text,
  is_instant boolean, status text, location text, latitude double precision,
  longitude double precision, start_date date, end_date date, time_from text,
  time_to text, total_hours text, flexible_timing boolean, payment_type text,
  payment_amount numeric, vacancies integer, rating numeric, rating_count integer,
  business_id uuid, employer_id uuid, created_at timestamptz,
  business_name text, business_logo text
)
LANGUAGE plpgsql AS $$
BEGIN
  RETURN QUERY
  SELECT
    j.id, j.title, j.description, j.category, j.work_period, j.is_instant, j.status,
    j.location, j.latitude, j.longitude, j.start_date, j.end_date,
    j.time_from, j.time_to, j.total_hours, j.flexible_timing,
    j.payment_type, j.payment_amount, j.vacancies, j.rating, j.rating_count,
    j.business_id, j.employer_id, j.created_at,
    b.name AS business_name, b.logo_url AS business_logo
  FROM jobs j
  JOIN businesses b ON j.business_id = b.id
  WHERE j.status = 'active'
    AND (p_query = '' OR
      j.title ILIKE '%' || p_query || '%' OR
      j.description ILIKE '%' || p_query || '%' OR
      j.category ILIKE '%' || p_query || '%' OR
      j.location ILIKE '%' || p_query || '%' OR
      b.name ILIKE '%' || p_query || '%'
    )
    AND (p_category IS NULL OR j.category = p_category)
    AND (p_work_period IS NULL OR j.work_period = p_work_period)
    AND (p_is_instant IS NULL OR j.is_instant = p_is_instant)
    AND (p_payment_min IS NULL OR j.payment_amount >= p_payment_min)
    AND (p_payment_max IS NULL OR j.payment_amount <= p_payment_max)
  ORDER BY j.created_at DESC
  LIMIT p_limit OFFSET p_offset;
END;
$$;

-- ============================================================
-- AUTO-CREATE PROFILE ON SIGNUP
-- ============================================================
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, email, name)
  VALUES (NEW.id, NEW.email, COALESCE(NEW.raw_user_meta_data->>'name', ''));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();