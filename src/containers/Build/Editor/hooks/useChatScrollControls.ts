import type { RefObject } from 'react';

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

  function isChatNearBottom(threshold = 120) {
    const container = chatScrollRef.current;
    if (!container) return true;
    const distanceFromBottom =
      container.scrollHeight - container.scrollTop - container.clientHeight;
    return distanceFromBottom <= threshold;
  }

  function handleChatScroll() {
    shouldAutoScrollRef.current = isChatNearBottom();
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
