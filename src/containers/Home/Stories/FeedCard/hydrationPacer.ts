// Home feed cards each fetch their full content, and on a slow or bunched
// connection (Mikey's iPhone on 5G, 10-20) a dozen replies land together and
// every card re-renders in the same frame: owner traces showed 15 comment
// cards in one 679 ms frame. Applying the replies a few per animation frame,
// on-screen cards first, spreads that work so scrolling keeps its frames.
// Requests are unchanged; only when a reply is applied moves.

export const HYDRATION_APPLIES_PER_FRAME = 2;

interface PacedApply {
  run: () => void;
  urgent: boolean;
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
  function enqueue(run: () => void, urgent = false) {
    if (urgent) {
      const firstLater = queue.findIndex((item) => !item.urgent);
      if (firstLater === -1) queue.push({ run, urgent });
      else queue.splice(firstLater, 0, { run, urgent });
    } else {
      queue.push({ run, urgent });
    }
    schedule();
  }

  function schedule() {
    if (scheduled || !queue.length) return;
    scheduled = true;
    requestFrame(flush);
  }

  function flush() {
    scheduled = false;
    for (let i = 0; i < perFrame && queue.length; i++) {
      const item = queue.shift()!;
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
