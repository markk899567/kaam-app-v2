import { useState, useEffect } from 'react';
import { User, Bell, Lock, Globe, Heart, LogOut, ChevronRight, FileText, LifeBuoy, Flag, Trash2, Shield, UserX } from 'lucide-react';
import { router } from '@/lib/router';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase';
import { Header } from '@/components/Header';
import { Loading, EmptyState } from '@/components/States';
import type { BlockedUser } from '@/types';

export function SettingsScreen() {
  const { signOut } = useAuth();
  return (
    <div className="min-h-screen bg-cream pb-20">
      <Header title="Settings" onBack={() => router.goBack()} />
      <div className="max-w-md mx-auto px-4 pt-4 space-y-3">
        <SettingsItem icon={<User className="w-4 h-4" />} title="Account" desc="Manage your account information" onClick={() => router.navigate({ name: 'account' })} />
        <SettingsItem icon={<Bell className="w-4 h-4" />} title="Notifications" desc="Push, email, and SMS preferences" onClick={() => router.navigate({ name: 'settings' })} />
        <SettingsItem icon={<Lock className="w-4 h-4" />} title="Privacy & Security" desc="Blocked users, account deletion" onClick={() => router.navigate({ name: 'privacy_security' })} />
        <SettingsItem icon={<Globe className="w-4 h-4" />} title="Language" desc="App language preference" onClick={() => {}} />
        <SettingsItem icon={<Heart className="w-4 h-4" />} title="Preferences" desc="Distance unit, display options" onClick={() => {}} />
        <button onClick={() => signOut()} className="option-box w-full text-left mt-4" style={{ minHeight: '52px' }}>
          <div className="option-box-icon" style={{ background: 'rgba(196,154,69,0.1)', color: '#C49A45' }}>
            <LogOut className="w-4 h-4" />
          </div>
          <div className="flex-1"><p className="text-sm font-semibold text-kaam-warning">Logout</p></div>
        </button>
      </div>
    </div>
  );
}

function SettingsItem({ icon, title, desc, onClick }: { icon: React.ReactNode; title: string; desc: string; onClick: () => void }) {
  return (
    <button onClick={onClick} className="option-box w-full text-left" style={{ minHeight: '56px' }}>
      <div className="option-box-icon">{icon}</div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-kaam-text">{title}</p>
        <p className="text-xs text-kaam-muted truncate">{desc}</p>
      </div>
      <ChevronRight className="w-4 h-4 text-kaam-muted" />
    </button>
  );
}

