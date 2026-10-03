import { useEffect, useState, useCallback } from 'react';
import { Search as SearchIcon, SlidersHorizontal, X, ChevronLeft } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { router } from '@/lib/router';
import { JobCard } from '@/components/JobCard';
import { Loading, EmptyState, ErrorState } from '@/components/States';
import type { SearchJobResult } from '@/types';

const CATEGORIES = ['Construction', 'Cleaning', 'Delivery', 'Cooking', 'Security', 'Driving', 'Retail', 'Electrician', 'Plumbing', 'Painting'];
const WORK_PERIODS = [
  { value: 'full_time', label: 'Full Time' },
  { value: 'part_time', label: 'Part Time' },
  { value: 'one_time', label: 'One Time' },
];
const PAYMENT_TYPES = [
  { value: 'per_hour', label: 'Per Hour' },
  { value: 'per_day', label: 'Per Day' },
  { value: 'per_week', label: 'Per Week' },
  { value: 'per_month', label: 'Per Month' },
  { value: 'fixed', label: 'Fixed' },
  { value: 'negotiable', label: 'Negotiable' },
];

interface SearchFilters {
  category: string | null;
  work_period: string | null;
  is_instant: boolean | null;
  payment_min: number | null;
  payment_max: number | null;
}

export function SearchScreen() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchJobResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<SearchFilters>({
    category: null,
    work_period: null,
    is_instant: null,
    payment_min: null,
    payment_max: null,
  });
  const [offset, setOffset] = useState(0);
  const [hasMore, setHasMore] = useState(true);

  const search = useCallback(async (resetOffset = true) => {
    setLoading(true);
    setError(null);
    const newOffset = resetOffset ? 0 : offset;
    
    const { data, error } = await supabase.rpc('search_jobs', {
      p_query: query.trim(),
      p_category: filters.category,
      p_work_period: filters.work_period,
      p_is_instant: filters.is_instant,
      p_payment_min: filters.payment_min,
      p_payment_max: filters.payment_max,
      p_limit: 15,
      p_offset: newOffset,
    });

    if (error) {
      setError(error.message);
      setResults([]);
    } else {
      const jobs = (data as SearchJobResult[]) ?? [];
      if (resetOffset) {
        setResults(jobs);
      } else {
        setResults(prev => [...prev, ...jobs]);
      }
      setHasMore(jobs.length === 15);
    }
    setLoading(false);
  }, [query, filters, offset]);

  useEffect(() => {
    const timeout = setTimeout(() => search(true), 300);
    return () => clearTimeout(timeout);
  }, [search]);

  const activeFilterCount = [
    filters.category,
    filters.work_period,
    filters.is_instant !== null ? 'instant' : null,
    filters.payment_min,
    filters.payment_max,
  ].filter(Boolean).length;

  return (
    <div className="min-h-screen bg-cream pb-20">
      {/* Search bar */}
      <div className="sticky top-0 z-30 bg-cream-white border-b border-olive-light/20">
        <div className="flex items-center gap-2 px-4 h-14">
          <button onClick={() => router.goBack()} className="flex-shrink-0">
            <ChevronLeft className="w-5 h-5 text-kaam-text" />
          </button>
          <div className="flex-1 relative">
            <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-kaam-muted" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search jobs, skills, places..."
              className="w-full pl-9 pr-3 py-2 text-sm bg-olive-lighter/30 rounded-lg border border-olive-light/30 focus:border-olive outline-none"
              autoFocus
            />
          </div>
          <button
            onClick={() => setShowFilters(true)}
            className="flex-shrink-0 w-9 h-9 flex items-center justify-center rounded-lg hover:bg-olive-lighter/50 relative"
            aria-label="Filters"
          >
            <SlidersHorizontal className="w-4 h-4 text-kaam-text" />
            {activeFilterCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-olive text-cream-white text-[10px] font-bold rounded-full flex items-center justify-center">
                {activeFilterCount}
              </span>
            )}
          </button>
        </div>
      </div>

      <div className="max-w-md mx-auto px-4 pt-4">
        {error ? (
          <ErrorState message={error} onRetry={() => search(true)} />
        ) : loading && results.length === 0 ? (
          <Loading message="Searching jobs..." />
        ) : results.length === 0 ? (
          <EmptyState
            icon={<SearchIcon className="w-8 h-8" />}
            title="No jobs found"
            description="Try different keywords or adjust your filters."
          />
        ) : (
          <>
            <p className="text-xs text-kaam-muted mb-3">
              {results.length} job{results.length !== 1 ? 's' : ''} found
            </p>
            <div className="space-y-2.5">
              {results.map((job) => (
                <JobCard key={job.id} job={job} />
              ))}
            </div>
            {hasMore && !loading && (
              <button
                onClick={() => { setOffset(prev => prev + 15); search(false); }}
                className="btn-secondary w-full mt-4"
              >
                Load More
              </button>
            )}
            {loading && results.length > 0 && (
              <p className="text-center text-xs text-kaam-muted py-4">Loading more...</p>
            )}
          </>
        )}
      </div>

      {/* Filters bottom sheet */}
      {showFilters && (
        <FilterSheet
          filters={filters}
          setFilters={setFilters}
          onClose={() => setShowFilters(false)}
          onApply={() => { setShowFilters(false); search(true); }}
          onClear={() => {
            setFilters({
              category: null,
              work_period: null,
              is_instant: null,
              payment_min: null,
              payment_max: null,
            });
          }}
        />
      )}
    </div>
  );
}

