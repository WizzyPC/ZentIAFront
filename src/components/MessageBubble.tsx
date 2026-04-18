import clsx from 'clsx';
import { Bot, Pencil, RefreshCcw, ThumbsDown, ThumbsUp, UserRound, Wrench } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism';
import remarkGfm from 'remark-gfm';
import { ChatMessage } from '../types/chat';

interface Props {
  message: ChatMessage;
  onFeedback?: (feedback: 'up' | 'down') => void;
  onRegenerate?: () => void;
  onEditRetry?: () => void;
}

const markdownComponents = {
  code(props: any) {
    const { children, className, ...rest } = props;
    const match = /language-(\w+)/.exec(className ?? '');

    if (match) {
      return (
        <SyntaxHighlighter
          style={oneDark}
          language={match[1]}
          PreTag="div"
          customStyle={{ margin: 0, borderRadius: 12, background: '#111827' }}
        >
          {String(children).replace(/\n$/, '')}
        </SyntaxHighlighter>
      );
    }

    return (
      <code className="rounded bg-slate-900 px-1 py-0.5 text-cyan-300" {...rest}>
        {children}
      </code>
    );
  },
};

function MessageBubble({ message, onFeedback, onRegenerate, onEditRetry }: Props) {
  const isUser = message.role === 'user';
  const isTool = message.role === 'tool';

  return (
    <div className={clsx('group flex gap-3', isUser ? 'justify-end' : 'justify-start')}>
      {!isUser && !isTool && <Bot size={18} className="mt-2 text-indigo-300" />}
      {isTool && <Wrench size={18} className="mt-2 text-fuchsia-300" />}

      <div
        className={clsx(
          'max-w-4xl rounded-2xl border px-4 py-3 text-sm leading-relaxed shadow-[0_8px_30px_rgba(0,0,0,0.18)]',
          isUser && 'border-cyan-500/30 bg-cyan-500/10 text-cyan-50',
          !isUser && !isTool && 'border-indigo-500/20 bg-slate-900/85 text-slate-100',
          isTool && 'border-fuchsia-500/20 bg-fuchsia-500/10 text-fuchsia-100',
        )}
      >
        {!isUser && (
          <div className="mb-2 flex items-center justify-between text-[11px] uppercase tracking-wide">
            <span className="text-slate-400">
              {isTool ? 'Tool event' : 'Zent IA'}
              {message.model ? ` • ${message.model}` : ''}
            </span>
            <span
              className={clsx(
                'rounded-full px-2 py-0.5 normal-case',
                message.state === 'streaming' && 'bg-cyan-500/20 text-cyan-300',
                message.state === 'failed' && 'bg-rose-500/20 text-rose-300',
                message.state === 'cancelled' && 'bg-amber-500/20 text-amber-300',
                message.state === 'completed' && 'bg-emerald-500/20 text-emerald-300',
                message.state === 'pending' && 'bg-slate-700 text-slate-300',
              )}
            >
              {message.state}
            </span>
          </div>
        )}

        <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>
          {message.content || (message.state === 'streaming' ? '…' : '')}
        </ReactMarkdown>

        {message.citations.length > 0 && (
          <div className="mt-3 rounded-lg border border-indigo-500/20 bg-slate-950/60 p-2">
            <p className="mb-1 text-xs text-slate-400">Citações</p>
            <ul className="space-y-1 text-xs">
              {message.citations.map((citation) => (
                <li key={citation.url}>
                  <a className="text-cyan-300 hover:underline" href={citation.url} target="_blank" rel="noreferrer">
                    {citation.title}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        )}

        {!isUser && !isTool && (
          <div className="mt-3 flex flex-wrap items-center gap-1">
            {onFeedback && (
              <>
                <button
                  type="button"
                  onClick={() => onFeedback('up')}
                  className={clsx(
                    'rounded-md p-1.5 transition',
                    message.feedback === 'up'
                      ? 'bg-emerald-500/20 text-emerald-300'
                      : 'text-slate-400 hover:bg-slate-700',
                  )}
                >
                  <ThumbsUp size={14} />
                </button>

                <button
                  type="button"
                  onClick={() => onFeedback('down')}
                  className={clsx(
                    'rounded-md p-1.5 transition',
                    message.feedback === 'down'
                      ? 'bg-rose-500/20 text-rose-300'
                      : 'text-slate-400 hover:bg-slate-700',
                  )}
                >
                  <ThumbsDown size={14} />
                </button>
              </>
            )}

            {onRegenerate && (
              <button type="button" onClick={onRegenerate} className="rounded-md p-1.5 text-slate-400 transition hover:bg-slate-700">
                <RefreshCcw size={14} />
              </button>
            )}

            {onEditRetry && (
              <button type="button" onClick={onEditRetry} className="rounded-md p-1.5 text-slate-400 transition hover:bg-slate-700">
                <Pencil size={14} />
              </button>
            )}
          </div>
        )}
      </div>

      {isUser && <UserRound size={18} className="mt-2 text-cyan-200" />}
    </div>
  );
}

export default MessageBubble;
