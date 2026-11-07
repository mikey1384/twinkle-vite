import React, { useEffect, useRef, useState } from 'react';
import { css, cx } from '@emotion/css';
import { useAppContext, useKeyContext, useNotiContext } from '~/contexts';
import { buildTodayStatsPatchFromDailyTaskStatus } from '~/helpers';
import RewardChips from '~/components/RewardChips';
import { WEBSITE_AGENT_NO_PLAY_ATTRIBUTE, WEBSITE_AGENT_OFF_LIMITS_ATTRIBUTE } from '~/helpers/websiteAgentPage';
import Icon from '~/components/Icon';
import ArenaLoader from '../ArenaLoader';
import MathText from '../MathText';
import { ARENA } from '../theme';
import LearningScene from './LearningScene';
import type { Profile, Prompt, TodayState } from './types';

const EMPTY_PROFILE: Profile = { goal: '', subject: '', grade: '', confidence: '' };
const SETUP_FIELDS = ['goal', 'subject', 'grade', 'confidence'] as const;
const NO_OPTIONS: NonNullable<TodayState['options']> = { goals: [], grades: [], confidence: [], exams: [] };
// sharedId: another member's cleared question, opened from their Home story
// (Mikey 11-01). Same question, explanation and check; no setup, its own
// payout, and the daily paid limit in place of the one-a-day rule.
// review: opened from one's own Home post, straight to the explanation of a
// cleared question (Mikey 11-01)
export default function TodayQuestion({ sharedId = 0, review = false }: { sharedId?: number; review?: boolean }) {
  const shared = sharedId > 0;
  const requestToday = useAppContext(v => v.requestHelpers.arenaToday);
  const requestShared = useAppContext(v => v.requestHelpers.arenaShared);
  const userId = useKeyContext(v => v.myState.userId);
  const onSetUserState = useAppContext(v => v.user.actions.onSetUserState);
  const onApplyTodayStatsProgress = useNotiContext(v => v.actions.onApplyTodayStatsProgress);
  const [data, setData] = useState<TodayState | null>(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  // which tap is waiting on the server: its button shows the spinner, and a
  // failure is shown beside it rather than at the top of a long page
  const [pending, setPending] = useState<string | null>(null);
  const [errorAt, setErrorAt] = useState<string | null>(null);
  const busyRef = useRef(false);
  const mounted = useRef(true);
  const requestId = useRef(0);
  const [editing, setEditing] = useState(false);
  // My focus opens on what the focus is now (Mikey 11-01), then edits it
  const [viewingFocus, setViewingFocus] = useState(false);
  const [focusSaved, setFocusSaved] = useState(false);
  const [profile, setProfile] = useState<Profile>(EMPTY_PROFILE);
  const [setupStep, setSetupStep] = useState(0);
  const [answer, setAnswer] = useState<string | number | null>(null);
  const [checkAnswer, setCheckAnswer] = useState<string | number | null>(null);
  const [lessonIndex, setLessonIndex] = useState(0);
  const [exploring, setExploring] = useState(false);
  const reviewPending = useRef(review);
  const assignmentId = useRef<number | null>(null);
  const hasProfile = !!data?.profile;
  const waitingForQuestion = hasProfile && !data?.assignment;
  const options = data?.options || NO_OPTIONS;

  useEffect(() => {
    mounted.current = true;
    busyRef.current = false;
    assignmentId.current = null;
    setData(null); setProfile(EMPTY_PROFILE); setEditing(false); setSetupStep(0);
    void run('open');
    return () => {
      mounted.current = false;
      // This counter invalidates the latest request, rather than a DOM ref.
      // eslint-disable-next-line react-hooks/exhaustive-deps
      requestId.current++;
    };
    // Request helpers are stable context actions, not dependencies.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId, sharedId]);

  useEffect(() => {
    if (shared || !data || !hasProfile || editing) return;
    const refresh = () => {
      if (
        document.visibilityState === 'visible' &&
        !busyRef.current &&
        (waitingForQuestion || Date.now() >= data.nextDay)
      ) void run('open');
    };
    const timer = window.setTimeout(refresh, Math.max(50, data.nextDay - Date.now() + 100));
    const retry = window.setInterval(refresh, 60000);
    window.addEventListener('focus', refresh);
    document.addEventListener('visibilitychange', refresh);
    return () => {
      window.clearTimeout(timer);
      window.clearInterval(retry);
      window.removeEventListener('focus', refresh);
      document.removeEventListener('visibilitychange', refresh);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data?.nextDay, hasProfile, waitingForQuestion, editing]);

  if (!data) return <section className={wrapCls}>{error ? <><p role="alert">{error}</p><button className={primaryCls} disabled={busy} onClick={() => void run('open')}>{pending === 'open' && <Icon icon="spinner" pulse />}Try again</button></> : <ArenaLoader text={shared ? 'Opening the question…' : 'Opening your challenge…'} />}</section>;
  const q = data.assignment;
  const rewards = q?.rewards || data.rewards;
  const setup = !shared && (!data.profile || editing);
  // a shared question once the day's paid ones are used up still plays
  const unpaidToday = shared && !q?.completedVia && (data.paidToday ?? 0) >= (data.paidPerDay ?? 0);
  const goal = options.goals.find(g => g.key === profile.goal);
  const setupTitles = ['What are you working toward?', profile.goal === 'ssat' ? 'Which SSAT level are you preparing for?' : 'What should we focus on?', 'Which school year are you in?', 'Where should we start?'];
  const choices = setupStep === 0 ? options.goals : setupStep === 1 ? profile.goal === 'exam' ? options.exams : (goal?.subjects || []).map(s => ({ key: s, label: options.exams.find(exam => exam.key === s)?.label || s })) : setupStep === 2 ? options.grades : options.confidence;
  const lesson = q?.lesson;
  const step = lesson?.steps[lessonIndex];
  const showLesson = q?.attempted && (!q.completedVia || exploring);
  const showCheck = showLesson && lesson && lessonIndex >= lesson.totalSteps;
  // a failed answer, lesson step or check keeps its message beside the button
  // that was tapped, while that button is on screen; anything else is shown
  // at the top
  const answerShown = !setup && !viewingFocus && !!q && !q.attempted;
  const inlineError = !!error && (
    (errorAt === 'answer' && answerShown) ||
    (errorAt === 'check' && !setup && !viewingFocus && !!showCheck && !!q?.check && !q.checkResult?.correct) ||
    (errorAt === 'lesson' && !setup && !viewingFocus && !!showLesson && !showCheck && !!step)
  );
  const errorBanner = (inline: boolean) => <div role="alert" className={inline ? cx(errorCls, inlineErrorCls) : errorCls}>{error}<button className={linkCls} disabled={busy} onClick={() => void run('open')}>{pending === 'open' && <Icon icon="spinner" pulse />}Refresh</button></div>;

  return (
    <section className={wrapCls} aria-busy={busy} {...(!setup && q && !q.completedVia ? { [WEBSITE_AGENT_NO_PLAY_ATTRIBUTE]: 'arenaToday', [WEBSITE_AGENT_OFF_LIMITS_ATTRIBUTE]: 'arenaToday' } : {})}>
      <header className={headCls}>
        {shared
          ? <div><span className={eyebrowCls}>{data.sharer?.username ? `${data.sharer.username.toUpperCase()} CLEARED THIS` : 'A CLEARED QUESTION'}</span><h1>Try this question</h1></div>
          : <div><span className={eyebrowCls}>ONE QUESTION, FOR YOU</span><h1>Today’s Challenge</h1></div>}
        {!shared && data.profile && !setup && !viewingFocus && <button className={linkCls} disabled={busy} onClick={() => { setFocusSaved(false); setViewingFocus(true); }}>My focus</button>}
      </header>
      {error && !inlineError && errorBanner(false)}
      {!shared && !setup && data.setupCompletedToday && !q?.completedVia && <div className={successCls} role="status">
        <strong>A cleared for today ✓</strong>
        <p>Your first-time setup counts. You can still complete your challenge to earn its rewards.</p>
      </div>}
      {setup ? (
        <div className={paperCls}>
          <p className={eyebrowCls}>STEP {setupStep + 1} OF 4</p>
          <div className={progressCls} aria-hidden="true">{[0, 1, 2, 3].map(i => <span key={i} data-done={i <= setupStep} />)}</div>
          <h2>{setupTitles[setupStep]}</h2>
          <p>{setupStep === 0 ? 'We’ll prepare one useful question a day for your goal.' : setupStep === 1 ? profile.goal === 'ssat' ? 'Use your current US grade: Elementary 3 or 4, Middle 5–7, Upper 8–11. You can change this later.' : 'Pick one focus for now. You can change it later.' : setupStep === 2 ? 'This helps us choose the right starting point. Use the equivalent grade if you study outside Korea.' : 'Your answers will help us adjust future questions.'}</p>
          <div className={setupStep === 2 ? gradeChoicesCls : choicesCls}>
            {choices.map(choice => <button key={choice.key} type="button" className={cx(optionCls, spinOptionCls)} aria-pressed={profile[SETUP_FIELDS[setupStep]] === choice.key} disabled={busy} onClick={() => void choosePreference(choice.key)}>{choice.label}{pending === `profile:${choice.key}` && <Icon className={optionSpinnerCls} icon="spinner" pulse />}</button>)}
          </div>
          <div className={actionsCls}>
            {setupStep > 0 && <button className={linkCls} disabled={busy} onClick={() => setSetupStep(s => s - 1)}>Back</button>}
            {editing && <button className={linkCls} disabled={busy} onClick={() => { setEditing(false); setViewingFocus(true); }}>Cancel</button>}
          </div>
          <p className={mutedCls}>{editing ? 'Changes apply to future questions; today’s question stays the same.' : 'Finish this first-time setup to clear A for today. We’ll prepare a question for your focus.'}</p>
        </div>
      ) : viewingFocus && data.profile ? (
        <div className={paperCls}>
          <span className={eyebrowCls}>MY FOCUS</span>
          <h2>Your questions are prepared for</h2>
          {focusSaved && <p role="status" className={feedbackCls}>Saved. Future questions follow this focus.</p>}
          <dl className={focusListCls}>
            <div><dt>Working toward</dt><dd>{options.goals.find(g => g.key === data.profile?.goal)?.label || data.profile.goal}</dd></div>
            <div><dt>Focus</dt><dd>{options.exams.find(e => e.key === data.profile?.subject)?.label || data.profile.subject}</dd></div>
            <div><dt>School year</dt><dd>{options.grades.find(g => g.key === data.profile?.grade)?.label || data.profile.grade}</dd></div>
            <div><dt>Starting point</dt><dd>{options.confidence.find(c => c.key === data.profile?.confidence)?.label || data.profile.confidence}</dd></div>
          </dl>
          <p className={mutedCls}>Changes apply to future questions; today’s question stays the same.</p>
          <div className={actionsCls}>
            <button className={linkCls} disabled={busy} onClick={() => setViewingFocus(false)}>Back to today’s question</button>
            <button className={primaryCls} disabled={busy} onClick={editPreferences}>Change my focus</button>
          </div>
        </div>
      ) : !q ? (
        <div className={paperCls}>
          <span className={eyebrowCls}>YOUR FOCUS IS SAVED</span>
          <h2>We’re preparing your challenge</h2>
          <p>{profileLabel(data)} · {options.grades.find(g => g.key === data.profile?.grade)?.label}</p>
          <p>Your challenge will appear here when it’s ready, with an interactive explanation to help you learn.</p>
          <RewardOffer rewards={rewards} />
        </div>
      ) : (
        <>
          {q.completedVia && <div className={successCls} role="status">
            <span className={eyebrowCls}>{q.unpaid ? 'CLEARED' : 'A CLEARED ✓'}</span>
            <h2>{q.completedVia === 'correct' ? 'Right first time!' : 'You worked it out.'}</h2>
            <p>{q.unpaid
              ? `Today’s ${data.paidPerDay} paid questions were already used, so this one paid no reward.`
              : shared
                ? q.completedVia === 'correct' ? 'Its reward is yours.' : 'You learned the idea and passed the understanding check.'
                : q.completedVia === 'correct' ? 'Your daily reward is yours.' : 'You learned the idea and passed the understanding check.'}</p>
            {!q.unpaid && <div className={rewardRowCls}><RewardChips xp={q.reward.xp} coins={q.reward.coins} />{q.completedVia === 'guided' && <span>No Coins on the guided route</span>}</div>}
            <p className={mutedCls}>{shared
              ? `Try more from Home: the first ${data.paidPerDay} each day pay. Your own Today’s Challenge is separate.`
              : 'A new question unlocks at 9 AM Korea time, when one is ready.'}</p>
            {!exploring && <button className={primaryCls} onClick={() => { setExploring(true); setLessonIndex(0); }}>{q.completedVia === 'correct' ? 'Explore the explanation' : 'Review what I learned'}</button>}
          </div>}
          {!q.attempted ? <div className={paperCls}>
            <span className={eyebrowCls}>{q.skill}</span><h2>{q.title}</h2>
            {unpaidToday
              ? <p className={learningNoteCls}>Today’s {data.paidPerDay} paid questions are used up. You can still try this one, for no reward.</p>
              : <RewardOffer rewards={rewards} />}
            <Question prompt={q.question} value={answer} onChange={setAnswer} disabled={busy} />
            <p className={mutedCls}>{unpaidToday ? 'Your first answer counts. If you miss it, the explanation and understanding check are still there.' : 'Your first answer counts. If you miss it, the explanation and understanding check can still clear A.'}</p>
            <button className={primaryCls} disabled={busy || !hasAnswer(answer)} onClick={() => void act({ action: 'answer', answer }, 'answer')}>{pending === 'answer' && <Icon icon="spinner" pulse />}Submit answer</button>
            {inlineError && errorAt === 'answer' && errorBanner(true)}
          </div> : <details className={originalCls}>
            <summary>Original question · {q.firstCorrect ? 'Correct' : 'Learning from a miss'}</summary>
            <Question prompt={q.question} value={q.firstAnswer} onChange={() => {}} disabled />
          </details>}
          {showLesson && lesson && <div className={paperCls}>
            {!q.completedVia && <div className={learningNoteCls}><strong>Not quite — let’s work it out.</strong>{unpaidToday
              ? <p>Finish the explanation and get the understanding check right to clear it.</p>
              : <p>Finish the explanation and get the understanding check right to clear A and earn <RewardChips xp={rewards.guidedXP} />. No Coins on this route.</p>}</div>}
            <span className={eyebrowCls}>{showCheck ? 'PUT THE IDEA TO WORK' : `EXPLANATION · ${lessonIndex + 1} / ${lesson.totalSteps}`}</span>
            <h2>{showCheck ? 'A quick understanding check' : step?.title}</h2>
            {showCheck && q.check ? <>
              <p className={summaryCls}><MathText text={lesson.summary || ''} /></p>
              <Question prompt={q.check} value={q.checkResult?.correct ? q.checkResult.answer : checkAnswer} onChange={setCheckAnswer} disabled={busy || q.checkResult?.correct === true} />
              {q.checkResult && <p role="status" className={q.checkResult.correct ? feedbackCls : learningNoteCls}>{q.checkResult.correct ? q.checkResult.explanation : 'Not yet. Revisit the explanation, then try applying the idea again.'}</p>}
              {!q.checkResult?.correct && <button className={primaryCls} disabled={busy || !hasAnswer(checkAnswer)} onClick={() => void act({ action: 'check', answer: checkAnswer }, 'check')}>{pending === 'check' && <Icon icon="spinner" pulse />}Check my understanding</button>}
              {inlineError && errorAt === 'check' && errorBanner(true)}
            </> : step && <>
              <p><MathText text={step.prompt} /></p>
              <LearningScene scene={step.response?.scene || step.scene} />
              <div className={choicesCls}>{step.options.map((option, i) => <button key={i} className={cx(optionCls, spinOptionCls)} aria-pressed={pending === `lesson:${i}` || (pending == null && step.response?.option === i)} disabled={busy || step.response?.correct === true} onClick={() => void act({ action: 'lesson', step: lessonIndex, option: i }, `lesson:${i}`)}><MathText text={option.label} />{pending === `lesson:${i}` && <Icon className={optionSpinnerCls} icon="spinner" pulse />}</button>)}</div>
              {inlineError && errorAt === 'lesson' && errorBanner(true)}
              {step.response && <div className={feedbackCls} role="status"><MathText text={step.response.feedback} /></div>}
            </>}
            <div className={actionsCls}>
              {lessonIndex > 0 && <button className={linkCls} disabled={busy} onClick={() => setLessonIndex(i => i - 1)}>Back</button>}
              {!showCheck && <button className={primaryCls} disabled={busy || lesson.completedSteps <= lessonIndex} onClick={() => setLessonIndex(i => i + 1)}>{lessonIndex + 1 === lesson.totalSteps ? 'Try the understanding check' : 'Next step'}</button>}
              {exploring && q.completedVia && <button className={linkCls} onClick={() => setExploring(false)}>Done reviewing</button>}
            </div>
          </div>}
        </>
      )}
      <p className={footCls}>{shared
        ? `The first ${data.paidPerDay} shared questions you clear each day pay, and a paid one clears A. One try per question.`
        : 'One reward per day. First try or guided learning both clear A. Basic and Excellence bonuses keep their own goals.'}</p>
    </section>
  );

  function apply(next: TodayState) {
    if (assignmentId.current !== (next.assignment?.id ?? null)) {
      assignmentId.current = next.assignment?.id ?? null;
      setAnswer(null); setCheckAnswer(null); setExploring(false);
      setLessonIndex(next.assignment?.lesson?.completedSteps || 0);
    }
    if (reviewPending.current && next.assignment) {
      reviewPending.current = false;
      if (next.assignment.completedVia) { setExploring(true); setLessonIndex(0); }
    }
    setData(next);
    if (next.profile) setProfile(next.profile);
    if (next.balances) onSetUserState({ userId, newState: next.balances });
    if (next.dailyTaskStatus) onApplyTodayStatsProgress({ newStats: buildTodayStatsPatchFromDailyTaskStatus(next.dailyTaskStatus) });
  }

  // the same answer, lesson and check actions, on whichever question is open
  function act(body: Record<string, unknown>, key: string) {
    const id = data?.assignment?.id;
    return run('action', shared ? { attemptId: id, ...body } : { assignmentId: id, ...body }, key);
  }

  async function run(action: 'open' | 'profile' | 'action', body: Record<string, unknown> = {}, key: string = action) {
    if (busyRef.current) return false;
    busyRef.current = true; setBusy(true); setError(''); setErrorAt(null); setPending(key);
    const id = ++requestId.current;
    try {
      const next: TodayState = shared
        ? await requestShared(action === 'open' ? 'open' : 'action', action === 'open' ? { challengeId: sharedId } : body)
        : await requestToday(action, body);
      if (!mounted.current || id !== requestId.current) return false;
      apply(next);
      return true;
    } catch (err: any) {
      if (mounted.current && id === requestId.current) {
        setError(err?.response?.data?.error || err?.message || 'Your progress could not be loaded. Please try again.');
        // an answer, lesson step or check shows its failure beside its button
        setErrorAt(key.split(':')[0]);
      }
      return false;
    } finally {
      if (id === requestId.current) {
        busyRef.current = false;
        if (mounted.current) { setBusy(false); setPending(null); }
      }
    }
  }

  function editPreferences() {
    setProfile(data?.profile || EMPTY_PROFILE); setSetupStep(0); setEditing(true); setViewingFocus(false); setFocusSaved(false); setError('');
  }

  async function choosePreference(value: string) {
    const field = SETUP_FIELDS[setupStep];
    const next = { ...profile, [field]: value, ...(field === 'goal' && value !== profile.goal ? { subject: '' } : {}) };
    setProfile(next);
    if (setupStep < 3) setSetupStep(s => s + 1);
    else if (await run('profile', { goal: next.goal, subject: next.subject, grade: next.grade, confidence: next.confidence }, `profile:${value}`)) {
      // an edit lands back on the focus, now saved; first-time setup goes on to the question
      if (editing) { setViewingFocus(true); setFocusSaved(true); }
      setEditing(false);
    }
  }
}

function hasAnswer(value: string | number | null) { return typeof value === 'number' || typeof value === 'string' && value.trim().length > 0; }
function profileLabel(data: TodayState) {
  const profile = data.profile!;
  const options = data.options || NO_OPTIONS;
  return options.exams.find(e => e.key === profile.subject)?.label || `${options.goals.find(g => g.key === profile.goal)?.label} · ${profile.subject}`;
}
function RewardOffer({ rewards }: { rewards: TodayState['rewards'] }) {
  return <div className={offerCls}>
    <div><span>Right first time</span><div className={rewardRowCls}><RewardChips xp={rewards.correctXP} coins={rewards.correctCoins} /></div></div>
    <div><span>Learn it, then pass the check</span><div className={rewardRowCls}><RewardChips xp={rewards.guidedXP} /><span>No Coins</span></div></div>
  </div>;
}
function Question({ prompt, value, onChange, disabled }: { prompt: Prompt; value: string | number | null; onChange: (value: string | number) => void; disabled: boolean }) {
  return <div className={questionCls}>
    {prompt.passage && <div className={passageCls}><MathText text={prompt.passage} /></div>}
    <p><MathText text={prompt.prompt} /></p>
    {prompt.choices ? <div className={choicesCls} role="group" aria-label="Answer choices">{prompt.choices.map((choice, i) => <button type="button" key={i} className={optionCls} aria-pressed={value === i} disabled={disabled} onClick={() => onChange(i)}><strong>{String.fromCharCode(65 + i)}.</strong> <MathText text={choice} /></button>)}</div> : <label className={inputCls}>Your answer<input value={value ?? ''} onChange={e => onChange(e.target.value)} disabled={disabled} maxLength={300} autoComplete="off" /></label>}
  </div>;
}

const wrapCls = css`width: 100%; max-width: 760px; margin: 0 auto; font-size: max(1.6rem, 16px); line-height: 1.55; h1 { font-size: max(2.5rem, 28px); margin: 0; } h2 { font-size: max(1.8rem, 22px); line-height: 1.3; margin: 0.5rem 0 1rem; } p { margin: 0.8rem 0; } button { font: inherit; } .reward-amount-chip { font-size: max(1.3rem, 14px); }`;
const headCls = css`display: flex; justify-content: space-between; gap: 1rem; align-items: center; margin-bottom: 1.5rem;`;
const eyebrowCls = css`font-size: max(1rem, 12px); font-weight: 800; letter-spacing: 0.06em;`;
const paperCls = css`background: white; border: 3px solid ${ARENA.ink}; border-radius: 12px; box-shadow: 4px 5px 0 ${ARENA.ink}; padding: 2rem; margin-bottom: 1.5rem; @media (max-width: 480px) { padding: 1.2rem; }`;
const choicesCls = css`display: grid; gap: 0.7rem; margin: 1.2rem 0;`;
const gradeChoicesCls = css`display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 0.7rem; margin: 1.2rem 0;`;
const optionCls = css`position: relative; display: block; width: 100%; text-align: left; padding: 1rem; border: 2px solid #aeb7bd; border-radius: 8px; background: white; color: ${ARENA.ink}; cursor: pointer; overflow-wrap: anywhere; &:hover:not(:disabled), &[aria-pressed='true'] { border-color: #276951; background: #e9f6ef; } &:disabled { cursor: default; } &:focus-visible { outline: 3px solid #3976bb; outline-offset: 2px; }`;
// options that send a tap (setup's last step, lesson steps) keep room on
// the right for the spinner, so a pending tap never reflows the text
const spinOptionCls = css`padding-right: 3.4rem;`;
const optionSpinnerCls = css`position: absolute; right: 1.1rem; top: 50%; margin-top: -0.5em;`;
const primaryCls = css`display: inline-flex; align-items: center; justify-content: center; gap: 0.7rem; min-height: 44px; padding: 0.85rem 1.4rem; color: white; background: ${ARENA.ink}; border: 2px solid ${ARENA.ink}; border-radius: 8px; cursor: pointer; font-weight: 800 !important; &:disabled { opacity: 0.45; cursor: default; } &:focus-visible { outline: 3px solid #3976bb; outline-offset: 3px; }`;
const linkCls = css`display: inline-flex; align-items: center; gap: 0.5rem; border: 0; background: transparent; color: ${ARENA.ink}; text-decoration: underline; padding: 0.5rem; cursor: pointer; &:disabled { opacity: 0.45; }`;
const progressCls = css`display: flex; gap: 0.4rem; margin-bottom: 1.6rem; span { height: 5px; background: #e1e4e7; flex: 1; border-radius: 4px; } [data-done='true'] { background: #3d7b60; }`;
const actionsCls = css`display: flex; gap: 1rem; flex-wrap: wrap; justify-content: flex-end; align-items: center; margin-top: 1.5rem;`;
const mutedCls = css`font-size: max(1.1rem, 14px); color: #556168;`;
const footCls = css`font-size: max(1.1rem, 14px); color: #556168; text-align: center; margin: 1.5rem 0 !important;`;
const rewardRowCls = css`display: flex; align-items: center; gap: 0.5rem; flex-wrap: wrap; font-size: max(1.1rem, 14px);`;
const offerCls = css`display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 1rem; padding: 1rem; background: #f5f7f4; border-radius: 8px; margin: 1.5rem 0; > div { display: flex; flex-direction: column; gap: 0.6rem; font-size: max(1.1rem, 14px); } @media (max-width: 480px) { grid-template-columns: 1fr; }`;
const successCls = css`border: 3px solid #326b50; border-radius: 12px; padding: 1.5rem; background: #edf8ee; margin-bottom: 1.5rem;`;
const errorCls = css`display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: 0.6rem; padding: 1rem; background: #fff0e9; border: 1px solid #ba6a40; border-radius: 8px; margin-bottom: 1rem;`;
// beside the button that failed
const inlineErrorCls = css`margin: 1rem 0 0;`;
const originalCls = css`padding: 1rem; background: white; border-radius: 8px; border: 1px solid #adb7bb; margin-bottom: 1.5rem; summary { cursor: pointer; font-weight: 700; }`;
const questionCls = css`margin: 1.2rem 0; > p { white-space: pre-wrap; }`;
const passageCls = css`padding: 1.2rem; background: #faf8f1; border-left: 3px solid #b9aa83; white-space: pre-wrap;`;
const inputCls = css`display: grid; gap: 0.5rem; input { font: inherit; width: 100%; padding: 0.9rem; border: 2px solid #adb7bb; border-radius: 6px; color: ${ARENA.ink}; }`;
const feedbackCls = css`padding: 1.1rem; border-left: 4px solid #3b795b; background: #eef7f1; margin: 1rem 0; white-space: pre-wrap;`;
const learningNoteCls = css`padding: 1rem; background: #fff5d7; border-radius: 8px; margin-bottom: 1.5rem;`;
const focusListCls = css`display: grid; gap: 0.9rem; margin: 1.2rem 0; > div { display: grid; gap: 0.2rem; padding: 0.9rem 1rem; border: 2px solid #e1e4e7; border-radius: 8px; } dt { font-size: max(1.1rem, 13px); font-weight: 700; color: #556168; } dd { margin: 0; font-weight: 800; overflow-wrap: anywhere; }`;
const summaryCls = css`white-space: pre-wrap;`;
