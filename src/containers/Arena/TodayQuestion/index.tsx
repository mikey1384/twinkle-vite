import React, { useEffect, useRef, useState } from 'react';
import { css } from '@emotion/css';
import { useAppContext, useKeyContext, useNotiContext } from '~/contexts';
import { buildTodayStatsPatchFromDailyTaskStatus } from '~/helpers';
import RewardChips from '~/components/RewardChips';
import { WEBSITE_AGENT_NO_PLAY_ATTRIBUTE, WEBSITE_AGENT_OFF_LIMITS_ATTRIBUTE } from '~/helpers/websiteAgentPage';
import ArenaLoader from '../ArenaLoader';
import MathText from '../MathText';
import { ARENA } from '../theme';
import LearningScene from './LearningScene';
import type { Profile, Prompt, TodayState } from './types';

const EMPTY_PROFILE: Profile = { goal: '', subject: '', grade: '', confidence: '' };
export default function TodayQuestion() {
  const request = useAppContext(v => v.requestHelpers.arenaToday);
  const userId = useKeyContext(v => v.myState.userId);
  const onSetUserState = useAppContext(v => v.user.actions.onSetUserState);
  const onApplyTodayStatsProgress = useNotiContext(v => v.actions.onApplyTodayStatsProgress);
  const [data, setData] = useState<TodayState | null>(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const busyRef = useRef(false);
  const mounted = useRef(true);
  const requestId = useRef(0);
  const [editing, setEditing] = useState(false);
  const [profile, setProfile] = useState<Profile>(EMPTY_PROFILE);
  const [setupStep, setSetupStep] = useState(0);
  const [answer, setAnswer] = useState<string | number | null>(null);
  const [checkAnswer, setCheckAnswer] = useState<string | number | null>(null);
  const [lessonIndex, setLessonIndex] = useState(0);
  const [exploring, setExploring] = useState(false);
  const assignmentId = useRef<number | null>(null);

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
  }, [userId]);

  useEffect(() => {
    if (!data) return;
    const refresh = () => {
      if (Date.now() >= data.nextDay && !busyRef.current) void run('open');
    };
    const timer = window.setTimeout(refresh, Math.max(50, data.nextDay - Date.now() + 100));
    const retry = window.setInterval(refresh, 30000);
    window.addEventListener('focus', refresh);
    return () => { window.clearTimeout(timer); window.clearInterval(retry); window.removeEventListener('focus', refresh); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data?.nextDay]);

  if (!data) return <section className={wrapCls}>{error ? <><p role="alert">{error}</p><button className={primaryCls} onClick={() => void run('open')}>Try again</button></> : <ArenaLoader text="Opening your daily question…" />}</section>;
  const q = data.assignment;
  const rewards = q?.rewards || data.rewards;
  const setup = !data.profile || editing;
  const goal = data.options.goals.find(g => g.key === profile.goal);
  const setupTitles = ['What are you working toward?', 'What should we focus on?', 'Which school year are you in?', 'Where should we start?'];
  const choices = setupStep === 0 ? data.options.goals : setupStep === 1 ? profile.goal === 'exam' ? data.options.exams : (goal?.subjects || []).map(s => ({ key: s, label: s })) : setupStep === 2 ? data.options.grades : data.options.confidence;
  const lesson = q?.lesson;
  const step = lesson?.steps[lessonIndex];
  const showLesson = q?.attempted && (!q.completedVia || exploring);
  const showCheck = showLesson && lesson && lessonIndex >= lesson.totalSteps;

  return (
    <section className={wrapCls} aria-busy={busy} {...(!setup && q && !q.completedVia ? { [WEBSITE_AGENT_NO_PLAY_ATTRIBUTE]: 'arenaToday', [WEBSITE_AGENT_OFF_LIMITS_ATTRIBUTE]: 'arenaToday' } : {})}>
      <header className={headCls}>
        <div><span className={eyebrowCls}>ONE QUESTION, FOR YOU</span><h1>Today’s Q</h1></div>
        {data.profile && !setup && <button className={linkCls} disabled={busy} onClick={editPreferences}>My focus</button>}
      </header>
      {error && <div role="alert" className={errorCls}>{error}<button className={linkCls} disabled={busy} onClick={() => void run('open')}>Refresh</button></div>}
      {setup ? (
        <div className={paperCls}>
          <p className={eyebrowCls}>STEP {setupStep + 1} OF 4</p>
          <div className={progressCls} aria-hidden="true">{[0, 1, 2, 3].map(i => <span key={i} data-done={i <= setupStep} />)}</div>
          <h2>{setupTitles[setupStep]}</h2>
          <p>{setupStep === 0 ? 'We’ll prepare one useful question a day for your goal.' : setupStep === 1 ? 'Pick one focus for now. You can change it later.' : setupStep === 2 ? 'This helps us choose the right starting point. Use the equivalent grade if you study outside Korea.' : 'Your answers will help us adjust future questions.'}</p>
          <div className={setupStep === 2 ? gradeChoicesCls : choicesCls}>
            {choices.map(choice => <button key={choice.key} type="button" className={optionCls} disabled={busy} onClick={() => void choosePreference(choice.key)}>{choice.label}</button>)}
          </div>
          <div className={actionsCls}>
            {setupStep > 0 && <button className={linkCls} disabled={busy} onClick={() => setSetupStep(s => s - 1)}>Back</button>}
            {editing && <button className={linkCls} disabled={busy} onClick={() => setEditing(false)}>Cancel</button>}
          </div>
          <p className={mutedCls}>Questions are prepared for you during our regular refills. {editing ? 'Changes apply to future questions; today’s question stays the same.' : 'You’ll see your first question here when it’s ready.'}</p>
        </div>
      ) : !q ? (
        <div className={paperCls}>
          <span className={eyebrowCls}>YOUR FOCUS IS SAVED</span>
          <h2>We’re preparing your question</h2>
          <p>{profileLabel(data)} · {data.options.grades.find(g => g.key === data.profile?.grade)?.label}</p>
          <p>Your next question will include an interactive explanation made for that question. Check back after the next refill.</p>
          <RewardOffer rewards={rewards} />
          <button className={primaryCls} disabled={busy} onClick={() => void run('open')}>Check for my question</button>
        </div>
      ) : (
        <>
          {q.completedVia && <div className={successCls} role="status">
            <span className={eyebrowCls}>A CLEARED ✓</span>
            <h2>{q.completedVia === 'correct' ? 'Right first time!' : 'You worked it out.'}</h2>
            <p>{q.completedVia === 'correct' ? 'Your daily reward is yours.' : 'You learned the idea and passed the understanding check.'}</p>
            <div className={rewardRowCls}><RewardChips xp={q.reward.xp} coins={q.reward.coins} />{q.completedVia === 'guided' && <span>No Coins on the guided route</span>}</div>
            <p className={mutedCls}>A new question unlocks at 9 AM Korea time, when one is ready.</p>
            {!exploring && <button className={primaryCls} onClick={() => { setExploring(true); setLessonIndex(0); }}>{q.completedVia === 'correct' ? 'Explore the explanation' : 'Review what I learned'}</button>}
          </div>}
          {!q.attempted ? <div className={paperCls}>
            <span className={eyebrowCls}>{q.skill}</span><h2>{q.title}</h2>
            <RewardOffer rewards={rewards} />
            <Question prompt={q.question} value={answer} onChange={setAnswer} disabled={busy} />
            <p className={mutedCls}>Your first answer counts. If you miss it, the explanation and understanding check can still clear A.</p>
            <button className={primaryCls} disabled={busy || !hasAnswer(answer)} onClick={() => void run('action', { assignmentId: q.id, action: 'answer', answer })}>Submit answer</button>
          </div> : <details className={originalCls}>
            <summary>Original question · {q.firstCorrect ? 'Correct' : 'Learning from a miss'}</summary>
            <Question prompt={q.question} value={q.firstAnswer} onChange={() => {}} disabled />
          </details>}
          {showLesson && lesson && <div className={paperCls}>
            {!q.completedVia && <div className={learningNoteCls}><strong>Not quite — let’s work it out.</strong><p>Finish the explanation and get the understanding check right to clear A and earn <RewardChips xp={rewards.guidedXP} />. No Coins on this route.</p></div>}
            <span className={eyebrowCls}>{showCheck ? 'PUT THE IDEA TO WORK' : `EXPLANATION · ${lessonIndex + 1} / ${lesson.totalSteps}`}</span>
            <h2>{showCheck ? 'A quick understanding check' : step?.title}</h2>
            {showCheck && q.check ? <>
              <p className={summaryCls}><MathText text={lesson.summary || ''} /></p>
              <Question prompt={q.check} value={q.checkResult?.correct ? q.checkResult.answer : checkAnswer} onChange={setCheckAnswer} disabled={busy || q.checkResult?.correct === true} />
              {q.checkResult && <p role="status" className={q.checkResult.correct ? feedbackCls : learningNoteCls}>{q.checkResult.correct ? q.checkResult.explanation : 'Not yet. Revisit the explanation, then try applying the idea again.'}</p>}
              {!q.checkResult?.correct && <button className={primaryCls} disabled={busy || !hasAnswer(checkAnswer)} onClick={() => void run('action', { assignmentId: q.id, action: 'check', answer: checkAnswer })}>Check my understanding</button>}
            </> : step && <>
              <p><MathText text={step.prompt} /></p>
              <LearningScene scene={step.response?.scene || step.scene} />
              <div className={choicesCls}>{step.options.map((option, i) => <button key={i} className={optionCls} aria-pressed={step.response?.option === i} disabled={busy || step.response?.correct === true} onClick={() => void run('action', { assignmentId: q.id, action: 'lesson', step: lessonIndex, option: i })}><MathText text={option.label} /></button>)}</div>
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
      <p className={footCls}>One reward per day. First try or guided learning both clear A. Basic and Excellence bonuses keep their own goals.</p>
    </section>
  );

  function apply(next: TodayState) {
    if (assignmentId.current !== (next.assignment?.id ?? null)) {
      assignmentId.current = next.assignment?.id ?? null;
      setAnswer(null); setCheckAnswer(null); setExploring(false);
      setLessonIndex(next.assignment?.lesson?.completedSteps || 0);
    }
    setData(next);
    if (next.profile) setProfile(next.profile);
    if (next.balances) onSetUserState({ userId, newState: next.balances });
    if (next.dailyTaskStatus) onApplyTodayStatsProgress({ newStats: buildTodayStatsPatchFromDailyTaskStatus(next.dailyTaskStatus) });
  }

  async function run(action: 'open' | 'profile' | 'action', body: Record<string, unknown> = {}) {
    if (busyRef.current) return false;
    busyRef.current = true; setBusy(true); setError('');
    const id = ++requestId.current;
    try {
      const next: TodayState = await request(action, body);
      if (!mounted.current || id !== requestId.current) return false;
      apply(next);
      return true;
    } catch (err: any) {
      if (mounted.current && id === requestId.current) setError(err?.response?.data?.error || err?.message || 'Your progress could not be loaded. Please try again.');
      return false;
    } finally {
      if (id === requestId.current) {
        busyRef.current = false;
        if (mounted.current) setBusy(false);
      }
    }
  }

  function editPreferences() {
    setProfile(data?.profile || EMPTY_PROFILE); setSetupStep(0); setEditing(true); setError('');
  }

  async function choosePreference(value: string) {
    const field = (['goal', 'subject', 'grade', 'confidence'] as const)[setupStep];
    const next = { ...profile, [field]: value, ...(field === 'goal' && value !== profile.goal ? { subject: '' } : {}) };
    setProfile(next);
    if (setupStep < 3) setSetupStep(s => s + 1);
    else if (await run('profile', { goal: next.goal, subject: next.subject, grade: next.grade, confidence: next.confidence })) setEditing(false);
  }
}

function hasAnswer(value: string | number | null) { return typeof value === 'number' || typeof value === 'string' && value.trim().length > 0; }
function profileLabel(data: TodayState) {
  const profile = data.profile!;
  return profile.goal === 'exam' ? data.options.exams.find(e => e.key === profile.subject)?.label : `${data.options.goals.find(g => g.key === profile.goal)?.label} · ${profile.subject}`;
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
const optionCls = css`display: block; width: 100%; text-align: left; padding: 1rem; border: 2px solid #aeb7bd; border-radius: 8px; background: white; color: ${ARENA.ink}; cursor: pointer; overflow-wrap: anywhere; &:hover:not(:disabled), &[aria-pressed='true'] { border-color: #276951; background: #e9f6ef; } &:disabled { cursor: default; } &:focus-visible { outline: 3px solid #3976bb; outline-offset: 2px; }`;
const primaryCls = css`min-height: 44px; padding: 0.85rem 1.4rem; color: white; background: ${ARENA.ink}; border: 2px solid ${ARENA.ink}; border-radius: 8px; cursor: pointer; font-weight: 800 !important; &:disabled { opacity: 0.45; cursor: default; } &:focus-visible { outline: 3px solid #3976bb; outline-offset: 3px; }`;
const linkCls = css`border: 0; background: transparent; color: ${ARENA.ink}; text-decoration: underline; padding: 0.5rem; cursor: pointer; &:disabled { opacity: 0.45; }`;
const progressCls = css`display: flex; gap: 0.4rem; margin-bottom: 1.6rem; span { height: 5px; background: #e1e4e7; flex: 1; border-radius: 4px; } [data-done='true'] { background: #3d7b60; }`;
const actionsCls = css`display: flex; gap: 1rem; flex-wrap: wrap; justify-content: flex-end; align-items: center; margin-top: 1.5rem;`;
const mutedCls = css`font-size: max(1.1rem, 14px); color: #556168;`;
const footCls = css`font-size: max(1.1rem, 14px); color: #556168; text-align: center; margin: 1.5rem 0 !important;`;
const rewardRowCls = css`display: flex; align-items: center; gap: 0.5rem; flex-wrap: wrap; font-size: max(1.1rem, 14px);`;
const offerCls = css`display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 1rem; padding: 1rem; background: #f5f7f4; border-radius: 8px; margin: 1.5rem 0; > div { display: flex; flex-direction: column; gap: 0.6rem; font-size: max(1.1rem, 14px); } @media (max-width: 480px) { grid-template-columns: 1fr; }`;
const successCls = css`border: 3px solid #326b50; border-radius: 12px; padding: 1.5rem; background: #edf8ee; margin-bottom: 1.5rem;`;
const errorCls = css`padding: 1rem; background: #fff0e9; border: 1px solid #ba6a40; border-radius: 8px; margin-bottom: 1rem;`;
const originalCls = css`padding: 1rem; background: white; border-radius: 8px; border: 1px solid #adb7bb; margin-bottom: 1.5rem; summary { cursor: pointer; font-weight: 700; }`;
const questionCls = css`margin: 1.2rem 0; > p { white-space: pre-wrap; }`;
const passageCls = css`padding: 1.2rem; background: #faf8f1; border-left: 3px solid #b9aa83; white-space: pre-wrap;`;
const inputCls = css`display: grid; gap: 0.5rem; input { font: inherit; width: 100%; padding: 0.9rem; border: 2px solid #adb7bb; border-radius: 6px; color: ${ARENA.ink}; }`;
const feedbackCls = css`padding: 1.1rem; border-left: 4px solid #3b795b; background: #eef7f1; margin: 1rem 0; white-space: pre-wrap;`;
const learningNoteCls = css`padding: 1rem; background: #fff5d7; border-radius: 8px; margin-bottom: 1.5rem;`;
const summaryCls = css`white-space: pre-wrap;`;
