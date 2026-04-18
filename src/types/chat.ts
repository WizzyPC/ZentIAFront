export type ChatRole = 'user' | 'assistant' | 'system' | 'tool';
export type Feedback = 'up' | 'down' | null;
export type ChatMode = 'balanced' | 'fast' | 'creative';
export type GenerationState = 'idle' | 'generating' | 'streaming' | 'completed' | 'cancelled' | 'failed';
export type MessageState = 'pending' | 'streaming' | 'completed' | 'failed' | 'cancelled';

export interface Citation {
  source_id: string;
  title: string;
  url: string;
}

export interface Artifact {
  id: string;
  message_id: string;
  generation_id: string;
  file_name: string;
  mime_type: string;
  ext: string;
  version: string;
  size_bytes: number;
  preview_supported: boolean;
  created_at: string;
}

export interface ToolEvent {
  tool_call_id: string;
  generation_id: string;
  tool_name: string;
  status: 'started' | 'completed' | 'failed';
  input?: Record<string, unknown>;
  result?: Record<string, unknown>;
  error?: { code: string; message: string } | null;
  latency_ms?: number;
  started_at?: string;
}

export interface ChatMessage {
  id: string;
  chat_id: string;
  role: ChatRole;
  content: string;
  blocks: Array<Record<string, unknown>>;
  state: MessageState;
  generation_id?: string;
  artifacts: string[];
  citations: Citation[];
  version: number;
  created_at: string;
  updated_at: string;
  feedback?: Feedback;
  model?: string;
}

export interface Generation {
  id: string;
  chat_id: string;
  state: GenerationState;
  estimated_cost_usd?: number;
  cost_real_usd?: number;
  input_tokens_real?: number;
  output_tokens_real?: number;
  started_at: string;
  finished_at?: string;
  message_id?: string;
  error?: { code: string; message: string; retryable?: boolean } | null;
}

export interface BudgetInfo {
  allowed: boolean;
  remaining_usd?: number;
}

export interface ChatSession {
  id: string;
  userId: string;
  title: string;
  createdAt: string;
  updatedAt: string;
  mode: ChatMode;
  messages: ChatMessage[];
  generations: Generation[];
}
