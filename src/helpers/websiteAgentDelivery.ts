// Duplicate socket packets and competing tabs must claim the server action
// before touching the DOM. A lost acknowledgement consumes the claim; it must
// never be interpreted as permission to execute a fresh copy.
export class WebsiteAgentDelivery {
  private tail: Promise<unknown> = Promise.resolve();
  private pending = new Map<string, Promise<void>>();
  private completed = new Map<
    string,
    { result: unknown; token: string; expiresAt: number }
  >();

  async run({
    id,
    expiresAt,
    claim,
    execute,
    respond
  }: {
    id: string;
    expiresAt: number;
    claim: () => Promise<string | null>;
    execute: (token: string) => Promise<unknown>;
    respond: (result: unknown, token: string) => void;
  }) {
    for (const [key, entry] of this.completed) {
      if (entry.expiresAt < Date.now()) this.completed.delete(key);
    }
    const done = this.completed.get(id);
    if (done) return respond(done.result, done.token);
    if (this.pending.has(id)) return this.pending.get(id);
    if (!Number.isFinite(expiresAt) || expiresAt <= Date.now()) return;
    const work = this.tail.then(async () => {
      if (expiresAt <= Date.now()) return;
      const token = await claim();
      if (!token || expiresAt <= Date.now()) return;
      let result: unknown;
      try {
        result = await execute(token);
      } catch (error) {
        result = { ok: false, error: String(error), code: 'outcome_unknown' };
      }
      this.completed.set(id, { result, token, expiresAt: expiresAt + 60_000 });
      respond(result, token);
    });
    this.tail = work.catch(() => undefined);
    this.pending.set(id, work);
    try {
      await work;
    } finally {
      this.pending.delete(id);
    }
  }
}
