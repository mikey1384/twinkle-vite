import { useLayoutEffect, useState, type RefObject } from 'react';

// Whether a scroller still hides content below its fold (Mikey 10-11: a
// lesson page or a rule card can scroll, and an iPhone shows no scrollbar
// until you scroll, so its "more below" cue has to come from us). True while
// more than `slack` px is out of view; it updates on scroll, on a resize of
// the scroller or its content, and on any change inside it. `key` restarts
// the watch when the content is swapped for a new page.
export function useMoreBelow(
  ref: RefObject<HTMLElement | null>,
  key: unknown,
  slack = 4
) {
  const [more, setMore] = useState(false);
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) {
      setMore(false);
      return;
    }
    const check = () =>
      setMore(el.scrollHeight - el.clientHeight - el.scrollTop > slack);
    check();
    el.addEventListener('scroll', check, { passive: true });
    const sizes = new ResizeObserver(check);
    sizes.observe(el);
    Array.from(el.children).forEach((child) => sizes.observe(child));
    const changes = new MutationObserver(check);
    changes.observe(el, {
      childList: true,
      subtree: true,
      characterData: true
    });
    return () => {
      el.removeEventListener('scroll', check);
      sizes.disconnect();
      changes.disconnect();
    };
  }, [ref, key, slack]);
  return more;
}

// one tap on a "more" cue: the next screenful, keeping a little of what was
// just read in view (`covered`: px of the scroller hidden under a pinned
// footer)
export function scrollToMore(el: HTMLElement | null, covered = 0) {
  if (!el) return;
  el.scrollBy({
    top: Math.max(40, el.clientHeight - covered - 32),
    behavior: 'smooth'
  });
}
