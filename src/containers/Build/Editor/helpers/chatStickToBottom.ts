export const CHAT_BOTTOM_SCROLL_THRESHOLD = 120;

// Position alone cannot tell "reading the latest line" from "just started
// scrolling up": both sit within the threshold. While a reply streams, content
// grows every frame, so a reader who is still inside the threshold gets pulled
// back down before they can leave it. Any upward move therefore releases the
// pin at once; only moving down into the threshold (or landing on the bottom)
// takes it again.
export function resolveChatStickToBottom({
  scrollTop,
  scrollHeight,
  clientHeight,
  previousScrollTop,
  threshold = CHAT_BOTTOM_SCROLL_THRESHOLD
}: {
  scrollTop: number;
  scrollHeight: number;
  clientHeight: number;
  previousScrollTop: number | null;
  threshold?: number;
}) {
  const distanceFromBottom = scrollHeight - scrollTop - clientHeight;
  // Shrinking content clamps scrollTop downward too, but that leaves the view
  // on the bottom edge, which is not a reader moving away.
  const movedUp =
    previousScrollTop !== null &&
    scrollTop < previousScrollTop &&
    distanceFromBottom > 1;
  if (movedUp) return false;
  return distanceFromBottom <= threshold;
}
