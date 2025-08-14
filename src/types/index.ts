import type { PreviewType } from '@uiw/react-md-editor';

export interface Note {
  id: string;
  title: string;
  content: string;
  createdAt: number;
  updatedAt: number;
}

export type Theme = 'dark' | 'light';

export type MdScreen = PreviewType;

export interface AppConfig {
  theme: Theme;
  fontSize: number;
  mdScreen: MdScreen;
}