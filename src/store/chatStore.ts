import { create } from 'zustand';
import { ChatSession, Feedback, Message } from '../types/chat';
import { getLocalActiveChat, saveLocalActiveChat } from '../utils/storage';
import { loadUserChats, persistChats } from '../services/chatRepository';

interface ChatState {
  chats: ChatSession[];
  activeChatId: string | null;
  isTyping: boolean;
  isSubmitting: boolean;
  setTyping: (isTyping: boolean) => void;
  setSubmitting: (isSubmitting: boolean) => void;
  bootstrapUserChats: (userId: string, mode: ChatSession['mode']) => Promise<void>;
  createChat: (userId: string, mode: ChatSession['mode']) => Promise<string>;
  setActiveChat: (userId: string, chatId: string) => void;
  addMessage: (userId: string, chatId: string, message: Message) => Promise<void>;
  updateLastAssistantMessage: (userId: string, chatId: string, content: string, model?: string) => Promise<void>;
  setMessageFeedback: (userId: string, chatId: string, messageId: string, feedback: Feedback) => Promise<void>;
}

const makeNewChat = (userId: string, mode: ChatSession['mode']): ChatSession => {
  const now = new Date().toISOString();
  return {
    id: crypto.randomUUID(),
    userId,
    title: 'Novo Chat',
    mode,
    createdAt: now,
    updatedAt: now,
    messages: [],
  };
};

const persist = async (userId: string, chats: ChatSession[]) => persistChats(userId, chats);

export const useChatStore = create<ChatState>((set, get) => ({
  chats: [],
  activeChatId: null,
  isTyping: false,
  isSubmitting: false,
  setTyping: (isTyping) => set({ isTyping }),
  setSubmitting: (isSubmitting) => set({ isSubmitting }),
  bootstrapUserChats: async (userId, mode) => {
    const loadedChats = await loadUserChats(userId);
    const chats = loadedChats.length > 0 ? loadedChats : [makeNewChat(userId, mode)];
    const activeChatId = getLocalActiveChat(userId) ?? chats[0].id;
    set({ chats, activeChatId });
  },
  createChat: async (userId, mode) => {
    const next = makeNewChat(userId, mode);
    const chats = [next, ...get().chats];
    saveLocalActiveChat(userId, next.id);
    set({ chats, activeChatId: next.id });
    await persist(userId, chats);
    return next.id;
  },
  setActiveChat: (userId, chatId) => {
    saveLocalActiveChat(userId, chatId);
    set({ activeChatId: chatId });
  },
  addMessage: async (userId, chatId, message) => {
    const chats = get().chats.map((chat) => {
      if (chat.id !== chatId) return chat;
      const title =
        chat.title === 'Novo Chat' && message.sender === 'user' ? message.content.slice(0, 50) : chat.title;
      return { ...chat, title, updatedAt: new Date().toISOString(), messages: [...chat.messages, message] };
    });
    set({ chats });
    await persist(userId, chats);
  },
  updateLastAssistantMessage: async (userId, chatId, content, model) => {
    const chats = get().chats.map((chat) => {
      if (chat.id !== chatId) return chat;
      const messages = [...chat.messages];
      const index = messages.map((m) => m.sender).lastIndexOf('assistant');
      if (index >= 0) {
        messages[index] = { ...messages[index], content, model };
      }
      return { ...chat, updatedAt: new Date().toISOString(), messages };
    });
    set({ chats });
    await persist(userId, chats);
  },
  setMessageFeedback: async (userId, chatId, messageId, feedback) => {
    const chats = get().chats.map((chat) => {
      if (chat.id !== chatId) return chat;
      return {
        ...chat,
        messages: chat.messages.map((message) => (message.id === messageId ? { ...message, feedback } : message)),
      };
    });
    set({ chats });
    await persist(userId, chats);
  },
}));
