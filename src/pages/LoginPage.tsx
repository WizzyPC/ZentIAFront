import { FormEvent, useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { formatApiError } from '../services/api';

function LoginPage() {
  const navigate = useNavigate();
  const { session, signIn } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  if (session) {
    return <Navigate to="/app/chat" replace />;
  }

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setLoading(true);

    try {
      await signIn(email, password);
      navigate('/app/chat');
    } catch (authError) {
      setError(formatApiError(authError));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-[radial-gradient(circle_at_top,_#312e81,_#020617_60%)] p-4">
      <form
        onSubmit={onSubmit}
        className="w-full max-w-md rounded-3xl border border-indigo-500/25 bg-slate-950/75 p-8 shadow-[0_20px_80px_rgba(59,130,246,0.2)] backdrop-blur"
      >
        <h1 className="mb-2 bg-gradient-to-r from-cyan-300 to-indigo-300 bg-clip-text text-2xl font-semibold text-transparent">
          Entrar no Zent IA
        </h1>
        <p className="mb-6 text-sm text-slate-400">Experiência de chat em tempo real com SSE, tools e artifacts.</p>

        <label className="mb-4 block text-sm">
          <span className="mb-2 block text-slate-300">E-mail</span>
          <input
            type="email"
            required
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 outline-none ring-indigo-400 transition focus:ring"
          />
        </label>

        <label className="mb-4 block text-sm">
          <span className="mb-2 block text-slate-300">Senha</span>
          <input
            type="password"
            required
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 outline-none ring-indigo-400 transition focus:ring"
          />
        </label>

        {error && <p className="mb-4 rounded-lg bg-rose-500/20 px-3 py-2 text-sm text-rose-200">{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-xl bg-gradient-to-r from-cyan-400 to-indigo-400 px-4 py-2 font-semibold text-slate-950 transition hover:opacity-90 disabled:opacity-50"
        >
          {loading ? 'Entrando...' : 'Entrar'}
        </button>
      </form>
    </div>
  );
}

export default LoginPage;
