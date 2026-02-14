import { FormEvent, useState } from 'react';
import { ingestSource, formatApiError } from '../services/api';
import { useChatStore } from '../store/chatStore';

function AccountPage() {
  const user = useChatStore((state) => state.user);
  const [sourceUrl, setSourceUrl] = useState('');
  const [status, setStatus] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const submitIngestion = async (event: FormEvent) => {
    event.preventDefault();
    setStatus(null);
    setLoading(true);

    try {
      await ingestSource(sourceUrl);
      setStatus('Fonte enviada com sucesso para ingestão.');
      setSourceUrl('');
    } catch (error) {
      setStatus(formatApiError(error));
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="mx-auto max-w-3xl space-y-6">
      <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-5">
        <h2 className="mb-4 text-lg font-semibold text-cyan-300">Perfil</h2>
        <dl className="space-y-2 text-sm">
          <div className="flex justify-between border-b border-slate-800 pb-2">
            <dt className="text-slate-400">Nome</dt>
            <dd>{user?.name}</dd>
          </div>
          <div className="flex justify-between border-b border-slate-800 pb-2">
            <dt className="text-slate-400">E-mail</dt>
            <dd>{user?.email}</dd>
          </div>
          <div className="flex justify-between pb-2">
            <dt className="text-slate-400">Plano</dt>
            <dd>{user?.plan}</dd>
          </div>
        </dl>
      </div>

      <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-5">
        <h2 className="mb-4 text-lg font-semibold text-cyan-300">Ingestion</h2>
        <p className="mb-4 text-sm text-slate-400">Envie uma URL para processamento no endpoint `/api/v1/ingestion/source`.</p>

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
