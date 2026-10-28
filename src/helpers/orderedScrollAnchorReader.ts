// Opt-in for a single vertical list whose anchors are non-overlapping direct
// children (Home). Nested comment/page anchors keep the general selection path.
// Keep DOM order, not cached geometry: late images and wrapped footers can move
// rows without changing the list. Ordinary scrolls read one row or O(log n)
// rectangles instead of measuring every loaded row.
export function createOrderedScrollAnchorReader(container: HTMLElement) {
  let items: HTMLElement[] | null = null;
  let currentIndex = -1;
  const observer = typeof MutationObserver === 'function'
    ? new MutationObserver(invalidate)
    : null;
  observer?.observe(container, { childList: true });

  return { read, dispose: () => observer?.disconnect() };

  function invalidate() {
    items = null;
    currentIndex = -1;
  }

  function read(anchorLine: number): HTMLElement[] {
    if (!observer || observer.takeRecords().length) invalidate();
    if (!items) {
      items = Array.from(container.children).filter(
        (item): item is HTMLElement => item instanceof HTMLElement && (
          item.dataset.scrollAnchorId !== undefined ||
          item.dataset.scrollAnchorContentKey !== undefined
        )
      );
    }
    const current = items[currentIndex];
    if (current) {
      const rect = current.getBoundingClientRect();
      if (rect.height > 1 && rect.top <= anchorLine && rect.bottom >= anchorLine) {
        return [current];
      }
    }

    let low = 0;
    let high = items.length;
    while (low < high) {
      const middle = low + Math.floor((high - low) / 2);
      if (items[middle].getBoundingClientRect().bottom < anchorLine) {
        low = middle + 1;
      } else {
        high = middle;
      }
    }
    currentIndex = Math.min(low, items.length - 1);
    // The surrounding rows preserve the general selector's nearest-row and
    // first-visible-row behavior when the anchor line lies in a gap or outside
    // the list. Include a visible successor if an empty/deleted row is present.
    let end = low;
    while (end < items.length && items[end].getBoundingClientRect().height <= 1) {
      end += 1;
    }
    return items.slice(Math.max(0, low - 1), Math.min(items.length, end + 1));
  }
}