export function AccountScreen() {
  const { profile, user, signOut } = useAuth();
  return (
    <div className="min-h-screen bg-cream pb-20">
      <Header title="Account" onBack={() => router.goBack()} />
      <div className="max-w-md mx-auto px-4 pt-4 space-y-4">
        <div className="clay-card p-4 space-y-3">
          <Row label="Name" value={profile?.name} />
          <Row label="Email" value={profile?.email} />
          <Row label="Phone" value={profile?.phone ?? 'Not set'} />
          <Row label="Role" value={profile?.role === 'employer' ? 'Employer' : 'Worker'} />
          <Row label="Member Since" value={profile ? new Date(profile.created_at).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' }) : ''} />
        </div>
        <button onClick={() => signOut()} className="btn-secondary w-full">Logout</button>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value?: string }) {
  return (
    <div className="flex justify-between items-center">
      <span className="text-xs text-kaam-muted">{label}</span>
      <span className="text-sm font-medium text-kaam-text">{value}</span>
    </div>
  );
}

export function PrivacySecurityScreen() {
  const { user, signOut } = useAuth();
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);

  async function handleDelete() {
    if (!user) return;
    setDeleting(true);
    // Delete profile data (cascades to related data)
    await supabase.from('profiles').delete().eq('id', user.id);
    await signOut();
    setDeleting(false);
  }

  return (
    <div className="min-h-screen bg-cream pb-20">
      <Header title="Privacy & Security" onBack={() => router.goBack()} />
      <div className="max-w-md mx-auto px-4 pt-4 space-y-3">
        <SettingsItem icon={<UserX className="w-4 h-4" />} title="Blocked Users" desc="Manage blocked accounts" onClick={() => router.navigate({ name: 'blocked_users' })} />
        <SettingsItem icon={<Shield className="w-4 h-4" />} title="Privacy Controls" desc="Who can see your information" onClick={() => {}} />

        <div className="pt-4">
          <h2 className="text-sm font-semibold text-kaam-text mb-2">Danger Zone</h2>
          {!confirmDelete ? (
            <button onClick={() => setConfirmDelete(true)} className="option-box w-full text-left" style={{ minHeight: '52px' }}>
              <div className="option-box-icon" style={{ background: 'rgba(239,68,68,0.1)', color: '#ef4444' }}>
                <Trash2 className="w-4 h-4" />
              </div>
              <div className="flex-1"><p className="text-sm font-semibold text-red-600">Delete Account</p></div>
            </button>
          ) : (
            <div className="clay-card p-4 border-red-200">
              <p className="text-sm font-semibold text-red-600 mb-1">Are you sure?</p>
              <p className="text-xs text-kaam-muted mb-3">This will permanently delete your account and all associated data. This action cannot be undone.</p>
              <div className="flex gap-2">
                <button onClick={() => setConfirmDelete(false)} className="btn-secondary flex-1">Cancel</button>
                <button onClick={handleDelete} disabled={deleting} className="flex-1 py-3 rounded-xl bg-red-600 text-cream-white font-semibold disabled:opacity-50">
                  {deleting ? 'Deleting...' : 'Delete Forever'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export function BlockedUsersScreen() {
  const { user } = useAuth();
  const [blocked, setBlocked] = useState<BlockedUser[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    (async () => {
      setLoading(true);
      const { data } = await supabase
        .from('blocked_users')
        .select('*')
        .eq('blocker_id', user.id)
        .order('created_at', { ascending: false });
      setBlocked((data as BlockedUser[]) ?? []);
      setLoading(false);
    })();
  }, [user]);

  async function handleUnblock(id: string) {
    await supabase.from('blocked_users').delete().eq('id', id);
    setBlocked(prev => prev.filter(b => b.id !== id));
  }

  return (
    <div className="min-h-screen bg-cream pb-20">
      <Header title="Blocked Users" onBack={() => router.goBack()} />
      <div className="max-w-md mx-auto px-4 pt-4">
        {loading ? <Loading /> :
        blocked.length === 0 ? (
          <EmptyState icon={<UserX className="w-8 h-8" />} title="No blocked users" description="People you block will appear here." />
        ) : (
          <div className="space-y-2">
            {blocked.map(b => (
              <div key={b.id} className="clay-card p-3.5 flex items-center justify-between">
                <span className="text-sm font-medium text-kaam-text">{b.blocked_id.slice(0, 8)}...</span>
                <button onClick={() => handleUnblock(b.id)} className="text-xs text-olive-deep font-medium">Unblock</button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}


export function HelpScreen() {
  const [showReport, setShowReport] = useState(false);
  const [reportType, setReportType] = useState('');
  const [reportDesc, setReportDesc] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const { user } = useAuth();

  const REPORT_TYPES = [
    { value: 'fake_job', label: 'Fake Job' },
    { value: 'fake_profile', label: 'Fake Profile' },
    { value: 'scam', label: 'Scam' },
    { value: 'inappropriate', label: 'Inappropriate Content' },
    { value: 'harassment', label: 'Harassment' },
    { value: 'spam', label: 'Spam' },
  ];

  const FAQS = [
    { q: 'How do I apply for a job?', a: 'Open any job from the Home or Search screen and tap "Apply Now". Your profile information is automatically included.' },
    { q: 'How do I post a job?', a: 'Go to Jobs tab, select "I Need Workers", then "Create Requirement" to post a new job opening.' },
    { q: 'How do I get verified?', a: 'Go to Me > Verification and submit your ID details. Our team will review your request.' },
    { q: 'How do payments work?', a: 'Payment terms are set by the employer in each job listing. Kaam does not handle payments directly.' },
    { q: 'Can I message an employer?', a: 'Yes, once you apply for a job, a conversation is automatically created with the employer.' },
  ];

  async function handleReport() {
    if (!user || !reportType) return;
    setSubmitting(true);
    const { error } = await supabase.from('reports').insert({
      reporter_id: user.id,
      report_type: reportType,
      description: reportDesc,
      status: 'pending',
    });
    if (!error) {
      setSubmitted(true);
      setTimeout(() => { setShowReport(false); setSubmitted(false); setReportType(''); setReportDesc(''); }, 2000);
    }
    setSubmitting(false);
  }

  return (
    <div className="min-h-screen bg-cream pb-20">
      <Header title="Help" onBack={() => router.goBack()} />
      <div className="max-w-md mx-auto px-4 pt-4 space-y-4">
        {/* FAQs */}
        <div>
          <h2 className="text-sm font-semibold text-kaam-text mb-2 flex items-center gap-1.5">
            <FileText className="w-4 h-4 text-olive" /> FAQs
          </h2>
          <div className="space-y-2">
            {FAQS.map((faq, i) => (
              <details key={i} className="clay-card p-3.5">
                <summary className="text-sm font-medium text-kaam-text cursor-pointer">{faq.q}</summary>
                <p className="text-xs text-kaam-muted mt-2 leading-relaxed">{faq.a}</p>
              </details>
            ))}
          </div>
        </div>

        {/* Report a problem */}
        <div>
          <h2 className="text-sm font-semibold text-kaam-text mb-2 flex items-center gap-1.5">
            <Flag className="w-4 h-4 text-olive" /> Report a Problem
          </h2>
          {!showReport ? (
            <button onClick={() => setShowReport(true)} className="option-box w-full text-left" style={{ minHeight: '56px' }}>
              <div className="option-box-icon"><Flag className="w-4 h-4" /></div>
              <div className="flex-1"><p className="text-sm font-semibold text-kaam-text">Report an Issue</p><p className="text-xs text-kaam-muted">Fake job, scam, harassment, etc.</p></div>
              <ChevronRight className="w-4 h-4 text-kaam-muted" />
            </button>
          ) : submitted ? (
            <div className="clay-card p-4 text-center">
              <p className="text-sm font-semibold text-kaam-success">Report submitted. Thank you!</p>
            </div>
          ) : (
            <div className="clay-card p-4 space-y-3">
              <div>
                <label className="block text-xs font-medium text-kaam-muted mb-1.5">Issue Type</label>
                <select className="input-field" value={reportType} onChange={e => setReportType(e.target.value)}>
                  <option value="">Select type...</option>
                  {REPORT_TYPES.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-kaam-muted mb-1.5">Description</label>
                <textarea className="input-field min-h-[80px] resize-none" value={reportDesc} onChange={e => setReportDesc(e.target.value)} placeholder="Describe the issue..." />
              </div>
              <button onClick={handleReport} disabled={submitting || !reportType} className="btn-primary w-full">
                {submitting ? 'Submitting...' : 'Submit Report'}
              </button>
            </div>
          )}
        </div>

        {/* Contact support */}
        <div>
          <h2 className="text-sm font-semibold text-kaam-text mb-2 flex items-center gap-1.5">
            <LifeBuoy className="w-4 h-4 text-olive" /> Contact Support
          </h2>
          <div className="clay-card p-4">
            <p className="text-sm text-kaam-text">Email: support@kaam.app</p>
            <p className="text-xs text-kaam-muted mt-1">We typically respond within 24 hours.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
