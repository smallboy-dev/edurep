import { useState, useEffect, useCallback } from 'react';

export function useFullscreen() {
  const [isFullscreen, setIsFullscreen] = useState(false);

  const checkFullscreen = useCallback(() => {
    setIsFullscreen(!!document.fullscreenElement);
  }, []);

  useEffect(() => {
    document.addEventListener('fullscreenchange', checkFullscreen);
    return () => document.removeEventListener('fullscreenchange', checkFullscreen);
  }, [checkFullscreen]);

  const enterFullscreen = async (lockKeyboard = false) => {
    try {
      if (!document.fullscreenElement) {
        await document.documentElement.requestFullscreen();
      }
      
      if (lockKeyboard && 'keyboard' in navigator && 'lock' in navigator.keyboard) {
        await navigator.keyboard.lock();
        console.log("Keyboard locked globally (Alt+Tab, Escape intercepted)");
      }
    } catch (err) {
      console.error("Fullscreen/Lock request failed:", err);
    }
  };

  const exitFullscreen = async () => {
    try {
      if (document.fullscreenElement) {
        if ('keyboard' in navigator && 'unlock' in navigator.keyboard) {
          navigator.keyboard.unlock();
        }
        await document.exitFullscreen();
      }
    } catch (err) {
      console.error("Exit fullscreen failed:", err);
    }
  };

  return { isFullscreen, enterFullscreen, exitFullscreen };
}
