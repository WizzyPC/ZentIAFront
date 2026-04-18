import axios from 'axios';
import { Artifact, BudgetInfo, Citation, GenerationState, ToolEvent } from '../types/chat';

const baseURL = import.meta.env.VITE_API_BASE_URL ?? 'https://zentia.onrender.com';

const api = axios.create({
  baseURL,
  timeout: 45_000,
});

export interface ApiErrorEnvelope {
  error?: {
    code: string;
    message: string;
    request_id?: string;
    retryable?: boolean;
    details?: Record<string, unknown>;
  };
}

export interface CreateGenerationRequest {
  chat_id: chatId || undefined,
  parent_message_id?: string;
  user_message: {
    content: string;
    attachments?: Array<Record<string, unknown>>;
  };
  mode: 'balanced' | 'fast' | 'creative';
  rag?: {
    enabled: boolean;
    source_ids?: string[];
  };
  tools?: {
    allowed?: string[];
  };
  output?: {
    format?: 'structured' | 'text';
    artifact_types?: string[];
  };
}

export interface CreateGenerationResponse {
  generation_id: string;
  chat_id: string;
  state: GenerationState;
  estimated_cost_usd?: number;
  budget?: BudgetInfo;
  stream_url: string;
  cancel_url: string;
}

export type SSEEvent =
  | { type: 'state'; payload: { generation_id: string; state: GenerationState; timestamp?: string } }
  | { type: 'token'; payload: { generation_id: string; index: number; text: string } }
  | { type: 'tool_call'; payload: ToolEvent }
  | { type: 'tool_result'; payload: ToolEvent }
  | { type: 'artifact'; payload: { generation_id: string; artifact_id: string; version?: string; file_name: string; mime_type: string; size_bytes: number; message_id: string } }
  | { type: 'error'; payload: { generation_id: string; code: string; message: string; retryable?: boolean } }
  | { type: 'done'; payload: { generation_id: string; state: GenerationState; message_id?: string; usage?: { input_tokens_real?: number; output_tokens_real?: number; cost_real_usd?: number }; citations?: Citation[]; finished_at?: string } };

const authHeader = (token: string) => ({
  'Content-Type': 'application/json',
  Authorization: `Bearer ${token}`,
});

export async function getSystemHealth() {
  const response = await api.get('/api/v1/system/health');
  return response.data;
}

export async function createGeneration(payload: CreateGenerationRequest, token: string, idempotencyKey?: string) {
  const headers: Record<string, string> = {
    ...authHeader(token),
    'X-Request-Id': crypto.randomUUID(),
  };

  if (idempotencyKey) {
    headers['Idempotency-Key'] = idempotencyKey;
  }

  console.log('payload', payload);

  try {
    const response = await api.post<CreateGenerationResponse>('/api/v1/chat/generations', payload, { headers });
    return response.data;
  } catch (error) {
    try {
      const res = await fetch(`${baseURL}/api/v1/chat/generations`, {
        method: 'POST',
        headers,
        body: JSON.stringify(payload),
      });
      const text = await res.text();
      console.log('status', res.status, 'body', text);
    } catch (debugError) {
      console.warn('debug fetch failed', debugError);
    }
    throw error;
  }

  const response = await api.post<CreateGenerationResponse>('/api/v1/chat/generations', payload, { headers });
  return response.data;
}

export async function cancelGeneration(generationId: string, token: string, reason?: string) {
  const response = await api.post(
    `/api/v1/chat/generations/${generationId}/cancel`,
    reason ? { reason } : {},
    { headers: authHeader(token) },
  );
  return response.data;
}

export async function regenerateMessage(messageId: string, token: string) {
  const response = await api.post<CreateGenerationResponse>(
    `/api/v1/chat/messages/${messageId}/regenerate`,
    {},
    { headers: authHeader(token) },
  );
  return response.data;
}

export async function editAndRetryMessage(messageId: string, content: string, token: string) {
  const response = await api.post<CreateGenerationResponse>(
    `/api/v1/chat/messages/${messageId}/edit-and-retry`,
    { content },
    { headers: authHeader(token) },
  );
  return response.data;
}

export async function listArtifactsByMessage(messageId: string, token: string) {
  const response = await api.get<{ artifacts: Artifact[] }>(`/api/v1/chat/messages/${messageId}/artifacts`, {
    headers: authHeader(token),
  });
  return response.data.artifacts ?? [];
}

export async function getArtifactDownloadUrl(artifactId: string, token: string) {
  const response = await api.get<{ download_url: string }>(`/api/v1/artifacts/${artifactId}/download-url`, {
    headers: authHeader(token),
  });
  return response.data.download_url;
}

export async function createArtifactShare(artifactId: string, token: string) {
  const response = await api.post<{ share_url: string }>(
    `/api/v1/artifacts/${artifactId}/shares`,
    {},
    { headers: authHeader(token) },
  );
  return response.data.share_url;
}

export async function ingestSource(sourceUrl: string, token: string) {
  const response = await api.post(
    '/api/v1/ingestion/source',
    { source_url: sourceUrl },
    { headers: authHeader(token) },
  );
  return response.data;
}

function parseSSEChunk(buffer: string): { events: SSEEvent[]; rest: string } {
  const chunks = buffer.split('\n\n');
  const rest = chunks.pop() ?? '';
  const events: SSEEvent[] = [];

  for (const raw of chunks) {
    const lines = raw.split('\n');
    const eventLine = lines.find((line) => line.startsWith('event:'));
    const dataLine = lines.find((line) => line.startsWith('data:'));
    if (!eventLine || !dataLine) continue;

    const eventType = eventLine.replace('event:', '').trim();
    const dataRaw = dataLine.replace('data:', '').trim();
    if (!dataRaw) continue;

    try {
      const payload = JSON.parse(dataRaw);
      if (
        eventType === 'state' ||
        eventType === 'token' ||
        eventType === 'tool_call' ||
        eventType === 'tool_result' ||
        eventType === 'artifact' ||
        eventType === 'error' ||
        eventType === 'done'
      ) {
        events.push({ type: eventType, payload } as SSEEvent);
      }
    } catch {
      // ignore malformed event
    }
  }

  return { events, rest };
}

export async function streamGeneration({
  generationId,
  token,
  signal,
  onEvent,
}: {
  generationId: string;
  token: string;
  signal?: AbortSignal;
  onEvent: (event: SSEEvent) => void;
}) {
  const url = `${baseURL}/api/v1/chat/generations/${generationId}/stream`;
  const response = await fetch(url, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'text/event-stream',
      'Cache-Control': 'no-cache',
    },
    signal,
  });

  if (!response.ok || !response.body) {
    throw new Error(`Falha ao abrir SSE (${response.status}).`);
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';

  while (true) {
    const { value, done } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const parsed = parseSSEChunk(buffer);
    buffer = parsed.rest;
    parsed.events.forEach(onEvent);
  }
}

export function formatApiError(error: unknown): string {
  if (axios.isAxiosError(error)) {
    const apiData = error.response?.data as ApiErrorEnvelope | undefined;
    if (apiData?.error?.message) {
      return apiData.error.message;
    }

    if (error.response) {
      return `Erro no servidor (${error.response.status}).`;
    }

    if (error.request) {
      return 'Não foi possível conectar à API. Verifique sua internet e tente novamente.';
    }
  }

  if (error instanceof Error && error.message) {
    return error.message;
  }

  return 'Ocorreu um erro inesperado. Tente novamente em alguns segundos.';
}
