import { FormEvent, useState } from 'react';
import { ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { formatApiError, ingestSource } from '../services/api';
import { getUserSettings, saveUserSettings } from '../utils/storage';

function AccountPage() {
  const { user, session } = useAuth();
  const [sourceUrl, setSourceUrl] = useState('');
  const [status, setStatus] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [preferredMode, setPreferredMode] = useState(getUserSettings().preferredMode);

  const submitIngestion = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!session?.access_token) {
      setStatus('Sessão inválida. Faça login novamente.');
      return;
    }

    setStatus(null);
    setLoading(true);

    try {
      await ingestSource(sourceUrl, session.access_token);
      setStatus('Fonte enviada com sucesso para ingestão.');
      setSourceUrl('');
    } catch (error) {
      console.error('Front: AccountPage ingestion error', {
        error,
        stack: error instanceof Error ? error.stack : undefined,
      });
      setStatus(formatApiError(error));
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="mx-auto max-w-3xl space-y-6">
      <div>
        <Link
          to="/app/chat"
          className="inline-flex items-center gap-2 rounded-lg border border-slate-700 px-3 py-2 text-sm text-slate-300 transition hover:bg-slate-800"
        >
          <ArrowLeft size={16} />
          Voltar para chats
        </Link>
      </div>

      <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-5">
        <h2 className="mb-4 text-lg font-semibold text-cyan-300">Perfil</h2>
        <dl className="space-y-2 text-sm">
          <div className="flex justify-between border-b border-slate-800 pb-2">
            <dt className="text-slate-400">ID</dt>
            <dd className="max-w-[220px] truncate">{user?.id}</dd>
          </div>

          <div className="flex justify-between border-b border-slate-800 pb-2">
            <dt className="text-slate-400">E-mail</dt>
            <dd>{user?.email}</dd>
          </div>

          <div className="flex justify-between pb-2">
            <dt className="text-slate-400">Sessão</dt>
            <dd className="text-emerald-300">Ativa</dd>
          </div>
        </dl>
      </div>

      <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-5">
        <h2 className="mb-4 text-lg font-semibold text-cyan-300">Configurações</h2>

        <label className="block text-sm text-slate-300">
          Modo padrão de resposta
          <select
            value={preferredMode}
            onChange={(event) => {
              const value = event.target.value as 'balanced' | 'fast' | 'creative';
              setPreferredMode(value);
              saveUserSettings({ preferredMode: value });
            }}
            className="mt-2 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2"
          >
            <option value="balanced">Balanced</option>
            <option value="fast">Fast</option>
            <option value="creative">Creative</option>
          </select>
        </label>
      </div>

      <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-5">
        <h2 className="mb-4 text-lg font-semibold text-cyan-300">Ingestion</h2>
        <p className="mb-4 text-sm text-slate-400">
          Envie uma URL para processamento no endpoint `/api/v1/ingestion/source`.
        </p>

        <form className="space-y-3" onSubmit={submitIngestion}>
          <input
            required
            type="url"
            placeholder="https://exemplo.com/documento"
            value={sourceUrl}
            onChange={(event) => setSourceUrl(event.target.value)}
            className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm outline-none ring-cyan-500 transition focus:ring"
          />

          <button
            type="submit"
            disabled={loading}
            className="rounded-lg bg-brand-500 px-4 py-2 font-semibold text-slate-950 transition hover:bg-brand-400 disabled:opacity-50"
          >
            {loading ? 'Enviando...' : 'Enviar fonte'}
          </button>
        </form>

        {status && <p className="mt-3 text-sm text-slate-200">{status}</p>}
      </div>
    </section>
  );
}

export default AccountPage;
