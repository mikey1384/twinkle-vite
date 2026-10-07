import React, { useEffect, useMemo, useRef, useState } from 'react';
import ErrorBoundary from '~/components/ErrorBoundary';
import { useAppContext, useKeyContext, useViewContext } from '~/contexts';
import { css, cx } from '@emotion/css';
import { mobileMaxWidth } from '~/constants/css';
import NeonButton from '../ClassicArcade/NeonButton';
import { NEON, PIXEL_FONT, READ_FONT, rgba } from '../ClassicArcade/theme';
import LetterGrade from '../Marble/LetterGrade';
import GameCTAButton from '~/components/Buttons/GameCTAButton';
import ChallengeModal from './ChallengeModal';
import RuleCard, { type ReviewRuleCard } from './RuleCard';
import {
  initialKoreanShown,
  saveKoreanShown
} from '~/helpers/grammarblesRuleCard';
import Loading from '~/components/Loading';
import { useAgentScreenState } from '~/helpers/websiteAgentScreenState';

interface ReviewItem {
  id: number;
  questionId: number;
  level: number;
  grade?: string;
  selectedChoiceIndex?: number | null;
  answerIndex: number;
  timeStamp: number;
  question: string;
  choices: string[];
  questionRating?: number;
  isChecked?: boolean;
  explanation?: string | null;
  ruleCard?: ReviewRuleCard | null;
}

