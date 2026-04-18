import { FormEvent, useEffect, useMemo, useRef, useState } from 'react';
import { Loader2, SendHorizontal, Square } from 'lucide-react';
import { useAuth } from '../auth/AuthContext';
import ArtifactGallery from '../components/ArtifactGallery';
import MessageBubble from '../components/MessageBubble';
import ToolActivityPanel from '../components/ToolActivityPanel';
import {
  cancelGeneration,
  createArtifactShare,
  createGeneration,
  editAndRetryMessage,
  formatApiError,
  getArtifactDownloadUrl,
  listArtifactsByMessage,
  regenerateMessage,
  SSEEvent,
  streamGeneration,
} from '../services/api';
import { useChatStore } from '../store/chatStore';
import { Artifact, ChatMessage, ChatMode, ToolEvent } from '../types/chat';
import { getUserSettings } from '../utils/storage';

function ChatPage() {
  const { session, user } = useAuth();
  const [input, setInput] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [mode, setMode] = useState<ChatMode>(getUserSettings().preferredMode);
  const [toolEvents, setToolEvents] = useState<Record<string, ToolEvent>>({});
  const [artifacts, setArtifacts] = useState<Record<string, Artifact>>({});

  const streamAbortRef = useRef<AbortController | null>(null);
  const messagesContainerRef = useRef<HTMLDivElement | null>(null);

  const {
    chats,
    activeChatId,
    bootstrapUserChats,
    createChat,
    isSubmitting,
    setSubmitting,
    setActiveChat,
    beginUserTurn,
    appendToken,
    setGenerationState,
    setGenerationDone,
    setGenerationError,
    upsertToolEvent,
    addArtifact,
    setMessageFeedback,
    budgetBlocked,
    setBudgetBlocked,
    updateMessageContent,
  } = useChatStore();

  useEffect(() => {
    if (!user) return;
    void bootstrapUserChats(user.id, mode);
  }, [bootstrapUserChats, mode, user]);

  const activeChat = useMemo(
    () => chats.find((chat) => chat.id === activeChatId) ?? chats[0],
    [activeChatId, chats],
  );

  const activeGeneration = useMemo(
    () => activeChat?.generations.find((g) => g.state === 'generating' || g.state === 'streaming') ?? null,
    [activeChat],
  );

  const activeTools = useMemo(
    () => Object.values(toolEvents).filter((event) => event.generation_id === activeGeneration?.id),
    [activeGeneration?.id, toolEvents],
  );

  const activeArtifacts = useMemo(() => {
    if (!activeChat) return [];
    const artifactIds = activeChat.messages.flatMap((message) => message.artifacts);
    return artifactIds.map((id) => artifacts[id]).filter(Boolean);
  }, [activeChat, artifacts]);

  useEffect(() => {
    if (!messagesContainerRef.current) return;
    messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
  }, [activeChat?.messages.length, activeGeneration?.state]);

  const handleSSEEvent = async (chatId: string, generationId: string, event: SSEEvent) => {
    if (!user) return;

    if (event.type === 'state') {
      await setGenerationState({
        userId: user.id,
        chatId,
        generationId,
        state: event.payload.state,
      });
      return;
    }

    if (event.type === 'token') {
      await appendToken({ chatId, generationId, text: event.payload.text });
      return;
    }

    if (event.type === 'tool_call' || event.type === 'tool_result') {
      const toolEvent: ToolEvent = {
        ...event.payload,
        status: event.payload.status,
      };
      setToolEvents((prev) => ({ ...prev, [toolEvent.tool_call_id]: toolEvent }));
      await upsertToolEvent({ userId: user.id, chatId, event: toolEvent });
      return;
    }

    if (event.type === 'artifact') {
      const nextArtifact: Artifact = {
        id: event.payload.artifact_id,
        generation_id: generationId,
        message_id: event.payload.message_id,
        file_name: event.payload.file_name,
        mime_type: event.payload.mime_type,
        ext: event.payload.file_name.split('.').pop() ?? 'txt',
        version: event.payload.version ?? 'v1',
        size_bytes: event.payload.size_bytes,
        preview_supported: true,
        created_at: new Date().toISOString(),
      };
      setArtifacts((prev) => ({ ...prev, [nextArtifact.id]: nextArtifact }));
      await addArtifact({ userId: user.id, chatId, artifact: nextArtifact });
      return;
    }

    if (event.type === 'error') {
      setError(event.payload.message);
      await setGenerationError({
        userId: user.id,
        chatId,
        generationId,
        code: event.payload.code,
        message: event.payload.message,
        retryable: event.payload.retryable,
      });
      return;
    }

    if (event.type === 'done') {
      await setGenerationDone({
        userId: user.id,
        chatId,
        generationId,
        messageId: event.payload.message_id,
        usage: event.payload.usage,
        citations: event.payload.citations,
        finishedAt: event.payload.finished_at,
      });
      return;
    }
  };

  const openGenerationStream = async (chatId: string, generationId: string, token: string) => {
    const controller = new AbortController();
    streamAbortRef.current = controller;

    try {
      await streamGeneration({
        generationId,
        token,
        signal: controller.signal,
        onEvent: (event) => {
          void handleSSEEvent(chatId, generationId, event);
        },
      });
    } finally {
      if (streamAbortRef.current === controller) {
        streamAbortRef.current = null;
      }
    }
  };

  const startGenerationFor = async ({
    chatId,
    content,
    parentMessageId,
  }: {
    chatId: string;
    content: string;
    parentMessageId?: string;
  }) => {
    if (!user || !session?.access_token) return;

    setError(null);
    setSubmitting(true);

    try {
      const creation = await createGeneration(
        {
          chat_id: chatId,
          parent_message_id: parentMessageId,
          message: { role: 'user', content, attachments: [] },
          mode,
          rag: { enabled: true, source_ids: [] },
          tools: { allowed: ['knowledge_search', 'code_interpreter'] },
          output: { format: 'structured', artifact_types: ['md', 'json', 'lua', 'luau', 'txt'] },
        },
        session.access_token,
        crypto.randomUUID(),
      );

      if (creation.budget?.allowed === false) {
        setBudgetBlocked(true);
        setError('Budget excedido. Ajuste o plano/orçamento para continuar.');
        return;
      }

      setBudgetBlocked(false);

      const resolvedChatId = creation.chat_id || chatId;
      if (resolvedChatId !== chatId) {
        setActiveChat(user.id, resolvedChatId);
      }

      await beginUserTurn({
        userId: user.id,
        chatId: resolvedChatId,
        content,
        generationId: creation.generation_id,
        mode,
        estimatedCostUsd: creation.estimated_cost_usd,
        budget: creation.budget,
      });

      await openGenerationStream(resolvedChatId, creation.generation_id, session.access_token);
    } catch (apiError) {
      setError(formatApiError(apiError));
    } finally {
      setSubmitting(false);
    }
  };

  const sendMessage = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const content = input.trim();
    if (!content || !activeChat || !user || !session?.access_token || isSubmitting || budgetBlocked) {
      return;
    }

    setInput('');
    await startGenerationFor({ chatId: activeChat.id, content });
  };

  const handleCancel = async () => {
    if (!activeGeneration || !session?.access_token || !user || !activeChat) return;
    try {
      await cancelGeneration(activeGeneration.id, session.access_token, 'cancelled_by_user');
      streamAbortRef.current?.abort();
      await setGenerationState({
        userId: user.id,
        chatId: activeChat.id,
        generationId: activeGeneration.id,
        state: 'cancelled',
      });
    } catch (apiError) {
      setError(formatApiError(apiError));
    }
  };

  const handleRegenerate = async (message: ChatMessage) => {
    if (!session?.access_token || !activeChat || !user) return;
    try {
      const creation = await regenerateMessage(message.id, session.access_token);
      await setGenerationState({
        userId: user.id,
        chatId: activeChat.id,
        generationId: creation.generation_id,
        state: 'generating',
      });
      await openGenerationStream(activeChat.id, creation.generation_id, session.access_token);
    } catch (apiError) {
      setError(formatApiError(apiError));
    }
  };

  const handleEditAndRetry = async (message: ChatMessage) => {
    if (!session?.access_token || !activeChat || !user) return;
    const edited = window.prompt('Editar mensagem para retry', message.content);
    if (!edited || edited.trim() === message.content.trim()) return;

    try {
      await updateMessageContent({ userId: user.id, chatId: activeChat.id, messageId: message.id, content: edited });
      const creation = await editAndRetryMessage(message.id, edited, session.access_token);
      await setGenerationState({
        userId: user.id,
        chatId: activeChat.id,
        generationId: creation.generation_id,
        state: 'generating',
      });
      await openGenerationStream(activeChat.id, creation.generation_id, session.access_token);
    } catch (apiError) {
      setError(formatApiError(apiError));
    }
  };

  const handleDownloadArtifact = async (artifactId: string) => {
    if (!session?.access_token) return;
    try {
      const url = await getArtifactDownloadUrl(artifactId, session.access_token);
      window.open(url, '_blank', 'noopener,noreferrer');
    } catch (apiError) {
      setError(formatApiError(apiError));
    }
  };

  const handleShareArtifact = async (artifactId: string) => {
    if (!session?.access_token) return;
    try {
      const shareUrl = await createArtifactShare(artifactId, session.access_token);
      await navigator.clipboard.writeText(shareUrl);
    } catch (apiError) {
      setError(formatApiError(apiError));
    }
  };

  const hydrateArtifactsFromServer = async () => {
    if (!session?.access_token || !activeChat) return;

    const assistantMessages = activeChat.messages.filter((msg) => msg.role === 'assistant');
    for (const message of assistantMessages) {
      try {
        const items = await listArtifactsByMessage(message.id, session.access_token);
        if (items.length > 0) {
          setArtifacts((prev) => {
            const next = { ...prev };
            items.forEach((item) => {
              next[item.id] = item;
            });
            return next;
          });
        }
      } catch {
        // silent hydration fail
      }
    }
  };

  useEffect(() => {
    void hydrateArtifactsFromServer();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeChat?.id]);

  if (!activeChat && user) {
    return (
      <button
        type="button"
        onClick={() => createChat(user.id, mode)}
        className="rounded-xl bg-cyan-400 px-4 py-2 text-slate-950"
      >
        Criar primeiro chat
      </button>
    );
  }

  return (
    <section className="flex h-[calc(100vh-120px)] flex-col">
      <div className="mb-3 flex items-center justify-between rounded-2xl border border-indigo-500/20 bg-slate-900/70 px-4 py-3">
        <div>
          <h2 className="text-sm font-semibold text-indigo-200">Modo de resposta</h2>
          <p className="text-xs text-slate-400">State machine orientada por eventos SSE do backend</p>
        </div>

        <div className="flex items-center gap-2">
          <select
            value={mode}
            onChange={(event) => setMode(event.target.value as ChatMode)}
            className="rounded-lg border border-slate-700 bg-slate-950 px-2 py-1 text-sm"
          >
            <option value="balanced">Balanced</option>
            <option value="fast">Fast</option>
            <option value="creative">Creative</option>
          </select>

          {activeGeneration && (
            <button
              type="button"
              onClick={handleCancel}
              className="inline-flex items-center gap-1 rounded-lg border border-rose-500/40 bg-rose-500/10 px-2 py-1 text-xs text-rose-200"
            >
              <Square size={12} /> Cancelar
            </button>
          )}
        </div>
      </div>

      <div
        ref={messagesContainerRef}
        className="mb-3 flex-1 space-y-3 overflow-y-auto rounded-2xl border border-indigo-500/20 bg-gradient-to-b from-slate-900/90 to-slate-950/95 p-4"
      >
        {activeChat?.messages.length === 0 && (
          <p className="text-center text-sm text-slate-500">Faça sua primeira pergunta para a Zent IA.</p>
        )}

        {activeChat?.messages.map((message) => (
          <MessageBubble
            key={message.id}
            message={message}
            onFeedback={
              message.role === 'assistant' && user && activeChat
                ? async (feedback) => setMessageFeedback(user.id, activeChat.id, message.id, feedback)
                : undefined
            }
            onRegenerate={message.role === 'assistant' ? () => void handleRegenerate(message) : undefined}
            onEditRetry={message.role === 'assistant' ? () => void handleEditAndRetry(message) : undefined}
          />
        ))}
      </div>

      <div className="mb-3 grid gap-3 lg:grid-cols-2">
        <ToolActivityPanel events={activeTools} />
        <ArtifactGallery
          artifacts={activeArtifacts}
          onDownload={handleDownloadArtifact}
          onShare={handleShareArtifact}
        />
      </div>

      {activeGeneration && (
        <div className="mb-2 rounded-lg border border-cyan-500/20 bg-cyan-500/10 px-3 py-2 text-xs text-cyan-200">
          <p>
            Geração <strong>{activeGeneration.state}</strong>
            {activeGeneration.estimated_cost_usd !== undefined && (
              <> • custo estimado: ${activeGeneration.estimated_cost_usd.toFixed(4)}</>
            )}
            {activeGeneration.cost_real_usd !== undefined && <> • custo real: ${activeGeneration.cost_real_usd.toFixed(4)}</>}
          </p>
        </div>
      )}

      {error && <p className="mb-2 rounded-lg bg-rose-500/15 px-3 py-2 text-sm text-rose-200">{error}</p>}
      {budgetBlocked && (
        <p className="mb-2 rounded-lg bg-amber-500/15 px-3 py-2 text-sm text-amber-200">
          Novas gerações bloqueadas por orçamento.
        </p>
      )}

      <form onSubmit={sendMessage} className="flex items-end gap-2 rounded-2xl border border-indigo-500/20 bg-slate-900/90 p-2">
        <textarea
          value={input}
          onChange={(event) => setInput(event.target.value)}
          rows={2}
          placeholder="Digite sua pergunta..."
          className="min-h-[56px] flex-1 resize-none rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-sm outline-none ring-indigo-400 transition focus:ring"
        />

        <button
          type="submit"
          disabled={!input.trim() || isSubmitting || budgetBlocked}
          className="inline-flex h-[56px] items-center justify-center rounded-xl bg-gradient-to-r from-cyan-400 to-indigo-400 px-4 text-slate-950 transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
        >
          {isSubmitting ? <Loader2 size={18} className="animate-spin" /> : <SendHorizontal size={18} />}
        </button>
      </form>
    </section>
  );
}

export default ChatPage;
