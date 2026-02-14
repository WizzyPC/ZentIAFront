import { Link, useLocation } from 'react-router-dom';
import { MessageSquarePlus, User, LogOut } from 'lucide-react';
import clsx from 'clsx';
import { useChatStore } from '../store/chatStore';

function Sidebar() {
  const location = useLocation();
  const { chats, activeChatId, createChat, setActiveChat, logout, user } = useChatStore();

  return (
    <aside className="flex h-full w-full flex-col border-r border-slate-800 bg-slate-900/70 backdrop-blur">
      <div className="p-4">
        <button
          type="button"
          onClick={() => createChat()}
          className="flex w-full items-center justify-center gap-2 rounded-lg bg-brand-500 px-3 py-2 font-medium text-slate-950 transition hover:bg-brand-400"
        >
          <MessageSquarePlus size={16} />
          Novo Chat
        </button>
      </div>

      <div className="flex-1 space-y-2 overflow-y-auto px-3 pb-4">
        {chats.map((chat) => (
          <button
            key={chat.id}
            type="button"
            onClick={() => setActiveChat(chat.id)}
            className={clsx(
              'w-full rounded-lg px-3 py-2 text-left text-sm transition',
              activeChatId === chat.id
                ? 'bg-slate-800 text-cyan-300 shadow-glow'
                : 'bg-slate-900 text-slate-300 hover:bg-slate-800 hover:text-slate-100',
            )}
          >
            <p className="truncate font-medium">{chat.title}</p>
            <p className="truncate text-xs text-slate-500">{new Date(chat.updatedAt).toLocaleString()}</p>
          </button>
        ))}
      </div>

      <div className="border-t border-slate-800 p-3 text-sm">
        <Link
          to="/app/account"
          className={clsx(
            'mb-2 flex items-center gap-2 rounded-lg px-3 py-2 transition',
            location.pathname.includes('/account')
              ? 'bg-slate-800 text-cyan-300'
              : 'text-slate-300 hover:bg-slate-800',
          )}
        >
          <User size={16} />
          Conta
        </Link>

        <button
          type="button"
          onClick={logout}
          className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-slate-300 transition hover:bg-slate-800"
        >
          <LogOut size={16} />
          Sair
        </button>

        {user && (
          <p className="mt-2 truncate px-3 text-xs text-slate-500">
            {user.name} • {user.plan}
          </p>
        )}
      </div>
    </aside>
  );
}

export default Sidebar;