export default function Review() {
  const AI_FEATURES_DISABLED = useViewContext(
    (v) => v.state.aiFeaturesDisabled
  );
  const loadGrammarReview = useAppContext(
    (v) => v.requestHelpers.loadGrammarReview
  );
  const onSetUserState = useAppContext((v) => v.user.actions.onSetUserState);
  const userId = useKeyContext((v) => v.myState.userId);
  const [items, setItems] = useState<ReviewItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const initialized = useRef(false);
  const [challengeQ, setChallengeQ] = useState<ReviewItem | null>(null);
  const [challengedQIds, setChallengedQIds] = useState<Record<number, boolean>>(
    {}
  );
  const [koreanShown, setKoreanShown] = useState(initialKoreanShown);

  useEffect(() => {
    if (!initialized.current) {
      init();
    }
    async function init() {
      initialized.current = true;
      setLoading(true);
      try {
        const { items: rows = [], hasMore } = await loadGrammarReview({
          limit: 10
        });
        setItems(rows);
        setHasMore(!!hasMore);
      } finally {
        setLoading(false);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const [answerState, setAnswerState] = useState<{
    [id: number]: {
      selectedIndex: number | null;
      status: '' | 'pass' | 'fail';
    };
  }>({});

  const QItems = useMemo(
    () =>
      items.map((it) => {
        const current = answerState[it.id] || {
          selectedIndex: null,
          status: '' as ''
        };
        return (
          <div key={it.id} className={itemCls}>
            <div className={qHeaderCls}>
              <LetterGrade letter={it.grade || ''} size={28} />
              <div className={metaCls}>
                <span>QID {it.questionId}</span>
                {typeof it.questionRating === 'number' && (
                  <>
                    <span> | </span>
                    <span>Rating {it.questionRating}</span>
                  </>
                )}
              </div>
            </div>
            {it.ruleCard &&
              !challengedQIds[it.questionId] &&
              typeof current.selectedIndex === 'number' && (
                <RuleCard
                  card={it.ruleCard}
                  look="classic"
                  // An unchecked question's key may still be wrong (the tag
                  // agrees on the skill, not the key), so it only names the
                  // point; the reasons wait until the question is checked.
                  pointOnly={!it.isChecked}
                  pickedChoice={
                    current.status === 'fail'
                      ? (it.choices[current.selectedIndex] ?? null)
                      : null
                  }
                  koreanShown={koreanShown}
                  onToggleKorean={handleToggleKorean}
                />
              )}
            {explanationShown(
              it,
              current.selectedIndex,
              !!challengedQIds[it.questionId]
            ) && <div className={explanationCls}>{it.explanation}</div>}
            <div className={questionCls}>{it.question}</div>
            <div className={choicesCls}>
              {it.choices.map((choice, i) => {
                const answered = typeof current.selectedIndex === 'number';
                const right = answered && i === it.answerIndex;
                const wrong =
                  answered &&
                  i === current.selectedIndex &&
                  i !== it.answerIndex;
                return (
                  <button
                    key={i}
                    className={cx(
                      choiceCls,
                      right && choiceRightCls,
                      wrong && choiceWrongCls,
                      answered && !right && !wrong && choiceDimCls
                    )}
                    disabled={answered}
                    onClick={() => {
                      const status = i === it.answerIndex ? 'pass' : 'fail';
                      setAnswerState((prev) => ({
                        ...prev,
                        [it.id]: { selectedIndex: i, status }
                      }));
                    }}
                  >
                    <span className={letterCls}>{'ABCDEFG'[i]}</span>
                    {choice}
                  </button>
                );
              })}
            </div>
            {!it.isChecked && (
              <div
                style={{
                  marginTop: '0.75rem',
                  display: 'flex',
                  justifyContent: 'center'
                }}
              >
                {AI_FEATURES_DISABLED ? (
                  <GameCTAButton
                    arcade
                    icon="ban"
                    variant="neutral"
                    size="sm"
                    onClick={() => {}}
                    disabled
                  >
                    Challenge Unavailable
                  </GameCTAButton>
                ) : (
                  <GameCTAButton
                    arcade
                    icon="exclamation-circle"
                    variant="logoBlue"
                    size="sm"
                    onClick={() => {
                      setChallengeQ(it);
                    }}
                  >
                    Challenge
                  </GameCTAButton>
                )}
              </div>
            )}
          </div>
        );
      }),
    [items, answerState, challengedQIds, AI_FEATURES_DISABLED, koreanShown]
  );

  // Hands Zero and Ciel the review list as shown: each question, its choices,
  // the grade it earned and the user's retry; the correct choice and the
  // explanation only once the screen reveals them, never before.
  useAgentScreenState('grammarblesReview', {
    loading,
    hasMore,
    challengeOpenForQuestionId: challengeQ?.questionId ?? null,
    items: items.slice(0, 30).map((it) => {
      const current = answerState[it.id];
      const answered = typeof current?.selectedIndex === 'number';
      const ruleCardShown =
        !!it.ruleCard &&
        !!it.isChecked &&
        answered &&
        !challengedQIds[it.questionId];
      return {
        questionId: it.questionId,
        grade: it.grade || null,
        question: String(it.question || '').slice(0, 500),
        choices: (it.choices || [])
          .slice(0, 30)
          .map((choice) => String(choice ?? '').slice(0, 500)),
        yourRetryChoiceIndex: answered
          ? (current?.selectedIndex ?? null)
          : null,
        retryResult: answered ? current?.status || null : null,
        correctChoiceIndex: answered ? it.answerIndex : null,
        grammarPoint:
          it.ruleCard && answered && !challengedQIds[it.questionId]
            ? it.ruleCard.nameEn
            : null,
        explanation: explanationShown(
          it,
          current?.selectedIndex,
          !!challengedQIds[it.questionId]
        )
          ? String(it.explanation).slice(0, 500)
          : null,
        ruleCard: ruleCardShown
          ? {
              grammarPoint: it.ruleCard!.nameEn,
              why: it.ruleCard!.why.slice(0, 500),
              wrongChoiceMistakes: it
                .ruleCard!.wrongChoices.slice(0, 3)
                .map((w) => `${w.choice}: ${w.error}`.slice(0, 300)),
              koreanShown
            }
          : null,
        challenged: !!challengedQIds[it.questionId],
        canChallenge: !it.isChecked && !AI_FEATURES_DISABLED
      };
    })
  });

  if (loading) {
    return (
      <ErrorBoundary componentPath="Earn/GrammarGameModal/Review/Skeleton">
        <div className={boardCls}>
          <Loading />
        </div>
      </ErrorBoundary>
    );
  }

  return (
    <ErrorBoundary componentPath="Earn/GrammarGameModal/Review">
      <div className={boardCls}>
        <div className={titleCls}>Review</div>
        <div className={listCls}>
          {QItems}
          {hasMore && (
            <div className={moreCls}>
              <NeonButton onClick={handleLoadMore}>
                {loadingMore ? 'Loading…' : 'Load more'}
              </NeonButton>
            </div>
          )}
          {!items.length && (
            <div className={emptyCls}>No solved questions to review yet.</div>
          )}
        </div>
        {challengeQ && (
          <ChallengeModal
            isOpen={true}
            onClose={() => setChallengeQ(null)}
            questionId={challengeQ.questionId}
            onAfterSuccess={({ explanation, newBalance, justified }) =>
              handleChallengeDone({
                explanation,
                newBalance,
                justified,
                challengeQId: challengeQ.questionId
              })
            }
          />
        )}
      </div>
    </ErrorBoundary>
  );

  function handleToggleKorean() {
    setKoreanShown((shown) => {
      saveKoreanShown(!shown);
      return !shown;
    });
  }

  function handleChallengeDone({
    explanation,
    newBalance,
    justified,
    challengeQId
  }: {
    explanation: string;
    newBalance?: number;
    justified: boolean;
    challengeQId: number;
  }) {
    if (!challengeQId) return;
    setItems((prev) =>
      prev.map((p) =>
        p.questionId === challengeQId
          ? { ...p, isChecked: true, explanation }
          : p
      )
    );
    setChallengedQIds((prev) => ({
      ...prev,
      [challengeQId]: true
    }));
    if (typeof newBalance === 'number') {
      onSetUserState({
        userId,
        newState: { twinkleCoins: newBalance }
      });
    }
    if (!justified) setChallengeQ(null);
  }

  async function handleLoadMore() {
    if (!hasMore || loadingMore) return;
    setLoadingMore(true);
    try {
      const lastId = items[items.length - 1]?.id;
      const { items: rows = [], hasMore: nextHasMore } =
        await loadGrammarReview({
          lastId,
          limit: 10
        });
      setItems((prev) => [...prev, ...rows]);
      setHasMore(!!nextHasMore);
    } finally {
      setLoadingMore(false);
    }
  }
}

// Classic's review in the arcade look (Mikey 10-07): a neon glass board
// filling the page; the list scrolls inside it
const boardCls = css`
  flex: 1;
  min-height: 0;
  width: 100%;
  max-width: 82rem;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  border-radius: 18px;
  background: linear-gradient(
    180deg,
    rgba(20, 22, 80, 0.75),
    rgba(10, 10, 46, 0.85)
  );
  border: 2px solid ${rgba(NEON.violetRgb, 0.5)};
  box-shadow:
    0 0 24px ${rgba(NEON.violetRgb, 0.25)},
    inset 0 0 30px rgba(0, 0, 0, 0.4);
  color: ${NEON.ink};
  font-family: ${READ_FONT};
`;
const titleCls = css`
  padding: 1.1rem 1.4rem 0.6rem;
  font-family: ${PIXEL_FONT};
  font-size: 1.5rem;
  color: ${NEON.cyan};
  text-shadow: 0 0 10px ${rgba(NEON.cyanRgb, 0.7)};
`;
const listCls = css`
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  overscroll-behavior: contain;
  padding: 0.4rem 1.4rem 1.4rem;
  @media (max-width: ${mobileMaxWidth}) {
    padding: 0.4rem 0.8rem 1rem;
  }
`;
const itemCls = css`
  border-radius: 14px;
  background: rgba(255, 255, 255, 0.06);
  border: 1px solid ${rgba(NEON.violetRgb, 0.35)};
  padding: 1.1rem 1.3rem;
  margin-bottom: 1.1rem;
`;
const questionCls = css`
  margin: 0.6rem 0 0.9rem;
  font-size: 1.8rem;
  font-weight: 800;
  line-height: 1.35;
  color: ${NEON.ink};
`;
const choicesCls = css`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.7rem;
  @media (max-width: ${mobileMaxWidth}) {
    grid-template-columns: 1fr;
  }
`;
const choiceCls = css`
  display: flex;
  align-items: center;
  gap: 0.8rem;
  padding: 0.9rem 1.1rem;
  border-radius: 12px;
  text-align: left;
  font: 700 1.55rem ${READ_FONT};
  color: ${NEON.ink};
  background: rgba(12, 14, 56, 0.9);
  border: 2px solid ${rgba(NEON.cyanRgb, 0.45)};
  cursor: pointer;
  &:disabled {
    cursor: default;
  }
`;
const choiceRightCls = css`
  border-color: ${NEON.green};
  background: ${rgba(NEON.greenRgb, 0.18)};
  box-shadow: 0 0 12px ${rgba(NEON.greenRgb, 0.45)};
`;
const choiceWrongCls = css`
  border-color: ${NEON.red};
  background: ${rgba(NEON.redRgb, 0.18)};
`;
const choiceDimCls = css`
  opacity: 0.55;
`;
const letterCls = css`
  flex: none;
  width: 2.6rem;
  height: 2.6rem;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 8px;
  font: 1rem ${PIXEL_FONT};
  color: ${NEON.navy};
  background: ${NEON.cyan};
`;
const explanationCls = css`
  margin-top: 0.75rem;
  padding: 0.75rem 1rem;
  border-left: 4px solid ${NEON.cyan};
  background: rgba(255, 255, 255, 0.07);
  border-radius: 8px;
  color: ${NEON.ink};
  font-size: 1.4rem;
  white-space: pre-wrap;
`;
const moreCls = css`
  display: flex;
  justify-content: center;
  padding: 0.4rem 0 0.8rem;
`;
const emptyCls = css`
  padding: 4rem 1rem;
  text-align: center;
  font-size: 1.6rem;
  font-weight: 700;
  color: ${NEON.inkSoft};
`;

const qHeaderCls = css`
  display: flex;
  align-items: center;
  justify-content: space-between;
`;

const metaCls = css`
  font-size: 1.2rem;
  color: ${NEON.inkSoft};
`;

// Grade badge is centralized as <LetterGrade />

// No correctness badge in review; focus on interactive reveal only

// The question's own checked explanation (it can carry a challenge's "Fix
// applied" note) stays visible beside a rule card unless it says the same.
function explanationShown(
  it: ReviewItem,
  selectedIndex: number | null | undefined,
  challenged: boolean
) {
  if (!it.explanation || !it.isChecked) return false;
  if (typeof selectedIndex !== 'number' && !challenged) return false;
  const cardWhyShown = !!it.ruleCard && !challenged;
  return (
    !cardWhyShown || normalize(it.explanation) !== normalize(it.ruleCard!.why)
  );
}

function normalize(text: string) {
  return String(text || '')
    .trim()
    .replace(/\s+/g, ' ')
    .toLowerCase();
}
