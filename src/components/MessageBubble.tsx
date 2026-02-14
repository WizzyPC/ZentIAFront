import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import clsx from 'clsx';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { Bot, ThumbsDown, ThumbsUp, UserRound } from 'lucide-react';
import { Message } from '../types/chat';

interface Props {
  message: Message;
  onFeedback?: (feedback: 'up' | 'down') => void;
}

function MessageBubble({ message, onFeedback }: Props) {
  const isUser = message.sender === 'user';

  return (
    <div className={clsx('flex gap-3', isUser ? 'justify-end' : 'justify-start')}>
      {!isUser && <Bot size={18} className="mt-2 text-cyan-300" />}
      <div className={clsx('max-w-3xl rounded-2xl px-4 py-3 text-sm leading-relaxed', isUser ? 'bg-cyan-600 text-cyan-50' : 'bg-slate-800 text-slate-100')}>
        {!isUser && (
          <p className="mb-2 text-xs uppercase tracking-wide text-slate-400">
            Zent IA {message.model ? `• ${message.model}` : '• default'}
          </p>
        )}
        <ReactMarkdown
          remarkPlugins={[remarkGfm]}
          components={{
            code(props) {
              const { children, className, ...rest } = props;
              const match = /language-(\w+)/.exec(className || '');
              return match ? (
                <SyntaxHighlighter
                  {...rest}
                  style={oneDark}
                  language={match[1]}
                  PreTag="div"
                  customStyle={{ margin: 0, borderRadius: 10 }}
                >
                  {String(children).replace(/\n$/, '')}
                </SyntaxHighlighter>
              ) : (
                <code className="rounded bg-slate-900 px-1 py-0.5 text-cyan-300">{children}</code>
              );
            },
          }}
        >
          {message.content}
        </ReactMarkdown>

        {!isUser && onFeedback && (
          <div className="mt-3 flex gap-1">
            <button
              type="button"
              onClick={() => onFeedback('up')}
              className={clsx('rounded-md p-1.5 transition', message.feedback === 'up' ? 'bg-emerald-500/20 text-emerald-300' : 'text-slate-400 hover:bg-slate-700')}
            >
              <ThumbsUp size={14} />
            </button>
            <button
              type="button"
              onClick={() => onFeedback('down')}
              className={clsx('rounded-md p-1.5 transition', message.feedback === 'down' ? 'bg-rose-500/20 text-rose-300' : 'text-slate-400 hover:bg-slate-700')}
            >
              <ThumbsDown size={14} />
            </button>
          </div>
        )}
      </div>
      {isUser && <UserRound size={18} className="mt-2 text-cyan-200" />}
    </div>
  );
}

export default MessageBubble;
