/*
# Kaam Schema — RLS Policies (Part 2)

Adds Row Level Security policies to all Kaam tables.
Tables were created in the kaam_tables migration; this migration only adds policies.

## Policy Summary
- profiles: public read, self insert/update
- businesses: public read, owner insert/update/delete
- jobs: public read, employer insert/update/delete
- job_requirements: public read, employer (via job ownership) insert/update/delete
- applications: applicant+employer read, applicant insert, both update, applicant delete
- saved_jobs/saved_profiles: owner CRUD
- conversations: participant-scoped access
- conversation_participants: self/participant read, self insert
- messages: participant read, sender insert, participant update
- notifications/push_tokens: owner CRUD
- active_work: worker+employer read/update/insert
- completed_work: worker+employer read
- reviews: public read, authorized reviewer insert, reviewer delete
- verification_records: owner read/insert/update
- reports: reporter read/insert
- blocked_users: blocker CRUD
- user_preferences: owner CRUD
*/

-- PROFILES
DROP POLICY IF EXISTS "profiles_select_public" ON profiles;
CREATE POLICY "profiles_select_public" ON profiles FOR SELECT
  TO authenticated USING (true);

DROP POLICY IF EXISTS "profiles_insert_own" ON profiles;
CREATE POLICY "profiles_insert_own" ON profiles FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "profiles_update_own" ON profiles;
CREATE POLICY "profiles_update_own" ON profiles FOR UPDATE
  TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

-- BUSINESSES
DROP POLICY IF EXISTS "businesses_select_all" ON businesses;
CREATE POLICY "businesses_select_all" ON businesses FOR SELECT
  TO authenticated USING (true);

DROP POLICY IF EXISTS "businesses_insert_own" ON businesses;
CREATE POLICY "businesses_insert_own" ON businesses FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = owner_id);

DROP POLICY IF EXISTS "businesses_update_own" ON businesses;
CREATE POLICY "businesses_update_own" ON businesses FOR UPDATE
  TO authenticated USING (auth.uid() = owner_id) WITH CHECK (auth.uid() = owner_id);

DROP POLICY IF EXISTS "businesses_delete_own" ON businesses;
CREATE POLICY "businesses_delete_own" ON businesses FOR DELETE
  TO authenticated USING (auth.uid() = owner_id);

-- JOBS
DROP POLICY IF EXISTS "jobs_select_all" ON jobs;
CREATE POLICY "jobs_select_all" ON jobs FOR SELECT
  TO authenticated USING (true);

DROP POLICY IF EXISTS "jobs_insert_own" ON jobs;
CREATE POLICY "jobs_insert_own" ON jobs FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = employer_id);

DROP POLICY IF EXISTS "jobs_update_own" ON jobs;
CREATE POLICY "jobs_update_own" ON jobs FOR UPDATE
  TO authenticated USING (auth.uid() = employer_id) WITH CHECK (auth.uid() = employer_id);

DROP POLICY IF EXISTS "jobs_delete_own" ON jobs;
CREATE POLICY "jobs_delete_own" ON jobs FOR DELETE
  TO authenticated USING (auth.uid() = employer_id);

-- JOB REQUIREMENTS
DROP POLICY IF EXISTS "job_req_select_all" ON job_requirements;
CREATE POLICY "job_req_select_all" ON job_requirements FOR SELECT
  TO authenticated USING (true);

DROP POLICY IF EXISTS "job_req_insert_own" ON job_requirements;
CREATE POLICY "job_req_insert_own" ON job_requirements FOR INSERT
  TO authenticated WITH CHECK (
    EXISTS (SELECT 1 FROM jobs WHERE jobs.id = job_id AND jobs.employer_id = auth.uid())
  );

DROP POLICY IF EXISTS "job_req_update_own" ON job_requirements;
CREATE POLICY "job_req_update_own" ON job_requirements FOR UPDATE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM jobs WHERE jobs.id = job_id AND jobs.employer_id = auth.uid())
  ) WITH CHECK (
    EXISTS (SELECT 1 FROM jobs WHERE jobs.id = job_id AND jobs.employer_id = auth.uid())
  );

DROP POLICY IF EXISTS "job_req_delete_own" ON job_requirements;
CREATE POLICY "job_req_delete_own" ON job_requirements FOR DELETE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM jobs WHERE jobs.id = job_id AND jobs.employer_id = auth.uid())
  );

