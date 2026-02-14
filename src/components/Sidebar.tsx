import clsx from 'clsx';
import { LogOut, MessagesSquare, MessageSquarePlus, UserRound } from 'lucide-react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { Link, useLocation } from 'react-router-dom';
import { MessageSquarePlus, User, LogOut } from 'lucide-react';
import clsx from 'clsx';
import { useChatStore } from '../store/chatStore';

function Sidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const { chats, activeChatId, createChat, setActiveChat } = useChatStore();

  const onNewChat = async () => {
    if (!user) return;

    await createChat(user.id, 'balanced');
    navigate('/app/chat');
  };

  const onSelectChat = (chatId: string) => {
    if (!user) return;

    setActiveChat(user.id, chatId);
    navigate('/app/chat');
  };

  return (
    <aside className="flex h-full w-full flex-col border-r border-slate-800 bg-slate-900/80 backdrop-blur-xl">
      <div className="border-b border-slate-800 p-4">
        <button
          type="button"
          onClick={onNewChat}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-brand-500 px-3 py-2.5 font-semibold text-slate-950 transition hover:bg-brand-400"
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

      <div className="space-y-1 p-3">
        <Link
          to="/app/chat"
          className={clsx(
            'flex items-center gap-2 rounded-lg px-3 py-2 text-sm transition',
            location.pathname.includes('/chat')
              ? 'bg-slate-800 text-cyan-300'
              : 'text-slate-300 hover:bg-slate-800',
          )}
        >
          <MessagesSquare size={16} />
          Chats
        </Link>

        <Link
          to="/app/account"
          className={clsx(
            'flex items-center gap-2 rounded-lg px-3 py-2 text-sm transition',
            location.pathname.includes('/account')
              ? 'bg-slate-800 text-cyan-300'
              : 'text-slate-300 hover:bg-slate-800',
          )}
        >
          <UserRound size={16} />
          Conta
        </Link>
      </div>

      <div className="flex-1 space-y-2 overflow-y-auto px-3 pb-4">
        {chats.map((chat) => (
          <button
            key={chat.id}
            type="button"
            onClick={() => onSelectChat(chat.id)}
            className={clsx(
              'w-full rounded-xl border px-3 py-2 text-left text-sm transition',
              activeChatId === chat.id
                ? 'border-cyan-500/40 bg-slate-800 text-cyan-200 shadow-glow'
                : 'border-slate-800 bg-slate-900 text-slate-300 hover:bg-slate-800 hover:text-slate-100',
            )}
          >
            <p className="truncate font-medium">{chat.title}</p>
            <p className="truncate text-xs text-slate-500">
              {new Date(chat.updatedAt).toLocaleString()}
            </p>
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
        <button
          type="button"
          onClick={signOut}
          className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-slate-300 transition hover:bg-slate-800"
        >
          <LogOut size={16} />
          Sair
        </button>

        <p className="mt-2 truncate px-3 text-xs text-slate-500">{user?.email}</p>
      </div>
    </aside>
  );
}

export default Sidebar;
