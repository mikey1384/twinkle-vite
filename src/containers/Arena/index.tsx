import React from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { css } from '@emotion/css';
import HomeLoginPrompt from '~/components/HomeLoginPrompt';
import ErrorBoundary from '~/components/ErrorBoundary';
import Icon from '~/components/Icon';
import { useKeyContext } from '~/contexts';
import { mobileMaxWidth } from '~/constants/css';
import ModeChooser from './ModeChooser';
import Train from './Train';
import Fights from './Fights';
import AIStory from './AIStory';
import { ARENA } from './theme';

// /arena: the "A" of the daily goals (Mikey 2026-10-24). Train on the left
// holds everything that is not a real fight (AI Story, review, untimed
// retakes, boss prep); Arena on the right holds only real fights, authentic
// mock exams under their real conditions. Like Grammarbles and Daily
// Reflection, a page with two covers instead of a modal.

type View = 'choose' | 'train' | 'arena';

export default function ArenaPage() {
  const userId = useKeyContext((v) => v.myState.userId);
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const rawView = searchParams.get('mode');
  const view: View =
    rawView === 'train' || rawView === 'arena' ? rawView : 'choose';
  const activity = view === 'train' ? searchParams.get('play') : null;

  if (!userId) {
    return <HomeLoginPrompt message="Log in to enter the Arena" />;
  }

  return (
    <ErrorBoundary componentPath="Arena/Page">
      <div className={pageCls}>
        {activity !== 'ai-story' && (
          <div className={topBarCls}>
            <button
              type="button"
              className={backCls}
              onClick={handleBack}
              aria-label={view === 'choose' ? 'Back to Home' : 'Back to Arena'}
            >
              <Icon icon="arrow-left" />
              <span>{view === 'choose' ? 'Home' : 'Arena'}</span>
            </button>
            {view !== 'choose' && (
              <div className={modeTagCls}>
                {view === 'train' ? 'Train' : 'Arena'}
              </div>
            )}
          </div>
        )}

        <main className={stageCls}>
          {view === 'choose' && <ModeChooser onPick={openView} />}
          {view === 'train' && activity === 'ai-story' && (
            <AIStory onHide={() => setSearchParams({ mode: 'train' })} />
          )}
          {view === 'train' && activity !== 'ai-story' && (
            <Train
              onPlayAIStory={() =>
                setSearchParams({ mode: 'train', play: 'ai-story' })
              }
            />
          )}
          {view === 'arena' && <Fights />}
        </main>
      </div>
    </ErrorBoundary>
  );

  function openView(next: 'train' | 'arena') {
    setSearchParams({ mode: next });
  }

  function handleBack() {
    if (view === 'choose') {
      navigate('/');
      return;
    }
    setSearchParams({});
  }
}

const pageCls = css`
  min-height: calc(100vh - 7rem);
  display: flex;
  flex-direction: column;
  width: 100%;
  background: ${ARENA.background};
  color: ${ARENA.ink};
  padding: 1.4rem 2rem 4rem;
  @media (max-width: ${mobileMaxWidth}) {
    padding: 1rem 1rem calc(var(--mobile-nav-total-height, 7rem) + 2.5rem);
  }
`;

const stageCls = css`
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
  width: 100%;
  > * {
    width: 100%;
  }
`;

const topBarCls = css`
  width: 100%;
  max-width: 1100px;
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
  color: ${ARENA.inkSoft};
  font-size: 1.4rem;
  font-weight: 600;
  cursor: pointer;
  padding: 0.4rem 0;
  &:hover {
    color: ${ARENA.ink};
  }
`;

const modeTagCls = css`
  font-size: 1.2rem;
  font-weight: 800;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: ${ARENA.accent};
`;
