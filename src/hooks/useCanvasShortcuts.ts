import { useEffect } from 'react';

export interface UseCanvasShortcutsOptions {
  onUndo: () => void;
  onRedo: () => void;
}

export function useCanvasShortcuts({ onUndo, onRedo }: UseCanvasShortcutsOptions) {
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      const isInput = ['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement).tagName);
      if (isInput) return;

      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') {
        if (e.shiftKey) {
          e.preventDefault();
          onRedo();
        } else {
          e.preventDefault();
          onUndo();
        }
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'y') {
        e.preventDefault();
        onRedo();
      }
    };

    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, [onUndo, onRedo]);
}