interface FilterSheetProps {
  filters: SearchFilters;
  setFilters: (f: SearchFilters) => void;
  onClose: () => void;
  onApply: () => void;
  onClear: () => void;
}

function FilterSheet({ filters, setFilters, onClose, onApply, onClear }: FilterSheetProps) {
  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end">
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />
      <div className="relative bg-cream-white rounded-t-2xl max-h-[85vh] overflow-y-auto animate-slide-up">
        <div className="sticky top-0 bg-cream-white border-b border-olive-light/20 px-4 py-3 flex items-center justify-between">
          <h2 className="text-base font-semibold text-kaam-text">Filters</h2>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-lg">
            <X className="w-5 h-5 text-kaam-muted" />
          </button>
        </div>

        <div className="px-4 py-4 space-y-5">
          {/* Category */}
          <div>
            <label className="block text-xs font-medium text-kaam-muted mb-2">Category</label>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setFilters({ ...filters, category: null })}
                className={`px-3 py-1.5 rounded-full text-xs font-medium border ${
                  !filters.category ? 'bg-olive text-cream-white border-olive' : 'bg-cream-white text-kaam-text border-olive-light/30'
                }`}
              >
                All
              </button>
              {CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setFilters({ ...filters, category: cat })}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium border ${
                    filters.category === cat ? 'bg-olive text-cream-white border-olive' : 'bg-cream-white text-kaam-text border-olive-light/30'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Work Period */}
          <div>
            <label className="block text-xs font-medium text-kaam-muted mb-2">Work Type</label>
            <div className="grid grid-cols-3 gap-2">
              {WORK_PERIODS.map((wp) => (
                <button
                  key={wp.value}
                  onClick={() => setFilters({ ...filters, work_period: filters.work_period === wp.value ? null : wp.value })}
                  className={`px-3 py-2 rounded-lg text-xs font-medium border ${
                    filters.work_period === wp.value ? 'bg-olive text-cream-white border-olive' : 'bg-cream-white text-kaam-text border-olive-light/30'
                  }`}
                >
                  {wp.label}
                </button>
              ))}
            </div>
          </div>

          {/* Instant */}
          <div>
            <label className="block text-xs font-medium text-kaam-muted mb-2">Instant Jobs</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => setFilters({ ...filters, is_instant: filters.is_instant === true ? null : true })}
                className={`px-3 py-2 rounded-lg text-xs font-medium border ${
                  filters.is_instant === true ? 'bg-olive text-cream-white border-olive' : 'bg-cream-white text-kaam-text border-olive-light/30'
                }`}
              >
                Instant Only
              </button>
              <button
                onClick={() => setFilters({ ...filters, is_instant: false })}
                className={`px-3 py-2 rounded-lg text-xs font-medium border ${
                  filters.is_instant === false ? 'bg-olive text-cream-white border-olive' : 'bg-cream-white text-kaam-text border-olive-light/30'
                }`}
              >
                Regular Only
              </button>
            </div>
          </div>

          {/* Payment range */}
          <div>
            <label className="block text-xs font-medium text-kaam-muted mb-2">Payment Range</label>
            <div className="grid grid-cols-2 gap-3">
              <input
                type="number"
                placeholder="Min"
                value={filters.payment_min ?? ''}
                onChange={(e) => setFilters({ ...filters, payment_min: e.target.value ? Number(e.target.value) : null })}
                className="input-field text-sm"
              />
              <input
                type="number"
                placeholder="Max"
                value={filters.payment_max ?? ''}
                onChange={(e) => setFilters({ ...filters, payment_max: e.target.value ? Number(e.target.value) : null })}
                className="input-field text-sm"
              />
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <button onClick={onClear} className="btn-secondary flex-1">Clear All</button>
            <button onClick={onApply} className="btn-primary flex-1">Apply Filters</button>
          </div>
        </div>
      </div>
    </div>
  );
}
