import React, { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { css, cx } from '@emotion/css';
import Icon from '~/components/Icon';
import { mobileMaxWidth } from '~/constants/css';
import { useAppContext } from '~/contexts';
import { lockBodyScroll } from '~/helpers/bodyScrollLock';
import RuleCard from '../Review/RuleCard';
import ChallengeModal from '../Review/ChallengeModal';
import useChallengeReviews from '../Review/useChallengeReviews';
import { challengeReviewLabel, getSavedChallengeReview, isChallengeReviewSettled } from '../Review/challengeReviews';
import { initialKoreanShown, saveKoreanShown } from '~/helpers/grammarblesRuleCard';
import type { QuestAnswer, QuestResult, QuestRun } from './types';
import QuestMarble, { answerLook } from './QuestMarble';
import AudioToggles from './AudioToggles';
import PixelIcon from './PixelIcon';
import { GotchaText } from './FormatQuestion';
import { useReadCooldown } from './readCooldown';
import { useMoreBelow } from './moreBelow';
import Stage from './MarbleRun/Stage';
import { BossFight } from './MarbleRun/boss/fight';
import { NEMESIS_BOSS } from './MarbleRun/boss/nemesis';
import { useStageFit } from './MarbleRun/useStageFit';
import { wrapCls, bossCls, bodyCls, dockCls, stageFitCls, cardCls, bossCardCls, cardInnerCls, ruleScrollCls, ruleFadeCls } from './MarbleRun/battleLayout';
import { playMusic, stopMusic } from './MarbleRun/music';
import { GOLD, PIXEL_FONT, PLATE, WOOD, button, frame, challengeButton, reviewedButton } from './pixelUi';

const REVIEW_TURN = { baseTimeMs: 12000, revealDelayMs: 0 };

// One confirmed first attempt per question, as before. The ghost battle
// illustrates those answers; rewards and spaced progress stay on the server.
// Every explanation waits for the player's Continue.
export default function Run({ run, onFinished, onQuit }: {
  run: QuestRun;
  onFinished: (result: QuestResult, answers: QuestAnswer[]) => void;
  onQuit: () => void;
}) {
  const answerQuestion = useAppContext((v) => v.requestHelpers.answerGrammarQuestQuestion);
  const finishRun = useAppContext((v) => v.requestHelpers.finishGrammarQuestRun);
  const practiceOnly = run.rules.mode === 'nemesis' && !!run.rules.practiceOnly;
  const [answers, setAnswers] = useState<Record<number, QuestAnswer>>(() =>
    Object.fromEntries((run.answers || []).map((a) => [a.position, a]))
  );
  const [combo, setCombo] = useState(run.combo || 0);
  const [sending, setSending] = useState(false);
  const [finishing, setFinishing] = useState(false);
  const [animating, setAnimating] = useState(false);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState('');
  const [koreanShown, setKoreanShown] = useState(initialKoreanShown);
  const [challengeOpen, setChallengeOpen] = useState(false);
  const { reviews } = useChallengeReviews();
  const shownAt = useRef(Date.now());
  const inFlight = useRef(false);
  const alive = useRef(true);
  const layerRef = useRef<HTMLDivElement>(null);
  const finishDelay = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [engine] = useState(() => {
    const fight = new BossFight(NEMESIS_BOSS, {
      onReady: () => setReady(true),
      onReviewReady: () => setAnimating(false)
    }, { questions: run.questions.length });
    fight.resumeAnswers(run.questions.flatMap((q) => answers[q.position] ? [answers[q.position].isCorrect] : []));
    if (run.questions.every((q) => !!answers[q.position])) fight.restoreReview();
    else fight.setQuestion(REVIEW_TURN);
    return fight;
  });
  const firstOpen = useMemo(() => run.questions.findIndex((q) => !answers[q.position]), [run.questions, answers]);
  const [position, setPosition] = useState(firstOpen === -1 ? run.questions.length - 1 : firstOpen);
  const question = run.questions[position];
  const answer = question ? answers[question.position] : undefined;
  const allAnswered = firstOpen === -1;
  const rightSoFar = Object.values(answers).filter((a) => a.isCorrect).length;
  const answeredCount = Object.keys(answers).length;
  const challenge = answer && !answer.isCorrect ? answer.challenge : null;
  const challengeReview = challenge ? reviews[challenge.questionId] : undefined;
  const savedReview = getSavedChallengeReview(challenge?.checked, challenge?.review);
  const reviewed = isChallengeReviewSettled(challengeReview, savedReview);
  const { reading, secondsLeft } = useReadCooldown(
    answer && !answer.isCorrect ? `miss-${position}` : null, answer?.readMs
  );
  const ruleRef = useRef<HTMLDivElement>(null);
  const ruleMore = useMoreBelow(ruleRef, answer && !answer.isCorrect ? `${run.runId}:${question?.position}:${koreanShown}` : null);
  const { bodyRef, dockRef, cardRef, stageWidth } = useStageFit({
    missOpen: !!answer && !answer.isCorrect,
    resetKey: `${run.runId}:${question?.position}`
  });

  useEffect(() => {
    shownAt.current = Date.now();
  }, [position]);

  useEffect(() => {
    alive.current = true;
    const previousFocus = document.activeElement as HTMLElement | null;
    const unlock = lockBodyScroll(document.body);
    layerRef.current?.querySelector('button')?.focus({ preventScroll: true });
    playMusic('boss-fort');
    return () => {
      alive.current = false;
      if (finishDelay.current != null) clearTimeout(finishDelay.current);
      unlock();
      stopMusic(0.6);
      if (previousFocus?.isConnected) previousFocus.focus({ preventScroll: true });
    };
  }, []);

  if (!question) return null;

  return createPortal(
    <div className={cx(wrapCls, bossCls)} ref={layerRef} onKeyDown={handleKeyDown} role="region" aria-label="Ghost review battle">
      <div className={topCls}>
        <button className={quitCls} onClick={onQuit}>← Map</button>
        <span className={titleCls}><PixelIcon name="ghost" /> {practiceOnly ? 'GHOST PRACTICE' : 'GHOST REVIEW'}</span>
        <AudioToggles className={audioCls} />
      </div>
      <div className={bodyCls} ref={bodyRef}>
        <div className={stageFitCls} style={{ width: stageWidth }} role="img" aria-label={`Ghost strength: ${run.questions.length - rightSoFar} of ${run.questions.length}. ${answeredCount} questions answered.`}>
          <Stage engine={engine} />
        </div>
        <div className={dockCls} ref={dockRef}>
        <div className={progressCls}>
          <div className={marbleRowCls} aria-label={`${rightSoFar} correct answers`}>
            {run.questions.map((q) => {
              const a = answers[q.position];
              return <QuestMarble key={q.position} look={a ? answerLook(a.isCorrect, a.combo || 1) : 'empty'}
                size={24} title={`Question ${q.position + 1}: ${a ? a.isCorrect ? 'correct' : 'missed' : 'unanswered'}`}
                className={q.position === question.position ? currentMarbleCls : undefined} />;
            })}
          </div>
          <span>{answeredCount}/{run.questions.length} answered</span>
          <span className={cx(comboCls, combo >= 3 && comboHotCls)}>Combo ×{combo}</span>
        </div>
        <div className={cx(cardCls, bossCardCls)} ref={cardRef}>
          <div className={cardInnerCls}>
          <div className={introCls}>{practiceOnly
            ? 'No timer · Practice only: no XP or Coins. Your next scheduled review stays the same.'
            : 'Land a hit with each right answer. No timer · Perfect reviews pay 3× XP and Coins while daily rewards remain.'}</div>
          {!ready && !answer ? <div className={readyCls} role="status">YOUR RIVAL RETURNS…</div> : <>
          <div className={metaCls}>Question {position + 1} of {run.questions.length} · <b>{question.skillName}</b></div>
          {question.instruction && <div className={instructionCls}><GotchaText text={question.instruction} /></div>}
          <div className={questionCls}>{question.question}</div>
          <div className={choicesCls}>
            {question.choices.map((choice, i) => {
              const state = !answer ? '' : i === answer.correctIndex ? 'right' : i === answer.selectedIndex ? 'wrong' : 'dim';
              return <button key={i}
                className={cx(choiceCls, state === 'right' && rightCls, state === 'wrong' && wrongCls, state === 'dim' && dimCls)}
                disabled={!!answer || sending || animating || !ready} onClick={() => handleAnswer(i)}>
                <span className={letterCls}>{'ABCD'[i]}</span>{choice}
              </button>;
            })}
          </div>
          </>}
          {error && <div className={errorCls} role="alert">{error}</div>}
          {answer && !answer.isCorrect && <div className={missCls}>
            <div className={missNoteCls}>The ghost dodged. Read the explanation, then continue when you’re ready.</div>
            {answer.ruleCard && <div ref={ruleRef} className={cx(ruleScrollCls, ruleMore && ruleFadeCls)} data-fit-flex><RuleCard card={answer.ruleCard} look="quest"
              pickedChoice={question.choices[answer.selectedIndex] ?? null}
              koreanShown={koreanShown} onToggleKorean={handleToggleKorean} /></div>}
          </div>}
          {answer && <div className={nextRowCls}>
            {challenge && <button className={reviewed ? reviewedCls : challengeCls}
              title={reviewed ? 'Read the reviewer’s explanation' : 'Think the answer key is wrong? Challenge it'}
              onClick={() => setChallengeOpen(true)}>{challengeReviewLabel(challengeReview, savedReview)}</button>}
            <button aria-busy={finishing} className={nextCls} disabled={finishing || reading || animating}
              onClick={allAnswered ? handleFinish : handleNext}>
              {finishing ? 'Saving…' : reading ? `Read it · ${secondsLeft}` : animating ? 'Marble away…'
                : allAnswered ? `Finish ${practiceOnly ? 'practice' : 'review'} · ${rightSoFar}/${run.questions.length}` : 'Continue'}
              {finishing && <Icon icon="spinner" pulse style={{ marginLeft: '0.7rem' }} />}
            </button>
          </div>}
          </div>
        </div>
        </div>
      </div>
      {challengeOpen && challenge && <ChallengeModal isOpen portalTarget={layerRef.current ?? undefined}
        questionId={challenge.questionId} questionText={answer?.prompt ?? question.question}
        savedReview={savedReview} questKind="nemesis" questRef={{ runId: run.runId, position: question.position }}
        returnLabel="Back to question" onClose={() => setChallengeOpen(false)} />}
    </div>, document.body
  );

  async function handleAnswer(choiceIndex: number) {
    if (inFlight.current || answer || animating || !ready || !engine.canAnswer) return;
    inFlight.current = true;
    setSending(true);
    setError('');
    try {
      const result: QuestAnswer = await answerQuestion({ runId: run.runId, position: question.position,
        choiceIndex, responseMs: Date.now() - shownAt.current });
      if (!alive.current) return;
      setAnswers((prev) => ({ ...prev, [result.position]: result }));
      setCombo(result.combo || 0);
      setReady(false);
      setAnimating(engine.answerReview(result.isCorrect));
    } catch {
      if (alive.current) setError('That answer did not reach the server. Try again.');
    } finally {
      inFlight.current = false;
      if (alive.current) setSending(false);
    }
  }

  function handleNext() {
    if (reading || animating || inFlight.current || !answer) return;
    const next = run.questions.findIndex((q, i) => i > position && !answers[q.position]);
    setReady(false);
    engine.setQuestion(REVIEW_TURN);
    engine.resumeReview();
    setError('');
    setPosition(next === -1 ? firstOpen : next);
  }

  async function handleFinish() {
    if (reading || animating || inFlight.current || !allAnswered) return;
    inFlight.current = true;
    setFinishing(true);
    setError('');
    try {
      if (engine.phase === 'review') {
        engine.resumeReview();
        await new Promise<void>((resolve) => {
          finishDelay.current = setTimeout(() => { finishDelay.current = null; resolve(); }, 1400);
        });
        if (!alive.current) return;
      }
      const result = await finishRun(run.runId);
      if (!alive.current) return;
      onFinished(result, run.questions.filter((q) => answers[q.position]).map((q) => ({
        ...answers[q.position], questionText: answers[q.position].prompt ?? q.question
      })));
    } catch {
      if (alive.current) setError('Could not save the run. Try again.');
    } finally {
      inFlight.current = false;
      if (alive.current) setFinishing(false);
    }
  }

  function handleToggleKorean() {
    setKoreanShown((shown) => { saveKoreanShown(!shown); return !shown; });
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLDivElement>) {
    if (challengeOpen) return;
    if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); onQuit(); return; }
    if (e.key !== 'Tab') return;
    const items = Array.from(e.currentTarget.querySelectorAll<HTMLElement>('button:not([disabled]), [href], input:not([disabled]), [tabindex]:not([tabindex="-1"])'));
    if (!items.length) return;
    e.preventDefault();
    const index = items.indexOf(document.activeElement as HTMLElement);
    items[e.shiftKey ? index <= 0 ? items.length - 1 : index - 1 : (index + 1) % items.length].focus();
  }
}

