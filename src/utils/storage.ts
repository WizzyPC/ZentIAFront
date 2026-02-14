import { ChatSession, ChatMode } from '../types/chat';

const SETTINGS_KEY = 'zentia:settings';

const userChatsKey = (userId: string) => `zentia:chats:${userId}`;
const userActiveChatKey = (userId: string) => `zentia:active-chat:${userId}`;

export function saveLocalChats(userId: string, chats: ChatSession[]): void {
  localStorage.setItem(userChatsKey(userId), JSON.stringify(chats));
}

export function getLocalChats(userId: string): ChatSession[] {
  const raw = localStorage.getItem(userChatsKey(userId));
  return raw ? (JSON.parse(raw) as ChatSession[]) : [];
}

export function saveLocalActiveChat(userId: string, chatId: string): void {
  localStorage.setItem(userActiveChatKey(userId), chatId);
}

export function getLocalActiveChat(userId: string): string | null {
  return localStorage.getItem(userActiveChatKey(userId));
}

export interface UserSettings {
  preferredMode: ChatMode;
}

export function getUserSettings(): UserSettings {
  const raw = localStorage.getItem(SETTINGS_KEY);
  if (!raw) {
    return { preferredMode: 'balanced' };
  }

  return JSON.parse(raw) as UserSettings;
}

export function saveUserSettings(settings: UserSettings): void {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
}
