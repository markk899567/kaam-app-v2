import { Search, Users, ChevronRight, Briefcase, TrendingUp } from 'lucide-react';
import { router } from '@/lib/router';
import { useAuth } from '@/context/AuthContext';
import { Header } from '@/components/Header';

export function JobsScreen() {
  const { profile } = useAuth();

  return (
    <div className="min-h-screen bg-cream pb-20">
      <Header title="Jobs" />
      <div className="max-w-md mx-auto px-4 pt-4 space-y-3">
        <p className="text-sm text-kaam-muted mb-2">What are you looking for today?</p>

        {/* I Need a Job */}
        <button
          onClick={() => router.switchTab(0)}
          className="option-box"
          style={{ minHeight: '64px' }}
        >
          <div className="option-box-icon">
            <Search className="w-4 h-4" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-kaam-text">I Need a Job</p>
            <p className="text-xs text-kaam-muted">Find work and apply</p>
          </div>
          <ChevronRight className="w-4 h-4 text-kaam-muted flex-shrink-0" />
        </button>

        {/* I Need Workers */}
        <button
          onClick={() => {
            if (profile?.role === 'employer' || profile?.role === 'admin') {
              router.navigate({ name: 'manage_posts' });
            } else {
              router.navigate({ name: 'create_business' });
            }
          }}
          className="option-box"
          style={{ minHeight: '64px' }}
        >
          <div className="option-box-icon">
            <Users className="w-4 h-4" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-kaam-text">I Need Workers</p>
            <p className="text-xs text-kaam-muted">Hire people for your requirement</p>
          </div>
          <ChevronRight className="w-4 h-4 text-kaam-muted flex-shrink-0" />
        </button>

        {/* Quick stats for employers */}
        {profile?.role === 'employer' && (
          <div className="mt-6">
            <h2 className="text-sm font-semibold text-kaam-text mb-3">Employer Tools</h2>
            <button
              onClick={() => router.navigate({ name: 'create_requirement' })}
              className="option-box"
              style={{ minHeight: '60px' }}
            >
              <div className="option-box-icon">
                <Briefcase className="w-4 h-4" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-kaam-text">Create Requirement</p>
                <p className="text-xs text-kaam-muted">Post a new job opening</p>
              </div>
              <ChevronRight className="w-4 h-4 text-kaam-muted flex-shrink-0" />
            </button>

            <button
              onClick={() => router.navigate({ name: 'manage_posts' })}
              className="option-box mt-2"
              style={{ minHeight: '60px' }}
            >
              <div className="option-box-icon">
                <TrendingUp className="w-4 h-4" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-kaam-text">Manage Job Posts</p>
                <p className="text-xs text-kaam-muted">View and manage your postings</p>
              </div>
              <ChevronRight className="w-4 h-4 text-kaam-muted flex-shrink-0" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