const topCls = css`
  display: flex; align-items: center; gap: 1rem;
  padding: 0.6rem 0.8rem; background: #2a2140; color: #f5eaff;
`;
const titleCls = css`
  display: inline-flex; align-items: center; gap: 0.8rem;
  font-family: ${PIXEL_FONT}; font-size: 1.15rem; line-height: 1.6;
  @media (max-width: ${mobileMaxWidth}) { font-size: 1rem; }
`;
const audioCls = css`margin-left: auto;`;
const quitCls = css`
  ${button(WOOD, '#6e3d1b')}
  min-height: 44px; font-size: 1.3rem; padding: 0 1rem; color: #fff5df; flex-shrink: 0;
`;
const progressCls = css`
  ${frame(PLATE, 2)}
  display: flex; flex-shrink: 0; flex-wrap: wrap; align-items: center;
  justify-content: center; gap: 0.7rem 1.6rem;
  width: 100%; padding: 0.7rem 1rem; color: #f5eaff; font-size: 1.3rem;
`;
const marbleRowCls = css`display: flex; flex-wrap: wrap; gap: 0.6rem; align-items: center;`;
const currentMarbleCls = css`outline: 2px solid #e3c3ff; outline-offset: 3px;`;
const comboCls = css`font-weight: 800;`;
const comboHotCls = css`color: #ffdc73;`;
const readyCls = css`padding: 2rem 1rem; font-family: ${PIXEL_FONT}; font-size: 1.2rem; text-align: center; color: #e3c3ff;`;
const introCls = css`font-size: 1.2rem; color: #c4b3d6; margin-bottom: 0.7rem; line-height: 1.5;`;
const metaCls = css`font-size: 1.3rem; line-height: 1.5; color: #d3c4e2;`;
const instructionCls = css`margin-top: 0.6rem; font-size: 1.4rem; font-weight: 700;`;
const questionCls = css`
  margin: 0.7rem 0 1.3rem; font-size: 2rem; font-weight: 700;
  line-height: 1.4; overflow-wrap: anywhere;
  @media (max-width: ${mobileMaxWidth}) { font-size: 1.8rem; }
`;
const choicesCls = css`display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 1rem;
  @media (max-width: ${mobileMaxWidth}) { grid-template-columns: 1fr; gap: 0.8rem; }
`;
const choiceCls = css`
  display: flex; align-items: center; min-width: 0; gap: 1rem;
  min-height: 48px; padding: 1rem 1.2rem;
  border: 2px solid #75529e; border-radius: 12px;
  background: #7956aa; box-shadow: 0 4px 0 #513571; color: #fff;
  font-size: 1.6rem; font-weight: 800; text-align: left; overflow-wrap: anywhere;
  cursor: pointer;
  &:active { transform: translateY(2px); }
  &:disabled { cursor: default; }
`;
const letterCls = css`
  display: inline-flex; align-items: center; justify-content: center; flex-shrink: 0;
  width: 2.8rem; height: 2.8rem; border-radius: 6px; background: rgba(255,255,255,.2);
`;
const rightCls = css`background: #278b4c; border-color: #197039; box-shadow: 0 4px 0 #176031;`;
const wrongCls = css`background: #bc3154; border-color: #97273f; box-shadow: 0 4px 0 #7e2035;`;
const dimCls = css`opacity: 0.55;`;
const errorCls = css`margin-top: 1rem; color: #ff9db0; font-size: 1.4rem;`;
const missCls = css`margin-top: 1.5rem;`;
const missNoteCls = css`font-size: 1.35rem; line-height: 1.5; color: #e1d0f5; margin-bottom: 0.8rem;`;
const nextRowCls = css`display: flex; flex-wrap: wrap; align-items: center; justify-content: flex-end; gap: 1rem; margin-top: 1.5rem;`;
const challengeCls = css`${challengeButton()} margin-right: auto; min-height: 44px;`;
const reviewedCls = css`${reviewedButton()} margin-right: auto; min-height: 44px;`;
const nextCls = css`
  ${button(GOLD, '#9a6500')}
  min-height: 48px; padding: 0.9rem 1.5rem;
  font-family: ${PIXEL_FONT}; font-size: 1.1rem; line-height: 1.5;
  &:disabled { opacity: 0.6; cursor: default; }
`;
