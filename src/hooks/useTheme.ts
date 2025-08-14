import { useEffect, useState } from 'react';
import { chromeStorage } from '../utils/chromeStorage';
import type { Theme } from '../types';

export const useTheme = () => {
  const [theme, setTheme] = useState<Theme>('dark');

  useEffect(() => {
    const loadTheme = async () => {
      try {
        const result = await chromeStorage.get(['theme']);
        if (result.theme) {
          setTheme(result.theme as Theme);
        }
      } catch (error) {
        console.error('테마 로드 실패:', error);
      }
    };

    loadTheme();
  }, []);

  const toggleTheme = async () => {
    try {
      const result = await chromeStorage.get(['theme']);
      const currentTheme = result.theme || 'dark';
      const newTheme: Theme = currentTheme === 'dark' ? 'light' : 'dark';

      await chromeStorage.set({ theme: newTheme });
      setTheme(newTheme);
    } catch (error) {
      console.error('테마 토글 실패:', error);
      const newTheme: Theme = theme === 'dark' ? 'light' : 'dark';
      setTheme(newTheme);
    }
  };

  return { theme, toggleTheme };
};