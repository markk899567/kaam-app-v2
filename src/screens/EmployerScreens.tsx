import { useEffect, useState, useCallback } from 'react';
import { Briefcase, Users, FileText, ChevronRight, Plus, Pause, Play, XCircle, CheckCircle2, Star } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { router } from '@/lib/router';
import { useAuth } from '@/context/AuthContext';
import { Header } from '@/components/Header';
import { Loading, EmptyState } from '@/components/States';
import { formatPayment, workPeriodLabel, formatDate, applicationStatusLabel, applicationStatusColor, initials } from '@/lib/utils';
import type { Job, Business, Application, Profile, JobRequirement } from '@/types';

export function CreateBusinessScreen() {
  const { user, refreshProfile } = useAuth();
  const [name, setName] = useState('');
  const [category, setCategory] = useState('');
  const [description, setDescription] = useState('');
  const [address, setAddress] = useState('');
  const [phone, setPhone] = useState('');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const CATEGORIES = ['Construction', 'Cleaning', 'Delivery', 'Cooking', 'Security', 'Driving', 'Retail', 'Manufacturing', 'Hospitality', 'Agriculture', 'Other'];

  async function handleSave() {
    if (!user) return;
    setSaving(true);
    const { error } = await supabase.from('businesses').insert({
      owner_id: user.id,
      name, category, description, address, contact_phone: phone,
    });
    if (!error) {
      // Update role to employer
      await supabase.from('profiles').update({ role: 'employer' }).eq('id', user.id);
      await refreshProfile();
      setSaved(true);
      setTimeout(() => router.navigate({ name: 'create_requirement' }), 800);
    }
    setSaving(false);
  }

  if (saved) {
    return (
      <div className="min-h-screen bg-cream pb-20">
        <Header title="Create Business" onBack={() => router.goBack()} />
        <div className="max-w-md mx-auto px-4 pt-4">
          <div className="clay-card p-6 text-center">
            <CheckCircle2 className="w-12 h-12 text-kaam-success mx-auto mb-3" />
            <p className="text-sm font-semibold text-kaam-text">Business created!</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-cream pb-20">
      <Header title="Create Business" onBack={() => router.goBack()} />
      <div className="max-w-md mx-auto px-4 pt-4 space-y-4">
        <p className="text-sm text-kaam-muted">Set up your business profile to start posting jobs.</p>
        <div className="clay-card p-4 space-y-3">
          <div><label className="block text-xs font-medium text-kaam-muted mb-1.5">Business Name</label><input className="input-field" value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Sharma Construction" /></div>
          <div>
            <label className="block text-xs font-medium text-kaam-muted mb-1.5">Category</label>
            <select className="input-field" value={category} onChange={e => setCategory(e.target.value)}>
              <option value="">Select category...</option>
              {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div><label className="block text-xs font-medium text-kaam-muted mb-1.5">Description</label><textarea className="input-field min-h-[70px] resize-none" value={description} onChange={e => setDescription(e.target.value)} placeholder="Brief description of your business" /></div>
          <div><label className="block text-xs font-medium text-kaam-muted mb-1.5">Address</label><input className="input-field" value={address} onChange={e => setAddress(e.target.value)} placeholder="Business address" /></div>
          <div><label className="block text-xs font-medium text-kaam-muted mb-1.5">Contact Phone</label><input className="input-field" value={phone} onChange={e => setPhone(e.target.value)} placeholder="Contact number" /></div>
        </div>
        <button onClick={handleSave} disabled={saving || !name.trim()} className="btn-primary w-full">{saving ? 'Saving...' : 'Create Business'}</button>
      </div>
    </div>
  );
}

// Job creation draft stored in memory
interface JobDraft {
  qualification?: string;
  skills?: string[];
  experience?: string;
  languages?: string[];
  age_min?: number;
  age_max?: number;
  num_workers?: number;
  title?: string;
  description?: string;
  category?: string;
  work_period?: string;
  start_date?: string;
  end_date?: string;
  time_from?: string;
  time_to?: string;
  total_hours?: string;
  flexible_timing?: boolean;
  payment_type?: string;
  payment_amount?: number;
  business_id?: string;
}

const draftStore: Record<string, JobDraft> = {};

export function getDraft(id: string): JobDraft {
  if (!draftStore[id]) draftStore[id] = { skills: [], languages: [], num_workers: 1, work_period: 'one_time', payment_type: 'fixed', flexible_timing: false };
  return draftStore[id];
}

export function CreateRequirementScreen() {
  const { user, profile } = useAuth();
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [loading, setLoading] = useState(true);
  const draftId = `draft_${Date.now()}`;

  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data } = await supabase.from('businesses').select('*').eq('owner_id', user.id);
      setBusinesses((data as Business[]) ?? []);
      setLoading(false);
    })();
  }, [user]);

  if (loading) return <div className="min-h-screen bg-cream"><Header title="Create Requirement" onBack={() => router.goBack()} /><Loading /></div>;

  if (businesses.length === 0) {
    return (
      <div className="min-h-screen bg-cream pb-20">
        <Header title="Create Requirement" onBack={() => router.goBack()} />
        <div className="max-w-md mx-auto px-4 pt-4">
          <EmptyState icon={<Briefcase className="w-8 h-8" />} title="No business profile" description="Create a business profile first to start posting jobs."
            action={<button onClick={() => router.navigate({ name: 'create_business' })} className="btn-primary">Create Business</button>} />
        </div>
      </div>
    );
  }

  // Store business_id in draft
  const draft = getDraft(draftId);
  draft.business_id = businesses[0].id;

  return (
    <div className="min-h-screen bg-cream pb-20">
      <Header title="Create Requirement" onBack={() => router.goBack()} />
      <div className="max-w-md mx-auto px-4 pt-4 space-y-3">
        <div className="clay-card p-3.5 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-olive-lighter flex items-center justify-center"><Briefcase className="w-5 h-5 text-olive-deep" /></div>
          <div><p className="text-sm font-semibold text-kaam-text">{businesses[0].name}</p><p className="text-xs text-kaam-muted">{businesses[0].category}</p></div>
        </div>
        <p className="text-sm text-kaam-muted">Let's create your job posting step by step.</p>
        <button onClick={() => router.navigate({ name: 'who_do_you_need', draftId })} className="btn-primary w-full">Start</button>
      </div>
    </div>
  );
}

