import React, {
  useEffect,
  useRef,
  useState,
  useSyncExternalStore
} from 'react';
import { useSearchParams } from 'react-router-dom';
import AiImageEstimate from '~/components/AiImageEstimate';
import ErrorBoundary from '~/components/ErrorBoundary';
import Icon from '~/components/Icon';
import { css } from '@emotion/css';
import { mobileMaxWidth } from '~/constants/css';
import { cloudFrontURL } from '~/constants/defaultValues';
import { useAppContext, useKeyContext } from '~/contexts';
import {
  dailyPictureJobs,
  isPending,
  type PictureDayState
} from '~/helpers/dailyPictureJobs';
import PictureDayProgress from './PictureDayProgress';
import type { AiImageQuality } from '~/helpers/aiImageModels';
import {
  PAPER,
  paperPrimaryButtonCls,
  paperSecondaryButtonCls,
  paperTextButtonCls,
  paperWorkingDotsCls
} from '../paperTheme';
import { containerCls, textareaCls } from './styles';

// Picture Day (Mikey 10-24): Word Day's twin. The member describes a picture
// (or anything at all) and the site paints it. The day's first picture at the
// default settings is free; higher settings and every try after that use the
// member's AI Battery, with no limit on tries.
export type { PictureDayState } from '~/helpers/dailyPictureJobs';

const PICTURE_MODEL = 'gpt-image-2.5-flare';
const DEFAULT_QUALITY: AiImageQuality = 'medium';
// the site pays for its default settings or anything cheaper
const FREE_QUALITIES: AiImageQuality[] = ['low', 'medium'];
const QUALITY_OPTIONS: { value: AiImageQuality; label: string }[] = [
  { value: 'low', label: 'Low' },
  { value: 'medium', label: 'Medium (default)' },
  { value: 'high', label: 'High' },
  { value: 'xhigh', label: 'Extra high' },
  { value: 'max', label: 'Max' }
];
const STYLE_SUGGESTIONS = [
  'Watercolor',
  'Storybook',
  'Comic',
  'Pixel art',
  'Clay',
  'Oil painting'
];
const PROMPT_MAX = 1000;
const STYLE_MAX = 120;

