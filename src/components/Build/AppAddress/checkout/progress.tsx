import React, { useEffect, useState } from 'react';
import { css, keyframes } from '@emotion/css';
import { useAppContext, useKeyContext } from '~/contexts';
import {
  BUILD_WORKSPACE_COMPACT_LANDSCAPE_MEDIA_QUERY,
  BUILD_WORKSPACE_COMPACT_MEDIA_QUERY
} from '~/containers/Build/Editor/constants';
import type { AddressText } from '../text';
import { refreshDomainProgress } from '../useDomainProgress';
import { progressFraction, type DomainProgressView, type ProgressStepKey } from './model';
import { formatResendCountdown, resendStore } from './resendStore';
import { T, CheckIcon, StarMark } from './ui';
import type { HeaderMenuItem } from '~/components/Build/HeaderChip';

// The purchase progress tracker's pieces outside the checkout's dark stage:
// the chip's label with its bar, the step track, the Name.com confirmation
// nudge with Resend, and the Build header's notice. All read the shared
// progress record (../useDomainProgress).

export function stepLabel(t: AddressText, key: ProgressStepKey, state: string) {
  if (key === 'paid') return t.stepPaid;
  if (key === 'registered') return t.stepRegistered;
  if (key === 'secure') return state === 'current' ? t.stepSecuring : t.stepSecure;
  if (key === 'live') return t.stepLive;
  return t.stepEmail;
}

// a purchase still needs the member's eye (or ours)
export function progressShowing(progress: DomainProgressView | null): progress is DomainProgressView {
  return Boolean(progress && ['setting_up', 'one_step_left', 'support'].includes(progress.stage));
}

// The address chip while a purchase is under way: "Setting up…" with a bar,
// then "1 step left" once only the email confirmation is left.
export function ChipProgressLabel({ t, progress }: { t: AddressText; progress: DomainProgressView }) {
  const label = progress.stage === 'one_step_left' ? t.chipOneStep : progress.stage === 'support' ? t.chipOnIt : t.chipSettingUp;
  const percent = Math.round(progressFraction(progress) * 100);
  return (
    <span className={chipLabelClass}>
      <span>{label}</span>
      {progress.stage === 'setting_up' ? (
        <span className={chipBarClass} role="progressbar" aria-label={t.progressLabel} aria-valuemin={0} aria-valuemax={100} aria-valuenow={percent}>
          <span style={{ width: `${Math.max(8, percent)}%` }} />
        </span>
      ) : progress.stage === 'one_step_left' ? (
        <span className={chipDotClass} aria-hidden="true" />
      ) : null}
    </span>
  );
}

// Paid → Registered → Secure connection → Live → Email confirmed, small.
export function ProgressTrack({ t, progress }: { t: AddressText; progress: DomainProgressView }) {
  return (
    <ol className={trackClass} aria-label={t.progressLabel}>
      {progress.steps.map((step) => (
        <li key={step.key} data-state={step.state} aria-current={step.state === 'current' ? 'step' : undefined}>
          <span className={trackDotClass} aria-hidden="true">
            {step.state === 'done' ? <CheckIcon size={11} color="#fff" /> : step.state === 'current' ? <StarMark size={10} /> : step.state === 'problem' ? '!' : null}
          </span>
          <span>{stepLabel(t, step.key, step.state)}</span>
        </li>
      ))}
    </ol>
  );
}

// Resend Name.com's confirmation email (one per 15 minutes per record).
// Shared across the chip menu, Build header notice, and Live order screen.
export function useResendVerification(t: AddressText, buildId: number, progress: DomainProgressView | null) {
  const resendDomainVerification = useAppContext((v) => v.requestHelpers.resendDomainVerification);
  const rawUserId = useKeyContext((v) => v.myState.userId);
  const userId = Number(rawUserId || 0);
  const orderId = progress?.orderId || 0;
  const [, setTick] = useState(0);

  useEffect(() => {
    resendStore.syncUser(userId || null);
  }, [userId]);

  useEffect(() => {
    if (!userId || !buildId || !orderId) return;
    return resendStore.subscribe(userId, buildId, orderId, () => setTick((value) => value + 1));
  }, [userId, buildId, orderId]);

  const snapshot = resendStore.getSnapshot(userId, buildId, progress);
  const cooldownUntil = snapshot.cooldownUntil;

  useEffect(() => {
    if (!cooldownUntil || cooldownUntil <= Date.now()) return;
    const timer = window.setInterval(() => {
      if (Date.now() >= cooldownUntil) {
        resendStore.clearExpired(userId, buildId, orderId);
        window.clearInterval(timer);
      }
      setTick((value) => value + 1);
    }, 1000);
    return () => window.clearInterval(timer);
  }, [cooldownUntil, userId, buildId, orderId]);

  const countdown =
    snapshot.cooldownRemainingMs > 0 ? formatResendCountdown(snapshot.cooldownRemainingMs) : '';
  const label =
    snapshot.status === 'sending'
      ? t.resending
      : countdown
        ? `${t.resend} (${countdown})`
        : t.resend;

  return {
    pending: snapshot.pending,
    state: snapshot.status,
    canResend: snapshot.canResend,
    countdown,
    label,
    message:
      snapshot.status === 'sent'
        ? t.resent
        : snapshot.status === 'wait'
          ? t.resendWait
          : snapshot.status === 'failed'
            ? t.resendFailed
            : '',
    nudge: snapshot.pending
      ? snapshot.pending.daysLeft > 0
        ? t.verifyNudge(snapshot.pending.daysLeft)
        : t.verifyNudgeToday
      : '',
    resend: () =>
      resendStore.trigger(userId, buildId, progress, resendDomainVerification, refreshDomainProgress)
  };
}

