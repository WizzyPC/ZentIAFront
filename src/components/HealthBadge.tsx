import { useEffect, useState } from 'react';
import clsx from 'clsx';
import { getSystemHealth } from '../services/api';

function HealthBadge() {
  const [status, setStatus] = useState<'loading' | 'online' | 'offline'>('loading');

  useEffect(() => {
    let mounted = true;

    getSystemHealth()
      .then(() => mounted && setStatus('online'))
      .catch(() => mounted && setStatus('offline'));

    return () => {
      mounted = false;
    };
  }, []);

  return (
    <span
      className={clsx(
        'inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-medium',
        status === 'online' && 'bg-emerald-500/20 text-emerald-300',
        status === 'offline' && 'bg-rose-500/20 text-rose-300',
        status === 'loading' && 'bg-slate-700 text-slate-300',
      )}
    >
      <span
        className={clsx(
          'h-2 w-2 rounded-full',
          status === 'online' && 'bg-emerald-400',
          status === 'offline' && 'bg-rose-400',
          status === 'loading' && 'bg-slate-400',
        )}
      />
      API {status === 'loading' ? 'verificando...' : status}
    </span>
  );
}

export default HealthBadge;
