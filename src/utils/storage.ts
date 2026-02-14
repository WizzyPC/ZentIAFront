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
}