export default function PictureDayScreen({
  questionId,
  question,
  initialPicture,
  submitting,
  submitError,
  onDone,
  onPictureChange,
  onClose
}: {
  questionId: number;
  question: string;
  initialPicture: PictureDayState;
  submitting: boolean;
  submitError?: string | null;
  onDone: (args: { picturePath: string; prompt: string }) => void;
  // keeps the panel's copy current (the screen remounts from it)
  onPictureChange?: (picture: PictureDayState) => void;
  onClose: () => void;
}) {
  const userId = useKeyContext((v) => v.myState.userId);
  const [searchParams] = useSearchParams();
  const requestedPath = searchParams.get('picture');
  const openedPathRef = useRef<string | null>(null);
  const appliedJobPathRef = useRef<string | null>(null);
  const memberSelectedPictureRef = useRef(false);
  const restoredJobRequestRef = useRef<string | null>(null);
  const snapshot = useSyncExternalStore(
    dailyPictureJobs.subscribe,
    dailyPictureJobs.getSnapshot
  );
  const job =
    snapshot.userId === Number(userId)
      ? snapshot.jobs
          .filter((item) => item.questionId === questionId)
          .sort((a, b) => b.startedAt - a.startedAt)[0]
      : undefined;
  const generateDailyPicture = useAppContext(
    (v) => v.requestHelpers.generateDailyPicture
  );
  const loadDailyPicture = useAppContext(
    (v) => v.requestHelpers.loadDailyPicture
  );
  const [picture, setPicture] = useState<PictureDayState>(initialPicture);
  const [prompt, setPrompt] = useState(initialPicture.prompt || '');
  const initialStyle = initialPicture.style || '';
  const [style, setStyle] = useState(initialStyle);
  const [customStyleOpen, setCustomStyleOpen] = useState(
    Boolean(initialStyle) && !STYLE_SUGGESTIONS.includes(initialStyle)
  );
  const [quality, setQuality] = useState<AiImageQuality>(DEFAULT_QUALITY);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const generating = !!job && isPending(job) && !job.backgroundOnly;
  const error = job?.status === 'failed' ? job.error : null;
  const [selectedPath, setSelectedPath] = useState(
    initialPicture.chosenPath ||
      initialPicture.candidates[initialPicture.candidates.length - 1]?.path ||
      ''
  );
  const onPictureChangeRef = useRef(onPictureChange);
  onPictureChangeRef.current = onPictureChange;
  useEffect(() => {
    if (picture !== initialPicture) onPictureChangeRef.current?.(picture);
    // initialPicture is the mount-time copy
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [picture]);

  useEffect(() => {
    if (!job) return;
    if (job.picture) setPicture(job.picture);
    // Queue acknowledgement and other tracking updates must not undo a
    // member's choice among the pictures they have already made.
    if (job.path && appliedJobPathRef.current !== job.path) {
      appliedJobPathRef.current = job.path;
      if (!memberSelectedPictureRef.current) setSelectedPath(job.path);
    }
    if (isPending(job) && restoredJobRequestRef.current !== job.requestId) {
      restoredJobRequestRef.current = job.requestId;
      setPrompt(job.prompt);
      setStyle(job.style);
      setCustomStyleOpen(
        Boolean(job.style) && !STYLE_SUGGESTIONS.includes(job.style)
      );
      const requestedQuality = QUALITY_OPTIONS.find(
        (option) => option.value === job.quality
      );
      if (requestedQuality) setQuality(requestedQuality.value);
    }
  }, [job]);

  useEffect(() => {
    if (
      requestedPath &&
      openedPathRef.current !== requestedPath &&
      picture.candidates.some((candidate) => candidate.path === requestedPath)
    ) {
      openedPathRef.current = requestedPath;
      setSelectedPath(requestedPath);
    }
  }, [requestedPath, picture.candidates]);

  const usesBattery =
    !picture.freeAvailable || !FREE_QUALITIES.includes(quality);
  const hasPictures = picture.candidates.length > 0;
  const selected = picture.candidates.find((c) => c.path === selectedPath);

  function handleStyleChip(value: string) {
    setCustomStyleOpen(false);
    setStyle((current) => (current === value ? '' : value));
  }

  const busy = generating || submitting;
  // the eyebrow already says Picture Day
  const questionText = question.replace(/^Picture Day:\s*/i, '');
  const displayQuestion =
    questionText.charAt(0).toUpperCase() + questionText.slice(1);

  return (
    <ErrorBoundary componentPath="DailyQuestionPanel/PictureDay">
      <div className={containerCls}>
        <div className={eyebrowCls}>Picture Day</div>
        {generating && job ? (
          <PictureDayProgress
            job={job}
            onClose={onClose}
            onCheck={() => {
              void dailyPictureJobs.recover(loadDailyPicture, true);
            }}
            onReturnToEditor={() =>
              dailyPictureJobs.returnToEditor(job.requestId)
            }
          />
        ) : (
          <>
            <p className={questionCls}>{displayQuestion}</p>

            {hasPictures && (
              <div className={sectionCls}>
                {selected && (
                  <img
                    className={mainPictureCls}
                    src={`${cloudFrontURL}/${selected.path}`}
                    alt={selected.prompt}
                  />
                )}
                {picture.candidates.length > 1 && (
                  <>
                    <div className={labelCls}>Pick the one you like</div>
                    <div className={thumbRowCls}>
                      {picture.candidates.map((candidate) => (
                        <button
                          key={candidate.path}
                          type="button"
                          className={thumbCls}
                          aria-pressed={candidate.path === selectedPath}
                          disabled={busy}
                          onClick={() => {
                            memberSelectedPictureRef.current = true;
                            setSelectedPath(candidate.path);
                          }}
                        >
                          <img
                            src={`${cloudFrontURL}/${candidate.path}`}
                            alt={candidate.prompt}
                            loading="lazy"
                          />
                        </button>
                      ))}
                    </div>
                  </>
                )}
                {submitError && <p className={errorCls}>{submitError}</p>}
                <div className={actionsCls}>
                  <button
                    type="button"
                    className={paperPrimaryButtonCls}
                    disabled={busy || !selected}
                    onClick={() =>
                      selected &&
                      onDone({
                        picturePath: selected.path,
                        prompt: selected.prompt
                      })
                    }
                  >
                    {submitting ? (
                      <>
                        Saving{' '}
                        <span
                          className={paperWorkingDotsCls}
                          aria-hidden="true"
                        >
                          <span />
                          <span />
                          <span />
                        </span>
                      </>
                    ) : (
                      <>
                        <Icon icon="check" />
                        Done
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}
            <div className={sectionCls}>
              <textarea
                className={promptAreaCls}
                placeholder="A fox reading a book under a giant mushroom at sunset..."
                value={prompt}
                maxLength={PROMPT_MAX}
                disabled={busy}
                onChange={(e) => setPrompt(e.target.value)}
              />

              <div className={labelCls}>Style</div>
              <div className={chipRowCls}>
                {STYLE_SUGGESTIONS.map((value) => (
                  <button
                    key={value}
                    type="button"
                    disabled={busy}
                    className={chipCls}
                    aria-pressed={!customStyleOpen && style === value}
                    onClick={() => handleStyleChip(value)}
                  >
                    {value}
                  </button>
                ))}
                <button
                  type="button"
                  disabled={busy}
                  className={chipCls}
                  aria-pressed={customStyleOpen}
                  onClick={() => {
                    setCustomStyleOpen(true);
                    if (STYLE_SUGGESTIONS.includes(style)) setStyle('');
                  }}
                >
                  <Icon icon="pencil-alt" style={{ marginRight: '0.4rem' }} />
                  Your own
                </button>
              </div>
              {customStyleOpen && (
                <input
                  className={styleInputCls}
                  placeholder="e.g. crayon drawing, 1980s anime, paper cut-out..."
                  value={style}
                  maxLength={STYLE_MAX}
                  disabled={busy}
                  autoFocus
                  onChange={(e) => setStyle(e.target.value)}
                />
              )}

              <button
                type="button"
                className={settingsToggleCls}
                aria-expanded={settingsOpen}
                onClick={() => setSettingsOpen((open) => !open)}
              >
                <Icon icon={settingsOpen ? 'chevron-up' : 'chevron-down'} />
                Picture settings
              </button>
              {settingsOpen && (
                <div className={settingsCls}>
                  <label className={settingsRowCls}>
                    <span>Quality</span>
                    <select
                      aria-label="Picture quality"
                      value={quality}
                      disabled={busy}
                      onChange={(e) =>
                        setQuality(e.target.value as AiImageQuality)
                      }
                    >
                      {QUALITY_OPTIONS.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                          {FREE_QUALITIES.includes(option.value)
                            ? ''
                            : ' · uses AI Battery'}
                        </option>
                      ))}
                    </select>
                  </label>
                  <p className={noteCls}>
                    Higher than the default uses your AI Battery.
                  </p>
                </div>
              )}

              {job?.backgroundOnly && isPending(job) && (
                <p className={noteCls}>
                  Your earlier picture may still arrive. Check the cost below
                  before making another picture.
                </p>
              )}
              <p className={costLineCls}>
                {usesBattery ? (
                  <>
                    <Icon icon="bolt" /> This picture uses your AI Battery.{' '}
                    <AiImageEstimate model={PICTURE_MODEL} quality={quality} />
                  </>
                ) : (
                  <>
                    <Icon icon="gift" /> Today’s first picture is on Twinkle.
                  </>
                )}
              </p>

              {error && <p className={errorCls}>{error}</p>}
              {!hasPictures && submitError && (
                <p className={errorCls}>{submitError}</p>
              )}

              <div className={actionsCls}>
                <button
                  type="button"
                  className={
                    hasPictures
                      ? paperSecondaryButtonCls
                      : paperPrimaryButtonCls
                  }
                  disabled={busy || !prompt.trim()}
                  onClick={handleGenerate}
                >
                  <Icon icon={hasPictures ? 'redo' : 'palette'} />
                  {hasPictures ? 'Try again' : 'Make my picture'}
                </button>
              </div>
              {/* Like Word Day, anything counts: no picture needed to finish */}
              <button
                type="button"
                className={paperTextButtonCls}
                style={{ alignSelf: 'center' }}
                disabled={busy || !prompt.trim()}
                onClick={() =>
                  onDone({ picturePath: '', prompt: prompt.trim() })
                }
              >
                {hasPictures
                  ? 'Finish with my words only, no picture'
                  : 'Finish with my words only'}
              </button>
            </div>
          </>
        )}
      </div>
    </ErrorBoundary>
  );

  function handleGenerate() {
    const text = prompt.trim();
    if (!text || busy) return;
    memberSelectedPictureRef.current = false;
    void dailyPictureJobs.start({
      userId: Number(userId),
      questionId,
      prompt: text,
      style: style.trim(),
      quality,
      generate: generateDailyPicture,
      load: loadDailyPicture
    });
  }
}

const eyebrowCls = css`
  font-size: 1.2rem;
  font-weight: 700;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: ${PAPER.accent};
  margin-bottom: 0.6rem;
`;

const questionCls = css`
  max-width: calc(640 * var(--px));
  font-family: ${PAPER.serif};
  font-size: 2.2rem;
  line-height: 1.4;
  color: ${PAPER.ink};
  text-align: center;
  margin: 0 0 1.6rem;
  @media (max-width: ${mobileMaxWidth}) {
    font-size: 1.8rem;
  }
`;

const sectionCls = css`
  width: 100%;
  max-width: calc(640 * var(--px));
  display: flex;
  flex-direction: column;
  gap: 0.9rem;
  & + & {
    margin-top: 2rem;
  }
`;

const promptAreaCls = css`
  ${textareaCls};
  min-height: calc(130 * var(--px));
`;

const labelCls = css`
  font-size: 1.2rem;
  font-weight: 700;
  color: ${PAPER.inkSoft};
  margin-top: 0.4rem;
`;

const chipRowCls = css`
  display: flex;
  flex-wrap: wrap;
  gap: 0.6rem;
`;

const chipCls = css`
  border: 1px solid ${PAPER.lineStrong};
  background: ${PAPER.paper};
  color: ${PAPER.ink};
  border-radius: 999px;
  padding: 0.5rem 1.2rem;
  font-size: 1.3rem;
  cursor: pointer;
  &[aria-pressed='true'] {
    background: ${PAPER.ink};
    border-color: ${PAPER.ink};
    color: ${PAPER.paper};
  }
  &:disabled {
    opacity: 0.6;
    cursor: default;
  }
`;

const styleInputCls = css`
  width: 100%;
  padding: 0.8rem 1.2rem;
  font-size: 1.4rem;
  color: ${PAPER.ink};
  background: ${PAPER.paper};
  border: 1px solid ${PAPER.lineStrong};
  border-radius: 10px;
  &:focus {
    outline: none;
    border-color: ${PAPER.accent};
  }
`;

const settingsToggleCls = css`
  align-self: flex-start;
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  border: none;
  background: none;
  padding: 0;
  font-size: 1.3rem;
  color: ${PAPER.inkSoft};
  cursor: pointer;
`;

const settingsCls = css`
  padding: 1rem 1.2rem;
  border: 1px solid ${PAPER.line};
  border-radius: 12px;
  background: ${PAPER.paperDeep};
`;

const settingsRowCls = css`
  display: flex;
  align-items: center;
  gap: 1rem;
  font-size: 1.4rem;
  color: ${PAPER.ink};
  select {
    font-size: 1.4rem;
    padding: 0.4rem 0.6rem;
    border-radius: 8px;
    border: 1px solid ${PAPER.lineStrong};
    background: ${PAPER.paper};
    color: ${PAPER.ink};
  }
`;

const noteCls = css`
  margin: 0.6rem 0 0;
  font-size: 1.2rem;
  color: ${PAPER.inkFaint};
`;

const costLineCls = css`
  margin: 0;
  font-size: 1.3rem;
  color: ${PAPER.inkSoft};
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.5rem;
`;

const errorCls = css`
  margin: 0;
  padding: 0.8rem 1.2rem;
  border-radius: 10px;
  background: ${PAPER.warnSoft};
  color: ${PAPER.warn};
  font-size: 1.4rem;
`;

const actionsCls = css`
  display: flex;
  justify-content: center;
  gap: 1rem;
  margin-top: 0.4rem;
`;

const mainPictureCls = css`
  width: 100%;
  border-radius: 14px;
  border: 1px solid ${PAPER.line};
  background: ${PAPER.paperDeep};
  display: block;
`;

const thumbRowCls = css`
  display: flex;
  gap: 0.6rem;
  overflow-x: auto;
  padding-bottom: 0.3rem;
`;

const thumbCls = css`
  flex: 0 0 auto;
  width: 72px;
  height: 72px;
  padding: 0;
  border-radius: 10px;
  overflow: hidden;
  border: 2px solid transparent;
  background: ${PAPER.paperDeep};
  cursor: pointer;
  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    display: block;
  }
  &[aria-pressed='true'] {
    border-color: ${PAPER.accent};
  }
`;
