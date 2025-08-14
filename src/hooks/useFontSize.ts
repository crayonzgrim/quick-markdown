import { useEffect, useState } from 'react';
import { getConfig, setConfig } from '../utils/storage';

const MIN_FONT_SIZE = 4;
const MAX_FONT_SIZE = 100;

export const useFontSize = () => {
  const [fontSize, setFontSize] = useState(12);

  useEffect(() => {
    const loadFontSize = async () => {
      const savedFontSize = await getConfig('font-size', '12');
      if (savedFontSize) {
        const size = parseInt(savedFontSize.toString());
        setFontSize(Math.max(MIN_FONT_SIZE, Math.min(size, MAX_FONT_SIZE)));
      }
    };

    loadFontSize();
  }, []);

  const updateFontSize = (newSize: number) => {
    const validSize = Math.max(MIN_FONT_SIZE, Math.min(newSize, MAX_FONT_SIZE));
    setFontSize(validSize);
    setConfig('font-size', validSize.toString());
  };

  return { 
    fontSize, 
    updateFontSize,
    MIN_FONT_SIZE,
    MAX_FONT_SIZE 
  };
};