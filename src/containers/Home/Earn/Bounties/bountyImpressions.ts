export type BountySlot = 'recommended' | 'recent' | 'top' | 'card' | 'row';
interface Impression {
  buildId: number;
  slot: BountySlot;
}
type Sender = (payload: {
  seen?: Impression[];
  played?: Impression;
}) => Promise<unknown>;

// One tracker per member and server reward day. Slots are distinct: seeing the
// ranked card must not hide a later recommendation from fatigue/slot telemetry.
export function createBountyImpressionTracker(
  send: Sender,
  isCurrent: () => boolean
) {
  const reported = new Set<string>();
  let queue: Impression[] = [];
  let timer: ReturnType<typeof setTimeout> | undefined;
  const keyOf = ({ buildId, slot }: Impression) => `${buildId}:${slot}`;
  const report = (payload: Parameters<Sender>[0]) => {
    if (!isCurrent()) return;
    void send(payload)
      .then((result) => {
        if (!result || (result as { throttled?: boolean }).throttled) {
          payload.seen?.forEach((entry) => reported.delete(keyOf(entry)));
        }
      })
      .catch(() => {
        payload.seen?.forEach((entry) => reported.delete(keyOf(entry)));
      });
  };
  function flush() {
    clearTimeout(timer);
    timer = undefined;
    const batch = queue;
    queue = [];
    // The server accepts at most 40 sightings per request.
    for (let i = 0; i < batch.length; i += 40)
      report({ seen: batch.slice(i, i + 40) });
  }
  return {
    seen(entry: Impression) {
      if (!isCurrent() || reported.has(keyOf(entry))) return;
      reported.add(keyOf(entry));
      queue.push(entry);
      timer ??= setTimeout(flush, 1500);
    },
    play(entry: Impression) {
      flush();
      report({ played: entry });
    },
    flush,
    dispose() {
      clearTimeout(timer);
      timer = undefined;
      queue = [];
      reported.clear();
    }
  };
}
