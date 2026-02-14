import { ChatSession } from '../types/chat';

const SETTINGS_KEY = 'zentia:settings';

const userChatsKey = (userId: string) => `zentia:chats:${userId}`;
const userActiveChatKey = (userId: string) => `zentia:active-chat:${userId}`;

export function saveLocalChats(userId: string, chats: ChatSession[]) {
  localStorage.setItem(userChatsKey(userId), JSON.stringify(chats));
}

export function getLocalChats(userId: string): ChatSession[] {
  const raw = localStorage.getItem(userChatsKey(userId));
  return raw ? (JSON.parse(raw) as ChatSession[]) : [];
}

export function saveLocalActiveChat(userId: string, chatId: string) {
  localStorage.setItem(userActiveChatKey(userId), chatId);
}

export function getLocalActiveChat(userId: string) {
  return localStorage.getItem(userActiveChatKey(userId));
}

export interface UserSettings {
  preferredMode: 'balanced' | 'fast' | 'creative';
}

export function getUserSettings(): UserSettings {
  const raw = localStorage.getItem(SETTINGS_KEY);
  return raw ? (JSON.parse(raw) as UserSettings) : { preferredMode: 'balanced' };
}

export function saveUserSettings(settings: UserSettings) {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
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
