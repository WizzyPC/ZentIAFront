import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import clsx from 'clsx';
import { Message } from '../types/chat';

interface Props {
  message: Message;
}

function MessageBubble({ message }: Props) {
  const isUser = message.sender === 'user';

  return (
    <div className={clsx('flex', isUser ? 'justify-end' : 'justify-start')}>
      <div
        className={clsx(
          'markdown max-w-3xl rounded-2xl px-4 py-3 text-sm leading-relaxed',
          isUser ? 'bg-cyan-600 text-cyan-50' : 'bg-slate-800 text-slate-100',
        )}
      >
        <ReactMarkdown remarkPlugins={[remarkGfm]}>{message.content}</ReactMarkdown>
      </div>
    </div>
  );
}

export default MessageBubble;
