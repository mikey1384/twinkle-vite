import { useRef, type RefObject } from 'react';
import { resolveChatStickToBottom } from '../helpers/chatStickToBottom';

interface UseChatScrollControlsOptions {
  chatEndRef: RefObject<HTMLDivElement | null>;
  chatScrollRef: RefObject<HTMLDivElement | null>;
  pendingScrollBehaviorRef: { current: ScrollBehavior };
  scrollRafRef: { current: number | null };
  shouldAutoScrollRef: { current: boolean };
}

export default function useChatScrollControls({
  chatEndRef,
  chatScrollRef,
  pendingScrollBehaviorRef,
  scrollRafRef,
  shouldAutoScrollRef
}: UseChatScrollControlsOptions) {
  const lastScrollTopRef = useRef<number | null>(null);

  function scrollChatToBottom(
    behavior: ScrollBehavior = 'smooth',
    options?: { force?: boolean }
  ) {
    if (!options?.force && !shouldAutoScrollRef.current) {
      return;
    }
    pendingScrollBehaviorRef.current = behavior;
    if (scrollRafRef.current !== null) return;
    scrollRafRef.current = requestAnimationFrame(() => {
      scrollRafRef.current = null;
      if (chatScrollRef.current) {
        chatScrollRef.current.scrollTo({
          top: chatScrollRef.current.scrollHeight,
          behavior: pendingScrollBehaviorRef.current
        });
        return;
      }
      chatEndRef.current?.scrollIntoView({
        behavior: pendingScrollBehaviorRef.current,
        block: 'nearest',
        inline: 'nearest'
      });
    });
  }

  function handleChatScroll() {
    const container = chatScrollRef.current;
    if (!container) {
      shouldAutoScrollRef.current = true;
      return;
    }
    shouldAutoScrollRef.current = resolveChatStickToBottom({
      scrollTop: container.scrollTop,
      scrollHeight: container.scrollHeight,
      clientHeight: container.clientHeight,
      previousScrollTop: lastScrollTopRef.current
    });
    lastScrollTopRef.current = container.scrollTop;
    if (!shouldAutoScrollRef.current && scrollRafRef.current !== null) {
      cancelAnimationFrame(scrollRafRef.current);
      scrollRafRef.current = null;
    }
  }

  function maybeAutoScrollDuringStream() {
    if (!shouldAutoScrollRef.current) return;
    scrollChatToBottom('auto');
  }

  return {
    handleChatScroll,
    maybeAutoScrollDuringStream,
    scrollChatToBottom
  };
}
