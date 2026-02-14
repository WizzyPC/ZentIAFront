export type Sender = 'user' | 'assistant';
export type Feedback = 'up' | 'down' | null;
export type ChatMode = 'balanced' | 'fast' | 'creative';

export interface Message {
  id: string;
  sender: Sender;
  content: string;
  createdAt: string;
  feedback?: Feedback;
  model?: string;
}

export interface ChatSession {
  id: string;
  userId: string;
  title: string;
  createdAt: string;
  updatedAt: string;
  mode: ChatMode;
  messages: Message[];
}
