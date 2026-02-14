import axios from 'axios';

const baseURL = import.meta.env.VITE_API_BASE_URL ?? 'https://zentia.onrender.com';

const api = axios.create({
  baseURL,
  timeout: 30_000,
});

export interface ChatCompleteRequest {
  message: string;
  chat_history?: Array<{ role: 'user' | 'assistant'; content: string }>;
}

export interface ChatCompleteResponse {
  response?: string;
  answer?: string;
  message?: string;
}

export async function getSystemHealth() {
  const { data } = await api.get('/api/v1/system/health');
  return data;
}

export async function completeChat(payload: ChatCompleteRequest) {
  const { data } = await api.post<ChatCompleteResponse>('/api/v1/chat/complete', payload);
  return data;
}

export async function ingestSource(sourceUrl: string) {
  const { data } = await api.post('/api/v1/ingestion/source', {
    source_url: sourceUrl,
  });
  return data;
}

export function formatApiError(error: unknown) {
  if (axios.isAxiosError(error)) {
    if (error.response) {
      const detail =
        (error.response.data as { detail?: string; message?: string })?.detail ??
        (error.response.data as { detail?: string; message?: string })?.message;
      return detail ?? `Erro no servidor (${error.response.status}).`;
    }
    if (error.request) {
      return 'Não foi possível conectar à API. Verifique sua internet ou tente novamente.';
    }
  }

  return 'Ocorreu um erro inesperado. Tente novamente.';
}
