import { FormEvent, useEffect, useMemo, useRef, useState } from 'react';
import { SendHorizontal } from 'lucide-react';
import { useAuth } from '../auth/AuthContext';
import MessageBubble from '../components/MessageBubble';
import TypingIndicator from '../components/TypingIndicator';
import { completeChat, formatApiError } from '../services/api';
import { useChatStore } from '../store/chatStore';
import { Message } from '../types/chat';
import { getUserSettings } from '../utils/storage';

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

type ChatMode = 'balanced' | 'fast' | 'creative';

type AnimationController = {
  cancelled: boolean;
  finalize: () => Promise<void>;
};

function ChatPage() {
  const { session, user } = useAuth();
  const [input, setInput] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [mode, setMode] = useState<ChatMode>(getUserSettings().preferredMode);
  const animationRef = useRef<AnimationController | null>(null);

  const {
    chats,
    activeChatId,
    addMessage,
    bootstrapUserChats,
    createChat,
    isTyping,
    isSubmitting,
    setMessageFeedback,
    setSubmitting,
    setTyping,
    updateLastAssistantMessage,
  } = useChatStore();

  useEffect(() => {
    if (!user) return;
    void bootstrapUserChats(user.id, mode);
  }, [bootstrapUserChats, mode, user]);

  useEffect(() => {
    return () => {
      if (animationRef.current) {
        animationRef.current.cancelled = true;
        void animationRef.current.finalize();
      }
    };
  }, []);

  const activeChat = useMemo(
    () => chats.find((chat) => chat.id === activeChatId) ?? chats[0],
    [activeChatId, chats],
  );

  const cancelActiveAnimation = async () => {
    const controller = animationRef.current;
    if (!controller) return;

    controller.cancelled = true;
    await controller.finalize();
    animationRef.current = null;
  };

  const animateAssistantResponse = async (
    userId: string,
    chatId: string,
    answer: string,
    model: string,
  ) => {
    const words = answer.match(/\S+\s*/g) ?? [];

    let wordsPerStep = 1;
    let baseInterval = 180;

    if (answer.length > 120 && answer.length <= 400) {
      wordsPerStep = 1;
      baseInterval = 90;
    } else if (answer.length > 400) {
      wordsPerStep = answer.length > 900 ? 4 : 3;
      baseInterval = 60;
    }

    const totalSteps = Math.max(1, Math.ceil(words.length / wordsPerStep));
    const interval = Math.max(16, Math.min(baseInterval, Math.floor(2500 / totalSteps)));
    const start = Date.now();

    let partial = '';

    const finalize = async () => {
      await updateLastAssistantMessage(userId, chatId, answer, model);
    };

    const controller: AnimationController = {
      cancelled: false,
      finalize,
    };

    animationRef.current = controller;

    for (let index = 0; index < words.length; index += wordsPerStep) {
      if (controller.cancelled) {
        return;
      }

      partial += words.slice(index, index + wordsPerStep).join('');
      await updateLastAssistantMessage(userId, chatId, partial, model);

      if (Date.now() - start > 2500) {
        break;
      }

      await wait(interval);
    }

    await finalize();
    if (animationRef.current === controller) {
      animationRef.current = null;
    }
  };

  const sendMessage = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const content = input.trim();
    if (!content || !activeChat || !user || !session?.access_token || isSubmitting) {
      return;
    }

    await cancelActiveAnimation();

    setError(null);
    setSubmitting(true);

    const userMessage: Message = {
      id: crypto.randomUUID(),
      sender: 'user',
      content,
      createdAt: new Date().toISOString(),
    };

    await addMessage(user.id, activeChat.id, userMessage);
    setInput('');
    setTyping(true);

    await addMessage(user.id, activeChat.id, {
      id: crypto.randomUUID(),
      sender: 'assistant',
      content: '',
      createdAt: new Date().toISOString(),
      model: mode,
    });

    try {
      const response = await completeChat(
        {
          message: content,
          mode,
          chat_history: activeChat.messages.map((message) => ({
            role: message.sender,
            content: message.content,
          })),
        },
        session.access_token,
      );

      const answer =
        response.response ?? response.answer ?? response.message ?? 'Sem resposta da IA.';

      setTyping(false);
      setSubmitting(false);

      void animateAssistantResponse(user.id, activeChat.id, answer, response.model ?? mode);
    } catch (apiError) {
      console.error('Front: ChatPage sendMessage error', {
        error: apiError,
        stack: apiError instanceof Error ? apiError.stack : undefined,
      });
      setError(formatApiError(apiError));
      await updateLastAssistantMessage(
        user.id,
        activeChat.id,
        'Desculpe, não consegui responder agora. Tente novamente.',
        mode,
      );
      setTyping(false);
      setSubmitting(false);
    }
  };

  if (!activeChat && user) {
    return (
      <button
        type="button"
        onClick={() => createChat(user.id, mode)}
        className="rounded-xl bg-brand-500 px-4 py-2 text-slate-950"
      >
        Criar primeiro chat
      </button>
    );
  }

  return (
    <section className="flex h-[calc(100vh-140px)] flex-col">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-sm text-slate-400">Modo de resposta</h2>
        <select
          value={mode}
          onChange={(event) => setMode(event.target.value as ChatMode)}
          className="rounded-lg border border-slate-700 bg-slate-900 px-2 py-1 text-sm"
        >
          <option value="balanced">Balanced</option>
          <option value="fast">Fast</option>
          <option value="creative">Creative</option>
        </select>
      </div>

      <div className="mb-4 flex-1 space-y-4 overflow-y-auto rounded-2xl border border-slate-800 bg-slate-900/40 p-4">
        {activeChat?.messages.length === 0 && (
          <p className="text-center text-sm text-slate-500">
            Faça sua primeira pergunta para a Zent IA.
          </p>
        )}

        {activeChat?.messages.map((message) => (
          <MessageBubble
            key={message.id}
            message={message}
            onFeedback={
              message.sender === 'assistant' && user && activeChat
                ? async (feedback) => {
                    await setMessageFeedback(user.id, activeChat.id, message.id, feedback);
                  }
                : undefined
            }
          />
        ))}

        {isTyping && <TypingIndicator />}
      </div>

      {error && <p className="mb-2 text-sm text-rose-300">{error}</p>}

      <form
        onSubmit={sendMessage}
        className="flex items-end gap-2 rounded-xl border border-slate-800 bg-slate-900 p-2"
      >
        <textarea
          value={input}
          onChange={(event) => setInput(event.target.value)}
          rows={2}
          placeholder="Digite sua pergunta..."
          className="min-h-[54px] flex-1 resize-none rounded-lg bg-slate-950 px-3 py-2 text-sm outline-none ring-cyan-500 transition focus:ring"
        />

        <button
          type="submit"
          disabled={!input.trim() || isSubmitting}
          className="inline-flex h-[54px] items-center justify-center rounded-lg bg-brand-500 px-4 text-slate-950 transition hover:bg-brand-400 disabled:cursor-not-allowed disabled:opacity-40"
        >
          <SendHorizontal size={18} />
        </button>
      </form>
    </section>
  );
}

export default ChatPage;
