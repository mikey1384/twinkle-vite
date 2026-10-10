import { useToast } from '~/contexts/Toast';
import { useChatPins } from '~/containers/Chat/Pins/context';

// Tapping a quote brings up the message it quotes. A message already on
// screen is scrolled to and flashed; an older one opens through the pinned
// messages' "Jump to message" window, which loads it with the chat's own
// access checks. General Chat has no such window, so there it can only
// scroll to a message that is already loaded.
export default function useJumpToQuotedMessage() {
  const pins = useChatPins();
  const showToast = useToast();

  return function jumpToQuotedMessage(messageId: number) {
    const id = Number(messageId || 0);
    if (!Number.isSafeInteger(id) || id <= 0) return;
    const element =
      typeof document === 'undefined'
        ? null
        : document.querySelector<HTMLElement>(`[data-chat-message-id="${id}"]`);
    if (element) {
      element.scrollIntoView({ block: 'center', behavior: 'smooth' });
      element.animate?.(
        [
          {
            boxShadow: 'inset 3px 0 #418ceb',
            background: 'rgba(65, 140, 235, 0.14)'
          },
          { boxShadow: 'inset 3px 0 transparent', background: 'transparent' }
        ],
        { duration: 1800, easing: 'ease-out' }
      );
      return;
    }
    if (pins) {
      void pins.jump(id);
      return;
    }
    showToast?.({
      message: 'That message is further up. Scroll up to load it.'
    });
  };
}
