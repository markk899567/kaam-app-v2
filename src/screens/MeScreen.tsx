import { User, Bookmark, UserCheck, ShieldCheck, Settings, HelpCircle, ChevronRight, BadgeCheck, LogOut, Shield, FileText } from 'lucide-react';
import { router } from '@/lib/router';
import { useAuth } from '@/context/AuthContext';
import { Header } from '@/components/Header';
import { initials } from '@/lib/utils';

export function MeScreen() {
  const { profile, signOut } = useAuth();

  return (
    <div className="min-h-screen bg-cream pb-20">
      <Header title="Me" />
      <div className="max-w-md mx-auto px-4 pt-4 space-y-4">
        {/* Profile card */}
        <button
          onClick={() => router.navigate({ name: 'profile' })}
          className="clay-card-interactive p-4 w-full text-left flex items-center gap-3"
        >
          <div className="w-14 h-14 rounded-full bg-olive flex items-center justify-center text-lg font-semibold text-cream-white flex-shrink-0">
            {initials(profile?.name ?? 'U')}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-base font-semibold text-kaam-text truncate">{profile?.name ?? 'User'}</p>
            <p className="text-xs text-kaam-muted truncate">{profile?.email}</p>
            <div className="flex items-center gap-2 mt-1">
              <span className="badge badge-olive">{profile?.role === 'employer' ? 'Employer' : profile?.role === 'admin' ? 'Admin' : 'Worker'}</span>
              {profile?.verification_status === 'verified' && (
                <span className="badge badge-success"><BadgeCheck className="w-3 h-3" /> Verified</span>
              )}
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-kaam-muted" />
        </button>

        {/* Menu items */}
        <div className="space-y-2">
          <MenuItem icon={<User className="w-4 h-4" />} title="My Profile" desc="Edit your personal information" onClick={() => router.navigate({ name: 'profile' })} />
          <MenuItem icon={<Bookmark className="w-4 h-4" />} title="Saved Jobs" desc="Jobs you've bookmarked" onClick={() => router.navigate({ name: 'saved_jobs' })} />
          <MenuItem icon={<UserCheck className="w-4 h-4" />} title="Saved Profiles" desc="Workers and businesses you follow" onClick={() => router.navigate({ name: 'saved_profiles' })} />
          <MenuItem icon={<ShieldCheck className="w-4 h-4" />} title="Verification" desc="Verify your identity" onClick={() => router.navigate({ name: 'verification' })} />
        </div>

        <div className="space-y-2">
          <MenuItem icon={<Settings className="w-4 h-4" />} title="Settings" desc="Account, notifications, preferences" onClick={() => router.navigate({ name: 'settings' })} />
          <MenuItem icon={<HelpCircle className="w-4 h-4" />} title="Help" desc="FAQs, report a problem, contact support" onClick={() => router.navigate({ name: 'help' })} />
        </div>

        {/* Admin link */}
        {profile?.role === 'admin' && (
          <div className="space-y-2">
            <MenuItem icon={<Shield className="w-4 h-4" />} title="Admin Dashboard" desc="Manage platform" onClick={() => router.navigate({ name: 'admin' })} />
          </div>
        )}

        {/* Logout */}
        <button
          onClick={() => signOut()}
          className="option-box w-full text-left mt-4"
          style={{ minHeight: '52px' }}
        >
          <div className="option-box-icon" style={{ background: 'rgba(196,154,69,0.1)', color: '#C49A45' }}>
            <LogOut className="w-4 h-4" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-semibold text-kaam-warning">Logout</p>
          </div>
        </button>

        <p className="text-center text-xs text-kaam-muted pt-4">Kaam v1.0 — Find Work. Find People.</p>
      </div>
    </div>
  );
}

function MenuItem({ icon, title, desc, onClick }: { icon: React.ReactNode; title: string; desc: string; onClick: () => void }) {
  return (
    <button onClick={onClick} className="option-box w-full text-left" style={{ minHeight: '60px' }}>
      <div className="option-box-icon">{icon}</div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-kaam-text">{title}</p>
        <p className="text-xs text-kaam-muted truncate">{desc}</p>
      </div>
      <ChevronRight className="w-4 h-4 text-kaam-muted flex-shrink-0" />
    </button>
  );
}
