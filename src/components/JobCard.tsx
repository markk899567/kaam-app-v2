import { Star, Zap, MapPin, Clock, Users, Briefcase } from 'lucide-react';
import type { NearbyJob, SearchJobResult } from '@/types';
import { formatPayment, formatDistance, workPeriodLabel } from '@/lib/utils';
import { router } from '@/lib/router';

interface JobCardProps {
  job: NearbyJob | SearchJobResult;
  distance?: number;
}

export function JobCard({ job, distance }: JobCardProps) {
  const jobName = 'business_name' in job ? job.business_name : 'Business';
  const jobLogo = 'business_logo' in job ? job.business_logo : null;
  const jobDistance = distance ?? ('distance_km' in job ? job.distance_km : undefined);

  return (
    <div
      onClick={() => router.navigate({ name: 'job_details', jobId: job.id })}
      className="clay-card-interactive p-3.5 cursor-pointer"
    >
      {/* Top row: business + instant badge */}
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-8 h-8 rounded-lg bg-olive-lighter flex items-center justify-center flex-shrink-0">
            <Briefcase className="w-4 h-4 text-olive-deep" />
          </div>
          <span className="text-xs font-medium text-kaam-muted truncate">{jobName}</span>
        </div>
        {job.is_instant && (
          <span className="badge badge-instant flex-shrink-0">
            <Zap className="w-3 h-3" /> Instant
          </span>
        )}
      </div>

      {/* Title */}
      <h3 className="text-sm font-semibold text-kaam-text mb-1.5 line-clamp-1">{job.title}</h3>

      {/* Info row */}
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mb-2">
        <span className="text-sm font-semibold text-olive-deep">
          {formatPayment(job.payment_amount, job.payment_type)}
        </span>
        {job.rating > 0 && (
          <span className="flex items-center gap-0.5 text-xs text-kaam-muted">
            <Star className="w-3 h-3 fill-kaam-warning text-kaam-warning" />
            {job.rating.toFixed(1)}
          </span>
        )}
        <span className="flex items-center gap-0.5 text-xs text-kaam-muted">
          <Users className="w-3 h-3" /> {job.vacancies} {job.vacancies === 1 ? 'opening' : 'openings'}
        </span>
      </div>

      {/* Bottom row: period, timing, distance */}
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-kaam-muted">
        <span className="flex items-center gap-0.5">
          <Clock className="w-3 h-3" /> {workPeriodLabel(job.work_period)}
        </span>
        {job.time_from && (
          <span>{job.time_from}{job.time_to ? `–${job.time_to}` : ''}</span>
        )}
        {jobDistance !== undefined && (
          <span className="flex items-center gap-0.5">
            <MapPin className="w-3 h-3" /> {formatDistance(jobDistance)}
          </span>
        )}
      </div>

      {job.start_date && (
        <p className="text-xs text-kaam-muted mt-1.5">
          Starts {new Date(job.start_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
        </p>
      )}
    </div>
  );
}
