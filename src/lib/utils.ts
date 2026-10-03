/**
 * Utility functions for the Kaam application.
 */

export function formatPayment(amount: number | null, type: string): string {
  if (amount === null || amount === undefined) {
    return type === 'negotiable' ? 'Negotiable' : '—';
  }
  const formatted = new Intl.NumberFormat('en-IN', {
    maximumFractionDigits: 0,
  }).format(amount);

  const labels: Record<string, string> = {
    per_hour: `${formatted}/hr`,
    per_day: `${formatted}/day`,
    per_week: `${formatted}/week`,
    per_month: `${formatted}/mo`,
    fixed: formatted,
    negotiable: 'Negotiable',
  };
  return labels[type] ?? formatted;
}

export function formatDistance(km: number): string {
  if (km < 1) return `${Math.round(km * 1000)} m`;
  return `${km} km`;
}

export function workPeriodLabel(period: string): string {
  const labels: Record<string, string> = {
    full_time: 'Full Time',
    part_time: 'Part Time',
    one_time: 'One Time',
  };
  return labels[period] ?? period;
}

export function applicationStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    under_review: 'Under Review',
    interview: 'Interview / Discussion',
    accepted: 'Accepted',
    rejected: 'Rejected',
    job_closed: 'Job Closed',
  };
  return labels[status] ?? status;
}

export function applicationStatusColor(status: string): string {
  const colors: Record<string, string> = {
    under_review: 'text-kaam-warning bg-kaam-warning/10',
    interview: 'text-olive-deep bg-olive/10',
    accepted: 'text-kaam-success bg-kaam-success/10',
    rejected: 'text-red-600 bg-red-50',
    job_closed: 'text-kaam-muted bg-kaam-muted/10',
  };
  return colors[status] ?? 'text-kaam-muted bg-kaam-muted/10';
}

export function formatDate(date: string | null): string {
  if (!date) return 'Flexible';
  const d = new Date(date);
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

export function formatTime(time: string | null): string {
  if (!time) return '';
  return time;
}

export function formatDateTime(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}

export function initials(name: string): string {
  if (!name) return '?';
  const parts = name.trim().split(' ');
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return name.slice(0, 2).toUpperCase();
}

export function timeAgo(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;
  return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
}
