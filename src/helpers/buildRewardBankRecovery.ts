// A question-bank generation is a server job (todo #130). bank-generate admits
// it and answers at once with { generationPending: true }; the server writes
// and checks the question in the background. This waits for that job by its
// request ID: lock-free progress reads until it is done or failed, then one
// read of its canonical result. A lost reply never repeats the paid work:
// sending bank-generate again with the same request ID reads the same job,
// and after a reload a new request for the same topic joins the running job.
export async function runRewardBankGeneration<
  T extends { generationPending?: boolean; [key: string]: unknown }
>({
  generate,
  readProgress,
  readResult,
  transient,
  canonicalFailure,
  now = Date.now,
  sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms)),
  timeoutMs = 20 * 60_000,
  pollMs = 2000,
  resultReads = 5
}: {
  generate: () => Promise<T>;
  readProgress: () => Promise<{ phase?: unknown } | null | undefined>;
  readResult: () => Promise<T>;
  // A lost connection, a timeout or a restarting server: worth asking again.
  transient: (error: unknown) => boolean;
  // The server's own answer about this job (failed, expired, not found). Final.
  canonicalFailure: (error: unknown) => boolean;
  now?: () => number;
  sleep?: (ms: number) => Promise<unknown>;
  timeoutMs?: number;
  pollMs?: number;
  resultReads?: number;
}): Promise<T> {
  const deadline = now() + timeoutMs;
  const pause = () => sleep(Math.max(0, Math.min(pollMs, deadline - now())));
  let lastError: unknown;
  for (;;) {
    try {
      const result = await generate();
      if (!result.generationPending) return result;
      break;
    } catch (error) {
      if (!transient(error) || now() >= deadline) throw error;
      lastError = error;
      await pause();
    }
  }
  let reads = 0;
  while (now() < deadline) {
    await pause();
    try {
      const progress = await readProgress();
      if (progress?.phase !== 'done' && progress?.phase !== 'failed') continue;
    } catch (error) {
      if (!transient(error)) throw error;
      lastError = error;
      continue;
    }
    try {
      const result = await readResult();
      if (!result.generationPending) return result;
    } catch (error) {
      // Never turn a failed, expired or missing job into another generation
      // or invent a successful question.
      if (canonicalFailure(error) || !transient(error)) throw error;
      lastError = error;
      if (++reads >= resultReads) throw error;
    }
  }
  throw (
    lastError ||
    new Error(
      'This question is still being prepared. Reopen the topic to check it.'
    )
  );
}
