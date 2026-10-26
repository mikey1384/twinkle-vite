import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { css } from '@emotion/css';
import LoggedOutPrompt from '~/components/LoggedOutPrompt';
import ErrorBoundary from '~/components/ErrorBoundary';
import Icon from '~/components/Icon';
import { DailyQuestionContent } from '~/components/Modals/DailyQuestionModal';
import { useAppContext, useKeyContext } from '~/contexts';
import { mobileMaxWidth } from '~/constants/css';
import PictureGallery from './PictureGallery';
import ModeChooser from './ModeChooser';
import StatPicker from './StatPicker';
import { PAGE } from './theme';
import { paperSecondaryButtonCls } from '~/components/Modals/DailyQuestionModal/paperTheme';

// /daily-reflection: Daily Reflection's own page (Mikey 2026-10-12: like
// Grammarbles, a page instead of a modal, with two modes picked from painted
// covers). Classic is the reflection as it always was; Training trains the
// stat picked for today. One reflection per mode per day.

export interface DailyReflectionModes {
  // dayType: today's Word Day / Picture Day, so the Classic card can show it
  classic: { started: boolean; answered: boolean; dayType?: 'keyword' | 'picture' | null };
  training: { started: boolean; answered: boolean; axis: string | null };
}

type View = 'choose' | 'classic' | 'training' | 'pictures';

export default function DailyReflectionPage() {
  const userId = useKeyContext((v) => v.myState.userId);
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const loadDailyReflectionModes = useAppContext(
    (v) => v.requestHelpers.loadDailyReflectionModes
  );
  const rawView = searchParams.get('mode');
  const view: View =
    rawView === 'classic' || rawView === 'training' || rawView === 'pictures'
      ? rawView
      : 'choose';
  const [modes, setModes] = useState<DailyReflectionModes | null>(null);
  const [modesFailed, setModesFailed] = useState(false);
  const [modesRetry, setModesRetry] = useState(0);
  // the stat picked on this visit, before Training's question exists
  const [pickedAxis, setPickedAxis] = useState<string | null>(null);

  useEffect(() => {
    if (!userId) return;
    let cancelled = false;
    setModesFailed(false);
    init();
    return () => {
      cancelled = true;
    };

    async function init() {
      const data = await loadDailyReflectionModes();
      if (cancelled) return;
      if (data && !data.error && data.classic && data.training) {
        setModes(data);
      } else {
        setModesFailed(true);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId, view, modesRetry]);

  if (!userId) {
    return <LoggedOutPrompt title="Log in to write your Daily Reflection" />;
  }

  const trainingAxis = modes?.training.axis || pickedAxis;
  const showTrainingPanel =
    view === 'training' && (modes?.training.started || !!pickedAxis);

  return (
    <ErrorBoundary componentPath="DailyReflection/Page">
      <div className={pageCls}>
        <div className={topBarCls}>
          <button
            type="button"
            className={backCls}
            onClick={handleBack}
            aria-label={view === 'choose' ? 'Back to Home' : 'Back'}
          >
            <Icon icon="arrow-left" />
            <span>{view === 'choose' ? 'Home' : 'Daily Reflection'}</span>
          </button>
          {view !== 'choose' && view !== 'pictures' && (
            <div className={modeTagCls}>
              {view === 'classic' ? 'Classic' : 'Training'}
            </div>
          )}
        </div>

        <main className={stageCls}>
          {view === 'choose' && (
            <ModeChooser
              modes={modes}
              onPick={openMode}
              onOpenPictures={() => setSearchParams({ mode: 'pictures' })}
            />
          )}

          {view === 'pictures' && <PictureGallery />}

          {view === 'training' && !showTrainingPanel && modes && (
            <StatPicker onPick={(axis) => setPickedAxis(axis)} />
          )}

          {view === 'training' && !modes && modesFailed && (
            <div className={failCls}>
              <p>We couldn’t load today’s Training. Please try again.</p>
              <button
                type="button"
                className={paperSecondaryButtonCls}
                onClick={() => setModesRetry((value) => value + 1)}
              >
                Try again
              </button>
            </div>
          )}

          {(view === 'classic' || showTrainingPanel) && (
            <div className={panelWrapCls}>
              <DailyQuestionContent
                key={view}
                mode={view === 'training' ? 'training' : 'classic'}
                trainingAxis={view === 'training' ? trainingAxis : null}
                onHide={goToChooser}
              />
            </div>
          )}
        </main>
      </div>
    </ErrorBoundary>
  );

  function openMode(mode: 'classic' | 'training') {
    setPickedAxis(null);
    setSearchParams({ mode });
  }

  function goToChooser() {
    setPickedAxis(null);
    setSearchParams({});
  }

  function handleBack() {
    if (view === 'choose') {
      navigate('/');
      return;
    }
    goToChooser();
  }
}

// every view sits centred in the space below the back bar, so short screens
// never look top-heavy (Mikey 10-12: "same applies to classic")
const pageCls = css`
  /* #App already accounts for the header and keyboard. Fill its available
     height; a separate viewport subtraction leaves the site background bare. */
  min-height: 100%;
  display: flex;
  flex-direction: column;
  width: 100%;
  background: ${PAGE.background};
  color: ${PAGE.ink};
  padding: 1.4rem 2rem 4rem;
  @media (max-width: ${mobileMaxWidth}) {
    /* the fixed bottom nav covers the page's end on phones: leave its
       footprint (nav plus safe area, keyboard netted out) plus breathing
       room, as Build pages do */
    padding: 1rem 1rem calc(var(--mobile-nav-total-height, 7rem) + 2.5rem);
  }
`;

const stageCls = css`
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
  width: 100%;
  /* full width for every view, each keeps its own max-width */
  > * {
    width: 100%;
  }
`;

const topBarCls = css`
  width: 100%;
  max-width: calc(1100 * var(--px));
  margin: 0 auto 1.2rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
`;

const backCls = css`
  display: inline-flex;
  align-items: center;
  gap: 0.6rem;
  border: none;
  background: none;
  color: ${PAGE.inkSoft};
  font-size: 1.4rem;
  font-weight: 600;
  cursor: pointer;
  padding: 0.4rem 0;
  &:hover {
    color: ${PAGE.ink};
  }
`;

const modeTagCls = css`
  font-size: 1.2rem;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: ${PAGE.accent};
`;

const panelWrapCls = css`
  width: 100%;
  max-width: calc(820 * var(--px));
  margin: 0 auto;
  background: ${PAGE.paper};
  border: 1px solid ${PAGE.line};
  border-radius: 16px;
  padding: 1rem;
  @media (max-width: ${mobileMaxWidth}) {
    border-radius: 12px;
    padding: 0.4rem;
  }
`;

const failCls = css`
  text-align: center;
  p {
    margin: 0 0 1.2rem;
    font-family: ${PAGE.serif};
    font-size: 1.9rem;
    color: ${PAGE.ink};
  }
`;
