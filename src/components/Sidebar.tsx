import clsx from 'clsx';
import {
  LogOut,
  MessagesSquare,
  MessageSquarePlus,
  UserRound,
} from 'lucide-react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { useChatStore } from '../store/chatStore';

const Sidebar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const { chats, activeChatId, createChat, setActiveChat } = useChatStore();

  const handleNewChat = async () => {
    if (!user) return;

    const newChat = await createChat(user.id, 'balanced');
    if (newChat?.id) {
      setActiveChat(user.id, newChat.id);
    }

    navigate('/app/chat');
  };

  const handleSelectChat = (chatId: string) => {
    if (!user) return;

    setActiveChat(user.id, chatId);
    navigate('/app/chat');
  };

  return (
    <aside className="flex h-full w-full flex-col border-r border-slate-800 bg-slate-900/80 backdrop-blur-xl">
      {/* Novo Chat */}
      <div className="border-b border-slate-800 p-4">
        <button
          type="button"
          onClick={handleNewChat}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-brand-500 px-3 py-2.5 font-semibold text-slate-950 transition hover:bg-brand-400"
        >
          <MessageSquarePlus size={16} />
          Novo Chat
        </button>
      </div>

      {/* Navegação */}
      <div className="space-y-1 p-3">
        <Link
          to="/app/chat"
          className={clsx(
            'flex items-center gap-2 rounded-lg px-3 py-2 text-sm transition',
            location.pathname.includes('/chat')
              ? 'bg-slate-800 text-cyan-300'
              : 'text-slate-300 hover:bg-slate-800'
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
              : 'text-slate-300 hover:bg-slate-800'
          )}
        >
          <UserRound size={16} />
          Conta
        </Link>
      </div>

      {/* Lista de Chats */}
      <div className="flex-1 space-y-2 overflow-y-auto px-3 pb-4">
        {chats.map((chat) => (
          <button
            key={chat.id}
            type="button"
            onClick={() => handleSelectChat(chat.id)}
            className={clsx(
              'w-full rounded-xl border px-3 py-2 text-left text-sm transition',
              activeChatId === chat.id
                ? 'border-cyan-500/40 bg-slate-800 text-cyan-200'
                : 'border-slate-800 bg-slate-900 text-slate-300 hover:bg-slate-800 hover:text-slate-100'
            )}
          >
            <p className="truncate font-medium">{chat.title}</p>
            <p className="truncate text-xs text-slate-500">
              {new Date(chat.updatedAt).toLocaleString()}
            </p>
          </button>
        ))}
      </div>

      {/* Rodapé */}
      <div className="border-t border-slate-800 p-3 text-sm">
        <button
          type="button"
          onClick={signOut}
          className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-slate-300 transition hover:bg-slate-800"
        >
          <LogOut size={16} />
          Sair
        </button>

        <p className="mt-2 truncate text-xs text-slate-500">
          {user?.email}
        </p>
      </div>
    </aside>
  );
};

export default Sidebar;
