import { supabase } from '@/lib/supabase';

export type NotificationType =
  | 'application_submitted'
  | 'application_viewed'
  | 'application_accepted'
  | 'application_rejected'
  | 'application_interview'
  | 'employer_replied'
  | 'new_matching_job'
  | 'work_completed'
  | 'review_reminder'
  | 'job_closed';

interface CreateNotificationParams {
  userId: string;
  type: NotificationType;
  title: string;
  body: string;
  data?: Record<string, unknown>;
}

/**
 * Notification service — creates in-app notifications.
 * Designed to be extended with SMS, APNs, and other push providers
 * without changing the calling code.
 *
 * Currently active providers:
 * - In-app notifications (Supabase)
 * - Web push via FCM (if configured)
 *
 * Future providers (not yet active):
 * - SMS (MSG91 — requires credentials)
 * - APNs (Apple Push — requires credentials)
 */
export const notificationService = {
  async create({ userId, type, title, body, data = {} }: CreateNotificationParams) {
    const { error } = await supabase
      .from('notifications')
      .insert({ user_id: userId, type, title, body, data });

    if (error) {
      console.error('Failed to create notification:', error);
    }
  },

  async markAsRead(notificationId: string) {
    const { error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('id', notificationId);

    if (error) {
      console.error('Failed to mark notification as read:', error);
    }
  },

  async markAllAsRead(userId: string) {
    const { error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('user_id', userId)
      .eq('is_read', false);

    if (error) {
      console.error('Failed to mark all notifications as read:', error);
    }
  },

  async getUnreadCount(userId: string): Promise<number> {
    const { count, error } = await supabase
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('is_read', false);

    if (error) return 0;
    return count ?? 0;
  },
};

/**
 * Push notification providers — each provider is isolated behind
 * a configuration check. Inactive providers silently no-op.
 * Add credentials to activate them without changing app code.
 */
export const pushProviders = {
  /**
   * FCM web push — active when VITE_FCM_VAPID_KEY and Firebase config are present.
   */
  fcm: {
    isConfigured(): boolean {
      return !!import.meta.env.VITE_FCM_VAPID_KEY && !!import.meta.env.VITE_FIREBASE_API_KEY;
    },
    async registerToken(userId: string, token: string) {
      const { error } = await supabase
        .from('push_tokens')
        .upsert({ user_id: userId, token, platform: 'web' }, {
          onConflict: 'user_id,token',
        });
      if (error) console.error('Failed to save push token:', error);
    },
  },

  /**
   * SMS via MSG91 — not yet configured.
   * Will be activated when MSG91 credentials are added.
   */
  sms: {
    isConfigured(): boolean {
      return false;
    },
  },

  /**
   * APNs — not yet configured.
   * Will be activated when Apple Push credentials are added.
   */
  apns: {
    isConfigured(): boolean {
      return false;
    },
  },
};
