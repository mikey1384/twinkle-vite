import pLimit from 'p-limit';

export class RequestPriorityLimiters {
  private normalLimiter: ReturnType<typeof pLimit>;
  private highPriorityLimiter: ReturnType<typeof pLimit>;

  constructor(concurrency: number) {
    this.normalLimiter = pLimit(Math.max(1, concurrency));
    // Critical interactive reads must not sit behind a cold page's unrelated
    // GET backlog. Keep this lane deliberately small so priority cannot turn
    // into unbounded concurrency.
    this.highPriorityLimiter = pLimit(
      Math.max(1, Math.min(2, concurrency))
    );
  }

  run<T>({
    priority,
    task
  }: {
    priority?: 'low' | 'normal' | 'high' | 'bulk';
    task: () => Promise<T>;
  }) {
    return (priority === 'high'
      ? this.highPriorityLimiter
      : this.normalLimiter)(task);
  }
}
