// Home feed cards each fetch their full content, and on a slow or bunched
// connection (Mikey's iPhone on 5G, 10-20) a dozen replies land together and
// every card re-renders in the same frame: owner traces showed 15 comment
// cards in one 679 ms frame. Applying the replies a few per animation frame,
// on-screen cards first, spreads that work so scrolling keeps its frames.
// Requests are unchanged; only when a reply is applied moves.

export const HYDRATION_APPLIES_PER_FRAME = 2;

interface PacedApply {
  run: () => void;
  // read when the frame applies, so a card scrolled into view meanwhile
  // still goes first
  urgent: () => boolean;
}

export function createHydrationPacer({
  perFrame = HYDRATION_APPLIES_PER_FRAME,
  requestFrame = (callback: () => void) => requestAnimationFrame(callback)
}: {
  perFrame?: number;
  requestFrame?: (callback: () => void) => unknown;
} = {}) {
  const queue: PacedApply[] = [];
  let scheduled = false;

  return { enqueue, pending: () => queue.length };

  // urgent: the card is on screen, so its reply goes before off-screen ones
  function enqueue(run: () => void, urgent: boolean | (() => boolean) = false) {
    queue.push({
      run,
      urgent: typeof urgent === 'function' ? urgent : () => urgent
    });
    schedule();
  }

  function takeNext() {
    let index = queue.findIndex((item) => {
      try {
        return item.urgent();
      } catch {
        return false;
      }
    });
    if (index === -1) index = 0;
    return queue.splice(index, 1)[0];
  }

  function schedule() {
    if (scheduled || !queue.length) return;
    scheduled = true;
    requestFrame(flush);
  }

  function flush() {
    scheduled = false;
    for (let i = 0; i < perFrame && queue.length; i++) {
      const item = takeNext();
      try {
        item.run();
      } catch (error) {
        console.error(error);
      }
    }
    schedule();
  }
}

export const homeFeedHydrationPacer = createHydrationPacer();
