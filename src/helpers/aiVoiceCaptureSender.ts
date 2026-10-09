// AudioWorklet messages may arrive together after a busy UI thread. Preserve
// their PCM order while coalescing the backlog into bounded socket packets.
export function createAiVoiceCaptureSender({
  send,
  onOverflow,
  now = () => performance.now(),
  schedule = (callback: () => void, ms: number) => setTimeout(callback, ms),
  cancel = (timer: ReturnType<typeof setTimeout>) => clearTimeout(timer)
}: {
  send: (pcm: Int16Array) => void;
  onOverflow: () => void;
  now?: () => number;
  schedule?: (
    callback: () => void,
    ms: number
  ) => ReturnType<typeof setTimeout>;
  cancel?: (timer: ReturnType<typeof setTimeout>) => void;
}) {
  // At most 16 KB base64 x 20 events/s = 320 KB/s. Catch-up traffic must
  // fit the server's sustained byte limit as well as its per-event limit.
  const maxPacketSamples = 6_000;
  const maxQueuedSamples = 1_048_576;
  let queue: Int16Array[] = [];
  let queuedSamples = 0;
  let timer: ReturnType<typeof setTimeout> | undefined;
  let nextSendAt = 0;
  let stopped = false;

  function stop() {
    stopped = true;
    if (timer !== undefined) cancel(timer);
    timer = undefined;
    queue = [];
    queuedSamples = 0;
  }

  function flush() {
    timer = undefined;
    if (stopped || !queuedSamples) return;
    const wait = nextSendAt - now();
    if (wait > 0) {
      timer = schedule(flush, wait);
      return;
    }
    const packet = new Int16Array(Math.min(queuedSamples, maxPacketSamples));
    let offset = 0;
    while (offset < packet.length) {
      const frame = queue[0];
      const count = Math.min(frame.length, packet.length - offset);
      packet.set(frame.subarray(0, count), offset);
      offset += count;
      if (count === frame.length) queue.shift();
      else queue[0] = frame.subarray(count);
    }
    queuedSamples -= packet.length;
    nextSendAt = now() + 50;
    send(packet);
    if (!stopped && queuedSamples) timer = schedule(flush, 50);
  }

  function enqueue(frame: Int16Array) {
    if (stopped || !frame.length) return;
    if (queuedSamples + frame.length > maxQueuedSamples) {
      stop();
      onOverflow();
      return;
    }
    queue.push(frame);
    queuedSamples += frame.length;
    if (timer === undefined) flush();
  }
  return { enqueue, stop };
}
