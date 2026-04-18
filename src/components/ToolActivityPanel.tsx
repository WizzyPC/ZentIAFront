import clsx from 'clsx';
import { ToolEvent } from '../types/chat';

interface Props {
  events: ToolEvent[];
}

function ToolActivityPanel({ events }: Props) {
  if (events.length === 0) return null;

  return (
    <div className="rounded-2xl border border-indigo-500/20 bg-slate-900/70 p-3">
      <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-indigo-300">Atividade da IA</h3>
      <div className="space-y-2">
        {events.map((event) => (
          <div key={event.tool_call_id} className="rounded-lg border border-slate-700 bg-slate-950/70 p-2 text-xs">
            <div className="mb-1 flex items-center justify-between">
              <p className="font-medium text-slate-200">{event.tool_name}</p>
              <span
                className={clsx(
                  'rounded-full px-2 py-0.5',
                  event.status === 'started' && 'bg-cyan-500/20 text-cyan-300',
                  event.status === 'completed' && 'bg-emerald-500/20 text-emerald-300',
                  event.status === 'failed' && 'bg-rose-500/20 text-rose-300',
                )}
              >
                {event.status}
              </span>
            </div>
            {event.error?.message ? (
              <p className="text-rose-300">{event.error.message}</p>
            ) : (
              <p className="text-slate-400">{event.latency_ms ? `${event.latency_ms}ms` : 'Executando...'}</p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

export default ToolActivityPanel;