const SKILL_OPTIONS = ['Construction', 'Cleaning', 'Cooking', 'Driving', 'Security', 'Electrician', 'Plumbing', 'Painting', 'Carpentry', 'Welding', 'Heavy Machinery', 'First Aid'];
const LANGUAGE_OPTIONS = ['Hindi', 'English', 'Bengali', 'Tamil', 'Telugu', 'Marathi', 'Kannada', 'Gujarati', 'Punjabi', 'Urdu'];

export function WhoDoYouNeedScreen({ draftId }: { draftId: string }) {
  const draft = getDraft(draftId);
  const [qualification, setQualification] = useState(draft.qualification ?? '');
  const [skills, setSkills] = useState<string[]>(draft.skills ?? []);
  const [experience, setExperience] = useState(draft.experience ?? '');
  const [languages, setLanguages] = useState<string[]>(draft.languages ?? []);
  const [numWorkers, setNumWorkers] = useState(draft.num_workers ?? 1);

  function next() {
    Object.assign(draft, { qualification, skills, experience, languages, num_workers: numWorkers });
    router.navigate({ name: 'work_details', draftId });
  }

  return (
    <div className="min-h-screen bg-cream pb-20">
      <Header title="Who Do You Need?" onBack={() => router.goBack()} />
      <div className="max-w-md mx-auto px-4 pt-4 space-y-4">
        <div className="clay-card p-4 space-y-3">
          <div><label className="block text-xs font-medium text-kaam-muted mb-1.5">Qualification Required</label><input className="input-field" value={qualification} onChange={e => setQualification(e.target.value)} placeholder="e.g. 10th Pass, ITI Electrician" /></div>
          <div><label className="block text-xs font-medium text-kaam-muted mb-1.5">Experience Required</label><input className="input-field" value={experience} onChange={e => setExperience(e.target.value)} placeholder="e.g. 2+ years" /></div>
          <div><label className="block text-xs font-medium text-kaam-muted mb-1.5">Number of Workers</label><input type="number" min="1" className="input-field" value={numWorkers} onChange={e => setNumWorkers(Number(e.target.value))} /></div>
        </div>
        <div className="clay-card p-4">
          <p className="text-xs font-medium text-kaam-muted mb-2">Skills Required</p>
          <div className="flex flex-wrap gap-2">
            {SKILL_OPTIONS.map(s => <button key={s} onClick={() => setSkills(prev => prev.includes(s) ? prev.filter(x => x !== s) : [...prev, s])} className={`px-3 py-1.5 rounded-full text-xs font-medium border ${skills.includes(s) ? 'bg-olive text-cream-white border-olive' : 'bg-cream-white text-kaam-text border-olive-light/30'}`}>{s}</button>)}
          </div>
        </div>
        <div className="clay-card p-4">
          <p className="text-xs font-medium text-kaam-muted mb-2">Languages</p>
          <div className="flex flex-wrap gap-2">
            {LANGUAGE_OPTIONS.map(l => <button key={l} onClick={() => setLanguages(prev => prev.includes(l) ? prev.filter(x => x !== l) : [...prev, l])} className={`px-3 py-1.5 rounded-full text-xs font-medium border ${languages.includes(l) ? 'bg-olive text-cream-white border-olive' : 'bg-cream-white text-kaam-text border-olive-light/30'}`}>{l}</button>)}
          </div>
        </div>
        <button onClick={next} className="btn-primary w-full">Continue</button>
      </div>
    </div>
  );
}

