import { useEffect, useState, useCallback } from 'react';
import { Search, Bell, Menu as MenuIcon, Zap, MapPin, ChevronRight, Star, Users, Clock, TrendingUp } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase';
import { router } from '@/lib/router';
import { JobCard } from '@/components/JobCard';
import { Loading, EmptyState } from '@/components/States';
import { getGreeting, initials } from '@/lib/utils';
import type { NearbyJob, SearchJobResult } from '@/types';

const CATEGORIES = ['Construction', 'Cleaning', 'Delivery', 'Cooking', 'Security', 'Driving', 'Retail', 'Electrician', 'Plumbing', 'Painting'];

export function HomeScreen() {
  const { profile } = useAuth();
  const [nearbyJobs, setNearbyJobs] = useState<NearbyJob[]>([]);
  const [instantJobs, setInstantJobs] = useState<SearchJobResult[]>([]);
  const [recommendedJobs, setRecommendedJobs] = useState<SearchJobResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);

  const loadJobs = useCallback(async () => {
    setLoading(true);

    // Nearby jobs — use profile location or default
    const lat = profile?.latitude ?? 12.9716;
    const lng = profile?.longitude ?? 77.5946;

    const { data: nearby } = await supabase.rpc('get_nearby_jobs', {
      p_lat: lat,
      p_lng: lng,
      p_radius_km: 15,
      p_limit: 5,
      p_offset: 0,
    });

    setNearbyJobs((nearby as NearbyJob[]) ?? []);

    // Instant jobs
    const { data: instant } = await supabase.rpc('search_jobs', {
      p_query: '',
      p_is_instant: true,
      p_limit: 5,
    });
    setInstantJobs((instant as SearchJobResult[]) ?? []);

    // Recommended — match by skills or category
    if (profile?.skills && profile.skills.length > 0) {
      const { data: recs } = await supabase.rpc('search_jobs', {
        p_query: profile.skills[0],
        p_limit: 5,
      });
      setRecommendedJobs((recs as SearchJobResult[]) ?? []);
    } else {
      // Default to recent active jobs
      const { data: recs } = await supabase.rpc('search_jobs', {
        p_query: '',
        p_limit: 5,
      });
      setRecommendedJobs((recs as SearchJobResult[]) ?? []);
    }

    // Unread notifications count
    if (profile) {
      const { count } = await supabase
        .from('notifications')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', profile.id)
        .eq('is_read', false);
      setUnreadCount(count ?? 0);
    }

    setLoading(false);
  }, [profile]);

  useEffect(() => {
    loadJobs();
  }, [loadJobs]);

  const greeting = getGreeting();
  const firstName = profile?.name?.split(' ')[0] ?? 'there';

  return (
    <div className="min-h-screen bg-cream pb-20">
      {/* Top bar */}
      <div className="sticky top-0 z-30 bg-cream-white/95 backdrop-blur-sm border-b border-olive-light/20">
        <div className="flex items-center justify-between px-4 h-14">
          <button
            onClick={() => router.navigate({ name: 'menu' })}
            className="w-9 h-9 flex items-center justify-center rounded-lg hover:bg-olive-lighter/50"
            aria-label="Menu"
          >
            <MenuIcon className="w-5 h-5 text-kaam-text" />
          </button>
          <span className="text-sm font-semibold text-olive-deep">Kaam</span>
          <div className="flex items-center gap-1">
            <button
              onClick={() => router.navigate({ name: 'search' })}
              className="w-9 h-9 flex items-center justify-center rounded-lg hover:bg-olive-lighter/50"
              aria-label="Search"
            >
              <Search className="w-5 h-5 text-kaam-text" />
            </button>
            <button
              onClick={() => router.navigate({ name: 'notifications' })}
              className="w-9 h-9 flex items-center justify-center rounded-lg hover:bg-olive-lighter/50 relative"
              aria-label="Notifications"
            >
              <Bell className="w-5 h-5 text-kaam-text" />
              {unreadCount > 0 && (
                <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-kaam-warning rounded-full" />
              )}
            </button>
            <button
              onClick={() => router.navigate({ name: 'profile' })}
              className="w-8 h-8 rounded-full bg-olive flex items-center justify-center text-xs font-semibold text-cream-white ml-1"
              aria-label="Profile"
            >
              {initials(profile?.name ?? 'U')}
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-md mx-auto px-4 pt-4">
        {/* Greeting */}
        <div className="mb-5">
          <p className="text-xs text-kaam-muted">{greeting},</p>
          <h1 className="text-xl font-bold text-kaam-text">{firstName}</h1>
        </div>

        {/* Search shortcut */}
        <button
          onClick={() => router.navigate({ name: 'search' })}
          className="clay-card-interactive w-full flex items-center gap-2 px-4 py-3 mb-5"
        >
          <Search className="w-4 h-4 text-kaam-muted" />
          <span className="text-sm text-kaam-muted">Search jobs, skills, locations...</span>
        </button>

        {/* Categories scroll */}
        <div className="mb-5">
          <div className="flex gap-2 overflow-x-auto scrollbar-hide -mx-4 px-4">
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                onClick={() => router.navigate({ name: 'search_results', query: cat })}
                className="flex-shrink-0 px-3 py-1.5 rounded-full bg-cream-white border border-olive-light/30 text-xs font-medium text-kaam-text hover:bg-olive-lighter/50 transition-colors"
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <Loading message="Finding jobs near you..." />
        ) : (
          <div className="space-y-6">
            {/* Instant Jobs */}
            {instantJobs.length > 0 && (
              <section>
                <div className="flex items-center justify-between mb-3">
                  <h2 className="text-sm font-semibold text-kaam-text flex items-center gap-1.5">
                    <Zap className="w-4 h-4 text-kaam-warning" />
                    Instant Jobs
                  </h2>
                  <button
                    onClick={() => router.navigate({ name: 'search_results', query: '' })}
                    className="text-xs text-olive-deep font-medium flex items-center gap-0.5"
                  >
                    See all <ChevronRight className="w-3 h-3" />
                  </button>
                </div>
                <div className="space-y-2.5">
                  {instantJobs.slice(0, 3).map((job) => (
                    <JobCard key={job.id} job={job} />
                  ))}
                </div>
              </section>
            )}

            {/* Recommended */}
            {recommendedJobs.length > 0 && (
              <section>
                <div className="flex items-center justify-between mb-3">
                  <h2 className="text-sm font-semibold text-kaam-text flex items-center gap-1.5">
                    <TrendingUp className="w-4 h-4 text-olive" />
                    Recommended for You
                  </h2>
                  <button
                    onClick={() => router.navigate({ name: 'search_results', query: '' })}
                    className="text-xs text-olive-deep font-medium flex items-center gap-0.5"
                  >
                    See all <ChevronRight className="w-3 h-3" />
                  </button>
                </div>
                <div className="space-y-2.5">
                  {recommendedJobs.slice(0, 3).map((job) => (
                    <JobCard key={job.id} job={job} />
                  ))}
                </div>
              </section>
            )}

            {/* Nearby */}
            <section>
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-sm font-semibold text-kaam-text flex items-center gap-1.5">
                  <MapPin className="w-4 h-4 text-olive" />
                  Nearby Jobs
                </h2>
                <button
                  onClick={() => router.navigate({ name: 'search_results', query: '' })}
                  className="text-xs text-olive-deep font-medium flex items-center gap-0.5"
                >
                  See all <ChevronRight className="w-3 h-3" />
                </button>
              </div>
              {nearbyJobs.length > 0 ? (
                <div className="space-y-2.5">
                  {nearbyJobs.slice(0, 5).map((job) => (
                    <JobCard key={job.id} job={job} />
                  ))}
                </div>
              ) : (
                <EmptyState
                  icon={<MapPin className="w-8 h-8" />}
                  title="No jobs nearby"
                  description="Try expanding your search distance or check back later."
                />
              )}
            </section>

            {nearbyJobs.length === 0 && instantJobs.length === 0 && recommendedJobs.length === 0 && (
              <EmptyState
                icon={<Briefcase />}
                title="No jobs available yet"
                description="Be the first to see new jobs by checking back soon."
              />
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function Briefcase() {
  return (
    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <rect x="2" y="7" width="20" height="14" rx="2" />
      <path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2" />
    </svg>
  );
}
