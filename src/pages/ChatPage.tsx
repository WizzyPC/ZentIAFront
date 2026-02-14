import { FormEvent, useMemo, useState } from 'react';
import { SendHorizontal } from 'lucide-react';
import MessageBubble from '../components/MessageBubble';
import TypingIndicator from '../components/TypingIndicator';
import { completeChat, formatApiError } from '../services/api';
import { useChatStore } from '../store/chatStore';
import { Message } from '../types/chat';

function ChatPage() {
  const [input, setInput] = useState('');
  const [error, setError] = useState<string | null>(null);

  const { chats, activeChatId, addMessage, isTyping, setTyping } = useChatStore();

  const activeChat = useMemo(
    () => chats.find((chat) => chat.id === activeChatId) ?? chats[0],
    [activeChatId, chats],
  );

  const sendMessage = async (event: FormEvent) => {
    event.preventDefault();
    const content = input.trim();
    if (!content || !activeChat) return;

    setError(null);

    const userMessage: Message = {
      id: crypto.randomUUID(),
      sender: 'user',
      content,
      createdAt: new Date().toISOString(),
    };

    addMessage(activeChat.id, userMessage);
    setInput('');
    setTyping(true);

    try {
      const response = await completeChat({
        message: content,
        chat_history: activeChat.messages.map((message) => ({
          role: message.sender,
          content: message.content,
        })),
      });

      const assistantMessage: Message = {
        id: crypto.randomUUID(),
        sender: 'assistant',
        content: response.response ?? response.answer ?? response.message ?? 'Sem resposta da IA.',
        createdAt: new Date().toISOString(),
      };

      addMessage(activeChat.id, assistantMessage);
    } catch (apiError) {
      setError(formatApiError(apiError));
    } finally {
      setTyping(false);
    }
  };

  if (!activeChat) {
    return <p className="text-slate-400">Crie um novo chat para começar.</p>;
  }

  return (
    <section className="flex h-[calc(100vh-140px)] flex-col">
      <div className="mb-4 flex-1 space-y-4 overflow-y-auto rounded-2xl border border-slate-800 bg-slate-900/30 p-4">
        {activeChat.messages.length === 0 && (
          <p className="text-center text-sm text-slate-500">Faça sua primeira pergunta para a Zent IA.</p>
        )}

        {activeChat.messages.map((message) => (
          <MessageBubble key={message.id} message={message} />
        ))}

        {isTyping && <TypingIndicator />}
      </div>

      {error && <p className="mb-2 text-sm text-rose-300">{error}</p>}

      <form onSubmit={sendMessage} className="flex items-end gap-2 rounded-xl border border-slate-800 bg-slate-900 p-2">
        <textarea
          value={input}
          onChange={(event) => setInput(event.target.value)}
          rows={2}
          placeholder="Digite sua pergunta..."
          className="min-h-[54px] flex-1 resize-none rounded-lg bg-slate-950 px-3 py-2 text-sm outline-none ring-cyan-500 transition focus:ring"
        />
        <button
          type="submit"
          disabled={!input.trim() || isTyping}
          className="inline-flex h-[54px] items-center justify-center rounded-lg bg-brand-500 px-4 text-slate-950 transition hover:bg-brand-400 disabled:cursor-not-allowed disabled:opacity-40"
        >
          <SendHorizontal size={18} />
        </button>
      </form>
    </section>
  );
}

export default ChatPage;
