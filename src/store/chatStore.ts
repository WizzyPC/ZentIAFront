import { create } from 'zustand';
import { ChatSession, Message, User } from '../types/chat';
import {
  clearUser,
  getActiveChat,
  getChats,
  getUser,
  saveActiveChat,
  saveChats,
  saveUser,
} from '../utils/storage';

interface ChatState {
  user: User | null;
  chats: ChatSession[];
  activeChatId: string | null;
  isTyping: boolean;
  setTyping: (isTyping: boolean) => void;
  login: (user: User) => void;
  logout: () => void;
  createChat: () => string;
  setActiveChat: (chatId: string) => void;
  addMessage: (chatId: string, message: Message) => void;
  updateChatTitle: (chatId: string, title: string) => void;
}

const makeNewChat = (): ChatSession => {
  const now = new Date().toISOString();
  return {
    id: crypto.randomUUID(),
    title: 'Novo Chat',
    createdAt: now,
    updatedAt: now,
    messages: [],
  };
};

const existingChats = getChats();
const initialChats = existingChats.length > 0 ? existingChats : [makeNewChat()];
const initialActive = getActiveChat() ?? initialChats[0]?.id ?? null;

export const useChatStore = create<ChatState>((set, get) => ({
  user: getUser(),
  chats: initialChats,
  activeChatId: initialActive,
  isTyping: false,
  setTyping: (isTyping) => set({ isTyping }),
  login: (user) => {
    saveUser(user);
    set({ user });
  },
  logout: () => {
    clearUser();
    set({ user: null });
  },
  createChat: () => {
    const next = makeNewChat();
    const chats = [next, ...get().chats];
    saveChats(chats);
    saveActiveChat(next.id);
    set({ chats, activeChatId: next.id });
    return next.id;
  },
  setActiveChat: (chatId) => {
    saveActiveChat(chatId);
    set({ activeChatId: chatId });
  },
  addMessage: (chatId, message) => {
    const chats = get().chats.map((chat) => {
      if (chat.id !== chatId) return chat;
      const title =
        chat.title === 'Novo Chat' && message.sender === 'user'
          ? message.content.slice(0, 36)
          : chat.title;

      return {
        ...chat,
        title,
        updatedAt: new Date().toISOString(),
        messages: [...chat.messages, message],
      };
    });

    saveChats(chats);
    set({ chats });
  },
  updateChatTitle: (chatId, title) => {
    const chats = get().chats.map((chat) =>
      chat.id === chatId ? { ...chat, title, updatedAt: new Date().toISOString() } : chat,
    );
    saveChats(chats);
    set({ chats });
  },
}));