export function WorkDetailsScreen({ draftId }: { draftId: string }) {
  const draft = getDraft(draftId);
  const [title, setTitle] = useState(draft.title ?? '');
  const [description, setDescription] = useState(draft.description ?? '');
  const [category, setCategory] = useState(draft.category ?? '');
  const [workPeriod, setWorkPeriod] = useState(draft.work_period ?? 'one_time');
  const [isInstant, setIsInstant] = useState(false);

  const CATEGORIES = ['Construction', 'Cleaning', 'Delivery', 'Cooking', 'Security', 'Driving', 'Retail', 'Manufacturing', 'Hospitality', 'Agriculture', 'Other'];

  function next() {
    Object.assign(draft, { title, description, category, work_period: workPeriod, is_instant: isInstant });
    router.navigate({ name: 'timings_duration', draftId });
  }

  return (
    <div className="min-h-screen bg-cream pb-20">
      <Header title="Work Details" onBack={() => router.goBack()} />
      <div className="max-w-md mx-auto px-4 pt-4 space-y-4">
        <div className="clay-card p-4 space-y-3">
          <div><label className="block text-xs font-medium text-kaam-muted mb-1.5">Job Title</label><input className="input-field" value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g. Construction Worker Needed" /></div>
          <div><label className="block text-xs font-medium text-kaam-muted mb-1.5">Description</label><textarea className="input-field min-h-[80px] resize-none" value={description} onChange={e => setDescription(e.target.value)} placeholder="Describe the work..." /></div>
          <div>
            <label className="block text-xs font-medium text-kaam-muted mb-1.5">Category</label>
            <select className="input-field" value={category} onChange={e => setCategory(e.target.value)}>
              <option value="">Select...</option>
              {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-kaam-muted mb-1.5">Work Period</label>
            <div className="grid grid-cols-3 gap-2">
              {[{v:'full_time',l:'Full Time'},{v:'part_time',l:'Part Time'},{v:'one_time',l:'One Time'}].map(wp => (
                <button key={wp.v} onClick={() => setWorkPeriod(wp.v)} className={`px-3 py-2 rounded-lg text-xs font-medium border ${workPeriod === wp.v ? 'bg-olive text-cream-white border-olive' : 'bg-cream-white text-kaam-text border-olive-light/30'}`}>{wp.l}</button>
              ))}
            </div>
          </div>
          <button onClick={() => setIsInstant(!isInstant)} className="option-box w-full text-left" style={{ minHeight: '48px' }}>
            <div className="option-box-icon" style={isInstant ? { background: 'rgba(196,154,69,0.15)', color: '#C49A45' } : {}}>
              <Star className="w-4 h-4" />
            </div>
            <div className="flex-1"><p className="text-sm font-semibold text-kaam-text">Instant Job</p><p className="text-xs text-kaam-muted">Urgent — starts within 1 hour</p></div>
            <div className={`w-5 h-5 rounded-full border-2 ${isInstant ? 'bg-kaam-warning border-kaam-warning' : 'border-olive-light/40'}`} />
          </button>
        </div>
        <button onClick={next} disabled={!title.trim()} className="btn-primary w-full">Continue</button>
      </div>
    </div>
  );
}

export function TimingsDurationScreen({ draftId }: { draftId: string }) {
  const draft = getDraft(draftId);
  const [startDate, setStartDate] = useState(draft.start_date ?? '');
  const [endDate, setEndDate] = useState(draft.end_date ?? '');
  const [timeFrom, setTimeFrom] = useState(draft.time_from ?? '');
  const [timeTo, setTimeTo] = useState(draft.time_to ?? '');
  const [totalHours, setTotalHours] = useState(draft.total_hours ?? '');
  const [flexible, setFlexible] = useState(draft.flexible_timing ?? false);

  function next() {
    Object.assign(draft, { start_date: startDate || null, end_date: endDate || null, time_from: timeFrom || null, time_to: timeTo || null, total_hours: totalHours || null, flexible_timing: flexible });
    router.navigate({ name: 'payment', draftId });
  }

  return (
    <div className="min-h-screen bg-cream pb-20">
      <Header title="Timings & Duration" onBack={() => router.goBack()} />
      <div className="max-w-md mx-auto px-4 pt-4 space-y-4">
        <div className="clay-card p-4 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div><label className="block text-xs font-medium text-kaam-muted mb-1.5">Start Date</label><input type="date" className="input-field" value={startDate} onChange={e => setStartDate(e.target.value)} /></div>
            <div><label className="block text-xs font-medium text-kaam-muted mb-1.5">End Date</label><input type="date" className="input-field" value={endDate} onChange={e => setEndDate(e.target.value)} /></div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="block text-xs font-medium text-kaam-muted mb-1.5">From</label><input type="time" className="input-field" value={timeFrom} onChange={e => setTimeFrom(e.target.value)} /></div>
            <div><label className="block text-xs font-medium text-kaam-muted mb-1.5">To</label><input type="time" className="input-field" value={timeTo} onChange={e => setTimeTo(e.target.value)} /></div>
          </div>
          <div><label className="block text-xs font-medium text-kaam-muted mb-1.5">Total Hours</label><input className="input-field" value={totalHours} onChange={e => setTotalHours(e.target.value)} placeholder="e.g. 8 hours" /></div>
          <button onClick={() => setFlexible(!flexible)} className="option-box w-full text-left" style={{ minHeight: '48px' }}>
            <div className="option-box-icon"><Star className="w-4 h-4" /></div>
            <div className="flex-1"><p className="text-sm font-semibold text-kaam-text">Flexible Timing</p><p className="text-xs text-kaam-muted">Worker can choose their schedule</p></div>
            <div className={`w-5 h-5 rounded-full border-2 ${flexible ? 'bg-olive border-olive' : 'border-olive-light/40'}`} />
          </button>
        </div>
        <button onClick={next} className="btn-primary w-full">Continue</button>
      </div>
    </div>
  );
}

export function PaymentScreen({ draftId }: { draftId: string }) {
  const draft = getDraft(draftId);
  const [paymentType, setPaymentType] = useState(draft.payment_type ?? 'fixed');
  const [paymentAmount, setPaymentAmount] = useState(draft.payment_amount?.toString() ?? '');

  const PAYMENT_TYPES = [
    { v: 'per_hour', l: 'Per Hour' }, { v: 'per_day', l: 'Per Day' }, { v: 'per_week', l: 'Per Week' },
    { v: 'per_month', l: 'Per Month' }, { v: 'fixed', l: 'Fixed' }, { v: 'negotiable', l: 'Negotiable' },
  ];

  function next() {
    Object.assign(draft, { payment_type: paymentType, payment_amount: paymentType === 'negotiable' ? null : Number(paymentAmount) || null });
    router.navigate({ name: 'review_requirement', draftId });
  }

  return (
    <div className="min-h-screen bg-cream pb-20">
      <Header title="Payment" onBack={() => router.goBack()} />
      <div className="max-w-md mx-auto px-4 pt-4 space-y-4">
        <div className="clay-card p-4">
          <label className="block text-xs font-medium text-kaam-muted mb-2">Payment Type</label>
          <div className="grid grid-cols-3 gap-2">
            {PAYMENT_TYPES.map(p => (
              <button key={p.v} onClick={() => setPaymentType(p.v)} className={`px-3 py-2 rounded-lg text-xs font-medium border ${paymentType === p.v ? 'bg-olive text-cream-white border-olive' : 'bg-cream-white text-kaam-text border-olive-light/30'}`}>{p.l}</button>
            ))}
          </div>
        </div>
        {paymentType !== 'negotiable' && (
          <div className="clay-card p-4">
            <label className="block text-xs font-medium text-kaam-muted mb-1.5">Amount (₹)</label>
            <input type="number" className="input-field" value={paymentAmount} onChange={e => setPaymentAmount(e.target.value)} placeholder="e.g. 500" />
          </div>
        )}
        <button onClick={next} className="btn-primary w-full">Review</button>
      </div>
    </div>
  );
}

export function ReviewRequirementScreen({ draftId }: { draftId: string }) {
  const draft = getDraft(draftId);
  const { user } = useAuth();
  const [posting, setPosting] = useState(false);

  async function handlePost() {
    if (!user) return;
    setPosting(true);

    // Insert job
    const { data: job, error } = await supabase.from('jobs').insert({
      business_id: draft.business_id,
      employer_id: user.id,
      title: draft.title,
      description: draft.description,
      category: draft.category,
      work_period: draft.work_period,
      is_instant: draft.is_instant ?? false,
      status: 'active',
      start_date: draft.start_date,
      end_date: draft.end_date,
      time_from: draft.time_from,
      time_to: draft.time_to,
      total_hours: draft.total_hours,
      flexible_timing: draft.flexible_timing ?? false,
      payment_type: draft.payment_type,
      payment_amount: draft.payment_amount,
      vacancies: draft.num_workers ?? 1,
    }).select().single();

    if (error) { setPosting(false); return; }

    const jobId = (job as { id: string }).id;

    // Insert requirements
    await supabase.from('job_requirements').insert({
      job_id: jobId,
      qualification: draft.qualification,
      skills: draft.skills,
      experience: draft.experience,
      languages: draft.languages,
      num_workers: draft.num_workers ?? 1,
    });

    setPosting(false);
    delete draftStore[draftId];
    router.navigate({ name: 'posted_success', jobId });
  }

  return (
    <div className="min-h-screen bg-cream pb-20">
      <Header title="Review Requirement" onBack={() => router.goBack()} />
      <div className="max-w-md mx-auto px-4 pt-4 space-y-3">
        <div className="clay-card p-4 space-y-2">
          <ReviewRow label="Job Title" value={draft.title} />
          <ReviewRow label="Description" value={draft.description} />
          <ReviewRow label="Category" value={draft.category} />
          <ReviewRow label="Work Period" value={workPeriodLabel(draft.work_period ?? 'one_time')} />
          <ReviewRow label="Qualification" value={draft.qualification} />
          <ReviewRow label="Experience" value={draft.experience} />
          <ReviewRow label="Skills" value={draft.skills?.join(', ')} />
          <ReviewRow label="Languages" value={draft.languages?.join(', ')} />
          <ReviewRow label="Workers Needed" value={`${draft.num_workers}`} />
          <ReviewRow label="Start Date" value={draft.start_date ? formatDate(draft.start_date) : 'Flexible'} />
          <ReviewRow label="Timings" value={draft.time_from ? `${draft.time_from}${draft.time_to ? `–${draft.time_to}` : ''}` : 'Flexible'} />
          <ReviewRow label="Flexible Timing" value={draft.flexible_timing ? 'Yes' : 'No'} />
          <ReviewRow label="Payment" value={formatPayment(draft.payment_amount ?? null, draft.payment_type ?? 'fixed')} />
          <ReviewRow label="Instant" value={draft.is_instant ? 'Yes' : 'No'} />
        </div>
        <div className="flex gap-3">
          <button onClick={() => router.goBack()} className="btn-secondary flex-1">Edit</button>
          <button onClick={handlePost} disabled={posting} className="btn-primary flex-1">{posting ? 'Posting...' : 'Post Job'}</button>
        </div>
      </div>
    </div>
  );
}

function ReviewRow({ label, value }: { label: string; value?: string | null }) {
  if (!value) return null;
  return (
    <div className="flex justify-between items-start gap-3">
      <span className="text-xs text-kaam-muted flex-shrink-0">{label}</span>
      <span className="text-sm font-medium text-kaam-text text-right">{value}</span>
    </div>
  );
}

export function PostedSuccessScreen({ jobId }: { jobId: string }) {
  return (
    <div className="min-h-screen bg-cream pb-20">
      <Header title="Posted Successfully" />
      <div className="max-w-md mx-auto px-4 pt-4 space-y-4">
        <div className="clay-card p-6 text-center">
          <CheckCircle2 className="w-14 h-14 text-kaam-success mx-auto mb-3" />
          <p className="text-base font-semibold text-kaam-text">Job Posted!</p>
          <p className="text-xs text-kaam-muted mt-1">Your job is now live and visible to workers.</p>
        </div>
        <div className="space-y-2">
          <button onClick={() => router.navigate({ name: 'job_details', jobId })} className="btn-secondary w-full">View Job Post</button>
          <button onClick={() => router.navigate({ name: 'manage_posts' })} className="btn-primary w-full">Manage Job Posts</button>
        </div>
      </div>
    </div>
  );
}

export function ManagePostsScreen() {
  const { user } = useAuth();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'active' | 'paused' | 'closed'>('active');

  const load = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const { data } = await supabase.from('jobs').select('*').eq('employer_id', user.id).order('created_at', { ascending: false });
    setJobs((data as Job[]) ?? []);
    setLoading(false);
  }, [user]);

  useEffect(() => { load(); }, [load]);

  const filtered = jobs.filter(j => j.status === filter);

  async function handleAction(job: Job, action: 'pause' | 'resume' | 'close') {
    const newStatus = action === 'pause' ? 'paused' : action === 'resume' ? 'active' : 'closed';
    await supabase.from('jobs').update({ status: newStatus }).eq('id', job.id);
    load();
  }

  return (
    <div className="min-h-screen bg-cream pb-20">
      <Header title="Manage Job Posts" onBack={() => router.goBack()} right={<button onClick={() => router.navigate({ name: 'create_requirement' })} className="px-2"><Plus className="w-5 h-5 text-olive-deep" /></button>} />
      <div className="max-w-md mx-auto px-4 pt-4">
        <div className="flex gap-2 mb-4">
          {(['active', 'paused', 'closed'] as const).map(f => (
            <button key={f} onClick={() => setFilter(f)} className={`px-3 py-1.5 rounded-full text-xs font-medium ${filter === f ? 'bg-olive text-cream-white' : 'bg-cream-white text-kaam-text border border-olive-light/30'}`}>
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>
        {loading ? <Loading message="Loading job posts..." /> :
        filtered.length === 0 ? (
          <EmptyState icon={<Briefcase className="w-8 h-8" />} title={`No ${filter} jobs`} description={filter === 'active' ? 'Post a new job to get started.' : undefined}
            action={filter === 'active' ? <button onClick={() => router.navigate({ name: 'create_requirement' })} className="btn-primary">Create Requirement</button> : undefined} />
        ) : (
          <div className="space-y-2.5">
            {filtered.map(job => (
              <div key={job.id} className="clay-card p-3.5">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-kaam-text truncate">{job.title}</p>
                    <p className="text-xs text-kaam-muted">{workPeriodLabel(job.work_period)} • {formatPayment(job.payment_amount, job.payment_type)}</p>
                  </div>
                  <span className={`badge ${job.status === 'active' ? 'badge-success' : job.status === 'paused' ? 'badge-instant' : 'badge-muted'} flex-shrink-0`}>
                    {job.status}
                  </span>
                </div>
                <div className="flex items-center gap-2 mt-2">
                  <button onClick={() => router.navigate({ name: 'applicants', jobId: job.id })} className="text-xs text-olive-deep font-medium flex items-center gap-1">
                    <Users className="w-3.5 h-3.5" /> Applicants
                  </button>
                  <span className="text-kaam-muted">•</span>
                  <button onClick={() => router.navigate({ name: 'job_details', jobId: job.id })} className="text-xs text-olive-deep font-medium">View</button>
                  {job.status === 'active' && <button onClick={() => handleAction(job, 'pause')} className="text-xs text-kaam-warning font-medium ml-auto flex items-center gap-1"><Pause className="w-3 h-3" /> Pause</button>}
                  {job.status === 'paused' && <button onClick={() => handleAction(job, 'resume')} className="text-xs text-kaam-success font-medium ml-auto flex items-center gap-1"><Play className="w-3 h-3" /> Resume</button>}
                  {job.status !== 'closed' && <button onClick={() => handleAction(job, 'close')} className="text-xs text-red-500 font-medium flex items-center gap-1"><XCircle className="w-3 h-3" /> Close</button>}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export function ApplicantsScreen({ jobId }: { jobId: string }) {
  const [apps, setApps] = useState<(Application & { profiles?: Profile })[]>([]);
  const [loading, setLoading] = useState(true);
  const [job, setJob] = useState<Job | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const { data: jobData } = await supabase.from('jobs').select('*').eq('id', jobId).maybeSingle();
    setJob(jobData as Job | null);

    const { data } = await supabase
      .from('applications')
      .select('*, profiles(*)')
      .eq('job_id', jobId)
      .order('created_at', { ascending: false });
    setApps((data as (Application & { profiles?: Profile })[]) ?? []);
    setLoading(false);
  }, [jobId]);

  useEffect(() => { load(); }, [load]);

  async function handleAction(app: Application, action: 'accept' | 'reject') {
    const newStatus = action === 'accept' ? 'accepted' : 'rejected';
    await supabase.from('applications').update({ status: newStatus }).eq('id', app.id);

    if (action === 'accept') {
      // Create active work record
      await supabase.from('active_work').insert({
        job_id: app.job_id,
        application_id: app.id,
        worker_id: app.applicant_id,
        employer_id: app.employer_id,
        business_id: app.business_id,
        status: 'active',
      });

      // Update conversation type to interview if exists
      await supabase.from('conversations').update({ conversation_type: 'interview' }).eq('application_id', app.id);
    }

    // Notify applicant
    const { notificationService } = await import('@/lib/notifications');
    await notificationService.create({
      userId: app.applicant_id,
      type: action === 'accept' ? 'application_accepted' : 'application_rejected',
      title: action === 'accept' ? 'Application Accepted!' : 'Application Update',
      body: action === 'accept' ? `Your application for ${job?.title ?? 'the job'} has been accepted.` : `Your application for ${job?.title ?? 'the job'} was not selected.`,
      data: { application_id: app.id, job_id: app.job_id },
    });

    load();
  }

  return (
    <div className="min-h-screen bg-cream pb-20">
      <Header title="Applicants" onBack={() => router.goBack()} subtitle={job?.title} />
      <div className="max-w-md mx-auto px-4 pt-4">
        {loading ? <Loading message="Loading applicants..." /> :
        apps.length === 0 ? (
          <EmptyState icon={<Users className="w-8 h-8" />} title="No applicants yet" description="When workers apply for this job, they'll appear here." />
        ) : (
          <div className="space-y-2.5">
            {apps.map(app => (
              <div key={app.id} className="clay-card p-3.5">
                <button onClick={() => router.navigate({ name: 'applicant_profile', applicationId: app.id })} className="flex items-center gap-3 w-full text-left mb-2">
                  <div className="w-10 h-10 rounded-full bg-olive flex items-center justify-center text-sm font-semibold text-cream-white flex-shrink-0">
                    {initials(app.profiles?.name ?? '?')}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-kaam-text truncate">{app.profiles?.name ?? 'Applicant'}</p>
                    <p className="text-xs text-kaam-muted truncate">{app.profiles?.qualification ?? 'No qualification set'}</p>
                  </div>
                  <span className={`badge ${applicationStatusColor(app.status)} flex-shrink-0`}>{applicationStatusLabel(app.status)}</span>
                </button>
                {app.profiles?.skills && app.profiles.skills.length > 0 && (
                  <div className="flex flex-wrap gap-1 mb-2">
                    {app.profiles.skills.slice(0, 3).map(s => <span key={s} className="badge badge-olive">{s}</span>)}
                  </div>
                )}
                {app.status === 'under_review' && (
                  <div className="flex gap-2">
                    <button onClick={() => handleAction(app, 'accept')} className="btn-primary flex-1 text-xs py-2">Accept</button>
                    <button onClick={() => handleAction(app, 'reject')} className="btn-secondary flex-1 text-xs py-2">Reject</button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export function ApplicantProfileScreen({ applicationId }: { applicationId: string }) {
  const [app, setApp] = useState<(Application & { profiles?: Profile; jobs?: Job }) | null>(null);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const [conversationId, setConversationId] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      setLoading(true);
      const { data } = await supabase
        .from('applications')
        .select('*, profiles(*), jobs(*)')
        .eq('id', applicationId)
        .maybeSingle();
      setApp(data as (Application & { profiles?: Profile; jobs?: Job }) | null);

      const { data: conv } = await supabase.from('conversations').select('id').eq('application_id', applicationId).maybeSingle();
      setConversationId(conv?.id ?? null);
      setLoading(false);
    })();
  }, [applicationId]);

  async function handleMessage() {
    if (!app || !user) return;
    if (conversationId) {
      router.navigate({ name: 'conversation', conversationId, otherUserId: app.applicant_id, jobId: app.job_id, applicationId: app.id });
      return;
    }
    const { data: conv } = await supabase.from('conversations').insert({ job_id: app.job_id, application_id: app.id, conversation_type: 'application' }).select().single();
    if (conv) {
      const cid = (conv as { id: string }).id;
      await supabase.from('conversation_participants').insert([
        { conversation_id: cid, user_id: user.id },
        { conversation_id: cid, user_id: app.applicant_id },
      ]);
      router.navigate({ name: 'conversation', conversationId: cid, otherUserId: app.applicant_id, jobId: app.job_id, applicationId: app.id });
    }
  }

  if (loading) return <div className="min-h-screen bg-cream"><Header title="Applicant Profile" onBack={() => router.goBack()} /><Loading /></div>;
  if (!app?.profiles) return <div className="min-h-screen bg-cream"><Header title="Applicant" onBack={() => router.goBack()} /><EmptyState title="Not found" /></div>;

  const p = app.profiles;

  return (
    <div className="min-h-screen bg-cream pb-20">
      <Header title="Applicant Profile" onBack={() => router.goBack()} />
      <div className="max-w-md mx-auto px-4 pt-4 space-y-4">
        <div className="clay-card p-4 flex items-center gap-3">
          <div className="w-14 h-14 rounded-full bg-olive flex items-center justify-center text-lg font-semibold text-cream-white">{initials(p.name)}</div>
          <div className="flex-1">
            <p className="text-base font-semibold text-kaam-text">{p.name}</p>
            <p className="text-xs text-kaam-muted">{p.email}</p>
            {p.verification_status === 'verified' && <span className="badge badge-success mt-1"><CheckCircle2 className="w-3 h-3" /> Verified</span>}
          </div>
        </div>
        <div className="clay-card p-4 space-y-3">
          {p.qualification && <div><p className="text-xs text-kaam-muted">Qualification</p><p className="text-sm font-medium text-kaam-text">{p.qualification}</p></div>}
          {p.experience && <div><p className="text-xs text-kaam-muted">Experience</p><p className="text-sm font-medium text-kaam-text">{p.experience}</p></div>}
          {p.location && <div><p className="text-xs text-kaam-muted">Location</p><p className="text-sm font-medium text-kaam-text">{p.location}</p></div>}
          {p.skills.length > 0 && <div><p className="text-xs text-kaam-muted mb-1.5">Skills</p><div className="flex flex-wrap gap-1.5">{p.skills.map(s => <span key={s} className="badge badge-olive">{s}</span>)}</div></div>}
          {p.languages.length > 0 && <div><p className="text-xs text-kaam-muted mb-1.5">Languages</p><div className="flex flex-wrap gap-1.5">{p.languages.map(l => <span key={l} className="badge badge-muted">{l}</span>)}</div></div>}
        </div>
        <button onClick={handleMessage} className="btn-primary w-full">Message</button>
      </div>
    </div>
  );
}

export function ReviewScreen({ completedWorkId }: { completedWorkId: string }) {
  const { user } = useAuth();
  const [rating, setRating] = useState(5);
  const [reviewText, setReviewText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [work, setWork] = useState<{ worker_id: string; employer_id: string; job_id: string } | null>(null);

  useEffect(() => {
    (async () => {
      const { data } = await supabase.from('completed_work').select('*').eq('id', completedWorkId).maybeSingle();
      if (data) setWork(data as { worker_id: string; employer_id: string; job_id: string });
    })();
  }, [completedWorkId]);

  async function handleSubmit() {
    if (!user || !work) return;
    setSubmitting(true);
    const reviewedId = user.id === work.worker_id ? work.employer_id : work.worker_id;
    const { error } = await supabase.from('reviews').insert({
      reviewer_id: user.id,
      reviewed_id: reviewedId,
      job_id: work.job_id,
      completed_work_id: completedWorkId,
      rating,
      review_text: reviewText,
    });
    if (!error) {
      setSubmitted(true);
      setTimeout(() => router.navigate({ name: 'completed_work' }), 1000);
    }
    setSubmitting(false);
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-cream pb-20">
        <Header title="Review" onBack={() => router.goBack()} />
        <div className="max-w-md mx-auto px-4 pt-4">
          <div className="clay-card p-6 text-center">
            <CheckCircle2 className="w-12 h-12 text-kaam-success mx-auto mb-3" />
            <p className="text-sm font-semibold text-kaam-text">Review Submitted!</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-cream pb-20">
      <Header title="Leave a Review" onBack={() => router.goBack()} />
      <div className="max-w-md mx-auto px-4 pt-4 space-y-4">
        <div className="clay-card p-4">
          <p className="text-xs font-medium text-kaam-muted mb-2">Rating</p>
          <div className="flex gap-2">
            {[1,2,3,4,5].map(n => (
              <button key={n} onClick={() => setRating(n)}>
                <Star className={`w-7 h-7 ${n <= rating ? 'fill-kaam-warning text-kaam-warning' : 'text-olive-light/40'}`} />
              </button>
            ))}
          </div>
        </div>
        <div className="clay-card p-4">
          <label className="block text-xs font-medium text-kaam-muted mb-1.5">Review (optional)</label>
          <textarea className="input-field min-h-[100px] resize-none" value={reviewText} onChange={e => setReviewText(e.target.value)} placeholder="Share your experience..." />
        </div>
        <button onClick={handleSubmit} disabled={submitting} className="btn-primary w-full">{submitting ? 'Submitting...' : 'Submit Review'}</button>
      </div>
    </div>
  );
}

export function ProfileViewScreen({ userId }: { userId: string }) {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const [isSaved, setIsSaved] = useState(false);

  useEffect(() => {
    (async () => {
      setLoading(true);
      const { data } = await supabase.from('profiles').select('*').eq('id', userId).maybeSingle();
      setProfile(data as Profile | null);
      if (user) {
        const { data: saved } = await supabase.from('saved_profiles').select('id').eq('user_id', user.id).eq('saved_user_id', userId).maybeSingle();
        setIsSaved(!!saved);
      }
      setLoading(false);
    })();
  }, [userId, user]);

  async function toggleSave() {
    if (!user) return;
    if (isSaved) {
      await supabase.from('saved_profiles').delete().eq('user_id', user.id).eq('saved_user_id', userId);
      setIsSaved(false);
    } else {
      await supabase.from('saved_profiles').insert({ user_id: user.id, saved_user_id: userId });
      setIsSaved(true);
    }
  }

  if (loading) return <div className="min-h-screen bg-cream"><Header title="Profile" onBack={() => router.goBack()} /><Loading /></div>;
  if (!profile) return <div className="min-h-screen bg-cream"><Header title="Profile" onBack={() => router.goBack()} /><EmptyState title="Profile not found" /></div>;

  return (
    <div className="min-h-screen bg-cream pb-20">
      <Header title="Profile" onBack={() => router.goBack()} />
      <div className="max-w-md mx-auto px-4 pt-4 space-y-4">
        <div className="clay-card p-4 flex items-center gap-3">
          <div className="w-14 h-14 rounded-full bg-olive flex items-center justify-center text-lg font-semibold text-cream-white">{initials(profile.name)}</div>
          <div className="flex-1">
            <p className="text-base font-semibold text-kaam-text">{profile.name}</p>
            <p className="text-xs text-kaam-muted">{profile.email}</p>
            {profile.verification_status === 'verified' && <span className="badge badge-success mt-1"><CheckCircle2 className="w-3 h-3" /> Verified</span>}
          </div>
          {user?.id !== userId && (
            <button onClick={toggleSave} className="w-9 h-9 flex items-center justify-center rounded-lg bg-olive-lighter">
              <Star className={`w-4 h-4 ${isSaved ? 'fill-kaam-warning text-kaam-warning' : 'text-kaam-muted'}`} />
            </button>
          )}
        </div>
        <div className="clay-card p-4 space-y-3">
          {profile.qualification && <div><p className="text-xs text-kaam-muted">Qualification</p><p className="text-sm font-medium text-kaam-text">{profile.qualification}</p></div>}
          {profile.experience && <div><p className="text-xs text-kaam-muted">Experience</p><p className="text-sm font-medium text-kaam-text">{profile.experience}</p></div>}
          {profile.location && <div><p className="text-xs text-kaam-muted">Location</p><p className="text-sm font-medium text-kaam-text">{profile.location}</p></div>}
          {profile.skills.length > 0 && <div><p className="text-xs text-kaam-muted mb-1.5">Skills</p><div className="flex flex-wrap gap-1.5">{profile.skills.map(s => <span key={s} className="badge badge-olive">{s}</span>)}</div></div>}
          {profile.languages.length > 0 && <div><p className="text-xs text-kaam-muted mb-1.5">Languages</p><div className="flex flex-wrap gap-1.5">{profile.languages.map(l => <span key={l} className="badge badge-muted">{l}</span>)}</div></div>}
        </div>
      </div>
    </div>
  );
}

export function MenuScreen() {
  const { profile, signOut } = useAuth();
  return (
    <div className="min-h-screen bg-cream pb-20">
      <Header title="Menu" onBack={() => router.goBack()} />
      <div className="max-w-md mx-auto px-4 pt-4 space-y-3">
        <div className="clay-card p-3.5 flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-olive flex items-center justify-center text-base font-semibold text-cream-white">{initials(profile?.name ?? 'U')}</div>
          <div><p className="text-sm font-semibold text-kaam-text">{profile?.name}</p><p className="text-xs text-kaam-muted">{profile?.email}</p></div>
        </div>
        <MenuItem icon={<FileText className="w-4 h-4" />} title="About Kaam" desc="Learn more about the app" onClick={() => {}} />
        <MenuItem icon={<Star className="w-4 h-4" />} title="Rate Us" desc="Leave a review" onClick={() => {}} />
        <MenuItem icon={<Users className="w-4 h-4" />} title="Refer a Friend" desc="Invite people to Kaam" onClick={() => {}} />
        <MenuItem icon={<Briefcase className="w-4 h-4" />} title="Become an Employer" desc="Start posting jobs" onClick={() => router.navigate({ name: 'create_business' })} />
      </div>
    </div>
  );
}

function MenuItem({ icon, title, desc, onClick }: { icon: React.ReactNode; title: string; desc: string; onClick: () => void }) {
  return (
    <button onClick={onClick} className="option-box w-full text-left" style={{ minHeight: '56px' }}>
      <div className="option-box-icon">{icon}</div>
      <div className="flex-1 min-w-0"><p className="text-sm font-semibold text-kaam-text">{title}</p><p className="text-xs text-kaam-muted truncate">{desc}</p></div>
      <ChevronRight className="w-4 h-4 text-kaam-muted" />
    </button>
  );
}