// The address menu's first rows while a purchase is under way: where it is,
// then Resend (1 step left) or See progress.
export function progressMenuItems(
  t: AddressText,
  progress: DomainProgressView,
  resend: ReturnType<typeof useResendVerification>,
  onSeeProgress: () => void
): HeaderMenuItem[] {
  const current = progress.steps.find((one) => one.state === 'current' || one.state === 'problem');
  const oneStep = progress.stage === 'one_step_left';
  const support = progress.stage === 'support';
  return [
    {
      label: (
        <span className={menuStatusClass}>
          <strong>{oneStep ? t.oneStepTitle : support ? t.chipOnIt : t.settingUpTitle(progress.domain)}</strong>
          <small>{oneStep ? resend.nudge : support ? t.onItBody : current ? stepLabel(t, current.key, current.state) : ''}</small>
          {resend.message ? <small role="status">{resend.message}</small> : null}
        </span>
      )
    },
    oneStep
      ? {
          label: <span>{resend.label}</span>,
          disabled: !resend.canResend,
          keepOpen: true,
          style: { color: '#4b3cf0', fontWeight: 800 },
          onClick: () => void resend.resend()
        }
      : {
          label: <span>{t.seeProgress}</span>,
          style: { color: '#4b3cf0', fontWeight: 800 },
          onClick: onSeeProgress
        }
  ];
}

// "Check your email from Name.com and click Verify. N days left…" + Resend.
export function VerifyNudge({ t, buildId, progress, compact = false }: { t: AddressText; buildId: number; progress: DomainProgressView; compact?: boolean }) {
  const resend = useResendVerification(t, buildId, progress);
  if (!resend.pending) return null;
  return (
    <div className={nudgeClass} data-compact={compact || undefined}>
      <p>{resend.nudge}</p>
      <div className={nudgeRowClass}>
        <button type="button" className={resendClass} disabled={!resend.canResend} onClick={() => void resend.resend()}>
          {resend.label}
        </button>
        <span role="status" className={nudgeStatusClass}>
          {resend.message}
        </span>
      </div>
    </div>
  );
}

