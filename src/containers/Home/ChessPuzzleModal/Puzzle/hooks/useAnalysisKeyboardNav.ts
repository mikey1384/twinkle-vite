import { useEffect } from 'react';

export function useAnalysisKeyboardNav({
  phase,
  analysisPrev,
  analysisNext,
  enterFromPly,
  enterFromFinal
}: {
  phase: string;
  analysisPrev: () => void;
  analysisNext: () => void;
  enterFromPly: ({ plyIndex }: { plyIndex: number }) => void;
  enterFromFinal: () => void;
}) {
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      const target = e.target as HTMLElement | null;
      if (target) {
        const tag = (target.tagName || '').toLowerCase();
        const isTyping =
          tag === 'input' || tag === 'textarea' || target.isContentEditable;
        if (isTyping) return;
      }
      if (phase !== 'ANALYSIS') return;
      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        analysisPrev();
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        analysisNext();
      } else if (e.key === 'Home') {
        e.preventDefault();
        enterFromPly({ plyIndex: 0 });
      } else if (e.key === 'End') {
        e.preventDefault();
        enterFromFinal();
      }
    }
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [phase, analysisPrev, analysisNext, enterFromPly, enterFromFinal]);
}
