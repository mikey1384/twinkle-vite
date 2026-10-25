// A lost HTTP response does not mean the paid generation failed. Read its
// existing job until it has a canonical result; never repeat the paid POST.
export async function runRewardBankGeneration<
  T extends { generationPending?: boolean; [key: string]: unknown }
>({
  generate,
  readResult,
  transient,
  now = Date.now,
  sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms)),
  timeoutMs = 280_000
}: {
  generate: () => Promise<T>;
  readResult: () => Promise<T>;
  transient: (error: unknown) => boolean;
  now?: () => number;
  sleep?: (ms: number) => Promise<unknown>;
  timeoutMs?: number;
}): Promise<T> {
  const deadline = now() + timeoutMs;
  let originalError: unknown;
  try {
    const result = await generate();
    if (!result.generationPending) return result;
  } catch (error) {
    if (!transient(error)) throw error;
    originalError = error;
  }
  while (now() < deadline) {
    try {
      const result = await readResult();
      if (!result.generationPending) return result;
    } catch (error) {
      // Not found, denied, failed and expired are terminal. Never turn them
      // into another generation or invent a successful question.
      if (!transient(error)) throw error;
      originalError ||= error;
    }
    if (now() < deadline) await sleep(Math.min(2000, deadline - now()));
  }
  throw (
    originalError ||
    new Error(
      'This question is still being prepared. Reopen the topic to check it.'
    )
  );
}
