export interface Note {
  id: string;
  title: string;
  content: string;
  createdAt: number;
  updatedAt: number;
}

export type Theme = 'dark' | 'light';

export interface AppConfig {
  theme: Theme;
  fontSize: number;
}