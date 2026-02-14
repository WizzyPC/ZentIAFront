import { FormEvent, useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { formatApiError } from '../services/api';
import { useAuth } from '../auth/AuthContext';

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

  const onSubmit = async (event: FormEvent) => {
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
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-950 via-slate-900 to-cyan-950 p-4">
      <form onSubmit={onSubmit} className="w-full max-w-md rounded-2xl border border-slate-800 bg-slate-900/85 p-8 shadow-glow">
        <h1 className="mb-2 text-2xl font-semibold text-cyan-300">Entrar no Zent IA</h1>
        <p className="mb-6 text-sm text-slate-400">Login real com Supabase Auth (email e senha).</p>

        <label className="mb-4 block text-sm">
          <span className="mb-2 block text-slate-300">E-mail</span>
          <input type="email" required value={email} onChange={(event) => setEmail(event.target.value)} className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 outline-none ring-cyan-500 transition focus:ring" />
        </label>

        <label className="mb-4 block text-sm">
          <span className="mb-2 block text-slate-300">Senha</span>
          <input type="password" required value={password} onChange={(event) => setPassword(event.target.value)} className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 outline-none ring-cyan-500 transition focus:ring" />
        </label>

        {error && <p className="mb-4 text-sm text-rose-300">{error}</p>}

        <button type="submit" disabled={loading} className="w-full rounded-lg bg-brand-500 px-4 py-2 font-semibold text-slate-950 transition hover:bg-brand-400 disabled:opacity-50">
          {loading ? 'Entrando...' : 'Entrar'}
        </button>
      </form>
    </div>
  );
}

export default LoginPage;
