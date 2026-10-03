import { useEffect, useState, useCallback } from 'react';
import { Users, Briefcase, Flag, ShieldCheck, Star, ChevronRight, LayoutDashboard, CheckCircle2, XCircle } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { router } from '@/lib/router';
import { useAuth } from '@/context/AuthContext';
import { Header } from '@/components/Header';
import { Loading, EmptyState, ErrorState } from '@/components/States';
import { formatDate, initials } from '@/lib/utils';
import type { Profile, Job, Report, VerificationRecord } from '@/types';

export function AdminScreen() {
  const { profile } = useAuth();

  if (profile?.role !== 'admin') {
    return (
      <div className="min-h-screen bg-cream pb-20">
        <Header title="Admin" onBack={() => router.goBack()} />
        <div className="max-w-md mx-auto px-4 pt-4">
          <EmptyState icon={<ShieldCheck className="w-8 h-8" />} title="Access Denied" description="You need admin privileges to access this area." />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-cream pb-20">
      <Header title="Admin Dashboard" onBack={() => router.goBack()} />
      <div className="max-w-md mx-auto px-4 pt-4 space-y-3">
        <AdminItem icon={<Users className="w-4 h-4" />} title="Users" desc="Manage user accounts" onClick={() => router.navigate({ name: 'admin_users' })} />
        <AdminItem icon={<Briefcase className="w-4 h-4" />} title="Jobs" desc="Moderate job postings" onClick={() => router.navigate({ name: 'admin_jobs' })} />
        <AdminItem icon={<Flag className="w-4 h-4" />} title="Reports" desc="Review user reports" onClick={() => router.navigate({ name: 'admin_reports' })} />
        <AdminItem icon={<ShieldCheck className="w-4 h-4" />} title="Verification" desc="Review verification requests" onClick={() => router.navigate({ name: 'admin_verification' })} />
      </div>
    </div>
  );
}

function AdminItem({ icon, title, desc, onClick }: { icon: React.ReactNode; title: string; desc: string; onClick: () => void }) {
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

export function AdminUsersScreen() {
  const [users, setUsers] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(50);
    if (error) {
      setUsers([]);
    } else {
      setUsers((data as Profile[]) ?? []);
    }
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const filtered = users.filter(u =>
    !search || u.name?.toLowerCase().includes(search.toLowerCase()) || u.email?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-cream pb-20">
      <Header title="Users" onBack={() => router.goBack()} />
      <div className="max-w-md mx-auto px-4 pt-4">
        <input className="input-field mb-3" placeholder="Search users..." value={search} onChange={e => setSearch(e.target.value)} />
        {loading ? <Loading /> :
        filtered.length === 0 ? <EmptyState icon={<Users className="w-8 h-8" />} title="No users found" /> : (
          <div className="space-y-2">
            {filtered.map(u => (
              <div key={u.id} className="clay-card p-3.5 flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-olive flex items-center justify-center text-sm font-semibold text-cream-white flex-shrink-0">
                  {initials(u.name)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-kaam-text truncate">{u.name}</p>
                  <p className="text-xs text-kaam-muted truncate">{u.email}</p>
                  <div className="flex gap-1.5 mt-1">
                    <span className="badge badge-olive">{u.role}</span>
                    {u.verification_status === 'verified' && <span className="badge badge-success">Verified</span>}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export function AdminJobsScreen() {
  const [jobs, setJobs] = useState<(Job & { businesses?: { name: string } })[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase
      .from('jobs')
      .select('*, businesses(name)')
      .order('created_at', { ascending: false })
      .limit(50);
    setJobs((data as (Job & { businesses?: { name: string } })[]) ?? []);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  async function handleStatusChange(jobId: string, status: string) {
    await supabase.from('jobs').update({ status }).eq('id', jobId);
    load();
  }

  return (
    <div className="min-h-screen bg-cream pb-20">
      <Header title="Jobs" onBack={() => router.goBack()} />
      <div className="max-w-md mx-auto px-4 pt-4">
        {loading ? <Loading /> :
        jobs.length === 0 ? <EmptyState icon={<Briefcase className="w-8 h-8" />} title="No jobs found" /> : (
          <div className="space-y-2">
            {jobs.map(j => (
              <div key={j.id} className="clay-card p-3.5">
                <p className="text-sm font-semibold text-kaam-text truncate">{j.title}</p>
                <p className="text-xs text-kaam-muted">{j.businesses?.name}</p>
                <div className="flex items-center gap-2 mt-2">
                  <span className={`badge ${j.status === 'active' ? 'badge-success' : j.status === 'paused' ? 'badge-instant' : 'badge-muted'}`}>{j.status}</span>
                  <button onClick={() => handleStatusChange(j.id, 'paused')} className="text-xs text-kaam-warning font-medium">Pause</button>
                  <button onClick={() => handleStatusChange(j.id, 'closed')} className="text-xs text-red-500 font-medium">Close</button>
                  <button onClick={() => router.navigate({ name: 'job_details', jobId: j.id })} className="text-xs text-olive-deep font-medium ml-auto">View</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export function AdminReportsScreen() {
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase
      .from('reports')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(50);
    setReports((data as Report[]) ?? []);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  async function handleStatus(id: string, status: string) {
    await supabase.from('reports').update({ status }).eq('id', id);
    load();
  }

  return (
    <div className="min-h-screen bg-cream pb-20">
      <Header title="Reports" onBack={() => router.goBack()} />
      <div className="max-w-md mx-auto px-4 pt-4">
        {loading ? <Loading /> :
        reports.length === 0 ? <EmptyState icon={<Flag className="w-8 h-8" />} title="No reports" /> : (
          <div className="space-y-2">
            {reports.map(r => (
              <div key={r.id} className="clay-card p-3.5">
                <div className="flex items-center justify-between mb-1">
                  <span className="badge badge-instant">{r.report_type.replace('_', ' ')}</span>
                  <span className={`badge ${r.status === 'pending' ? 'badge-muted' : 'badge-success'}`}>{r.status}</span>
                </div>
                {r.description && <p className="text-xs text-kaam-text mt-1">{r.description}</p>}
                <p className="text-xs text-kaam-muted mt-1">{formatDate(r.created_at)}</p>
                {r.status === 'pending' && (
                  <div className="flex gap-2 mt-2">
                    <button onClick={() => handleStatus(r.id, 'resolved')} className="text-xs text-kaam-success font-medium flex items-center gap-1"><CheckCircle2 className="w-3 h-3" /> Resolve</button>
                    <button onClick={() => handleStatus(r.id, 'dismissed')} className="text-xs text-kaam-muted font-medium flex items-center gap-1"><XCircle className="w-3 h-3" /> Dismiss</button>
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

export function AdminVerificationScreen() {
  const [records, setRecords] = useState<(VerificationRecord & { profiles?: { name: string; email: string } })[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase
      .from('verification_records')
      .select('*, profiles(name, email)')
      .order('created_at', { ascending: false })
      .limit(50);
    setRecords((data as (VerificationRecord & { profiles?: { name: string; email: string } })[]) ?? []);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  async function handleReview(id: string, userId: string, status: 'approved' | 'rejected') {
    await supabase.from('verification_records').update({ status, reviewed_at: new Date().toISOString() }).eq('id', id);
    if (status === 'approved') {
      await supabase.from('profiles').update({ verification_status: 'verified' }).eq('id', userId);
    } else {
      await supabase.from('profiles').update({ verification_status: 'rejected' }).eq('id', userId);
    }
    load();
  }

  return (
    <div className="min-h-screen bg-cream pb-20">
      <Header title="Verification" onBack={() => router.goBack()} />
      <div className="max-w-md mx-auto px-4 pt-4">
        {loading ? <Loading /> :
        records.length === 0 ? <EmptyState icon={<ShieldCheck className="w-8 h-8" />} title="No verification requests" /> : (
          <div className="space-y-2">
            {records.map(r => (
              <div key={r.id} className="clay-card p-3.5">
                <div className="flex items-center justify-between mb-1">
                  <p className="text-sm font-semibold text-kaam-text">{r.profiles?.name ?? 'Unknown'}</p>
                  <span className={`badge ${r.status === 'approved' ? 'badge-success' : r.status === 'rejected' ? 'badge-muted' : 'badge-instant'}`}>{r.status}</span>
                </div>
                <p className="text-xs text-kaam-muted">{r.id_type?.replace('_', ' ')} • {r.id_number}</p>
                <p className="text-xs text-kaam-muted mt-0.5">{r.profiles?.email}</p>
                {r.status === 'pending' && (
                  <div className="flex gap-2 mt-2">
                    <button onClick={() => handleReview(r.id, r.user_id, 'approved')} className="text-xs text-kaam-success font-medium flex items-center gap-1"><CheckCircle2 className="w-3 h-3" /> Approve</button>
                    <button onClick={() => handleReview(r.id, r.user_id, 'rejected')} className="text-xs text-red-500 font-medium flex items-center gap-1"><XCircle className="w-3 h-3" /> Reject</button>
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
