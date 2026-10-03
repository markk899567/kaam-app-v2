import { useEffect, useState, useCallback } from 'react';
import { Bell, CheckCircle2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { router } from '@/lib/router';
import { useAuth } from '@/context/AuthContext';
import { Header } from '@/components/Header';
import { Loading, EmptyState } from '@/components/States';
import { timeAgo } from '@/lib/utils';
import { notificationService } from '@/lib/notifications';
import type { Notification } from '@/types';

export function NotificationsScreen() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const { data } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(50);
    setNotifications((data as Notification[]) ?? []);
    setLoading(false);
  }, [user]);

  useEffect(() => { load(); }, [load]);

  // Realtime
  useEffect(() => {
    if (!user) return;
    const channel = supabase
      .channel('notifications_realtime')
      .on('postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'notifications', filter: `user_id=eq.${user.id}` },
        () => { load(); }
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [user, load]);

  async function handleNotificationTap(n: Notification) {
    if (!n.is_read) {
      await notificationService.markAsRead(n.id);
    }
    const data = n.data as Record<string, string>;
    switch (n.type) {
      case 'application_submitted':
      case 'application_viewed':
      case 'application_accepted':
      case 'application_rejected':
      case 'application_interview':
        if (data.application_id) router.navigate({ name: 'application_detail', applicationId: data.application_id });
        break;
      case 'employer_replied':
        if (data.conversation_id) router.navigate({ name: 'conversation', conversationId: data.conversation_id });
        break;
      case 'new_matching_job':
        if (data.job_id) router.navigate({ name: 'job_details', jobId: data.job_id });
        break;
      case 'work_completed':
        if (data.active_work_id) router.navigate({ name: 'active_work_detail', workId: data.active_work_id });
        break;
      default:
        break;
    }
    load();
  }

  async function handleMarkAllRead() {
    if (!user) return;
    await notificationService.markAllAsRead(user.id);
    load();
  }

  return (
    <div className="min-h-screen bg-cream pb-20">
      <Header
        title="Notifications"
        onBack={() => router.goBack()}
        right={
          notifications.some(n => !n.is_read) ? (
            <button onClick={handleMarkAllRead} className="text-xs text-olive-deep font-medium px-2">
              Mark all read
            </button>
          ) : undefined
        }
      />
      <div className="max-w-md mx-auto pt-2">
        {loading ? <Loading message="Loading notifications..." /> :
        notifications.length === 0 ? (
          <EmptyState icon={<Bell className="w-8 h-8" />} title="No notifications" description="You'll be notified about applications, messages, and job updates here." />
        ) : (
          <div className="divide-y divide-olive-light/15">
            {notifications.map(n => (
              <button
                key={n.id}
                onClick={() => handleNotificationTap(n)}
                className={`w-full flex items-start gap-3 px-4 py-3 text-left transition-colors ${!n.is_read ? 'bg-olive-lighter/20' : ''}`}
              >
                <div className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 ${!n.is_read ? 'bg-olive' : 'bg-olive-lighter'}`}>
                  <Bell className={`w-4 h-4 ${!n.is_read ? 'text-cream-white' : 'text-kaam-muted'}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <p className={`text-sm ${!n.is_read ? 'font-semibold text-kaam-text' : 'font-medium text-kaam-text'}`}>{n.title}</p>
                    {!n.is_read && <span className="w-2 h-2 bg-olive rounded-full flex-shrink-0" />}
                  </div>
                  <p className="text-xs text-kaam-muted mt-0.5 line-clamp-2">{n.body}</p>
                  <p className="text-xs text-kaam-muted mt-1">{timeAgo(n.created_at)}</p>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
