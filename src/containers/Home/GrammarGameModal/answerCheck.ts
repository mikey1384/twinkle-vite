// Grammarbles picks are checked on the server, which keeps the answer key.
// This is the client half: one check per pick, retried on a dropped
// connection with the SAME clickId so the server never counts it twice.

export interface GrammarPublicQuestion {
  index: number;
  question: string;
  choices: string[];
}

export interface GrammarAnswerResult {
  isCorrect: boolean;
  questionIndex?: number;
  choiceIndex?: number;
  grade?: string;
  nextQuestion?: GrammarPublicQuestion | null;
  finished?: boolean;
}

export type GrammarAnswerCheckOutcome =
  | { type: 'result'; result: GrammarAnswerResult }
  | { type: 'sessionClosed' }
  | { type: 'failed' };

export type GrammarAnswerCheck = (args: {
  questionIndex: number;
  choiceIndex: number;
  elapsedMs: number;
}) => Promise<GrammarAnswerCheckOutcome>;

const RETRY_DELAYS_MS = [250, 600];

export async function checkGrammarAnswerWithRetry({
  send,
  sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms)),
  retryDelaysMs = RETRY_DELAYS_MS
}: {
  send: () => Promise<GrammarAnswerResult>;
  sleep?: (ms: number) => Promise<unknown>;
  retryDelaysMs?: number[];
}): Promise<GrammarAnswerCheckOutcome> {
  for (let attempt = 0; ; attempt++) {
    try {
      const result = await send();
      if (!result || typeof result.isCorrect !== 'boolean') {
        return { type: 'failed' };
      }
      return { type: 'result', result };
    } catch (error: any) {
      if (error?.code === 'grammar_session_closed') {
        return { type: 'sessionClosed' };
      }
      const status = Number(error?.status || 0);
      // A 4xx other than a timeout is a definite "no"; retrying won't help.
      const retryable = !status || status >= 500 || status === 408;
      if (!retryable || attempt >= retryDelaysMs.length) {
        return { type: 'failed' };
      }
      await sleep(retryDelaysMs[attempt]);
    }
  }
}
