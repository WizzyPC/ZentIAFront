import axios from 'axios';

const baseURL = import.meta.env.VITE_API_BASE_URL ?? 'https://zentia.onrender.com';

const api = axios.create({
  baseURL,
  timeout: 45_000,
});

export interface ChatCompleteRequest {
  message: string;
  chatId?: string; // opcional
  history?: Array<{ role: 'user' | 'assistant'; content: string }>; // renomeado de chat_history
  // mode?: 'balanced' | 'fast' | 'creative'; // removido, backend não usa
}

export interface ChatCompleteResponse {
  response?: string;
  answer?: string;
  message?: string;
  model?: string;
}

const tokenPreview = (token: string) => `Bearer ${token.slice(0, 8)}…`;

const authHeader = (token: string) => ({
  'Content-Type': 'application/json',
  Authorization: `Bearer ${token}`,
});

export async function getSystemHealth() {
  try {
    const response = await api.get('/api/v1/system/health');
    console.log('Front: API response', {
      url: '/api/v1/system/health',
      status: response.status,
      data: response.data,
    });
    return response.data;
  } catch (error) {
    console.error('Front: API error', {
      url: '/api/v1/system/health',
      error,
    });
    throw error;
  }
}

export async function completeChat(payload: ChatCompleteRequest, token: string) {
  // se vier chat_history, mapeia para history automaticamente
  const fixedPayload = {
    ...payload,
    history: payload.history ?? (payload as any).chat_history ?? [],
  };

  const headers = authHeader(token);
  console.log('Front: API call chat/complete', {
    url: '/api/v1/chat/complete',
    authHeader: tokenPreview(token),
    headers: {
      ...headers,
      Authorization: tokenPreview(token),
    },
    payload: fixedPayload,
  });

  try {
    const response = await api.post<ChatCompleteResponse>('/api/v1/chat/complete', fixedPayload, {
      headers,
    });

    console.log('Front: API response', {
      url: '/api/v1/chat/complete',
      status: response.status,
      data: response.data,
    });

    return response.data;
  } catch (error) {
    console.error('Front: API error', {
      url: '/api/v1/chat/complete',
      authHeader: tokenPreview(token),
      error,
    });
    throw error;
  }
}

export async function ingestSource(sourceUrl: string, token: string) {
  const headers = authHeader(token);
  console.log('Front: API call ingestion/source', {
    url: '/api/v1/ingestion/source',
    authHeader: tokenPreview(token),
    headers: {
      ...headers,
      Authorization: tokenPreview(token),
    },
    payload: { source_url: sourceUrl },
  });

  try {
    const response = await api.post(
      '/api/v1/ingestion/source',
      { source_url: sourceUrl },
      { headers },
    );

    console.log('Front: API response', {
      url: '/api/v1/ingestion/source',
      status: response.status,
      data: response.data,
    });

    return response.data;
  } catch (error) {
    console.error('Front: API error', {
      url: '/api/v1/ingestion/source',
      authHeader: tokenPreview(token),
      error,
    });
    throw error;
  }
}

export function formatApiError(error: unknown): string {
  console.warn('Front: formatting API error', {
    error,
    stack: error instanceof Error ? error.stack : undefined,
  });

  if (axios.isAxiosError(error)) {
    if (error.response) {
      const payload = error.response.data as { detail?: string; message?: string } | undefined;
      const detail = payload?.detail ?? payload?.message;
      return detail ?? `Erro no servidor (${error.response.status}).`;
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
