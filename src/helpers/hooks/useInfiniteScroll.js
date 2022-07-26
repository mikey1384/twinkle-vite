import { useEffect, useRef } from 'react';
import { addEvent, removeEvent } from '../listenerHelpers';

const BodyRef = document.scrollingElement || document.documentElement;

export default function useInfiniteScroll({
  feedsLength,
  scrollable,
  onScrollToBottom
}) {
  const prevFeedsLength = useRef(0);
  const scrollHeightRef = useRef(0);
  const scrollPositionRef = useRef({ desktop: 0, mobile: 0 });
  const timerRef = useRef(null);

  useEffect(() => {
    addEvent(window, 'scroll', onScroll);
    addEvent(document.getElementById('App'), 'scroll', onScroll);

    function onScroll() {
      clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => {
        if (
          document.getElementById('App').scrollHeight >
            scrollHeightRef.current ||
          BodyRef.scrollTop > scrollHeightRef.current
        ) {
          scrollHeightRef.current = Math.max(
            document.getElementById('App').scrollHeight,
            BodyRef.scrollTop
          );
        }
        if (scrollable && scrollHeightRef.current !== 0) {
          scrollPositionRef.current = {
            desktop: document.getElementById('App').scrollTop,
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
      }, 300);
    }

    return function cleanUp() {
      removeEvent(window, 'scroll', onScroll);
      removeEvent(document.getElementById('App'), 'scroll', onScroll);
    };
  }, [onScrollToBottom, scrollable]);

  useEffect(() => {
    if (feedsLength < prevFeedsLength.current) {
      scrollHeightRef.current = Math.max(
        document.getElementById('App').scrollHeight,
        BodyRef.scrollTop
      );
    }
    prevFeedsLength.current = feedsLength;
  }, [feedsLength]);
}
