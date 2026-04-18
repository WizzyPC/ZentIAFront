import { Download, Share2 } from 'lucide-react';
import { Artifact } from '../types/chat';

interface Props {
  artifacts: Artifact[];
  onDownload: (artifactId: string) => Promise<void>;
  onShare: (artifactId: string) => Promise<void>;
}

function ArtifactGallery({ artifacts, onDownload, onShare }: Props) {
  if (artifacts.length === 0) return null;

  return (
    <div className="rounded-2xl border border-cyan-500/20 bg-slate-900/70 p-3">
      <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-cyan-300">Artifacts</h3>
      <div className="grid gap-2 sm:grid-cols-2">
        {artifacts.map((artifact) => (
          <article key={artifact.id} className="rounded-xl border border-slate-700 bg-slate-950/70 p-3 text-xs">
            <p className="truncate font-medium text-slate-100">{artifact.file_name}</p>
            <p className="mt-1 text-slate-400">
              {artifact.version} • {(artifact.size_bytes / 1024).toFixed(1)}kb
            </p>
            <div className="mt-2 flex gap-1">
              <button
                type="button"
                onClick={() => onDownload(artifact.id)}
                className="inline-flex items-center gap-1 rounded-md bg-cyan-500/20 px-2 py-1 text-cyan-200"
              >
                <Download size={12} /> Download
              </button>
              <button
                type="button"
                onClick={() => onShare(artifact.id)}
                className="inline-flex items-center gap-1 rounded-md bg-indigo-500/20 px-2 py-1 text-indigo-200"
              >
                <Share2 size={12} /> Share
              </button>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}

export default ArtifactGallery;
