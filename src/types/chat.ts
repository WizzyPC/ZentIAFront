export type Sender = 'user' | 'assistant';

export interface Message {
  id: string;
  sender: Sender;
  content: string;
  createdAt: string;
}

export interface ChatSession {
  id: string;
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
