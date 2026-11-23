import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { css, cx } from '@emotion/css';
import MonsterSprite, { MonsterPose } from '~/components/WordMonster/MonsterSprite';
import { backdropUri, HEART, HEART_EMPTY, SCROLL, SPEAKER } from './art';
import { playBattleSound } from './battleSfx';
import LootWindow from './LootWindow';
import { ServerLoot, summarizeLoot } from './loot';
import { useAppContext, useKeyContext } from '~/contexts';
import {
  COMMAND_NAMES,
  QuestionType,
  commandLine,
  defeatLines,
  encounterLines,
  hitLine,
  missLine,
  practiceWinLine,
  ranAwayLines,
  rematchLines
} from './lines';

const PIXEL_FONT = "'Press Start 2P', monospace";
const TYPE_MS = 24;

export interface BattleQuestion {
  index: number;
  type: QuestionType;
  prompt: string;
  choices?: string[];
  claims?: string[];
  hint?: string | null;
  letters?: number;
  hasSentenceAudio?: boolean;
  timeLimitMs: number;
  revealDelayMs: number;
}

// What a finished battle paid (loot.ts): base Word Master points for playing,
// XP and Coins on a win, and every drop the win rolled.
export type BattleLoot = ServerLoot;

export interface BattleState {
  status:
    | 'ready'
    | 'preparing'
    | 'active'
    | 'won'
    | 'lost'
    | 'discovered'
    | 'quizzed'
    | 'read'
    | 'off'
    | 'unavailable';
  playId?: number;
  wordId: number;
  word: string;
  wordLevel: number;
  hearts?: number;
  questionIndex?: number;
  question?: BattleQuestion | null;
  servedAgoMs?: number;
  won?: boolean;
  loot?: BattleLoot;
  unlocked?: Record<string, any>;
  answered?: {
    questionIndex: number;
    correct: boolean;
    timedOut: boolean;
    correctIndex?: number;
    answers?: boolean[];
    spelling?: string;
  };
  stale?: boolean;
  // Monster Den: a rematch (practice, never pays), the identity pool's
  // battles left today (null: unknown), when they reset (ms), and whether
  // the word waits in the member's Den (null: no Den yet).
  practice?: boolean;
  battlesLeft?: number | null;
  battleLimit?: number;
  resetAt?: number;
  captured?: boolean | null;
}

export interface BattleApi {
  start: (wordId: number) => Promise<BattleState>;
  answer: (args: {
    playId: number;
    questionIndex: number;
    answer: number | boolean[] | string;
    elapsedMs?: number;
  }) => Promise<BattleState>;
  loadAudio: (args: { playId: number; kind: 'word' | 'sentence' }) => Promise<Blob>;
}

type Phase = 'loading' | 'talk' | 'question' | 'loot' | 'done' | 'error';

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

