export type Sender = 'user' | 'assistant';
export type Feedback = 'up' | 'down' | null;

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
  mode: 'balanced' | 'fast' | 'creative';
  messages: Message[];
}
  title: string;
  createdAt: string;
  updatedAt: string;
  messages: Message[];
}

export interface User {
  name: string;
  email: string;
  plan: 'Free' | 'Pro' | 'Enterprise';
}
