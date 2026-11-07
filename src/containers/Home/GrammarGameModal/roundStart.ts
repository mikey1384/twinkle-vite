// What the round screen starts from, built from the server's /session answer.
// A new round starts at question 1. A resumed round (Mikey 11-07: "go
// Grammarbles resume") is the same round the player left: the grades already
// earned fill their marbles, the wrong picks on the question in play still
// count (they are kept on the server and cost their penalty there), and play
// continues at the next unanswered question.

export interface GrammarSessionQuestion {
  index: number;
  question: string;
  choices: string[];
}

export interface GrammarSessionStart {
  sessionId?: number;
  totalQuestions?: number;
  question?: GrammarSessionQuestion | null;
  resumed?: boolean;
  grades?: (string | null)[];
  wrongPicks?: number;
  revealDelayMs?: number;
  lastClickId?: number;
  finished?: boolean;
}

export interface GrammarRoundStart {
  questionIds: number[];
  questionObj: Record<number, any>;
  currentIndex: number;
  // Picks this page sends are numbered after the last one the round holds.
  lastClickId: number;
  // Every question was answered before the page closed: the round only
  // needs finishing.
  finished: boolean;
}

export function buildGrammarRoundStart(
  start: GrammarSessionStart | null | undefined
): GrammarRoundStart | null {
  const count = Number(start?.totalQuestions) || 0;
  if (!start?.sessionId || count <= 0) return null;
  const resumed = !!start.resumed;
  const grades = resumed && Array.isArray(start.grades) ? start.grades : [];
  const questionObj: Record<number, any> = {};
  for (let index = 0; index < count; index++) {
    const score = grades[index];
    questionObj[index] = {
      selectedChoiceIndex: null,
      ...(score ? { score } : {})
    };
  }
  const finished =
    resumed &&
    !!start.finished &&
    Array.from({ length: count }, (_, index) => grades[index]).every(Boolean);
  const question = start.question;
  if (finished) {
    return {
      questionIds: [...Array(count).keys()],
      questionObj,
      currentIndex: count - 1,
      lastClickId: Math.max(0, Number(start.lastClickId) || 0),
      finished: true
    };
  }
  const index = Number(question?.index);
  if (
    !question ||
    !Number.isSafeInteger(index) ||
    index < 0 ||
    index >= count ||
    (!resumed && index !== 0)
  ) {
    return null;
  }
  const wrongPicks = resumed ? Math.max(0, Number(start.wrongPicks) || 0) : 0;
  const revealDelayMs = Number(start.revealDelayMs);
  questionObj[index] = {
    question: question.question,
    choices: question.choices,
    selectedChoiceIndex: null,
    ...(resumed
      ? {
          wrongPicks,
          // a wrong pick on this question already counts as touching it
          ...(wrongPicks > 0 ? { wasWrong: true } : {}),
          ...(Number.isFinite(revealDelayMs) && revealDelayMs >= 0
            ? { revealDelayMs }
            : {})
        }
      : {})
  };
  return {
    questionIds: [...Array(count).keys()],
    questionObj,
    currentIndex: index,
    lastClickId: resumed ? Math.max(0, Number(start.lastClickId) || 0) : 0,
    finished: false
  };
}
