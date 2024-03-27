import React, { useEffect, useRef } from 'react';
import { addEvent, removeEvent } from '../listenerHelpers';

const BodyRef = document.scrollingElement || document.documentElement;

export default function useInfiniteScroll({
  feedsLength,
  scrollable,
  onScrollToBottom
}: {
  feedsLength: number;
  scrollable: boolean;
  onScrollToBottom: () => void;
}) {
  const prevFeedsLength = useRef(0);
  const scrollHeightRef = useRef(0);
  const scrollPositionRef = useRef({ desktop: 0, mobile: 0 });
  const timerRef: React.MutableRefObject<any> = useRef(0);

  useEffect(() => {
    addEvent(window, 'scroll', onScroll);
    addEvent(document.getElementById('App'), 'scroll', onScroll);

    function onScroll() {
      clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => {
        if (
          document.getElementById('App')?.scrollHeight ||
          0 > scrollHeightRef.current ||
          BodyRef.scrollTop > scrollHeightRef.current
        ) {
          scrollHeightRef.current = Math.max(
            document.getElementById('App')?.scrollHeight || 0,
            BodyRef.scrollTop
          );
        }
        if (scrollable && scrollHeightRef.current !== 0) {
          scrollPositionRef.current = {
            desktop: document.getElementById('App')?.scrollTop || 0,
            mobile: BodyRef.scrollTop
          };
          if (
            scrollPositionRef.current.desktop >=
              scrollHeightRef.current - window.innerHeight - 3000 ||
            scrollPositionRef.current.mobile >=
              scrollHeightRef.current - window.innerHeight - 3000
          ) {
            onScrollToBottom();
          }
        }
      }, 100);
    }

    return function cleanUp() {
      removeEvent(window, 'scroll', onScroll);
      removeEvent(document.getElementById('App'), 'scroll', onScroll);
    };
  }, [onScrollToBottom, scrollable]);

  useEffect(() => {
    if (feedsLength < prevFeedsLength.current) {
      scrollHeightRef.current = Math.max(
        document.getElementById('App')?.scrollHeight || 0,
        BodyRef?.scrollTop || 0
      );
    }
    prevFeedsLength.current = feedsLength;
  }, [feedsLength]);
}
