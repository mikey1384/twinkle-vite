// Only use for reads. Timing out a write does not mean it was not committed.
export default async function readWithTimeout<T>(
  read: () => Promise<T>,
  ms = 20000
): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    return await Promise.race([
      Promise.resolve().then(read),
      new Promise<never>((_, reject) => {
        timer = setTimeout(() => reject(new Error('Read timed out')), ms);
      })
    ]);
  } finally {
    clearTimeout(timer);
  }
}
