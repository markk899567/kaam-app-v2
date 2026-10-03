import { useEffect, useState, useCallback } from 'react';
import { MapPin, FileText, Briefcase, Languages, Clock, Bookmark, ChevronRight, Edit2, CheckCircle2, XCircle, Clock as ClockIcon } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { router } from '@/lib/router';
import { useAuth } from '@/context/AuthContext';
import { Header } from '@/components/Header';
import { Loading, EmptyState } from '@/components/States';
import { JobCard } from '@/components/JobCard';
import { initials, formatDate } from '@/lib/utils';
import type { Profile, SearchJobResult, VerificationRecord, BlockedUser } from '@/types';

export function ProfileScreen() {
  const { profile, user } = useAuth();
  const [loading, setLoading] = useState(false);

  return (
    <div className="min-h-screen bg-cream pb-20">
      <Header
        title="My Profile"
        onBack={() => router.goBack()}
        right={
          <button onClick={() => router.navigate({ name: 'edit_profile' })} className="w-9 h-9 flex items-center justify-center rounded-lg hover:bg-olive-lighter/50">
            <Edit2 className="w-4 h-4 text-kaam-text" />
          </button>
        }
      />
      <div className="max-w-md mx-auto px-4 pt-4 space-y-4">
        {/* Profile header */}
        <div className="clay-card p-4 flex items-center gap-3">
          <div className="w-16 h-16 rounded-full bg-olive flex items-center justify-center text-xl font-semibold text-cream-white flex-shrink-0">
            {initials(profile?.name ?? 'U')}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-base font-semibold text-kaam-text">{profile?.name}</p>
            <p className="text-xs text-kaam-muted">{profile?.email}</p>
            {profile?.phone && <p className="text-xs text-kaam-muted">{profile.phone}</p>}
            <div className="flex items-center gap-2 mt-1">
              <span className="badge badge-olive">{profile?.role === 'employer' ? 'Employer' : 'Worker'}</span>
              {profile?.verification_status === 'verified' && <span className="badge badge-success"><CheckCircle2 className="w-3 h-3" /> Verified</span>}
            </div>
          </div>
        </div>

        {/* Details */}
        <div className="clay-card p-4 space-y-3">
          {profile?.location && <DetailRow icon={<MapPin className="w-4 h-4" />} label="Location" value={profile.location} />}
          {profile?.qualification && <DetailRow icon={<FileText className="w-4 h-4" />} label="Qualification" value={profile.qualification} />}
          {profile?.experience && <DetailRow icon={<Briefcase className="w-4 h-4" />} label="Experience" value={profile.experience} />}
          {profile?.availability && <DetailRow icon={<Clock className="w-4 h-4" />} label="Availability" value={profile.availability} />}
          {profile?.skills && profile.skills.length > 0 && (
            <div>
              <p className="text-xs text-kaam-muted mb-1.5">Skills</p>
              <div className="flex flex-wrap gap-1.5">
                {profile.skills.map(s => <span key={s} className="badge badge-olive">{s}</span>)}
              </div>
            </div>
          )}
          {profile?.languages && profile.languages.length > 0 && (
            <div>
              <p className="text-xs text-kaam-muted mb-1.5">Languages</p>
              <div className="flex flex-wrap gap-1.5">
                {profile.languages.map(l => <span key={l} className="badge badge-muted">{l}</span>)}
              </div>
            </div>
          )}
          {profile?.work_preferences && profile.work_preferences.length > 0 && (
            <div>
              <p className="text-xs text-kaam-muted mb-1.5">Work Preferences</p>
              <div className="flex flex-wrap gap-1.5">
                {profile.work_preferences.map(w => <span key={w} className="badge badge-muted">{w}</span>)}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function DetailRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-center gap-2">
      <div className="text-olive flex-shrink-0">{icon}</div>
      <div className="flex-1 min-w-0">
        <p className="text-xs text-kaam-muted">{label}</p>
        <p className="text-sm font-medium text-kaam-text capitalize">{value}</p>
      </div>
    </div>
  );
}

const SKILL_OPTIONS = ['Construction', 'Cleaning', 'Cooking', 'Driving', 'Security', 'Electrician', 'Plumbing', 'Painting', 'Carpentry', 'Welding', 'Gardening', 'Delivery'];
const LANGUAGE_OPTIONS = ['Hindi', 'English', 'Bengali', 'Tamil', 'Telugu', 'Marathi', 'Kannada', 'Gujarati', 'Punjabi', 'Urdu', 'Malayalam', 'Odia'];

export function EditProfileScreen() {
  const { profile, user, refreshProfile } = useAuth();
  const [name, setName] = useState(profile?.name ?? '');
  const [phone, setPhone] = useState(profile?.phone ?? '');
  const [location, setLocation] = useState(profile?.location ?? '');
  const [qualification, setQualification] = useState(profile?.qualification ?? '');
  const [experience, setExperience] = useState(profile?.experience ?? '');
  const [skills, setSkills] = useState<string[]>(profile?.skills ?? []);
  const [languages, setLanguages] = useState<string[]>(profile?.languages ?? []);
  const [availability, setAvailability] = useState(profile?.availability ?? 'available');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  function toggleSkill(s: string) {
    setSkills(prev => prev.includes(s) ? prev.filter(x => x !== s) : [...prev, s]);
  }
  function toggleLang(l: string) {
    setLanguages(prev => prev.includes(l) ? prev.filter(x => x !== l) : [...prev, l]);
  }

  async function handleSave() {
    if (!user) return;
    setSaving(true);
    const { error } = await supabase
      .from('profiles')
      .update({
        name, phone, location, qualification, experience, skills, languages, availability,
        updated_at: new Date().toISOString(),
      })
      .eq('id', user.id);

    if (!error) {
      await refreshProfile();
      setSaved(true);
      setTimeout(() => router.goBack(), 800);
    }
    setSaving(false);
  }

  return (
    <div className="min-h-screen bg-cream pb-20">
      <Header title="Edit Profile" onBack={() => router.goBack()} />
      <div className="max-w-md mx-auto px-4 pt-4 space-y-4">
        <div className="clay-card p-4 space-y-3">
          <Field label="Full Name"><input className="input-field" value={name} onChange={e => setName(e.target.value)} /></Field>
          <Field label="Phone"><input className="input-field" value={phone} onChange={e => setPhone(e.target.value)} placeholder="Optional" /></Field>
          <Field label="Location"><input className="input-field" value={location} onChange={e => setLocation(e.target.value)} placeholder="City, Area" /></Field>
          <Field label="Qualification"><input className="input-field" value={qualification} onChange={e => setQualification(e.target.value)} placeholder="e.g. 10th Pass, ITI" /></Field>
          <Field label="Experience"><input className="input-field" value={experience} onChange={e => setExperience(e.target.value)} placeholder="e.g. 3 years" /></Field>
          <Field label="Availability">
            <select className="input-field" value={availability} onChange={e => setAvailability(e.target.value)}>
              <option value="available">Available</option>
              <option value="busy">Busy</option>
              <option value="unavailable">Unavailable</option>
            </select>
          </Field>
        </div>

        <div className="clay-card p-4">
          <p className="text-xs font-medium text-kaam-muted mb-2">Skills</p>
          <div className="flex flex-wrap gap-2">
            {SKILL_OPTIONS.map(s => (
              <button key={s} onClick={() => toggleSkill(s)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium border ${skills.includes(s) ? 'bg-olive text-cream-white border-olive' : 'bg-cream-white text-kaam-text border-olive-light/30'}`}>
                {s}
              </button>
            ))}
          </div>
        </div>

        <div className="clay-card p-4">
          <p className="text-xs font-medium text-kaam-muted mb-2">Languages</p>
          <div className="flex flex-wrap gap-2">
            {LANGUAGE_OPTIONS.map(l => (
              <button key={l} onClick={() => toggleLang(l)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium border ${languages.includes(l) ? 'bg-olive text-cream-white border-olive' : 'bg-cream-white text-kaam-text border-olive-light/30'}`}>
                {l}
              </button>
            ))}
          </div>
        </div>

        <button onClick={handleSave} disabled={saving} className="btn-primary w-full">
          {saving ? 'Saving...' : saved ? 'Saved!' : 'Save Changes'}
        </button>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs font-medium text-kaam-muted mb-1.5">{label}</label>
      {children}
    </div>
  );
}

export function SavedJobsScreen() {
  const { user } = useAuth();
  const [jobs, setJobs] = useState<SearchJobResult[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    (async () => {
      setLoading(true);
      const { data: saved } = await supabase
        .from('saved_jobs')
        .select('job_id')
        .eq('user_id', user.id);

      const jobIds = (saved ?? []).map((s: { job_id: string }) => s.job_id);
      if (jobIds.length === 0) {
        setJobs([]);
        setLoading(false);
        return;
      }

      const { data: jobData } = await supabase
        .from('jobs')
        .select('*, businesses(name, logo_url)')
        .in('id', jobIds)
        .order('created_at', { ascending: false });

      // Map to SearchJobResult shape
      const mapped: SearchJobResult[] = ((jobData as any[]) ?? []).map(j => ({
        id: j.id, title: j.title, description: j.description, category: j.category,
        work_period: j.work_period, is_instant: j.is_instant, status: j.status,
        location: j.location, latitude: j.latitude, longitude: j.longitude,
        start_date: j.start_date, end_date: j.end_date, time_from: j.time_from,
        time_to: j.time_to, total_hours: j.total_hours, flexible_timing: j.flexible_timing,
        payment_type: j.payment_type, payment_amount: j.payment_amount, vacancies: j.vacancies,
        rating: j.rating, rating_count: j.rating_count, business_id: j.business_id,
        employer_id: j.employer_id, created_at: j.created_at,
        business_name: j.businesses?.name ?? 'Business', business_logo: j.businesses?.logo_url ?? null,
      }));
      setJobs(mapped);
      setLoading(false);
    })();
  }, [user]);

  return (
    <div className="min-h-screen bg-cream pb-20">
      <Header title="Saved Jobs" onBack={() => router.goBack()} />
      <div className="max-w-md mx-auto px-4 pt-4">
        {loading ? <Loading message="Loading saved jobs..." /> :
        jobs.length === 0 ? (
          <EmptyState icon={<Bookmark className="w-8 h-8" />} title="No saved jobs" description="Bookmark jobs to find them quickly later." />
        ) : (
          <div className="space-y-2.5">
            {jobs.map(job => <JobCard key={job.id} job={job} />)}
          </div>
        )}
      </div>
    </div>
  );
}

export function SavedProfilesScreen() {
  const { user } = useAuth();
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    (async () => {
      setLoading(true);
      const { data: saved } = await supabase
        .from('saved_profiles')
        .select('saved_user_id')
        .eq('user_id', user.id);

      const ids = (saved ?? []).map((s: { saved_user_id: string }) => s.saved_user_id);
      if (ids.length === 0) {
        setProfiles([]);
        setLoading(false);
        return;
      }

      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .in('id', ids);
      setProfiles((profileData as Profile[]) ?? []);
      setLoading(false);
    })();
  }, [user]);

  return (
    <div className="min-h-screen bg-cream pb-20">
      <Header title="Saved Profiles" onBack={() => router.goBack()} />
      <div className="max-w-md mx-auto px-4 pt-4">
        {loading ? <Loading message="Loading saved profiles..." /> :
        profiles.length === 0 ? (
          <EmptyState icon={<Bookmark className="w-8 h-8" />} title="No saved profiles" description="Save workers or businesses to find them quickly." />
        ) : (
          <div className="space-y-2.5">
            {profiles.map(p => (
              <button key={p.id} onClick={() => router.navigate({ name: 'profile_view', userId: p.id })}
                className="clay-card-interactive p-3.5 w-full text-left flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-olive flex items-center justify-center text-sm font-semibold text-cream-white flex-shrink-0">
                  {initials(p.name)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-kaam-text truncate">{p.name}</p>
                  <p className="text-xs text-kaam-muted truncate">{p.qualification ?? p.location ?? 'No details'}</p>
                </div>
                <ChevronRight className="w-4 h-4 text-kaam-muted" />
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export function VerificationScreen() {
  const { profile, user } = useAuth();
  const [records, setRecords] = useState<VerificationRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    (async () => {
      setLoading(true);
      const { data } = await supabase
        .from('verification_records')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      setRecords((data as VerificationRecord[]) ?? []);
      setLoading(false);
    })();
  }, [user]);

  const status = profile?.verification_status ?? 'unverified';

  return (
    <div className="min-h-screen bg-cream pb-20">
      <Header title="Verification" onBack={() => router.goBack()} />
      <div className="max-w-md mx-auto px-4 pt-4 space-y-4">
        {/* Status card */}
        <div className="clay-card p-4 text-center">
          {status === 'verified' ? (
            <>
              <CheckCircle2 className="w-12 h-12 text-kaam-success mx-auto mb-2" />
              <p className="text-sm font-semibold text-kaam-text">Verified</p>
              <p className="text-xs text-kaam-muted mt-1">Your identity has been verified.</p>
            </>
          ) : status === 'pending' ? (
            <>
              <ClockIcon className="w-12 h-12 text-kaam-warning mx-auto mb-2" />
              <p className="text-sm font-semibold text-kaam-text">Pending Review</p>
              <p className="text-xs text-kaam-muted mt-1">Your verification is under review.</p>
            </>
          ) : status === 'rejected' ? (
            <>
              <XCircle className="w-12 h-12 text-red-500 mx-auto mb-2" />
              <p className="text-sm font-semibold text-kaam-text">Verification Rejected</p>
              <p className="text-xs text-kaam-muted mt-1">Please submit again with correct documents.</p>
            </>
          ) : (
            <>
              <ShieldCheck className="w-12 h-12 text-kaam-muted mx-auto mb-2" />
              <p className="text-sm font-semibold text-kaam-text">Not Verified</p>
              <p className="text-xs text-kaam-muted mt-1">Get verified to build trust with employers and workers.</p>
            </>
          )}
        </div>

        {/* Start verification */}
        {status !== 'verified' && status !== 'pending' && (
          <button
            onClick={() => router.navigate({ name: 'verification_details' })}
            className="btn-primary w-full"
          >
            Start Verification
          </button>
        )}

        {/* History */}
        {records.length > 0 && (
          <div>
            <h2 className="text-sm font-semibold text-kaam-text mb-2">Verification History</h2>
            <div className="space-y-2">
              {records.map(r => (
                <div key={r.id} className="clay-card p-3.5">
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-sm font-medium text-kaam-text capitalize">{r.id_type?.replace('_', ' ') ?? 'Document'}</p>
                    <span className={`badge ${r.status === 'approved' ? 'badge-success' : r.status === 'rejected' ? 'badge-muted' : 'badge-instant'}`}>
                      {r.status}
                    </span>
                  </div>
                  <p className="text-xs text-kaam-muted">Submitted {formatDate(r.submitted_at)}</p>
                  {r.review_note && <p className="text-xs text-kaam-muted mt-1">{r.review_note}</p>}
                </div>
              ))}
            </div>
          </div>
        )}

        {loading && <Loading />}
      </div>
    </div>
  );
}

export function VerificationDetailsScreen() {
  const { user, refreshProfile } = useAuth();
  const [idType, setIdType] = useState('national_id');
  const [idNumber, setIdNumber] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  async function handleSubmit() {
    if (!user) return;
    setSubmitting(true);
    const { error } = await supabase.from('verification_records').insert({
      user_id: user.id,
      id_type: idType,
      id_number: idNumber,
      status: 'pending',
    });

    if (!error) {
      await supabase.from('profiles').update({ verification_status: 'pending' }).eq('id', user.id);
      await refreshProfile();
      setSubmitted(true);
      setTimeout(() => router.goBack(), 1000);
    }
    setSubmitting(false);
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-cream pb-20">
        <Header title="Verification" onBack={() => router.goBack()} />
        <div className="max-w-md mx-auto px-4 pt-4">
          <div className="clay-card p-6 text-center">
            <CheckCircle2 className="w-12 h-12 text-kaam-success mx-auto mb-3" />
            <p className="text-sm font-semibold text-kaam-text">Submitted Successfully</p>
            <p className="text-xs text-kaam-muted mt-1">Your verification is now under review. You'll be notified when it's complete.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-cream pb-20">
      <Header title="Verification Details" onBack={() => router.goBack()} />
      <div className="max-w-md mx-auto px-4 pt-4 space-y-4">
        <div className="clay-card p-4 space-y-3">
          <Field label="ID Type">
            <select className="input-field" value={idType} onChange={e => setIdType(e.target.value)}>
              <option value="national_id">National ID (Aadhaar)</option>
              <option value="passport">Passport</option>
              <option value="driving_license">Driving License</option>
              <option value="voter_id">Voter ID</option>
              <option value="other">Other</option>
            </select>
          </Field>
          <Field label="ID Number">
            <input className="input-field" value={idNumber} onChange={e => setIdNumber(e.target.value)} placeholder="Enter your ID number" />
          </Field>
          <div className="bg-olive-lighter/30 rounded-lg p-3">
            <p className="text-xs text-kaam-muted">
              Your information is securely stored and will be reviewed by our team.
              Document upload will be available when a verification provider is connected.
            </p>
          </div>
        </div>
        <button onClick={handleSubmit} disabled={submitting || !idNumber.trim()} className="btn-primary w-full">
          {submitting ? 'Submitting...' : 'Submit for Verification'}
        </button>
      </div>
    </div>
  );
}
