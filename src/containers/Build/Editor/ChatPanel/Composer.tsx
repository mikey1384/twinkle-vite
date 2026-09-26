import React, { RefObject, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import LumineRescueEntry from '~/components/LumineRescueEntry';
import { useLocation, useNavigate } from 'react-router-dom';
import { css, keyframes } from '@emotion/css';
import { Color } from '~/constants/css';
import AIDisabledNotice from '~/components/AIDisabledNotice';
import Button from '~/components/Button';
import OwnAiCliNotice from './OwnAiCliNotice';
import GameCTAButton from '~/components/Buttons/GameCTAButton';
import Icon from '~/components/Icon';
import AppReferenceChips from './AppReferenceChips';
import AppReferencePicker from './AppReferencePicker';
import CommentFeedbackQuotes from './CommentFeedbackQuotes';
import type { BuildCommentFeedback } from '~/helpers/buildCommentFeedback';
import {
  MAX_BUILD_APP_REFERENCES,
  type BuildAppReference
} from '../helpers/appReferences';

const nudgePulse = keyframes`
  0% { box-shadow: 0 0 0 0 ${Color.logoBlue(0.55)}; }
  70% { box-shadow: 0 0 0 12px ${Color.logoBlue(0)}; }
  100% { box-shadow: 0 0 0 0 ${Color.logoBlue(0)}; }
`;

const spotlightFadeIn = keyframes`
  from { opacity: 0; }
  to { opacity: 1; }
`;

// Sits below every Modal (they start at 9,999,999) so the rescue/gift modals
// always layer above the dimmed backdrop.
const SPOTLIGHT_Z_INDEX = 9_999_000;

interface ComposerProps {
  AI_FEATURES_DISABLED: boolean;
  aiInputDisabled: boolean;
  aiInputDisabledNotice: string;
  // The chosen model cannot afford a read step and an edit step with the
  // Energy left; a lighter model can (helpers/lumineEnergySteps.ts).
  energyModelSwitch?: {
    message: string;
    buttonLabel: string;
    busy: boolean;
    onSwitch: () => void;
  } | null;
  buildId: number;
  draftMessage: string;
  generating: boolean;
  inputRef: RefObject<HTMLTextAreaElement | null>;
  isOwner: boolean;
  limitsExpanded: boolean;
  onDraftMessageChange: (value: string) => void;
  onOpenBuildChatUpload: () => void;
  onStopGeneration: () => void;
  onSubmitMessage: () => void;
  uploadInFlight: boolean;
  referenceApps: BuildAppReference[];
  onAddReferenceApp: (app: BuildAppReference) => void;
  onRemoveReferenceApp: (id: number) => void;
  commentFeedback: BuildCommentFeedback[];
  onRemoveCommentFeedback: (commentId: number) => void;
  submitting: boolean;
  submitError: string;
}

export default function Composer({
  AI_FEATURES_DISABLED,
  aiInputDisabled,
  aiInputDisabledNotice,
  energyModelSwitch,
  buildId,
  draftMessage,
  generating,
  inputRef,
  isOwner,
  limitsExpanded,
  onDraftMessageChange,
  onOpenBuildChatUpload,
  onStopGeneration,
  onSubmitMessage,
  uploadInFlight,
  referenceApps,
  onAddReferenceApp,
  onRemoveReferenceApp,
  commentFeedback,
  onRemoveCommentFeedback,
  submitting,
  submitError
}: ComposerProps) {
  const location = useLocation();
  const navigate = useNavigate();
  // Wordle skip-shield deep link: a gentle tutorial nudge pointing at the
  // chat box, dismissed the moment they engage with it.
  const [sayHiNudgeShown, setSayHiNudgeShown] = useState(
    () =>
      typeof window !== 'undefined' &&
      new URLSearchParams(location.search).get('sayHi') === 'lumine'
  );
  const containerRef = useRef<HTMLDivElement | null>(null);
  const spotlightRef = useRef<HTMLDivElement | null>(null);
  const referenceButtonRef = useRef<HTMLButtonElement | null>(null);
  const [referencePickerShown, setReferencePickerShown] = useState(false);
  const spotlightActive =
    sayHiNudgeShown && !aiInputDisabled && isOwner && !limitsExpanded;

  useEffect(() => {
    setReferencePickerShown(false);
  }, [
    buildId,
    aiInputDisabled,
    isOwner,
    limitsExpanded,
    submitting,
    uploadInFlight
  ]);

  // The spotlight hole is a fixed element whose box-shadow darkens the rest of
  // the viewport. Resize/scroll/visual-viewport boundaries keep it aligned
  // without running a permanent animation-frame loop while the user reads.
  useEffect(() => {
    if (!spotlightActive) return;
    let frame = 0;
    const syncRect = () => {
      frame = 0;
      const target = containerRef.current;
      const spotlight = spotlightRef.current;
      if (target && spotlight) {
        const rect = target.getBoundingClientRect();
        spotlight.style.top = `${rect.top - 6}px`;
        spotlight.style.left = `${rect.left - 6}px`;
        spotlight.style.width = `${rect.width + 12}px`;
        spotlight.style.height = `${rect.height + 12}px`;
      }
    };
    const scheduleSync = () => {
      if (frame) return;
      frame = requestAnimationFrame(syncRect);
    };
    const resizeObserver = new ResizeObserver(scheduleSync);
    if (containerRef.current) resizeObserver.observe(containerRef.current);
    window.addEventListener('resize', scheduleSync);
    window.addEventListener('scroll', scheduleSync, true);
    const visualViewport = window.visualViewport;
    visualViewport?.addEventListener('resize', scheduleSync);
    visualViewport?.addEventListener('scroll', scheduleSync);
    scheduleSync();
    return () => {
      if (frame) cancelAnimationFrame(frame);
      resizeObserver.disconnect();
      window.removeEventListener('resize', scheduleSync);
      window.removeEventListener('scroll', scheduleSync, true);
      visualViewport?.removeEventListener('resize', scheduleSync);
      visualViewport?.removeEventListener('scroll', scheduleSync);
    };
  }, [spotlightActive]);

  // Interacting anywhere outside the composer lifts the dimming instead of
  // leaving the page darkened while the user does something else.
  useEffect(() => {
    if (!spotlightActive) return;
    const handlePointerDown = (event: PointerEvent) => {
      const target = event.target as Node | null;
      if (target && containerRef.current?.contains(target)) return;
      handleDismissSayHiNudge();
    };
    document.addEventListener('pointerdown', handlePointerDown, true);
    return () =>
      document.removeEventListener('pointerdown', handlePointerDown, true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [spotlightActive]);

  if (!isOwner || limitsExpanded) {
    return null;
  }

  return (
    <div
      ref={containerRef}
      className={css`
        padding: 0.9rem 1rem 1.1rem;
        background: #fff;
        position: relative;
      `}
    >
      {spotlightActive && typeof document !== 'undefined'
        ? createPortal(
            <div
              ref={spotlightRef}
              aria-hidden
              className={css`
                position: fixed;
                border-radius: 14px;
                box-shadow: 0 0 0 200vmax rgba(0, 0, 0, 0.55);
                pointer-events: none;
                z-index: ${SPOTLIGHT_Z_INDEX};
                animation: ${spotlightFadeIn} 0.4s ease-out;
              `}
            />,
            document.body
          )
        : null}
      {sayHiNudgeShown && !aiInputDisabled ? (
        <div
          className={css`
            display: flex;
            align-items: center;
            gap: 0.7rem;
            margin-bottom: 0.8rem;
            padding: 0.9rem 1.1rem;
            border: 1px solid ${Color.logoBlue(0.4)};
            border-radius: 12px;
            background: ${Color.logoBlue(0.08)};
            font-size: 1.2rem;
            line-height: 1.4;
          `}
        >
          <span
            className={css`
              font-size: 1.7rem;
            `}
            aria-hidden
          >
            👋
          </span>
          <span>
            <b>Say hi to Lumine right here!</b> Ask for anything — a game, a
            drawing app, whatever you can imagine. Your first exchange works
            even with an empty battery.
          </span>
        </div>
      ) : null}
      {aiInputDisabled ? (
        <AIDisabledNotice
          title={
            AI_FEATURES_DISABLED
              ? 'Build AI Is Unavailable'
              : 'AI Energy Required'
          }
          notice={aiInputDisabledNotice}
          style={{ marginBottom: '0.6rem' }}
        />
      ) : null}
      {aiInputDisabled && !AI_FEATURES_DISABLED ? (
        <OwnAiCliNotice buildId={buildId} />
      ) : null}
      {energyModelSwitch ? (
        <div
          className={css`
            display: flex;
            align-items: center;
            gap: 0.9rem;
            margin-bottom: 0.8rem;
            padding: 0.9rem 1.1rem;
            border: 1px solid ${Color.orange(0.45)};
            border-radius: 12px;
            background: ${Color.orange(0.08)};
            font-size: 1.2rem;
            line-height: 1.4;
            @media (max-width: 600px) {
              flex-direction: column;
              align-items: stretch;
            }
          `}
        >
          <span
            className={css`
              flex: 1;
            `}
          >
            {energyModelSwitch.message}
          </span>
          <Button
            color="orange"
            loading={energyModelSwitch.busy}
            onClick={energyModelSwitch.onSwitch}
          >
            {energyModelSwitch.buttonLabel}
          </Button>
        </div>
      ) : null}
      {aiInputDisabled && !AI_FEATURES_DISABLED ? (
        <LumineRescueEntry
          eventType="aiEnergy"
          active
          style={{ marginBottom: '0.6rem' }}
        />
      ) : null}
      <div
        className={css`
          padding: 0.75rem;
          border: 1px solid var(--ui-border);
          border-radius: 12px;
          &:focus-within {
            border-color: var(--theme-border);
          }
          ${
            sayHiNudgeShown && !aiInputDisabled
              ? `animation: ${nudgePulse} 1.6s ease-out infinite; border-color: ${Color.logoBlue()};`
              : ''
          }
        `}
      >
        <AppReferenceChips
          apps={referenceApps}
          disabled={submitting || uploadInFlight}
          onRemove={onRemoveReferenceApp}
        />
        <CommentFeedbackQuotes
          feedback={commentFeedback}
          disabled={submitting || uploadInFlight}
          onRemove={onRemoveCommentFeedback}
        />
        <textarea
          ref={inputRef}
          aria-label="Message Lumine"
          value={draftMessage}
          onChange={(e) => {
            handleDismissSayHiNudge();
            onDraftMessageChange(e.target.value);
          }}
          onFocus={handleDismissSayHiNudge}
          onKeyDown={handleKeyDown}
          placeholder={
            aiInputDisabled
              ? aiInputDisabledNotice
              : commentFeedback.length
                ? 'Add instructions for Lumine (optional)...'
                : generating
                  ? 'Describe what to change next...'
                  : 'Describe what you want to build...'
          }
          disabled={aiInputDisabled || submitting}
          className={css`
            display: block;
            width: 100%;
            padding: 0.25rem 0.25rem 0.75rem;
            border: 0;
            resize: none;
            font-size: var(--build-workshop-input-font-size);
            font-family: inherit;
            min-height: 64px;
            max-height: 120px;
            background: #fff;
            &:focus {
              outline: none;
            }
          `}
          rows={2}
        />
        <div
          className={css`
            display: flex;
            align-items: center;
            flex-wrap: wrap;
            gap: 0.5rem;
          `}
        >
          <button
            type="button"
            ref={referenceButtonRef}
            aria-haspopup="dialog"
            aria-expanded={referencePickerShown}
            aria-controls={`build-app-reference-picker-${buildId}`}
            disabled={
              aiInputDisabled ||
              uploadInFlight ||
              submitting ||
              referenceApps.length >= MAX_BUILD_APP_REFERENCES
            }
            onClick={() => {
              handleDismissSayHiNudge();
              setReferencePickerShown(true);
            }}
            className={css`
              display: inline-flex;
              align-items: center;
              gap: 0.5rem;
              padding: 0.6rem 0.3rem;
              margin-right: auto;
              border: 0;
              border-radius: 6px;
              background: transparent;
              color: #526985;
              font-size: 1.1rem;
              font-weight: 650;
              cursor: pointer;
              &:hover:not(:disabled),
              &[aria-expanded='true'] {
                color: #2969d6;
                background: #eef4ff;
              }
              &:focus-visible {
                outline: 2px solid #75a3f6;
                outline-offset: 2px;
              }
              &:disabled {
                color: #919eaf;
                cursor: default;
              }
            `}
          >
            <Icon icon="layer-group" />
            {referenceApps.length >= MAX_BUILD_APP_REFERENCES
              ? '2 apps referenced'
              : 'Reference an app'}
          </button>
          <GameCTAButton
            onClick={onOpenBuildChatUpload}
            aria-label="Attach a file"
            disabled={
              aiInputDisabled || generating || uploadInFlight || submitting
            }
            variant="neutral"
            size="md"
            icon="upload"
            style={{ minWidth: '3rem', padding: '0.6rem 0.75rem' }}
          />
          <GameCTAButton
            onClick={onSubmitMessage}
            aria-label={generating ? 'Queue message' : 'Send message'}
            disabled={
              aiInputDisabled ||
              uploadInFlight ||
              submitting ||
              (!draftMessage.trim() && !commentFeedback.length)
            }
            loading={submitting}
            variant={generating ? 'orange' : 'logoBlue'}
            size="md"
            icon="paper-plane"
            style={{ minWidth: '3rem', padding: '0.6rem 0.75rem' }}
          />
          {generating ? (
            <GameCTAButton
              onClick={onStopGeneration}
              aria-label="Stop generation"
              variant="orange"
              size="md"
              icon="stop"
              style={{ minWidth: '3rem', padding: '0.6rem 0.75rem' }}
            >
              Stop
            </GameCTAButton>
          ) : null}
        </div>
      </div>
      {submitError ? (
        <p
          role="alert"
          className={css`
            margin: 0.6rem 0 0;
            font-size: 1.1rem;
            color: #b43a45;
          `}
        >
          {submitError}
        </p>
      ) : null}
      {referencePickerShown ? (
        <AppReferencePicker
          buildId={buildId}
          anchorRef={referenceButtonRef}
          selectedApps={referenceApps}
          onClose={() => setReferencePickerShown(false)}
          onSelect={(app) => {
            onAddReferenceApp(app);
            setReferencePickerShown(false);
            window.requestAnimationFrame(() => inputRef.current?.focus());
          }}
        />
      ) : null}
    </div>
  );

  function handleDismissSayHiNudge() {
    if (!sayHiNudgeShown) return;
    setSayHiNudgeShown(false);
    const params = new URLSearchParams(location.search);
    params.delete('sayHi');
    navigate(
      {
        pathname: location.pathname,
        search: params.toString() ? `?${params.toString()}` : '',
        hash: location.hash
      },
      { replace: true, state: location.state }
    );
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (
      e.key === 'Enter' &&
      !e.shiftKey &&
      !e.nativeEvent.isComposing &&
      e.keyCode !== 229
    ) {
      e.preventDefault();
      if (!submitting) onSubmitMessage();
    }
  }
}
