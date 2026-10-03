import { useEffect, useState, useCallback } from 'react';
import { Bookmark, BookmarkCheck, Zap, MapPin, Clock, Users, Star, Calendar, Wallet, ChevronLeft, Briefcase, FileText, CheckCircle2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { router } from '@/lib/router';
import { useAuth } from '@/context/AuthContext';
import { Header } from '@/components/Header';
import { Loading, ErrorState } from '@/components/States';
import { formatPayment, workPeriodLabel, formatDate, formatDistance } from '@/lib/utils';
import { notificationService } from '@/lib/notifications';
import type { Job, Business, JobRequirement } from '@/types';

export function JobDetailsScreen({ jobId }: { jobId: string }) {
  const { user, profile } = useAuth();
  const [job, setJob] = useState<Job | null>(null);
  const [business, setBusiness] = useState<Business | null>(null);
  const [requirements, setRequirements] = useState<JobRequirement[]>([]);
  const [isSaved, setIsSaved] = useState(false);
  const [hasApplied, setHasApplied] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [applying, setApplying] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);

    const { data: jobData, error: jobErr } = await supabase
      .from('jobs')
      .select('*')
      .eq('id', jobId)
      .maybeSingle();

    if (jobErr || !jobData) {
      setError(jobErr?.message ?? 'Job not found');
      setLoading(false);
      return;
    }

    setJob(jobData as Job);

    const { data: bizData } = await supabase
      .from('businesses')
      .select('*')
      .eq('id', (jobData as Job).business_id)
      .maybeSingle();
    setBusiness(bizData as Business | null);

    const { data: reqData } = await supabase
      .from('job_requirements')
      .select('*')
      .eq('job_id', jobId);
    setRequirements((reqData as JobRequirement[]) ?? []);

    // Check if saved
    if (user) {
      const { data: saved } = await supabase
        .from('saved_jobs')
        .select('id')
        .eq('user_id', user.id)
        .eq('job_id', jobId)
        .maybeSingle();
      setIsSaved(!!saved);

      // Check if applied
      const { data: app } = await supabase
        .from('applications')
        .select('id')
        .eq('applicant_id', user.id)
        .eq('job_id', jobId)
        .maybeSingle();
      setHasApplied(!!app);
    }

    setLoading(false);
  }, [jobId, user]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  async function toggleSave() {
    if (!user) return;
    if (isSaved) {
      await supabase.from('saved_jobs').delete().eq('user_id', user.id).eq('job_id', jobId);
      setIsSaved(false);
    } else {
      await supabase.from('saved_jobs').insert({ user_id: user.id, job_id: jobId });
      setIsSaved(true);
    }
  }

  async function handleApply() {
    if (!user || !job || !business) return;
    setApplying(true);

    // Create application
    const { data: app, error: appErr } = await supabase
      .from('applications')
      .insert({
        applicant_id: user.id,
        job_id: jobId,
        employer_id: job.employer_id,
        business_id: job.business_id,
        status: 'under_review',
      })
      .select()
      .single();

    if (appErr) {
      if (appErr.code === '23505') {
        setHasApplied(true);
      }
      setApplying(false);
      return;
    }

    // Create notification for employer
    await notificationService.create({
      userId: job.employer_id,
      type: 'application_submitted',
      title: 'New Application Received',
      body: `${profile?.name ?? 'Someone'} applied for ${job.title}`,
      data: { application_id: (app as { id: string }).id, job_id: jobId },
    });

    // Create conversation for this application
    const { data: conv } = await supabase
      .from('conversations')
      .insert({
        job_id: jobId,
        application_id: (app as { id: string }).id,
        conversation_type: 'application',
      })
      .select()
      .single();

    if (conv) {
      const convId = (conv as { id: string }).id;
      await supabase.from('conversation_participants').insert([
        { conversation_id: convId, user_id: user.id },
        { conversation_id: convId, user_id: job.employer_id },
      ]);
    }

    setHasApplied(true);
    setApplying(false);
    router.navigate({ name: 'application_detail', applicationId: (app as { id: string }).id });
  }

  if (loading) return <div className="min-h-screen bg-cream"><Header title="Job Details" onBack={() => router.goBack()} /><Loading /></div>;
  if (error) return <div className="min-h-screen bg-cream"><Header title="Job Details" onBack={() => router.goBack()} /><ErrorState message={error} onRetry={() => loadData()} /></div>;
  if (!job) return null;

  const isOwner = user?.id === job.employer_id;
  const req = requirements[0];

  return (
    <div className="min-h-screen bg-cream pb-24">
      <Header
        title="Job Details"
        onBack={() => router.goBack()}
        right={
          <button
            onClick={toggleSave}
            className="w-9 h-9 flex items-center justify-center rounded-lg hover:bg-olive-lighter/50"
            aria-label={isSaved ? 'Unsave' : 'Save'}
          >
            {isSaved ? (
              <BookmarkCheck className="w-5 h-5 text-olive-deep" />
            ) : (
              <Bookmark className="w-5 h-5 text-kaam-text" />
            )}
          </button>
        }
      />

      <div className="max-w-md mx-auto px-4 pt-4 space-y-4">
        {/* Business header */}
        {business && (
          <div className="flex items-center gap-3 p-3 clay-card">
            <div className="w-10 h-10 rounded-xl bg-olive-lighter flex items-center justify-center flex-shrink-0">
              <Briefcase className="w-5 h-5 text-olive-deep" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-kaam-text truncate">{business.name}</p>
              <p className="text-xs text-kaam-muted truncate">{business.category ?? 'Business'}</p>
            </div>
            {business.verification_status === 'verified' && (
              <span className="badge badge-success flex-shrink-0">
                <CheckCircle2 className="w-3 h-3" /> Verified
              </span>
            )}
          </div>
        )}

        {/* Title + badges */}
        <div className="clay-card p-4">
          <div className="flex items-start justify-between gap-2 mb-2">
            <h1 className="text-lg font-bold text-kaam-text flex-1">{job.title}</h1>
            {job.is_instant && (
              <span className="badge badge-instant flex-shrink-0">
                <Zap className="w-3 h-3" /> Instant
              </span>
            )}
          </div>

          {/* Key info grid */}
          <div className="grid grid-cols-2 gap-3 mt-3">
            <InfoRow icon={<Wallet className="w-4 h-4" />} label="Payment" value={formatPayment(job.payment_amount, job.payment_type)} />
            <InfoRow icon={<Clock className="w-4 h-4" />} label="Work Period" value={workPeriodLabel(job.work_period)} />
            <InfoRow icon={<Users className="w-4 h-4" />} label="Vacancies" value={`${job.vacancies}`} />
            <InfoRow icon={<Calendar className="w-4 h-4" />} label="Start Date" value={formatDate(job.start_date)} />
          </div>

          {job.time_from && (
            <div className="flex items-center gap-2 mt-3 text-sm text-kaam-muted">
              <Clock className="w-4 h-4" />
              <span>{job.time_from}{job.time_to ? ` – ${job.time_to}` : ''}</span>
              {job.total_hours && <span className="ml-2">({job.total_hours} hrs)</span>}
              {job.flexible_timing && <span className="badge badge-olive ml-2">Flexible</span>}
            </div>
          )}

          {job.location && (
            <div className="flex items-center gap-2 mt-3 text-sm text-kaam-muted">
              <MapPin className="w-4 h-4" />
              <span>{job.location}</span>
            </div>
          )}

          {job.rating > 0 && (
            <div className="flex items-center gap-1 mt-3 text-sm">
              <Star className="w-4 h-4 fill-kaam-warning text-kaam-warning" />
              <span className="font-semibold text-kaam-text">{job.rating.toFixed(1)}</span>
              <span className="text-kaam-muted">({job.rating_count} reviews)</span>
            </div>
          )}
        </div>

        {/* Description */}
        {job.description && (
          <div className="clay-card p-4">
            <h2 className="text-sm font-semibold text-kaam-text mb-2 flex items-center gap-1.5">
              <FileText className="w-4 h-4 text-olive" /> Description
            </h2>
            <p className="text-sm text-kaam-text leading-relaxed whitespace-pre-wrap">{job.description}</p>
          </div>
        )}

        {/* Requirements */}
        {req && (
          <div className="clay-card p-4">
            <h2 className="text-sm font-semibold text-kaam-text mb-3">Requirements</h2>
            <div className="space-y-2.5">
              {req.qualification && <InfoRow icon={<FileText className="w-4 h-4" />} label="Qualification" value={req.qualification} />}
              {req.experience && <InfoRow icon={<Briefcase className="w-4 h-4" />} label="Experience" value={req.experience} />}
              {req.skills.length > 0 && (
                <div>
                  <p className="text-xs text-kaam-muted mb-1.5">Skills Required</p>
                  <div className="flex flex-wrap gap-1.5">
                    {req.skills.map((s) => (
                      <span key={s} className="badge badge-olive">{s}</span>
                    ))}
                  </div>
                </div>
              )}
              {req.languages.length > 0 && (
                <div>
                  <p className="text-xs text-kaam-muted mb-1.5">Languages</p>
                  <div className="flex flex-wrap gap-1.5">
                    {req.languages.map((l) => (
                      <span key={l} className="badge badge-muted">{l}</span>
                    ))}
                  </div>
                </div>
              )}
              {req.num_workers > 1 && (
                <InfoRow icon={<Users className="w-4 h-4" />} label="Workers Needed" value={`${req.num_workers}`} />
              )}
            </div>
          </div>
        )}

        {/* Duration */}
        {job.end_date && (
          <div className="clay-card p-4">
            <h2 className="text-sm font-semibold text-kaam-text mb-2">Duration</h2>
            <div className="flex items-center gap-2 text-sm text-kaam-muted">
              <Calendar className="w-4 h-4" />
              <span>{formatDate(job.start_date)} – {formatDate(job.end_date)}</span>
            </div>
          </div>
        )}
      </div>

      {/* Sticky apply bar */}
      {!isOwner && (
        <div className="fixed bottom-0 left-0 right-0 z-30 bg-cream-white border-t border-olive-light/20 px-4 py-3 pb-safe">
          <div className="max-w-md mx-auto flex gap-3">
            <button
              onClick={toggleSave}
              className="flex-shrink-0 w-12 h-12 rounded-xl border border-olive-light/30 flex items-center justify-center"
              aria-label="Save job"
            >
              {isSaved ? <BookmarkCheck className="w-5 h-5 text-olive-deep" /> : <Bookmark className="w-5 h-5 text-kaam-muted" />}
            </button>
            {hasApplied ? (
              <button
                onClick={() => router.navigate({ name: 'application_detail', applicationId: jobId })}
                className="btn-secondary flex-1"
              >
                Application Sent — View Status
              </button>
            ) : (
              <button
                onClick={handleApply}
                disabled={applying || job.status !== 'active'}
                className="btn-primary flex-1"
              >
                {applying ? 'Applying...' : job.status === 'active' ? 'Apply Now' : 'Job Closed'}
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function InfoRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-center gap-2">
      <div className="text-olive flex-shrink-0">{icon}</div>
      <div className="min-w-0">
        <p className="text-xs text-kaam-muted">{label}</p>
        <p className="text-sm font-medium text-kaam-text truncate">{value}</p>
      </div>
    </div>
  );
}
