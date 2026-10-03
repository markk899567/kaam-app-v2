import { useEffect, useState, useCallback } from 'react';
import { FileText, Briefcase, CheckCircle2, History, ChevronRight } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { router } from '@/lib/router';
import { useAuth } from '@/context/AuthContext';
import { Header } from '@/components/Header';
import { Loading, EmptyState } from '@/components/States';
import { applicationStatusLabel, applicationStatusColor, formatDate } from '@/lib/utils';
import { notificationService } from '@/lib/notifications';
import type { Application, ActiveWork, CompletedWork, Job, Business } from '@/types';

export function ActivityScreen() {
  return (
    <div className="min-h-screen bg-cream pb-20">
      <Header title="Activity" />
      <div className="max-w-md mx-auto px-4 pt-4 space-y-3">
        <p className="text-sm text-kaam-muted mb-2">Track your work journey</p>

        <button
          onClick={() => router.navigate({ name: 'applications' })}
          className="option-box"
          style={{ minHeight: '64px' }}
        >
          <div className="option-box-icon">
            <FileText className="w-4 h-4" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-kaam-text">Applications</p>
            <p className="text-xs text-kaam-muted">Track your job applications</p>
          </div>
          <ChevronRight className="w-4 h-4 text-kaam-muted" />
        </button>

        <button
          onClick={() => router.navigate({ name: 'active_work' })}
          className="option-box"
          style={{ minHeight: '64px' }}
        >
          <div className="option-box-icon">
            <Briefcase className="w-4 h-4" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-kaam-text">Active Work</p>
            <p className="text-xs text-kaam-muted">Currently in progress</p>
          </div>
          <ChevronRight className="w-4 h-4 text-kaam-muted" />
        </button>

        <button
          onClick={() => router.navigate({ name: 'completed_work' })}
          className="option-box"
          style={{ minHeight: '64px' }}
        >
          <div className="option-box-icon">
            <CheckCircle2 className="w-4 h-4" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-kaam-text">Completed Work</p>
            <p className="text-xs text-kaam-muted">Finished jobs and reviews</p>
          </div>
          <ChevronRight className="w-4 h-4 text-kaam-muted" />
        </button>

        <button
          onClick={() => router.navigate({ name: 'work_history' })}
          className="option-box"
          style={{ minHeight: '64px' }}
        >
          <div className="option-box-icon">
            <History className="w-4 h-4" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-kaam-text">Work History</p>
            <p className="text-xs text-kaam-muted">All your past work records</p>
          </div>
          <ChevronRight className="w-4 h-4 text-kaam-muted" />
        </button>
      </div>
    </div>
  );
}