// The Build header's notice for the owner while a purchase is under way.
// On phones it collapses to a compact single-line bar so the locked Build
// workspace underneath keeps its height, with a toggle to inspect details.
export function ProgressNotice({
  t,
  buildId,
  progress,
  onOpen
}: {
  t: AddressText;
  buildId: number;
  progress: DomainProgressView;
  onOpen: () => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const resend = useResendVerification(t, buildId, progress);
  const oneStep = progress.stage === 'one_step_left';
  const support = progress.stage === 'support';
  useEffect(() => {
    setExpanded(false);
  }, [buildId, progress.orderId]);
  return (
    <section className={noticeClass} data-stage={progress.stage} data-expanded={expanded || undefined} aria-label={t.progressLabel}>
      <div className={noticeHeadClass}>
        <strong>{oneStep ? t.oneStepTitle : support ? t.supportTitle(progress.domain) : t.settingUpNotice(progress.domain)}</strong>
        <div className={noticeActionsClass}>
          {oneStep ? (
            !expanded ? (
              <button type="button" className={mobileResendClass} disabled={!resend.canResend} onClick={() => void resend.resend()}>
                {resend.label}
              </button>
            ) : null
          ) : (
            <button type="button" className={linkButtonClass} onClick={onOpen}>
              {t.seeProgress}
            </button>
          )}
          <button
            type="button"
            className={mobileToggleClass}
            aria-expanded={expanded}
            aria-label={t.progressLabel}
            onClick={() => setExpanded((prev) => !prev)}
          >
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.6"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
              style={{ transform: expanded ? 'rotate(180deg)' : 'none', transition: 'transform 0.18s ease' }}
            >
              <path d="M6 9l6 6 6-6" />
            </svg>
          </button>
        </div>
      </div>
      {oneStep && resend.message && !expanded ? (
        <span role="status" className={mobileStatusClass}>
          {resend.message}
        </span>
      ) : null}
      <div className={noticeDetailsClass} data-expanded={expanded || undefined}>
        {support && <p className={noticeBodyClass}>{t.onItBody}</p>}
        <ProgressTrack t={t} progress={progress} />
        {oneStep && <VerifyNudge t={t} buildId={buildId} progress={progress} compact />}
      </div>
    </section>
  );
}

// ---------------------------------------------------------------- styles

const pulse = keyframes`
  0%, 100% { transform: scale(1); box-shadow: 0 0 0 0 rgba(91, 75, 255, 0.35); }
  50% { transform: scale(1.08); box-shadow: 0 0 0 5px rgba(91, 75, 255, 0); }
`;
const shimmer = keyframes`
  from { background-position: 0 0; }
  to { background-position: 24px 0; }
`;

const menuStatusClass = css`
  display: grid;
  gap: 0.3rem;
  min-width: 0;
  max-width: 26rem;
  white-space: normal;
  overflow-wrap: anywhere;
  line-height: 1.4;
  strong {
    overflow-wrap: anywhere;
  }
  small {
    color: #5d5d6e;
    font-size: 1.15rem;
    overflow-wrap: anywhere;
  }
`;
const chipLabelClass = css`
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
`;
const chipBarClass = css`
  position: relative;
  display: inline-block;
  width: 3.6rem;
  height: 0.5rem;
  border-radius: 999px;
  background: rgba(29, 78, 216, 0.18);
  overflow: hidden;
  > span {
    display: block;
    height: 100%;
    border-radius: inherit;
    background: repeating-linear-gradient(90deg, #2f7be0 0 12px, #5b9bf0 12px 24px);
    animation: ${shimmer} 0.9s linear infinite;
    transition: width 0.6s ${T.ease};
  }
  @media (prefers-reduced-motion: reduce) {
    > span {
      animation: none;
    }
  }
`;
const chipDotClass = css`
  width: 0.7rem;
  height: 0.7rem;
  border-radius: 50%;
  background: #f59e0b;
  animation: ${pulse} 1.8s ease-in-out infinite;
  @media (prefers-reduced-motion: reduce) {
    animation: none;
  }
`;

const trackClass = css`
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem 1.1rem;
  li {
    display: inline-flex;
    align-items: center;
    gap: 0.45rem;
    font-size: 1.25rem;
    font-weight: 700;
    color: ${T.muted};
  }
  li[data-state='done'] {
    color: ${T.green};
  }
  li[data-state='current'] {
    color: ${T.violet};
  }
  li[data-state='problem'] {
    color: #b45309;
  }
`;
const trackDotClass = css`
  flex: none;
  width: 1.8rem;
  height: 1.8rem;
  border-radius: 50%;
  display: grid;
  place-items: center;
  font-size: 1.1rem;
  font-weight: 800;
  border: 2px solid ${T.field};
  background: #fff;
  color: #fff;
  [data-state='done'] > & {
    border-color: ${T.green};
    background: ${T.green};
  }
  [data-state='current'] > & {
    border-color: ${T.violet};
    background: ${T.violet};
    color: #fff3c4;
    animation: ${pulse} 1.6s ease-in-out infinite;
  }
  [data-state='problem'] > & {
    border-color: #f59e0b;
    background: #f59e0b;
  }
  @media (prefers-reduced-motion: reduce) {
    [data-state='current'] > & {
      animation: none;
    }
  }
`;

const nudgeClass = css`
  display: grid;
  gap: 0.6rem;
  padding: 1rem 1.2rem;
  border-radius: 12px;
  background: ${T.warmTint};
  border: 1px solid #f3d9a4;
  color: ${T.ink};
  p {
    margin: 0;
    font-size: 1.35rem;
    line-height: 1.5;
  }
  &[data-compact] {
    padding: 0.8rem 1rem;
    p {
      font-size: 1.25rem;
    }
  }
`;
const nudgeRowClass = css`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.4rem 1rem;
`;
const resendClass = css`
  min-height: 3.2rem;
  padding: 0 1.4rem;
  border-radius: 999px;
  border: 2px solid ${T.blue};
  background: #fff;
  color: ${T.blueDeep};
  font: inherit;
  font-size: 1.25rem;
  font-weight: 800;
  cursor: pointer;
  &:disabled {
    opacity: 0.5;
    cursor: default;
  }
  &:not(:disabled):hover {
    background: ${T.blueTint};
  }
`;
const nudgeStatusClass = css`
  font-size: 1.2rem;
  color: ${T.muted};
  &:empty {
    display: none;
  }
`;

const noticeClass = css`
  grid-column: 1 / -1;
  flex: 0 0 100%;
  width: 100%;
  box-sizing: border-box;
  display: grid;
  gap: 0.8rem;
  padding: 1rem 1.2rem;
  border: 1px solid #bfdbfe;
  background: #eff6ff;
  border-radius: 12px;
  color: #1e3a8a;
  font-size: 1.2rem;
  &[data-stage='one_step_left'] {
    border-color: #f3d9a4;
    background: #fffaf0;
    color: ${T.ink};
  }
  &[data-stage='support'] {
    border-color: #fde68a;
    background: #fffbeb;
    color: ${T.ink};
  }
  @media ${BUILD_WORKSPACE_COMPACT_MEDIA_QUERY} {
    gap: 0.45rem;
    padding: 0.45rem 0.75rem;
    border-radius: 10px;
  }
  @media ${BUILD_WORKSPACE_COMPACT_LANDSCAPE_MEDIA_QUERY} {
    gap: 0.3rem;
    padding: 0.3rem 0.65rem;
  }
`;
const noticeHeadClass = css`
  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
  justify-content: space-between;
  gap: 0.4rem 1rem;
  min-width: 0;
  strong {
    font-size: 1.35rem;
    overflow-wrap: anywhere;
  }
  @media ${BUILD_WORKSPACE_COMPACT_MEDIA_QUERY} {
    flex-wrap: nowrap;
    align-items: center;
    gap: 0.5rem;
    strong {
      flex: 1;
      min-width: 0;
      font-size: 1.2rem;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
  }
  @media ${BUILD_WORKSPACE_COMPACT_LANDSCAPE_MEDIA_QUERY} {
    strong {
      font-size: 1.1rem;
    }
  }
`;
const noticeActionsClass = css`
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  flex: none;
`;
const noticeDetailsClass = css`
  display: grid;
  gap: 0.8rem;
  @media ${BUILD_WORKSPACE_COMPACT_MEDIA_QUERY} {
    display: none;
    &[data-expanded] {
      display: grid;
      gap: 0.55rem;
    }
  }
  @media ${BUILD_WORKSPACE_COMPACT_LANDSCAPE_MEDIA_QUERY} {
    &[data-expanded] {
      max-height: 28vh;
      overflow-y: auto;
    }
  }
`;
const mobileResendClass = css`
  display: none;
  @media ${BUILD_WORKSPACE_COMPACT_MEDIA_QUERY} {
    display: inline-flex;
    align-items: center;
    min-height: 2.6rem;
    padding: 0 0.9rem;
    border-radius: 999px;
    border: 1.5px solid ${T.blue};
    background: #fff;
    color: ${T.blueDeep};
    font: inherit;
    font-size: 1.15rem;
    font-weight: 800;
    white-space: nowrap;
    cursor: pointer;
    &:disabled {
      opacity: 0.5;
      cursor: default;
    }
  }
  @media ${BUILD_WORKSPACE_COMPACT_LANDSCAPE_MEDIA_QUERY} {
    min-height: 2.2rem;
    padding: 0 0.75rem;
    font-size: 1.05rem;
  }
`;
const mobileToggleClass = css`
  display: none;
  @media ${BUILD_WORKSPACE_COMPACT_MEDIA_QUERY} {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 2.6rem;
    height: 2.6rem;
    padding: 0;
    border: 0;
    border-radius: 999px;
    background: rgba(20, 21, 28, 0.06);
    color: inherit;
    cursor: pointer;
    flex: none;
  }
  @media ${BUILD_WORKSPACE_COMPACT_LANDSCAPE_MEDIA_QUERY} {
    width: 2.2rem;
    height: 2.2rem;
  }
`;
const mobileStatusClass = css`
  display: none;
  @media ${BUILD_WORKSPACE_COMPACT_MEDIA_QUERY} {
    display: block;
    font-size: 1.1rem;
    color: ${T.muted};
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
`;
const noticeBodyClass = css`
  margin: 0;
  font-size: 1.25rem;
  line-height: 1.5;
`;
const linkButtonClass = css`
  border: 0;
  background: none;
  padding: 0.4rem 0;
  color: ${T.blueDeep};
  font: inherit;
  font-size: 1.25rem;
  font-weight: 800;
  cursor: pointer;
  text-decoration: underline;
  text-underline-offset: 2px;
  white-space: nowrap;
  @media ${BUILD_WORKSPACE_COMPACT_MEDIA_QUERY} {
    padding: 0.2rem 0;
    font-size: 1.15rem;
  }
`;
