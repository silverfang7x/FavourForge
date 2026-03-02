import type { RealtimeChannel } from '@supabase/supabase-js';

import { supabase } from '@services/SupabaseClient';
import type { ChatMessageModel } from '@models/ChatMessageModel';

export type NewMessageHandler = (message: ChatMessageModel) => void;

export async function sendMessage(params: {
  beaconId: string;
  senderId: string;
  content: string;
}): Promise<void> {
  const content = params.content.trim();
  if (!content) {
    throw new Error('Message cannot be empty');
  }

  const { error } = await supabase.from('chat_messages').insert({
    beacon_id: params.beaconId,
    sender_id: params.senderId,
    content,
  });

  if (error) {
    throw new Error(error.message);
  }
}

export async function listMessages(params: {
  beaconId: string;
  limit?: number;
}): Promise<ChatMessageModel[]> {
  const limit = params.limit ?? 50;
  const { data, error } = await supabase
    .from('chat_messages')
    .select('*')
    .eq('beacon_id', params.beaconId)
    .order('sent_at', { ascending: true })
    .limit(limit);

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []) as ChatMessageModel[];
}

export function subscribeToMessages(params: {
  beaconId: string;
  onNewMessage: NewMessageHandler;
}): { channel: RealtimeChannel; unsubscribe: () => void } {
  const channel = supabase
    .channel(`beacon:${params.beaconId}:chat_messages`)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'chat_messages',
        filter: `beacon_id=eq.${params.beaconId}`,
      },
      (payload) => {
        params.onNewMessage(payload.new as ChatMessageModel);
      },
    )
    .subscribe();

  return {
    channel,
    unsubscribe: () => {
      supabase.removeChannel(channel);
    },
  };
}
