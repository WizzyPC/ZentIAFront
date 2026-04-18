import { supabase } from './supabaseClient';
import { ChatSession } from '../types/chat';
import { getLocalChats, saveLocalChats } from '../utils/storage';

const TABLE_NAME = 'chat_sessions';

export async function loadUserChats(userId: string): Promise<ChatSession[]> {
  const local = getLocalChats(userId);

  const { data, error } = await supabase
    .from(TABLE_NAME)
    .select('id,user_id,backend_chat_id,title,created_at,updated_at,mode,messages,generations')
    .eq('user_id', userId)
    .order('updated_at', { ascending: false });

  if (error || !data) {
    return local;
  }

  const normalized: ChatSession[] = data.map((row) => ({
    id: row.id,
    backendChatId: row.backend_chat_id ?? undefined,
    userId: row.user_id,
    title: row.title,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    mode: (row.mode as ChatSession['mode']) ?? 'balanced',
    messages: Array.isArray(row.messages) ? row.messages : [],
    generations: Array.isArray(row.generations) ? row.generations : [],
  }));

  saveLocalChats(userId, normalized);
  return normalized;
}

export async function persistChats(userId: string, chats: ChatSession[]) {
  saveLocalChats(userId, chats);

  const payload = chats.map((chat) => ({
    id: chat.id,
    backend_chat_id: chat.backendChatId ?? null,
    user_id: userId,
    title: chat.title,
    created_at: chat.createdAt,
    updated_at: chat.updatedAt,
    mode: chat.mode,
    messages: chat.messages,
    generations: chat.generations ?? [],
  }));

  const { error } = await supabase.from(TABLE_NAME).upsert(payload, { onConflict: 'id' });
  if (error) {
    // eslint-disable-next-line no-console
    console.warn('Could not persist chats to Supabase. Using local fallback.', error.message);
  }
}