export function ApplicationsScreen() {
  const { user } = useAuth();
  const [applications, setApplications] = useState<(Application & { jobs?: Job; businesses?: Business })[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const { data } = await supabase
      .from('applications')
      .select('*, jobs(*), businesses(*)')
      .eq('applicant_id', user.id)
      .order('created_at', { ascending: false });
    setApplications((data as (Application & { jobs?: Job; businesses?: Business })[]) ?? []);
    setLoading(false);
  }, [user]);

  useEffect(() => { load(); }, [load]);

  return (
    <div className="min-h-screen bg-cream pb-20">
      <Header title="Applications" onBack={() => router.goBack()} />
      <div className="max-w-md mx-auto px-4 pt-4">
        {loading ? (
          <Loading message="Loading applications..." />
        ) : applications.length === 0 ? (
          <EmptyState
            icon={<FileText className="w-8 h-8" />}
            title="No applications yet"
            description="Apply for jobs from the Home screen to see them here."
          />
        ) : (
          <div className="space-y-2.5">
            {applications.map((app) => (
              <button
                key={app.id}
                onClick={() => router.navigate({ name: 'application_detail', applicationId: app.id })}
                className="clay-card-interactive p-3.5 w-full text-left"
              >
                <div className="flex items-start justify-between mb-1.5">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-kaam-text truncate">
                      {app.jobs?.title ?? 'Job'}
                    </p>
                    <p className="text-xs text-kaam-muted truncate">
                      {app.businesses?.name ?? 'Business'}
                    </p>
                  </div>
                  <span className={`badge ${applicationStatusColor(app.status)} flex-shrink-0 ml-2`}>
                    {applicationStatusLabel(app.status)}
                  </span>
                </div>
                <p className="text-xs text-kaam-muted">Applied {formatDate(app.created_at)}</p>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export function ApplicationDetailScreen({ applicationId }: { applicationId: string }) {
  const { user } = useAuth();
  const [app, setApp] = useState<(Application & { jobs?: Job; businesses?: Business }) | null>(null);
  const [loading, setLoading] = useState(true);
  const [conversationId, setConversationId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase
      .from('applications')
      .select('*, jobs(*), businesses(*)')
      .eq('id', applicationId)
      .maybeSingle();
    setApp(data as (Application & { jobs?: Job; businesses?: Business }) | null);

    // Find conversation for this application
    const { data: conv } = await supabase
      .from('conversations')
      .select('id')
      .eq('application_id', applicationId)
      .maybeSingle();
    setConversationId(conv?.id ?? null);

    setLoading(false);
  }, [applicationId]);

  useEffect(() => { load(); }, [load]);

  async function handleMessage() {
    if (!app || !user) return;

    if (conversationId) {
      const otherUserId = user.id === app.applicant_id ? app.employer_id : app.applicant_id;
      router.navigate({ name: 'conversation', conversationId, otherUserId, jobId: app.job_id, applicationId: app.id });
      return;
    }

    // Create conversation
    const { data: conv } = await supabase
      .from('conversations')
      .insert({
        job_id: app.job_id,
        application_id: app.id,
        conversation_type: 'application',
      })
      .select()
      .single();

    if (conv) {
      const cid = (conv as { id: string }).id;
      const otherUserId = user.id === app.applicant_id ? app.employer_id : app.applicant_id;
      await supabase.from('conversation_participants').insert([
        { conversation_id: cid, user_id: user.id },
        { conversation_id: cid, user_id: otherUserId },
      ]);
      router.navigate({ name: 'conversation', conversationId: cid, otherUserId, jobId: app.job_id, applicationId: app.id });
    }
  }

  if (loading) return <div className="min-h-screen bg-cream"><Header title="Application" onBack={() => router.goBack()} /><Loading /></div>;
  if (!app) return <div className="min-h-screen bg-cream"><Header title="Application" onBack={() => router.goBack()} /><EmptyState title="Application not found" /></div>;

  return (
    <div className="min-h-screen bg-cream pb-20">
      <Header title="Application Detail" onBack={() => router.goBack()} />
      <div className="max-w-md mx-auto px-4 pt-4 space-y-4">
        {/* Status banner */}
        <div className={`rounded-xl p-4 ${applicationStatusColor(app.status)}`}>
          <p className="text-sm font-semibold">{applicationStatusLabel(app.status)}</p>
          <p className="text-xs opacity-80 mt-0.5">Submitted {formatDate(app.created_at)}</p>
        </div>

        {/* Job info */}
        {app.jobs && (
          <div className="clay-card p-4">
            <h2 className="text-sm font-semibold text-kaam-text mb-3">Job Details</h2>
            <p className="text-base font-semibold text-kaam-text mb-1">{app.jobs.title}</p>
            {app.businesses && <p className="text-xs text-kaam-muted mb-3">{app.businesses.name}</p>}
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-kaam-muted">Payment</span>
                <span className="font-medium text-kaam-text">{formatPayment(app.jobs.payment_amount, app.jobs.payment_type)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-kaam-muted">Work Period</span>
                <span className="font-medium text-kaam-text">{workPeriodLabel(app.jobs.work_period)}</span>
              </div>
              {app.jobs.time_from && (
                <div className="flex justify-between">
                  <span className="text-kaam-muted">Timings</span>
                  <span className="font-medium text-kaam-text">{app.jobs.time_from}{app.jobs.time_to ? `–${app.jobs.time_to}` : ''}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-kaam-muted">Start Date</span>
                <span className="font-medium text-kaam-text">{formatDate(app.jobs.start_date)}</span>
              </div>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-3">
          <button
            onClick={() => router.navigate({ name: 'job_details', jobId: app.job_id })}
            className="btn-secondary flex-1"
          >
            View Job
          </button>
          <button
            onClick={handleMessage}
            className="btn-primary flex-1"
          >
            Message
          </button>
        </div>
      </div>
    </div>
  );
}

function formatPayment(amount: number | null, type: string): string {
  if (amount === null) return type === 'negotiable' ? 'Negotiable' : '—';
  const formatted = new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 }).format(amount);
  const labels: Record<string, string> = {
    per_hour: `${formatted}/hr`, per_day: `${formatted}/day`, per_week: `${formatted}/week`,
    per_month: `${formatted}/mo`, fixed: formatted, negotiable: 'Negotiable',
  };
  return labels[type] ?? formatted;
}

function workPeriodLabel(period: string): string {
  const labels: Record<string, string> = { full_time: 'Full Time', part_time: 'Part Time', one_time: 'One Time' };
  return labels[period] ?? period;
}

export function ActiveWorkScreen() {
  const { user } = useAuth();
  const [workList, setWorkList] = useState<(ActiveWork & { jobs?: Job; businesses?: Business })[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const col = user.id;
    const { data } = await supabase
      .from('active_work')
      .select('*, jobs(*), businesses(*)')
      .or(`worker_id.eq.${col},employer_id.eq.${col}`)
      .eq('status', 'active')
      .order('created_at', { ascending: false });
    setWorkList((data as (ActiveWork & { jobs?: Job; businesses?: Business })[]) ?? []);
    setLoading(false);
  }, [user]);

  useEffect(() => { load(); }, [load]);

  return (
    <div className="min-h-screen bg-cream pb-20">
      <Header title="Active Work" onBack={() => router.goBack()} />
      <div className="max-w-md mx-auto px-4 pt-4">
        {loading ? <Loading message="Loading active work..." /> :
        workList.length === 0 ? (
          <EmptyState icon={<Briefcase className="w-8 h-8" />} title="No active work" description="When you get accepted for a job, it will appear here." />
        ) : (
          <div className="space-y-2.5">
            {workList.map((w) => (
              <button
                key={w.id}
                onClick={() => router.navigate({ name: 'active_work_detail', workId: w.id })}
                className="clay-card-interactive p-3.5 w-full text-left"
              >
                <p className="text-sm font-semibold text-kaam-text truncate">{w.jobs?.title ?? 'Job'}</p>
                <p className="text-xs text-kaam-muted truncate">{w.businesses?.name}</p>
                <span className="badge badge-success mt-2">In Progress</span>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export function ActiveWorkDetailScreen({ workId }: { workId: string }) {
  const { user } = useAuth();
  const [work, setWork] = useState<(ActiveWork & { jobs?: Job; businesses?: Business }) | null>(null);
  const [loading, setLoading] = useState(true);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [completing, setCompleting] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase
      .from('active_work')
      .select('*, jobs(*), businesses(*)')
      .eq('id', workId)
      .maybeSingle();
    setWork(data as (ActiveWork & { jobs?: Job; businesses?: Business }) | null);

    if (data) {
      const aw = data as ActiveWork;
      const { data: conv } = await supabase
        .from('conversations')
        .select('id')
        .eq('application_id', aw.application_id)
        .maybeSingle();
      setConversationId(conv?.id ?? null);
    }
    setLoading(false);
  }, [workId]);

  useEffect(() => { load(); }, [load]);

  async function handleComplete() {
    if (!work || !user) return;
    setCompleting(true);

    await supabase.from('active_work').update({ status: 'completed', completed_at: new Date().toISOString() }).eq('id', work.id);
    await supabase.from('completed_work').insert({
      job_id: work.job_id,
      active_work_id: work.id,
      worker_id: work.worker_id,
      employer_id: work.employer_id,
      business_id: work.business_id,
    });

    // Notify the other party
    const otherId = user.id === work.worker_id ? work.employer_id : work.worker_id;
    await notificationService.create({
      userId: otherId,
      type: 'work_completed',
      title: 'Work Completed',
      body: 'Work has been marked as completed. Please leave a review.',
      data: { active_work_id: work.id, job_id: work.job_id },
    });

    setCompleting(false);
    router.navigate({ name: 'completed_work' });
  }

  async function handleMessage() {
    if (!work || !user) return;
    if (conversationId) {
      const otherUserId = user.id === work.worker_id ? work.employer_id : work.worker_id;
      router.navigate({ name: 'conversation', conversationId, otherUserId, jobId: work.job_id });
    }
  }

  if (loading) return <div className="min-h-screen bg-cream"><Header title="Active Work" onBack={() => router.goBack()} /><Loading /></div>;
  if (!work) return <div className="min-h-screen bg-cream"><Header title="Active Work" onBack={() => router.goBack()} /><EmptyState title="Work not found" /></div>;

  return (
    <div className="min-h-screen bg-cream pb-20">
      <Header title="Active Work Details" onBack={() => router.goBack()} />
      <div className="max-w-md mx-auto px-4 pt-4 space-y-4">
        <div className="clay-card p-4">
          <p className="text-base font-semibold text-kaam-text mb-1">{work.jobs?.title}</p>
          <p className="text-xs text-kaam-muted mb-3">{work.businesses?.name}</p>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between"><span className="text-kaam-muted">Payment</span><span className="font-medium">{formatPayment(work.jobs?.payment_amount ?? null, work.jobs?.payment_type ?? 'fixed')}</span></div>
            {work.jobs?.time_from && <div className="flex justify-between"><span className="text-kaam-muted">Timings</span><span className="font-medium">{work.jobs.time_from}{work.jobs.time_to ? `–${work.jobs.time_to}` : ''}</span></div>}
            <div className="flex justify-between"><span className="text-kaam-muted">Started</span><span className="font-medium">{formatDate(work.started_at)}</span></div>
            <div className="flex justify-between"><span className="text-kaam-muted">Status</span><span className="badge badge-success">Active</span></div>
          </div>
        </div>

        <div className="flex gap-3">
          <button onClick={handleMessage} className="btn-secondary flex-1">Message</button>
          <button onClick={handleComplete} disabled={completing} className="btn-primary flex-1">
            {completing ? 'Completing...' : 'Mark Completed'}
          </button>
        </div>
      </div>
    </div>
  );
}

export function CompletedWorkScreen() {
  const { user } = useAuth();
  const [workList, setWorkList] = useState<(CompletedWork & { jobs?: Job; businesses?: Business })[]>([]);
  const [loading, setLoading] = useState(true);
  const [reviewedMap, setReviewedMap] = useState<Record<string, boolean>>({});

  const load = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const col = user.id;
    const { data } = await supabase
      .from('completed_work')
      .select('*, jobs(*), businesses(*)')
      .or(`worker_id.eq.${col},employer_id.eq.${col}`)
      .order('completed_at', { ascending: false });
    const items = (data as (CompletedWork & { jobs?: Job; businesses?: Business })[]) ?? [];
    setWorkList(items);

    // Check which ones have reviews by this user
    const ids = items.map(i => i.id);
    if (ids.length > 0) {
      const { data: reviews } = await supabase
        .from('reviews')
        .select('completed_work_id')
        .eq('reviewer_id', user.id)
        .in('completed_work_id', ids);
      const map: Record<string, boolean> = {};
      (reviews ?? []).forEach((r: { completed_work_id: string }) => { map[r.completed_work_id] = true; });
      setReviewedMap(map);
    }
    setLoading(false);
  }, [user]);

  useEffect(() => { load(); }, [load]);

  return (
    <div className="min-h-screen bg-cream pb-20">
      <Header title="Completed Work" onBack={() => router.goBack()} />
      <div className="max-w-md mx-auto px-4 pt-4">
        {loading ? <Loading message="Loading completed work..." /> :
        workList.length === 0 ? (
          <EmptyState icon={<CheckCircle2 className="w-8 h-8" />} title="No completed work yet" description="Completed jobs will appear here for review." />
        ) : (
          <div className="space-y-2.5">
            {workList.map((w) => (
              <div key={w.id} className="clay-card p-3.5">
                <p className="text-sm font-semibold text-kaam-text truncate">{w.jobs?.title}</p>
                <p className="text-xs text-kaam-muted truncate mb-2">{w.businesses?.name}</p>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-kaam-muted">Completed {formatDate(w.completed_at)}</span>
                  {reviewedMap[w.id] ? (
                    <span className="badge badge-success">Reviewed</span>
                  ) : (
                    <button
                      onClick={() => router.navigate({ name: 'review', completedWorkId: w.id })}
                      className="text-xs text-olive-deep font-medium"
                    >
                      Leave Review
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export function WorkHistoryScreen() {
  const { user } = useAuth();
  const [history, setHistory] = useState<(CompletedWork & { jobs?: Job; businesses?: Business })[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    (async () => {
      setLoading(true);
      const col = user.id;
      const { data } = await supabase
        .from('completed_work')
        .select('*, jobs(*), businesses(*)')
        .or(`worker_id.eq.${col},employer_id.eq.${col}`)
        .order('completed_at', { ascending: false });
      setHistory((data as (CompletedWork & { jobs?: Job; businesses?: Business })[]) ?? []);
      setLoading(false);
    })();
  }, [user]);

  return (
    <div className="min-h-screen bg-cream pb-20">
      <Header title="Work History" onBack={() => router.goBack()} />
      <div className="max-w-md mx-auto px-4 pt-4">
        {loading ? <Loading message="Loading history..." /> :
        history.length === 0 ? (
          <EmptyState icon={<History className="w-8 h-8" />} title="No work history" description="Your completed jobs will show here." />
        ) : (
          <div className="space-y-2.5">
            {history.map((w) => (
              <div key={w.id} className="clay-card p-3.5">
                <p className="text-sm font-semibold text-kaam-text truncate">{w.jobs?.title}</p>
                <p className="text-xs text-kaam-muted truncate">{w.businesses?.name}</p>
                <p className="text-xs text-kaam-muted mt-1">Completed {formatDate(w.completed_at)}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
