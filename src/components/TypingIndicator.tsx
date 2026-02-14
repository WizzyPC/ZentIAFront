import { Bot } from 'lucide-react';

function TypingIndicator() {
  return (
    <div className="flex items-center gap-3">
      <Bot size={18} className="text-cyan-300" />
      <div className="flex items-center gap-1 rounded-2xl bg-slate-800 px-4 py-3">
        <span className="h-2 w-2 animate-bounce rounded-full bg-cyan-400 [animation-delay:-0.3s]" />
        <span className="h-2 w-2 animate-bounce rounded-full bg-cyan-400 [animation-delay:-0.15s]" />
        <span className="h-2 w-2 animate-bounce rounded-full bg-cyan-400" />
      </div>
    </div>
  );
}

export default TypingIndicator;
