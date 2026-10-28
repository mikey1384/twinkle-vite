import { useLayoutEffect, useRef, useState } from 'react';

// The normal marble battle's fit algorithm, shared with the untimed review.
export function useStageFit({ lessonOpen = false, missOpen, resetKey }: {
  lessonOpen?: boolean;
  missOpen: boolean;
  resetKey: string;
}) {
  const bodyRef = useRef<HTMLDivElement>(null);
  const dockRef = useRef<HTMLDivElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const lessonOpenRef = useRef(lessonOpen);
  lessonOpenRef.current = lessonOpen;
  const missOpenRef = useRef(missOpen);
  missOpenRef.current = missOpen;
  const missRoomyRef = useRef(false);
  const [stageWidth, setStageWidth] = useState<number | undefined>(undefined);

  useLayoutEffect(() => {
    if (cardRef.current) cardRef.current.scrollTop = 0;
  }, [resetKey]);

  useLayoutEffect(() => {
    const body = bodyRef.current;
    const dock = dockRef.current;
    if (!body || !dock) return;
    function fit() {
      if (!body || !dock) return;
      const style = getComputedStyle(body);
      const innerW =
        body.clientWidth -
        parseFloat(style.paddingLeft) -
        parseFloat(style.paddingRight);
      const innerH =
        body.clientHeight -
        parseFloat(style.paddingTop) -
        parseFloat(style.paddingBottom);
      const ratio = 960 / 380;
      let width: number;
      const card = cardRef.current;
      const rule = card?.querySelector<HTMLElement>('[data-fit-flex]');
      if (!missOpenRef.current) missRoomyRef.current = false;
      else if (
        card &&
        (card.scrollHeight > card.clientHeight + 1 ||
          (!!rule &&
            rule.scrollHeight > rule.clientHeight + 1 &&
            rule.clientHeight < parseFloat(style.fontSize) * 6.4))
      )
        missRoomyRef.current = true;
      if (style.flexDirection === 'row') {
        const gap = parseFloat(style.columnGap) || 0;
        // Landscape needs room for the sentence and two columns of answers.
        // A lesson page has no answers to tap, and a miss's card holds the
        // whole sentence, its rule card and Continue: the card takes more room.
        width = Math.min(
          (innerW - gap) *
            (lessonOpenRef.current ? 0.28 : missRoomyRef.current ? 0.22 : 0.4),
          innerH * ratio
        );
      } else {
        // the dock's natural height: every child at its content height
        let need = 0;
        const dockGap = parseFloat(getComputedStyle(dock).rowGap) || 0;
        Array.from(dock.children).forEach((child, i) => {
          const el = child as HTMLElement;
          need +=
            el.scrollHeight +
            (el.offsetHeight - el.clientHeight) +
            (i ? dockGap : 0);
        });
        // a part that shrinks to fit (a miss's rule card) still wants its
        // own height, up to its cap: the level gives way first
        dock.querySelectorAll<HTMLElement>('[data-fit-flex]').forEach((el) => {
          const cap = parseFloat(getComputedStyle(el).maxHeight);
          const wants = Math.min(el.scrollHeight, cap >= 0 ? cap : Infinity);
          need += Math.max(0, wants - el.clientHeight);
        });
        const gap = parseFloat(style.rowGap) || 0;
        // the level never shrinks below about a third of the screen while a
        // question is asked (a tall card scrolls instead); a lesson page or a
        // miss's card is read, not played, and may take more of it
        const floor = Math.min(
          innerW,
          innerH *
            (lessonOpenRef.current ? 0.12 : missOpenRef.current ? 0.2 : 0.32) *
            ratio
        );
        width = Math.max(
          floor,
          Math.min(innerW, 1320, (innerH - need - gap) * ratio)
        );
      }
      setStageWidth(Math.max(160, Math.floor(width)));
    }
    fit();
    const observer = new ResizeObserver(fit);
    observer.observe(body);
    observer.observe(dock);
    const mutations = new MutationObserver(fit);
    mutations.observe(dock, {
      childList: true,
      characterData: true,
      subtree: true
    });
    return () => {
      observer.disconnect();
      mutations.disconnect();
    };
  }, []);

  return { bodyRef, dockRef, cardRef, stageWidth };
}