// Whole-number sprite scales so the pixels stay crisp; bosses are drawn
// bigger (approved art: 5x for level 5 against 3x for levels 1-2).
function useMonsterScale(level: number) {
  const [narrow, setNarrow] = useState(
    () => typeof window !== 'undefined' && window.innerWidth <= 480
  );
  useEffect(() => {
    const onResize = () => setNarrow(window.innerWidth <= 480);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);
  if (narrow) return level >= 5 ? 4 : level >= 3 ? 3 : 2;
  return level >= 5 ? 5 : level >= 3 ? 4 : 3;
}

// The battle itself: a first-person, turn-based fight in a classic style, all
// original. Monster centred on its backdrop, hearts top left, a text window
// that types the battle lines, and a command window with the question.
export default function BattleScreen({
  initial,
  api,
  onFinished,
  onClose,
  practice = false,
  speed = 1
}: {
  initial: BattleState;
  api: BattleApi;
  onFinished: (finished: BattleState) => void;
  onClose?: () => void;
  // A Monster Den rematch: the same battle, practice only (no loot reel).
  practice?: boolean;
  // tests and previews run the typed lines faster
  speed?: number;
}) {
  const userId = useKeyContext((v) => v.myState.userId);
  const onSetUserState = useAppContext((v) => v.user.actions.onSetUserState);
  const word = initial.word;
  const level = Math.max(1, Math.min(5, Number(initial.wordLevel) || 1));
  const monsterScale = useMonsterScale(level);
  const [phase, setPhase] = useState<Phase>('loading');
  const [line, setLine] = useState('');
  const [typed, setTyped] = useState('');
  const [pose, setPose] = useState<MonsterPose>('idle');
  const [entered, setEntered] = useState(false);
  const [ranAway, setRanAway] = useState(false);
  const [shake, setShake] = useState(false);
  const [hearts, setHearts] = useState(2);
  const [lostHeart, setLostHeart] = useState(-1);
  const [question, setQuestion] = useState<BattleQuestion | null>(null);
  const [revealed, setRevealed] = useState(false);
  const [picked, setPicked] = useState<number | null>(null);
  const [claimPicks, setClaimPicks] = useState<(boolean | null)[]>([null, null, null]);
  const [spellInput, setSpellInput] = useState('');
  const [answerReveal, setAnswerReveal] = useState<BattleState['answered'] | null>(null);
  const [remainingMs, setRemainingMs] = useState(0);
  const [burst, setBurst] = useState<string | null>(null);
  const [finished, setFinished] = useState<BattleState | null>(null);
  const [errorText, setErrorText] = useState('');
  const mounted = useRef(true);
  const playIdRef = useRef<number>(initial.playId || 0);
  const revealAtRef = useRef(0);
  const submittingRef = useRef(false);
  const questionRef = useRef<BattleQuestion | null>(null);
  const audioUrls = useRef<Record<string, string>>({});

  useEffect(() => {
    mounted.current = true;
    const urls = audioUrls.current;
    return () => {
      mounted.current = false;
      Object.values(urls).forEach((url) => URL.revokeObjectURL(url));
    };
  }, []);

  // Types one battle line, then holds it a moment.
  const say = useCallback(
    async (text: string, hold = 550) => {
      if (!mounted.current) return;
      setLine(text);
      setTyped('');
      const step = Math.max(4, TYPE_MS / speed);
      for (let i = 1; i <= text.length; i++) {
        if (!mounted.current) return;
        setTyped(text.slice(0, i));
        await wait(step);
      }
      await wait(hold / speed);
    },
    [speed]
  );

  const finish = useCallback(
    async (state: BattleState) => {
      if (state.status === 'won' && practice) {
        setPose('defeat');
        playBattleSound('defeat');
        await say(defeatLines(word)[0], 700);
        await say(practiceWinLine(word), 600);
        setFinished(state);
        setPhase('done');
      } else if (state.status === 'won') {
        setPose('defeat');
        playBattleSound('defeat');
        const [defeated, dropped] = defeatLines(word);
        await say(defeated, 700);
        setPhase('loot');
        await say(dropped, 300);
        // the loot window calls handleRevealed once every slot is open
        setFinished(state);
      } else if (state.status === 'lost') {
        setRanAway(true);
        playBattleSound('ranAway');
        const [ran, left] = ranAwayLines(word);
        await say(ran, 500);
        await say(left, 600);
        setFinished(state);
        setPhase('done');
      } else {
        setFinished(state);
        setPhase('done');
      }
    },
    [practice, say, word]
  );

  const askQuestion = useCallback(
    async (q: BattleQuestion, resumedAgoMs = 0) => {
      questionRef.current = q;
      setQuestion(q);
      setRevealed(false);
      setPicked(null);
      setClaimPicks([null, null, null]);
      setSpellInput('');
      setAnswerReveal(null);
      submittingRef.current = false;
      setPhase('talk');
      await say(commandLine(q.type, word), 200);
      if (!mounted.current) return;
      setPhase('question');
      const delay = resumedAgoMs ? 0 : Math.max(0, q.revealDelayMs - 400) / speed;
      await wait(delay);
      if (!mounted.current) return;
      revealAtRef.current = Date.now();
      setRevealed(true);
      setRemainingMs(Math.max(3000, q.timeLimitMs - resumedAgoMs));
      if (q.type === 'bee') void playClip('word');
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [say, speed, word]
  );

  // Opening: start (or resume) the battle, then the encounter.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        let state = initial;
        if (state.status === 'ready') state = await api.start(initial.wordId);
        if (cancelled) return;
        if (state.status !== 'active') {
          setEntered(true);
          await finish(state);
          return;
        }
        playIdRef.current = state.playId || 0;
        setHearts(state.hearts ?? 2);
        setPhase('talk');
        await wait(60);
        setEntered(true);
        playBattleSound(level >= 5 ? 'boss' : 'encounter');
        if (level >= 5) {
          setShake(true);
          setTimeout(() => mounted.current && setShake(false), 500);
        }
        if (!state.servedAgoMs) {
          const opening = practice ? rematchLines(word) : encounterLines(word, level);
          for (const text of opening) await say(text, 450);
        }
        if (state.question) await askQuestion(state.question, state.servedAgoMs || 0);
      } catch (error: any) {
        if (cancelled) return;
        console.error(error);
        setErrorText('The monster wandered off. Try again in a moment.');
        setPhase('error');
      }
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // The answer window: a timeout sends an empty answer (the server marks it).
  useEffect(() => {
    if (phase !== 'question' || !revealed || !question) return;
    const deadline = revealAtRef.current + Math.max(3000, remainingMs);
    const id = window.setInterval(() => {
      const left = deadline - Date.now();
      if (left <= 0) {
        window.clearInterval(id);
        setRemainingMs(0);
        void submit(question.type === 'truefalse' ? [] : question.type === 'bee' ? '' : -1);
        return;
      }
      setRemainingMs(left);
    }, 100);
    return () => window.clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, revealed, question]);

  async function submit(answer: number | boolean[] | string) {
    const q = questionRef.current;
    if (!q || submittingRef.current || !playIdRef.current) return;
    submittingRef.current = true;
    const elapsedMs = Math.max(0, Date.now() - revealAtRef.current);
    setPhase('talk');
    let state: BattleState;
    try {
      state = await api.answer({
        playId: playIdRef.current,
        questionIndex: q.index,
        answer,
        elapsedMs
      });
    } catch (error) {
      console.error(error);
      setErrorText('The connection fizzled. Close and open the word to carry on.');
      setPhase('error');
      return;
    }
    if (!mounted.current) return;
    const result = state.answered;
    const isFinal = state.status !== 'active';
    if (result) {
      setAnswerReveal(result);
      if (result.correct) {
        setPose('hit');
        setBurst(isFinal ? 'CRITICAL!' : 'HIT!');
        playBattleSound('hit');
        await say(hitLine(q.type, word, isFinal && state.status === 'won'), 500);
      } else {
        setPose('attack');
        setShake(true);
        playBattleSound('counter');
        setTimeout(() => mounted.current && setShake(false), 450);
        setLostHeart((state.hearts ?? hearts - 1));
        setHearts(state.hearts ?? Math.max(0, hearts - 1));
        await say(missLine(word, result.timedOut), 900);
      }
      setBurst(null);
      if (!mounted.current) return;
      setPose('idle');
      setLostHeart(-1);
    }
    if (state.status === 'active' && state.question) {
      await askQuestion(state.question);
      return;
    }
    await finish(state);
  }

  async function playClip(kind: 'word' | 'sentence') {
    const playId = playIdRef.current;
    if (!playId) return;
    try {
      let url = audioUrls.current[kind];
      if (!url) {
        const blob = await api.loadAudio({ playId, kind });
        url = URL.createObjectURL(blob);
        audioUrls.current[kind] = url;
      }
      const audio = new Audio(url);
      await audio.play();
    } catch (error) {
      console.warn('Battle audio could not play', error);
    }
  }

  function handlePick(index: number) {
    if (phase !== 'question' || !revealed || picked !== null) return;
    playBattleSound('select');
    setPicked(index);
    void submit(index);
  }

  function handleClaim(i: number, value: boolean) {
    if (phase !== 'question' || !revealed || claimPicks[i] !== null) return;
    playBattleSound('select');
    const next = [...claimPicks];
    next[i] = value;
    setClaimPicks(next);
    if (next.every((v) => v !== null)) void submit(next as boolean[]);
  }

  function handleCast(event?: React.FormEvent) {
    event?.preventDefault();
    if (phase !== 'question' || !revealed || !spellInput.trim()) return;
    playBattleSound('select');
    void submit(spellInput);
  }

  const lootSummary = useMemo(() => summarizeLoot(finished?.loot), [finished]);
  const handleRevealed = useCallback(() => {
    if (!finished) return;
    const loot = finished.loot;
    // The member's XP and Coins after the win, as the server counted them.
    const newState: Record<string, number> = {};
    if (typeof loot?.xp === 'number') newState.twinkleXP = loot.xp;
    if (typeof loot?.coins === 'number') newState.twinkleCoins = loot.coins;
    if (userId && Object.keys(newState).length) onSetUserState({ userId, newState });
    if (finished.status === 'won') setPhase('done');
  }, [finished, onSetUserState, userId]);

  const shortChoices =
    question?.choices && question.choices.every((c) => c.length <= 18) && question.type !== 'meaning';
  const timeShare = question ? Math.max(0, Math.min(1, remainingMs / Math.max(1, question.timeLimitMs))) : 0;

  return (
    <div className={cx(rootCls, shake && shakeCls)} data-phase={phase}>
      <div className={sceneCls} style={{ backgroundImage: `url("${backdropUri(level)}")` }}>
        <div className={hudCls}>
          <div className={heartsCls} aria-label={`${hearts} hearts left`}>
            {[0, 1].map((i) => (
              <img
                key={i}
                src={i < hearts ? HEART : HEART_EMPTY}
                alt=""
                className={cx(heartCls, i === lostHeart && heartLostCls)}
              />
            ))}
          </div>
          <div className={plateCls}>
            <span className={plateNameCls}>{word.toUpperCase()}</span>
            <span className={plateLevelCls}>
              {level >= 5 ? 'BOSS' : `Lv${level}`}
              {practice ? ' · REMATCH' : ''}
            </span>
          </div>
          {onClose && (
            <button type="button" className={closeCls} onClick={onClose} aria-label="Close">
              ×
            </button>
          )}
        </div>
        <div
          className={cx(
            monsterWrapCls,
            entered && monsterEnteredCls,
            entered && level >= 5 && bossEnterCls,
            ranAway && ranAwayCls
          )}
        >
          <MonsterSprite word={word} level={level} pose={pose} scale={monsterScale} />
          {burst && <div className={burstCls}>{burst}</div>}
        </div>
      </div>

      <div className={windowCls} aria-live="polite">
        <div className={textCls}>
          {phase === 'error' ? errorText : typed}
          {phase !== 'error' && typed.length < line.length && <span className={caretCls}>▌</span>}
        </div>
      </div>

      {(phase === 'question' || (phase === 'talk' && question && revealed)) && question && (
        <div className={commandCls}>
          <div className={commandHeadCls}>
            <span className={commandNameCls}>{COMMAND_NAMES[question.type]}</span>
            <div className={timerCls} aria-hidden>
              <div className={timerFillCls} style={{ width: `${Math.round(timeShare * 100)}%` }} />
            </div>
          </div>
          <div className={promptCls}>{renderPrompt(question.prompt)}</div>
          {question.hint && <div className={hintCls}>Hint: it's a {question.hint}.</div>}
          {revealed && question.choices && (
            <div className={cx(choicesCls, shortChoices && choicesGridCls)}>
              {question.choices.map((choice, i) => {
                const isPicked = picked === i;
                const isRight = answerReveal?.correctIndex === i;
                const isWrongPick = isPicked && answerReveal && !answerReveal.correct;
                return (
                  <button
                    key={i}
                    type="button"
                    className={cx(
                      choiceCls,
                      isPicked && choicePickedCls,
                      answerReveal && isRight && choiceRightCls,
                      isWrongPick && choiceWrongCls
                    )}
                    disabled={phase !== 'question' || picked !== null}
                    onClick={() => handlePick(i)}
                  >
                    <span className={cursorCls}>{isPicked ? '▶' : ''}</span>
                    <span className={choiceTextCls}>{choice}</span>
                  </button>
                );
              })}
            </div>
          )}
          {revealed && question.claims && (
            <div className={claimsCls}>
              {question.claims.map((claim, i) => (
                <div key={i} className={claimRowCls}>
                  <span className={claimTextCls}>{claim}</span>
                  <div className={claimButtonsCls}>
                    {[true, false].map((value) => {
                      const chosen = claimPicks[i] === value;
                      const truth = answerReveal?.answers?.[i];
                      return (
                        <button
                          key={String(value)}
                          type="button"
                          className={cx(
                            claimButtonCls,
                            chosen && choicePickedCls,
                            answerReveal && truth === value && choiceRightCls,
                            answerReveal && chosen && truth !== value && choiceWrongCls
                          )}
                          disabled={phase !== 'question' || claimPicks[i] !== null}
                          onClick={() => handleClaim(i, value)}
                        >
                          {value ? 'TRUE' : 'FALSE'}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
          {revealed && question.type === 'bee' && (
            <form className={beeCls} onSubmit={handleCast}>
              <div className={beeAudioRowCls}>
                <button type="button" className={beeAudioCls} onClick={() => playClip('word')}>
                  <img src={SPEAKER} alt="" className={beeIconCls} /> Hear it
                </button>
                {question.hasSentenceAudio && (
                  <button type="button" className={beeAudioCls} onClick={() => playClip('sentence')}>
                    <img src={SCROLL} alt="" className={beeIconCls} /> In a sentence
                  </button>
                )}
              </div>
              <div className={beeInputRowCls}>
                <input
                  className={beeInputCls}
                  value={spellInput}
                  onChange={(e) => setSpellInput(e.target.value)}
                  placeholder={question.letters ? `${question.letters} letters` : 'Type its name'}
                  autoComplete="off"
                  autoCorrect="off"
                  autoCapitalize="off"
                  spellCheck={false}
                  maxLength={60}
                  disabled={phase !== 'question'}
                  autoFocus
                />
                <button type="submit" className={castCls} disabled={phase !== 'question' || !spellInput.trim()}>
                  CAST
                </button>
              </div>
              {answerReveal?.spelling && !answerReveal.correct && (
                <div className={hintCls}>The right spelling: {answerReveal.spelling}</div>
              )}
            </form>
          )}
        </div>
      )}

      {!practice &&
        finished &&
        ((finished.status === 'won' && (phase === 'loot' || phase === 'done')) ||
          (finished.status === 'lost' && phase === 'done' && lootSummary.basePoints > 0)) && (
          <LootWindow
            summary={lootSummary}
            won={finished.status === 'won'}
            onRevealed={handleRevealed}
          />
        )}

      {phase === 'done' && finished && (
        <div className={doneRowCls}>
          <button type="button" className={doneButtonCls} onClick={() => onFinished(finished)}>
            {practice ? 'Done ▶' : 'See what it means ▶'}
          </button>
        </div>
      )}
      {phase === 'error' && onClose && (
        <div className={doneRowCls}>
          <button type="button" className={doneButtonCls} onClick={onClose}>
            Close
          </button>
        </div>
      )}
    </div>
  );
}

// Prompts carry the word in curly quotes and an optional second line (the
// spell sentence with its gap).
function renderPrompt(prompt: string) {
  const [head, ...rest] = prompt.split('\n');
  return (
    <>
      <div>{head}</div>
      {rest.length > 0 && <div className={spellLineCls}>{rest.join(' ')}</div>}
    </>
  );
}

const rootCls = css`
  width: 100%;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  gap: 10px;
  background: #0f0b1a;
  padding: 12px;
  color: #ffffff;
  min-height: 100%;
  user-select: none;
  @media (max-width: 480px) {
    padding: 8px;
    gap: 8px;
  }
`;

const shakeCls = css`
  animation: battle-shake 0.45s steps(3) 1;
  @keyframes battle-shake {
    0% {
      transform: translate(0, 0);
    }
    25% {
      transform: translate(-6px, 3px);
    }
    50% {
      transform: translate(5px, -3px);
    }
    75% {
      transform: translate(-3px, 2px);
    }
    100% {
      transform: translate(0, 0);
    }
  }
`;

const sceneCls = css`
  position: relative;
  height: 360px;
  background-size: cover;
  background-position: center bottom;
  image-rendering: pixelated;
  border: 3px solid #ffffff;
  box-shadow: 0 0 0 3px #0f0b1a;
  overflow: hidden;
  @media (max-width: 480px) {
    height: 300px;
  }
`;

const hudCls = css`
  position: absolute;
  top: 8px;
  left: 8px;
  right: 8px;
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  z-index: 2;
`;

const heartsCls = css`
  display: flex;
  gap: 6px;
  padding: 6px 8px;
  background: rgba(15, 11, 26, 0.75);
  border: 2px solid #ffffff;
`;

const heartCls = css`
  width: 28px;
  height: 28px;
  image-rendering: pixelated;
`;

const heartLostCls = css`
  animation: heart-lost 0.6s steps(2) 2;
  @keyframes heart-lost {
    0% {
      transform: scale(1.4);
      opacity: 0.3;
    }
    100% {
      transform: scale(1);
      opacity: 1;
    }
  }
`;

const plateCls = css`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  padding: 6px 10px;
  background: rgba(15, 11, 26, 0.75);
  border: 2px solid #ffffff;
  max-width: 60%;
`;

const plateNameCls = css`
  font-family: ${PIXEL_FONT};
  font-size: 12px;
  letter-spacing: 1px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  max-width: 100%;
  @media (max-width: 480px) {
    font-size: 10px;
  }
`;

const plateLevelCls = css`
  font-family: ${PIXEL_FONT};
  font-size: 9px;
  color: #ffd34d;
`;

const closeCls = css`
  width: 36px;
  height: 36px;
  font-size: 22px;
  line-height: 1;
  color: #ffffff;
  background: rgba(15, 11, 26, 0.75);
  border: 2px solid #ffffff;
  cursor: pointer;
`;

const monsterWrapCls = css`
  position: absolute;
  left: 50%;
  bottom: -14px;
  transform: translate(-50%, -140%);
  opacity: 0;
  transition: transform 0.45s steps(5), opacity 0.2s;
`;

const monsterEnteredCls = css`
  transform: translate(-50%, 0);
  opacity: 1;
`;

const bossEnterCls = css`
  transition: transform 0.3s steps(3), opacity 0.1s;
`;

const ranAwayCls = css`
  transform: translate(160%, 0) !important;
  transition: transform 0.6s steps(6) !important;
`;

const burstCls = css`
  position: absolute;
  top: 38%;
  left: 50%;
  transform: translateX(-50%);
  font-family: ${PIXEL_FONT};
  font-size: 20px;
  color: #ffd34d;
  text-shadow: 3px 3px 0 #0f0b1a, -2px -2px 0 #0f0b1a;
  animation: burst-up 0.7s steps(4) 1 forwards;
  @keyframes burst-up {
    0% {
      transform: translate(-50%, 10px) scale(0.6);
    }
    40% {
      transform: translate(-50%, -6px) scale(1.2);
    }
    100% {
      transform: translate(-50%, -24px) scale(1);
    }
  }
`;

const windowCls = css`
  background: #0f0b1a;
  border: 3px solid #ffffff;
  box-shadow: 0 0 0 3px #0f0b1a, inset 0 0 0 3px #2c2442;
  padding: 14px 16px;
  min-height: 74px;
`;

const textCls = css`
  font-family: ${PIXEL_FONT};
  font-size: 13px;
  line-height: 1.8;
  @media (max-width: 480px) {
    font-size: 11px;
  }
`;

const caretCls = css`
  animation: caret-blink 0.6s steps(1) infinite;
  @keyframes caret-blink {
    50% {
      opacity: 0;
    }
  }
`;

const commandCls = css`
  background: #0f0b1a;
  border: 3px solid #ffffff;
  box-shadow: 0 0 0 3px #0f0b1a, inset 0 0 0 3px #2c2442;
  padding: 12px 14px 14px;
  display: flex;
  flex-direction: column;
  gap: 10px;
`;

const commandHeadCls = css`
  display: flex;
  align-items: center;
  gap: 12px;
`;

const commandNameCls = css`
  font-family: ${PIXEL_FONT};
  font-size: 11px;
  color: #ffd34d;
  white-space: nowrap;
`;

const timerCls = css`
  flex: 1;
  height: 10px;
  border: 2px solid #ffffff;
  background: #2c2442;
`;

const timerFillCls = css`
  height: 100%;
  background: #3ad16f;
  transition: width 0.1s linear;
`;

const promptCls = css`
  font-size: 17px;
  font-weight: 700;
  line-height: 1.4;
  @media (max-width: 480px) {
    font-size: 15px;
  }
`;

const spellLineCls = css`
  margin-top: 8px;
  padding: 8px 10px;
  background: #f6e6bf;
  color: #3b2200;
  font-weight: 600;
  border: 2px solid #d6b46f;
`;

const hintCls = css`
  font-size: 13px;
  color: #b9a6ff;
`;

const choicesCls = css`
  display: grid;
  grid-template-columns: 1fr;
  gap: 8px;
  animation: choices-in 0.25s steps(3) 1;
  @keyframes choices-in {
    0% {
      opacity: 0;
      transform: translateY(6px);
    }
    100% {
      opacity: 1;
      transform: translateY(0);
    }
  }
`;

const choicesGridCls = css`
  @media (min-width: 400px) {
    grid-template-columns: 1fr 1fr;
  }
`;

const choiceCls = css`
  display: flex;
  align-items: center;
  gap: 6px;
  min-height: 46px;
  padding: 8px 12px 8px 6px;
  text-align: left;
  color: #ffffff;
  background: #1d1630;
  border: 2px solid #5a4d7a;
  cursor: pointer;
  font-size: 15px;
  line-height: 1.3;
  &:hover:not(:disabled) {
    border-color: #ffffff;
    background: #2a2045;
  }
  &:disabled {
    cursor: default;
  }
  @media (max-width: 480px) {
    font-size: 14px;
  }
`;

const cursorCls = css`
  width: 14px;
  flex-shrink: 0;
  color: #ffd34d;
  font-size: 12px;
`;

const choiceTextCls = css`
  flex: 1;
  min-width: 0;
  overflow-wrap: anywhere;
`;

const choicePickedCls = css`
  border-color: #ffd34d !important;
`;

const choiceRightCls = css`
  border-color: #3ad16f !important;
  background: #173d2a !important;
`;

const choiceWrongCls = css`
  border-color: #ff3b5c !important;
  background: #4a1626 !important;
`;

const claimsCls = css`
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

const claimRowCls = css`
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 6px 8px;
  background: #1d1630;
  border: 2px solid #5a4d7a;
  @media (max-width: 480px) {
    flex-direction: column;
    align-items: stretch;
  }
`;

const claimTextCls = css`
  flex: 1;
  font-size: 15px;
  line-height: 1.3;
`;

const claimButtonsCls = css`
  display: flex;
  gap: 6px;
  flex-shrink: 0;
`;

const claimButtonCls = css`
  min-width: 74px;
  min-height: 40px;
  font-family: ${PIXEL_FONT};
  font-size: 10px;
  color: #ffffff;
  background: #0f0b1a;
  border: 2px solid #5a4d7a;
  cursor: pointer;
  @media (max-width: 480px) {
    flex: 1;
  }
`;

const beeCls = css`
  display: flex;
  flex-direction: column;
  gap: 10px;
`;

const beeAudioRowCls = css`
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
`;

const beeAudioCls = css`
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  font-size: 14px;
  font-weight: 700;
  color: #ffffff;
  background: #2a2045;
  border: 2px solid #ffffff;
  cursor: pointer;
`;

const beeIconCls = css`
  width: 18px;
  height: 18px;
  image-rendering: pixelated;
`;

const beeInputRowCls = css`
  display: flex;
  gap: 8px;
`;

const beeInputCls = css`
  flex: 1;
  min-width: 0;
  font-size: 18px;
  font-weight: 700;
  letter-spacing: 1px;
  padding: 10px 12px;
  color: #ffffff;
  background: #1d1630;
  border: 2px solid #ffffff;
  outline: none;
  &:focus {
    border-color: #ffd34d;
  }
`;

const castCls = css`
  font-family: ${PIXEL_FONT};
  font-size: 12px;
  padding: 0 16px;
  color: #3b2200;
  background: #ffd34d;
  border: 2px solid #ffffff;
  cursor: pointer;
  &:disabled {
    opacity: 0.5;
    cursor: default;
  }
`;




const doneRowCls = css`
  display: flex;
  justify-content: center;
`;

const doneButtonCls = css`
  font-family: ${PIXEL_FONT};
  font-size: 12px;
  padding: 14px 18px;
  color: #3b2200;
  background: #ffd34d;
  border: 3px solid #ffffff;
  box-shadow: 0 4px 0 #b88a00;
  cursor: pointer;
  &:active {
    transform: translateY(3px);
    box-shadow: 0 1px 0 #b88a00;
  }
`;
