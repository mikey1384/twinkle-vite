import React, { useCallback, useEffect, useRef, useState } from 'react';
import { css, cx } from '@emotion/css';

// The like / reply / reward + heart / ask / share row of a comment. It stays
// on ONE row and never wraps: when the buttons do not fit, the row scrolls
// sideways. A soft fade on the right edge shows only while more buttons are
// hidden (and on the left once scrolled), and goes away at the end.
//
// The outer box is the container the buttons' @container queries measure (it
// is exactly as wide as the comment column, like the row it replaces). The
// inner scroller is a little larger than the column on the sides, above and
// below, so raised-button shadows and focus rings are not clipped by the scroll
// box and nothing moves compared to a plain row: side and bottom padding have
// matching negative margins, and the top padding is cancelled by shifting the
// box up (not by margin-top, which callers and the runtime drawer set). Its
// padding ignores the pointer so the empty padding never blocks what is
// underneath.
const outerClass = css`
  min-width: 0;
  container-type: inline-size;
`;

const scrollerClass = css`
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: nowrap;
  min-width: 0;
  overflow-x: auto;
  overflow-y: hidden;
  overscroll-behavior-x: contain;
  -webkit-overflow-scrolling: touch;
  scrollbar-width: none;
  &::-webkit-scrollbar {
    display: none;
  }
  padding: 0.4rem 0.8rem 2.4rem;
  margin-inline: -0.8rem;
  margin-bottom: -2.8rem;
  position: relative;
  top: -0.4rem;
  scroll-padding-inline: 4rem;
  pointer-events: none;
  > * {
    pointer-events: auto;
  }
  &[data-more-right='true'] {
    -webkit-mask-image: linear-gradient(
      to right,
      #000 calc(100% - 4rem),
      transparent
    );
    mask-image: linear-gradient(to right, #000 calc(100% - 4rem), transparent);
  }
  &[data-more-left='true'][data-more-right='true'] {
    -webkit-mask-image: linear-gradient(
      to right,
      transparent,
      #000 3rem,
      #000 calc(100% - 4rem),
      transparent
    );
    mask-image: linear-gradient(
      to right,
      transparent,
      #000 3rem,
      #000 calc(100% - 4rem),
      transparent
    );
  }
  &[data-more-left='true']:not([data-more-right='true']) {
    -webkit-mask-image: linear-gradient(to right, transparent, #000 3rem);
    mask-image: linear-gradient(to right, transparent, #000 3rem);
  }
`;

export default function ActionRow({
  children,
  className,
  style
}: {
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
}) {
  const rowRef = useRef<HTMLDivElement>(null);
  const [more, setMore] = useState({ left: false, right: false });

  const measure = useCallback(() => {
    const row = rowRef.current;
    if (!row) return;
    const left = row.scrollLeft > 2;
    const right = row.scrollLeft + row.clientWidth < row.scrollWidth - 2;
    setMore((prev) =>
      prev.left === left && prev.right === right ? prev : { left, right }
    );
  }, []);

  // Observe once: the row, its direct children (font swaps, an image or label
  // appearing or hiding) and, cheaply, any change to its contents.
  useEffect(() => {
    const row = rowRef.current;
    if (!row) return;
    measure();
    const resizeObserver =
      typeof ResizeObserver === 'undefined'
        ? null
        : new ResizeObserver(measure);
    const observed = new Set<Element>();
    function syncObserved() {
      if (!row || !resizeObserver) return;
      const current = new Set<Element>([row, ...Array.from(row.children)]);
      observed.forEach((element) => {
        if (!current.has(element)) {
          resizeObserver.unobserve(element);
          observed.delete(element);
        }
      });
      current.forEach((element) => {
        if (!observed.has(element)) {
          resizeObserver.observe(element);
          observed.add(element);
        }
      });
    }
    syncObserved();
    const mutationObserver =
      typeof MutationObserver === 'undefined'
        ? null
        : new MutationObserver(() => {
            syncObserved();
            measure();
          });
    mutationObserver?.observe(row, {
      childList: true,
      subtree: true,
      characterData: true
    });
    return () => {
      resizeObserver?.disconnect();
      mutationObserver?.disconnect();
    };
  }, [measure]);

  return (
    <div className={outerClass} style={style}>
      <div
        ref={rowRef}
        className={cx('comment__action-row', scrollerClass, className)}
        data-more-left={more.left}
        data-more-right={more.right}
        onScroll={measure}
      >
        {children}
      </div>
    </div>
  );
}
