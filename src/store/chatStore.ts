import { create } from 'zustand';
import {
  Artifact,
  BudgetInfo,
  ChatMessage,
  ChatMode,
  ChatSession,
  Feedback,
  Generation,
  GenerationState,
  ToolEvent,
} from '../types/chat';
import { getLocalActiveChat, saveLocalActiveChat } from '../utils/storage';
import { loadUserChats, persistChats } from '../services/chatRepository';

interface ChatState {
  chats: ChatSession[];
  activeChatId: string | null;
  isSubmitting: boolean;
  budgetBlocked: boolean;
  setSubmitting: (isSubmitting: boolean) => void;
  setBudgetBlocked: (blocked: boolean) => void;
  bootstrapUserChats: (userId: string, mode: ChatMode) => Promise<void>;
  createChat: (userId: string, mode: ChatMode) => Promise<string>;
  setActiveChat: (userId: string, chatId: string) => void;
  setBackendChatId: (userId: string, localChatId: string, backendChatId: string) => Promise<void>;
  beginUserTurn: (params: {
    userId: string;
    chatId: string;
    content: string;
    generationId: string;
    mode: ChatMode;
    estimatedCostUsd?: number;
    budget?: BudgetInfo;
  }) => Promise<{ userMessageId: string; assistantMessageId: string }>;
  appendToken: (params: { chatId: string; generationId: string; text: string }) => Promise<void>;
  setGenerationState: (params: {
    userId: string;
    chatId: string;
    generationId: string;
    state: GenerationState;
    messageId?: string;
  }) => Promise<void>;
  setGenerationDone: (params: {
    userId: string;
    chatId: string;
    generationId: string;
    messageId?: string;
    usage?: { input_tokens_real?: number; output_tokens_real?: number; cost_real_usd?: number };
    citations?: ChatMessage['citations'];
    finishedAt?: string;
  }) => Promise<void>;
  setGenerationError: (params: {
    userId: string;
    chatId: string;
    generationId: string;
    code: string;
    message: string;
    retryable?: boolean;
  }) => Promise<void>;
  upsertToolEvent: (params: { userId: string; chatId: string; event: ToolEvent }) => Promise<void>;
  addArtifact: (params: { userId: string; chatId: string; artifact: Artifact }) => Promise<void>;
  setMessageFeedback: (userId: string, chatId: string, messageId: string, feedback: Feedback) => Promise<void>;
  updateMessageContent: (params: { userId: string; chatId: string; messageId: string; content: string }) => Promise<void>;
}

const makeNewChat = (userId: string, mode: ChatMode): ChatSession => {
  const now = new Date().toISOString();
  return {
    id: crypto.randomUUID(),
    backendChatId: undefined,
    userId,
    title: 'Novo Chat',
    mode,
    createdAt: now,
    updatedAt: now,
    messages: [],
    generations: [],
  };
};

const persist = async (userId: string, chats: ChatSession[]) => persistChats(userId, chats);

const mutateChat = (chats: ChatSession[], chatId: string, update: (chat: ChatSession) => ChatSession) =>
  chats.map((chat) => (chat.id === chatId ? update(chat) : chat));

