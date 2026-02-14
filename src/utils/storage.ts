import { ChatSession, User } from '../types/chat';

const USER_KEY = 'zentia:user';
const CHATS_KEY = 'zentia:chats';
const ACTIVE_CHAT_KEY = 'zentia:active-chat';

export function saveUser(user: User) {
  localStorage.setItem(USER_KEY, JSON.stringify(user));
}

export function getUser(): User | null {
  const raw = localStorage.getItem(USER_KEY);
  if (!raw) return null;
  return JSON.parse(raw) as User;
}

export function clearUser() {
  localStorage.removeItem(USER_KEY);
}

export function saveChats(chats: ChatSession[]) {
  localStorage.setItem(CHATS_KEY, JSON.stringify(chats));
}

export function getChats(): ChatSession[] {
  const raw = localStorage.getItem(CHATS_KEY);
  if (!raw) return [];
  return JSON.parse(raw) as ChatSession[];
}

export function saveActiveChat(chatId: string) {
  localStorage.setItem(ACTIVE_CHAT_KEY, chatId);
}

export function getActiveChat() {
  return localStorage.getItem(ACTIVE_CHAT_KEY);
}