-- APPLICATIONS
DROP POLICY IF EXISTS "apps_select_own" ON applications;
CREATE POLICY "apps_select_own" ON applications FOR SELECT
  TO authenticated USING (auth.uid() = applicant_id OR auth.uid() = employer_id);

DROP POLICY IF EXISTS "apps_insert_own" ON applications;
CREATE POLICY "apps_insert_own" ON applications FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = applicant_id);

DROP POLICY IF EXISTS "apps_update_own" ON applications;
CREATE POLICY "apps_update_own" ON applications FOR UPDATE
  TO authenticated USING (auth.uid() = applicant_id OR auth.uid() = employer_id)
  WITH CHECK (auth.uid() = applicant_id OR auth.uid() = employer_id);

DROP POLICY IF EXISTS "apps_delete_own" ON applications;
CREATE POLICY "apps_delete_own" ON applications FOR DELETE
  TO authenticated USING (auth.uid() = applicant_id);

-- SAVED JOBS
DROP POLICY IF EXISTS "saved_jobs_select_own" ON saved_jobs;
CREATE POLICY "saved_jobs_select_own" ON saved_jobs FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "saved_jobs_insert_own" ON saved_jobs;
CREATE POLICY "saved_jobs_insert_own" ON saved_jobs FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "saved_jobs_delete_own" ON saved_jobs;
CREATE POLICY "saved_jobs_delete_own" ON saved_jobs FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

-- SAVED PROFILES
DROP POLICY IF EXISTS "saved_profiles_select_own" ON saved_profiles;
CREATE POLICY "saved_profiles_select_own" ON saved_profiles FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "saved_profiles_insert_own" ON saved_profiles;
CREATE POLICY "saved_profiles_insert_own" ON saved_profiles FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "saved_profiles_delete_own" ON saved_profiles;
CREATE POLICY "saved_profiles_delete_own" ON saved_profiles FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