export const useChatStore = create<ChatState>((set, get) => ({
  chats: [],
  activeChatId: null,
  isSubmitting: false,
  budgetBlocked: false,
  setSubmitting: (isSubmitting) => set({ isSubmitting }),
  setBudgetBlocked: (budgetBlocked) => set({ budgetBlocked }),

  bootstrapUserChats: async (userId, mode) => {
    const loadedChats = await loadUserChats(userId);
    const chats = loadedChats.length > 0
      ? loadedChats.map((chat) => ({ ...chat, generations: chat.generations ?? [] }))
      : [makeNewChat(userId, mode)];

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
  setBackendChatId: async (userId, localChatId, backendChatId) => {
    const now = new Date().toISOString();
    const chats = mutateChat(get().chats, localChatId, (chat) => ({
      ...chat,
      backendChatId,
      updatedAt: now,
    }));
    set({ chats });
    await persist(userId, chats);
    return { userMessageId, assistantMessageId };
  },

  beginUserTurn: async ({ userId, chatId, content, generationId, mode, estimatedCostUsd, budget }) => {
    const now = new Date().toISOString();
    const userMessageId = crypto.randomUUID();
    const assistantMessageId = crypto.randomUUID();

    const chats = mutateChat(get().chats, chatId, (chat) => {
      const userMessage: ChatMessage = {
        id: userMessageId,
        chat_id: chat.id,
        role: 'user',
        content,
        blocks: [],
        state: 'completed',
        artifacts: [],
        citations: [],
        version: 1,
        created_at: now,
        updated_at: now,
      };

      const assistantMessage: ChatMessage = {
        id: assistantMessageId,
        chat_id: chat.id,
        role: 'assistant',
        content: '',
        blocks: [],
        state: 'pending',
        generation_id: generationId,
        artifacts: [],
        citations: [],
        version: 1,
        model: mode,
        created_at: now,
        updated_at: now,
      };

      const generation: Generation = {
        id: generationId,
        chat_id: chat.id,
        state: 'generating',
        estimated_cost_usd: estimatedCostUsd,
        started_at: now,
        message_id: assistantMessageId,
        error: budget?.allowed === false
          ? { code: 'BUDGET_EXCEEDED', message: 'Budget bloqueado pelo backend', retryable: false }
          : null,
      };

      const title = chat.title === 'Novo Chat' ? content.slice(0, 60) : chat.title;
      return {
        ...chat,
        title,
        mode,
        updatedAt: now,
        messages: [...chat.messages, userMessage, assistantMessage],
        generations: [...chat.generations, generation],
      };
    });

    set({ chats });
    await persist(userId, chats);
    return { userMessageId, assistantMessageId };
  },

  appendToken: async ({ chatId, generationId, text }) => {
    const chats = mutateChat(get().chats, chatId, (chat) => ({
      ...chat,
      updatedAt: new Date().toISOString(),
      messages: chat.messages.map((message) =>
        message.generation_id === generationId
          ? {
              ...message,
              content: `${message.content}${text}`,
              state: 'streaming',
              updated_at: new Date().toISOString(),
            }
          : message,
      ),
    }));

    set({ chats });
  },

  setGenerationState: async ({ userId, chatId, generationId, state, messageId }) => {
    const now = new Date().toISOString();
    const chats = mutateChat(get().chats, chatId, (chat) => ({
      ...chat,
      updatedAt: now,
      generations: chat.generations.map((generation) =>
        generation.id === generationId ? { ...generation, state, message_id: messageId ?? generation.message_id } : generation,
      ),
      messages: chat.messages.map((message) => {
        if (message.generation_id !== generationId) return message;
        if (state === 'streaming') return { ...message, state: 'streaming', updated_at: now };
        if (state === 'cancelled') return { ...message, state: 'cancelled', updated_at: now };
        if (state === 'failed') return { ...message, state: 'failed', updated_at: now };
        if (state === 'completed') return { ...message, state: 'completed', updated_at: now };
        return message;
      }),
    }));

    set({ chats });
    await persist(userId, chats);
  },

  setGenerationDone: async ({ userId, chatId, generationId, messageId, usage, citations, finishedAt }) => {
    const endedAt = finishedAt ?? new Date().toISOString();
    const chats = mutateChat(get().chats, chatId, (chat) => ({
      ...chat,
      updatedAt: endedAt,
      generations: chat.generations.map((generation) =>
        generation.id === generationId
          ? {
              ...generation,
              state: 'completed',
              message_id: messageId ?? generation.message_id,
              input_tokens_real: usage?.input_tokens_real,
              output_tokens_real: usage?.output_tokens_real,
              cost_real_usd: usage?.cost_real_usd,
              finished_at: endedAt,
            }
          : generation,
      ),
      messages: chat.messages.map((message) =>
        message.generation_id === generationId
          ? {
              ...message,
              id: messageId ?? message.id,
              state: 'completed',
              citations: citations ?? message.citations,
              updated_at: endedAt,
            }
          : message,
      ),
    }));

    set({ chats });
    await persist(userId, chats);
  },

  setGenerationError: async ({ userId, chatId, generationId, code, message, retryable }) => {
    const now = new Date().toISOString();
    const chats = mutateChat(get().chats, chatId, (chat) => ({
      ...chat,
      updatedAt: now,
      generations: chat.generations.map((generation) =>
        generation.id === generationId
          ? {
              ...generation,
              state: 'failed',
              error: { code, message, retryable },
              finished_at: now,
            }
          : generation,
      ),
      messages: chat.messages.map((msg) =>
        msg.generation_id === generationId ? { ...msg, state: 'failed', updated_at: now } : msg,
      ),
    }));

    set({ chats });
    await persist(userId, chats);
  },

  upsertToolEvent: async ({ userId, chatId, event }) => {
    const now = new Date().toISOString();
    const chats = mutateChat(get().chats, chatId, (chat) => {
      const toolMessageId = `${event.generation_id}:${event.tool_call_id}`;
      const existing = chat.messages.find((m) => m.id === toolMessageId);
      const toolMessage: ChatMessage = {
        id: toolMessageId,
        chat_id: chat.id,
        role: 'tool',
        content: JSON.stringify(event, null, 2),
        blocks: [],
        state: event.status === 'failed' ? 'failed' : 'completed',
        generation_id: event.generation_id,
        artifacts: [],
        citations: [],
        version: 1,
        created_at: existing?.created_at ?? now,
        updated_at: now,
      };

      return {
        ...chat,
        updatedAt: now,
        messages: existing
          ? chat.messages.map((message) => (message.id === toolMessageId ? toolMessage : message))
          : [...chat.messages, toolMessage],
      };
    });

    set({ chats });
    await persist(userId, chats);
  },

  addArtifact: async ({ userId, chatId, artifact }) => {
    const now = new Date().toISOString();
    const chats = mutateChat(get().chats, chatId, (chat) => ({
      ...chat,
      updatedAt: now,
      messages: chat.messages.map((message) =>
        message.id === artifact.message_id
          ? {
              ...message,
              artifacts: message.artifacts.includes(artifact.id)
                ? message.artifacts
                : [...message.artifacts, artifact.id],
              updated_at: now,
            }
          : message,
      ),
    }));

    set({ chats });
    await persist(userId, chats);
  },

  setMessageFeedback: async (userId, chatId, messageId, feedback) => {
    const chats = mutateChat(get().chats, chatId, (chat) => ({
      ...chat,
      messages: chat.messages.map((message) => (message.id === messageId ? { ...message, feedback } : message)),
    }));

    set({ chats });
    await persist(userId, chats);
  },

  updateMessageContent: async ({ userId, chatId, messageId, content }) => {
    const now = new Date().toISOString();
    const chats = mutateChat(get().chats, chatId, (chat) => ({
      ...chat,
      updatedAt: now,
      messages: chat.messages.map((message) =>
        message.id === messageId
          ? {
              ...message,
              content,
              version: message.version + 1,
              updated_at: now,
            }
          : message,
      ),
    }));

    set({ chats });
    await persist(userId, chats);
  },
}));
