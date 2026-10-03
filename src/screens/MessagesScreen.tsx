import { useEffect, useState, useCallback, useRef } from 'react';
import { Send, ChevronLeft, MessageSquare } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { router } from '@/lib/router';
import { useAuth } from '@/context/AuthContext';
import { Header } from '@/components/Header';
import { Loading, EmptyState } from '@/components/States';
import { initials, timeAgo, formatDate } from '@/lib/utils';
import type { Conversation, Message, Profile } from '@/types';

export function MessagesScreen() {
  const { user } = useAuth();
  const [conversations, setConversations] = useState<{ conv: Conversation; other: Profile | null; lastMsg: Message | null }[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!user) return;
    setLoading(true);

    // Get conversations where user is a participant
    const { data: parts } = await supabase
      .from('conversation_participants')
      .select('conversation_id')
      .eq('user_id', user.id);

    const convIds = (parts ?? []).map((p: { conversation_id: string }) => p.conversation_id);
    if (convIds.length === 0) {
      setConversations([]);
      setLoading(false);
      return;
    }

    const { data: convs } = await supabase
      .from('conversations')
      .select('*')
      .in('id', convIds)
      .order('updated_at', { ascending: false });

    const result: { conv: Conversation; other: Profile | null; lastMsg: Message | null }[] = [];

    for (const conv of (convs as Conversation[]) ?? []) {
      // Get other participant
      const { data: otherParts } = await supabase
        .from('conversation_participants')
        .select('user_id')
        .eq('conversation_id', conv.id)
        .neq('user_id', user.id);

      let otherProfile: Profile | null = null;
      if (otherParts && otherParts.length > 0) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', (otherParts[0] as { user_id: string }).user_id)
          .maybeSingle();
        otherProfile = profile as Profile | null;
      }

      // Get last message
      const { data: msgs } = await supabase
        .from('messages')
        .select('*')
        .eq('conversation_id', conv.id)
        .order('created_at', { ascending: false })
        .limit(1);

      result.push({ conv, other: otherProfile, lastMsg: (msgs?.[0] as Message) ?? null });
    }

    setConversations(result);
    setLoading(false);
  }, [user]);

  useEffect(() => { load(); }, [load]);

  // Realtime subscription
  useEffect(() => {
    if (!user) return;
    const channel = supabase
      .channel('conversations_list')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'messages' }, () => {
        load();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'conversations' }, () => {
        load();
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [user, load]);

  return (
    <div className="min-h-screen bg-cream pb-20">
      <Header title="Messages" />
      <div className="max-w-md mx-auto pt-2">
        {loading ? (
          <Loading message="Loading conversations..." />
        ) : conversations.length === 0 ? (
          <EmptyState
            icon={<MessageSquare className="w-8 h-8" />}
            title="No conversations yet"
            description="Messages with employers and workers will appear here."
          />
        ) : (
          <div className="divide-y divide-olive-light/15">
            {conversations.map(({ conv, other, lastMsg }) => (
              <button
                key={conv.id}
                onClick={() => router.navigate({
                  name: 'conversation',
                  conversationId: conv.id,
                  otherUserId: other?.id,
                  jobId: conv.job_id ?? undefined,
                  applicationId: conv.application_id ?? undefined,
                })}
                className="w-full flex items-center gap-3 px-4 py-3 hover:bg-olive-lighter/20 transition-colors text-left"
              >
                <div className="w-11 h-11 rounded-full bg-olive flex items-center justify-center text-sm font-semibold text-cream-white flex-shrink-0">
                  {initials(other?.name ?? '?')}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-semibold text-kaam-text truncate">{other?.name ?? 'Unknown'}</p>
                    {lastMsg && <span className="text-xs text-kaam-muted flex-shrink-0">{timeAgo(lastMsg.created_at)}</span>}
                  </div>
                  <p className="text-xs text-kaam-muted truncate">
                    {lastMsg?.body ?? 'No messages yet'}
                  </p>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export function ConversationScreen({ conversationId, otherUserId }: { conversationId: string; otherUserId?: string }) {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [otherProfile, setOtherProfile] = useState<Profile | null>(null);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  const load = useCallback(async () => {
    setLoading(true);

    // Load messages
    const { data: msgs } = await supabase
      .from('messages')
      .select('*')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true });
    setMessages((msgs as Message[]) ?? []);

    // Load other user profile
    if (otherUserId) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', otherUserId)
        .maybeSingle();
      setOtherProfile(profile as Profile | null);
    }

    setLoading(false);
  }, [conversationId, otherUserId]);

  useEffect(() => {
    load();
  }, [load]);

  // Realtime subscription for new messages
  useEffect(() => {
    const channel = supabase
      .channel(`conv_${conversationId}`)
      .on('postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages', filter: `conversation_id=eq.${conversationId}` },
        (payload) => {
          setMessages(prev => {
            const newMsg = payload.new as Message;
            if (prev.some(m => m.id === newMsg.id)) return prev;
            return [...prev, newMsg];
          });
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [conversationId]);

  // Auto-scroll to bottom
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Mark messages as read
  useEffect(() => {
    if (!user) return;
    supabase
      .from('messages')
      .update({ read_at: new Date().toISOString() })
      .eq('conversation_id', conversationId)
      .neq('sender_id', user.id)
      .is('read_at', null);
  }, [conversationId, user, messages.length]);

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    if (!input.trim() || !user || sending) return;
    setSending(true);
    const body = input.trim();
    setInput('');

    const { data } = await supabase
      .from('messages')
      .insert({
        conversation_id: conversationId,
        sender_id: user.id,
        body,
      })
      .select()
      .single();

    if (data) {
      setMessages(prev => [...prev, data as Message]);
      // Update conversation updated_at
      await supabase.from('conversations').update({ updated_at: new Date().toISOString() }).eq('id', conversationId);

      // Notify other user
      if (otherUserId) {
        const { notificationService } = await import('@/lib/notifications');
        await notificationService.create({
          userId: otherUserId,
          type: 'employer_replied',
          title: 'New Message',
          body: body.length > 50 ? body.slice(0, 50) + '...' : body,
          data: { conversation_id: conversationId },
        });
      }
    }
    setSending(false);
  }

  return (
    <div className="min-h-screen bg-cream flex flex-col" style={{ height: '100vh' }}>
      {/* Header */}
      <header className="sticky top-0 z-30 bg-cream-white/95 backdrop-blur-sm border-b border-olive-light/20 flex-shrink-0">
        <div className="flex items-center gap-3 px-4 h-14">
          <button onClick={() => router.goBack()} className="flex-shrink-0">
            <ChevronLeft className="w-5 h-5 text-kaam-text" />
          </button>
          <div className="w-9 h-9 rounded-full bg-olive flex items-center justify-center text-xs font-semibold text-cream-white flex-shrink-0">
            {initials(otherProfile?.name ?? '?')}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-kaam-text truncate">{otherProfile?.name ?? 'Conversation'}</p>
            <p className="text-xs text-kaam-muted">{otherProfile?.verification_status === 'verified' ? 'Verified' : 'Unverified'}</p>
          </div>
        </div>
      </header>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 max-w-md mx-auto w-full">
        {loading ? (
          <Loading message="Loading messages..." />
        ) : messages.length === 0 ? (
          <EmptyState icon={<MessageSquare className="w-8 h-8" />} title="No messages yet" description="Start the conversation by sending a message." />
        ) : (
          <div className="space-y-2">
            {messages.map((msg) => {
              const isMine = msg.sender_id === user?.id;
              return (
                <div key={msg.id} className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
                  <div
                    className={`max-w-[75%] rounded-2xl px-3.5 py-2 ${
                      isMine
                        ? 'bg-olive text-cream-white rounded-br-md'
                        : 'bg-cream-white text-kaam-text rounded-bl-md border border-olive-light/20'
                    }`}
                  >
                    <p className="text-sm whitespace-pre-wrap break-words">{msg.body}</p>
                    <p className={`text-[10px] mt-0.5 ${isMine ? 'text-cream-white/60' : 'text-kaam-muted'}`}>
                      {formatDate(msg.created_at)}
                    </p>
                  </div>
                </div>
              );
            })}
            <div ref={bottomRef} />
          </div>
        )}
      </div>

      {/* Input */}
      <div className="flex-shrink-0 bg-cream-white border-t border-olive-light/20 px-4 py-3 pb-safe">
        <form onSubmit={handleSend} className="flex items-center gap-2 max-w-md mx-auto">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type a message..."
            className="flex-1 input-field text-sm"
            disabled={sending}
          />
          <button
            type="submit"
            disabled={!input.trim() || sending}
            className="w-11 h-11 rounded-xl bg-olive flex items-center justify-center flex-shrink-0 disabled:opacity-40"
            aria-label="Send"
          >
            <Send className="w-4 h-4 text-cream-white" />
          </button>
        </form>
      </div>
    </div>
  );
}