-- CONVERSATIONS
DROP POLICY IF EXISTS "conversations_select_participant" ON conversations;
CREATE POLICY "conversations_select_participant" ON conversations FOR SELECT
  TO authenticated USING (
    EXISTS (
      SELECT 1 FROM conversation_participants
      WHERE conversation_participants.conversation_id = conversations.id
      AND conversation_participants.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "conversations_insert_participant" ON conversations;
CREATE POLICY "conversations_insert_participant" ON conversations FOR INSERT
  TO authenticated WITH CHECK (
    EXISTS (
      SELECT 1 FROM conversation_participants
      WHERE conversation_participants.conversation_id = conversations.id
      AND conversation_participants.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "conversations_update_participant" ON conversations;
CREATE POLICY "conversations_update_participant" ON conversations FOR UPDATE
  TO authenticated USING (
    EXISTS (
      SELECT 1 FROM conversation_participants
      WHERE conversation_participants.conversation_id = conversations.id
      AND conversation_participants.user_id = auth.uid()
    )
  );

-- CONVERSATION PARTICIPANTS
DROP POLICY IF EXISTS "conv_part_select_own" ON conversation_participants;
CREATE POLICY "conv_part_select_own" ON conversation_participants FOR SELECT
  TO authenticated USING (
    auth.uid() = user_id
    OR EXISTS (
      SELECT 1 FROM conversation_participants cp
      WHERE cp.conversation_id = conversation_participants.conversation_id
      AND cp.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "conv_part_insert_own" ON conversation_participants;
CREATE POLICY "conv_part_insert_own" ON conversation_participants FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

-- MESSAGES
DROP POLICY IF EXISTS "messages_select_participant" ON messages;
CREATE POLICY "messages_select_participant" ON messages FOR SELECT
  TO authenticated USING (
    EXISTS (
      SELECT 1 FROM conversation_participants
      WHERE conversation_participants.conversation_id = messages.conversation_id
      AND conversation_participants.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "messages_insert_participant" ON messages;
CREATE POLICY "messages_insert_participant" ON messages FOR INSERT
  TO authenticated WITH CHECK (
    auth.uid() = sender_id
    AND EXISTS (
      SELECT 1 FROM conversation_participants
      WHERE conversation_participants.conversation_id = messages.conversation_id
      AND conversation_participants.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "messages_update_participant" ON messages;
CREATE POLICY "messages_update_participant" ON messages FOR UPDATE
  TO authenticated USING (
    EXISTS (
      SELECT 1 FROM conversation_participants
      WHERE conversation_participants.conversation_id = messages.conversation_id
      AND conversation_participants.user_id = auth.uid()
    )
  );

-- NOTIFICATIONS
DROP POLICY IF EXISTS "notifications_select_own" ON notifications;
CREATE POLICY "notifications_select_own" ON notifications FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "notifications_update_own" ON notifications;
CREATE POLICY "notifications_update_own" ON notifications FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "notifications_delete_own" ON notifications;
CREATE POLICY "notifications_delete_own" ON notifications FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

-- PUSH TOKENS
DROP POLICY IF EXISTS "push_tokens_select_own" ON push_tokens;
CREATE POLICY "push_tokens_select_own" ON push_tokens FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "push_tokens_insert_own" ON push_tokens;
CREATE POLICY "push_tokens_insert_own" ON push_tokens FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "push_tokens_delete_own" ON push_tokens;
CREATE POLICY "push_tokens_delete_own" ON push_tokens FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

-- ACTIVE WORK
DROP POLICY IF EXISTS "active_work_select_own" ON active_work;
CREATE POLICY "active_work_select_own" ON active_work FOR SELECT
  TO authenticated USING (auth.uid() = worker_id OR auth.uid() = employer_id);

DROP POLICY IF EXISTS "active_work_update_own" ON active_work;
CREATE POLICY "active_work_update_own" ON active_work FOR UPDATE
  TO authenticated USING (auth.uid() = worker_id OR auth.uid() = employer_id)
  WITH CHECK (auth.uid() = worker_id OR auth.uid() = employer_id);

DROP POLICY IF EXISTS "active_work_insert_own" ON active_work;
CREATE POLICY "active_work_insert_own" ON active_work FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = worker_id OR auth.uid() = employer_id);

-- COMPLETED WORK
DROP POLICY IF EXISTS "completed_work_select_own" ON completed_work;
CREATE POLICY "completed_work_select_own" ON completed_work FOR SELECT
  TO authenticated USING (auth.uid() = worker_id OR auth.uid() = employer_id);

-- REVIEWS
DROP POLICY IF EXISTS "reviews_select_all" ON reviews;
CREATE POLICY "reviews_select_all" ON reviews FOR SELECT
  TO authenticated USING (true);

DROP POLICY IF EXISTS "reviews_insert_own" ON reviews;
CREATE POLICY "reviews_insert_own" ON reviews FOR INSERT
  TO authenticated WITH CHECK (
    auth.uid() = reviewer_id
    AND EXISTS (
      SELECT 1 FROM completed_work cw
      WHERE cw.id = reviews.completed_work_id
      AND (cw.worker_id = auth.uid() OR cw.employer_id = auth.uid())
    )
  );

DROP POLICY IF EXISTS "reviews_delete_own" ON reviews;
CREATE POLICY "reviews_delete_own" ON reviews FOR DELETE
  TO authenticated USING (auth.uid() = reviewer_id);

-- VERIFICATION RECORDS
DROP POLICY IF EXISTS "verification_select_own" ON verification_records;
CREATE POLICY "verification_select_own" ON verification_records FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "verification_insert_own" ON verification_records;
CREATE POLICY "verification_insert_own" ON verification_records FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "verification_update_own" ON verification_records;
CREATE POLICY "verification_update_own" ON verification_records FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- REPORTS
DROP POLICY IF EXISTS "reports_select_own" ON reports;
CREATE POLICY "reports_select_own" ON reports FOR SELECT
  TO authenticated USING (auth.uid() = reporter_id);

DROP POLICY IF EXISTS "reports_insert_own" ON reports;
CREATE POLICY "reports_insert_own" ON reports FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = reporter_id);

-- BLOCKED USERS
DROP POLICY IF EXISTS "blocked_select_own" ON blocked_users;
CREATE POLICY "blocked_select_own" ON blocked_users FOR SELECT
  TO authenticated USING (auth.uid() = blocker_id);

DROP POLICY IF EXISTS "blocked_insert_own" ON blocked_users;
CREATE POLICY "blocked_insert_own" ON blocked_users FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = blocker_id);

DROP POLICY IF EXISTS "blocked_delete_own" ON blocked_users;
CREATE POLICY "blocked_delete_own" ON blocked_users FOR DELETE
  TO authenticated USING (auth.uid() = blocker_id);

-- USER PREFERENCES
DROP POLICY IF EXISTS "prefs_select_own" ON user_preferences;
CREATE POLICY "prefs_select_own" ON user_preferences FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "prefs_insert_own" ON user_preferences;
CREATE POLICY "prefs_insert_own" ON user_preferences FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "prefs_update_own" ON user_preferences;
CREATE POLICY "prefs_update_own" ON user_preferences FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);