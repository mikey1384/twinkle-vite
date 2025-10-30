import React from 'react';
import ErrorBoundary from '~/components/ErrorBoundary';
import Button from '~/components/Button';
import Icon from '~/components/Icon';
import { useHomeContext } from '~/contexts';
import { css } from '@emotion/css';
import { Color, wideBorderRadius } from '~/constants/css';

export default function StartMenu() {
  const onSetTopMenuSectionSection = useHomeContext(
    (v) => v.actions.onSetTopMenuSectionSection
  );

  return (
    <ErrorBoundary componentPath="Home/Earn/ActivitySuggester/StartMenu">
      <div className={startMenuContainer}>
        <div className={sectionCard}>
          <div className={sectionHeader}>
            <div>
              <div className={sectionLabel}>
                Climb the XP leaderboard by answering subjects
              </div>
              <h3 className={sectionTitle}>Earn XP</h3>
            </div>
          </div>
          <p className={sectionDescription}>
            Post thoughtful comments on subjects to earn XP.
          </p>
          <div className={actionStack}>
            <Button
              onClick={() => onSetTopMenuSectionSection('subject')}
              color="logoBlue"
              variant="solid"
              tone="flat"
              size="lg"
              shape="pill"
            >
              <Icon icon="bolt" />
              <span>Answer Subjects</span>
            </Button>
          </div>
        </div>
        <div className={sectionCard}>
          <div className={sectionHeader}>
            <div>
              <div className={sectionLabel}>
                Support the community with good vibes
              </div>
              <h3 className={sectionTitle}>Earn Karma Points</h3>
            </div>
          </div>
          <p className={sectionDescription}>
            Recommend and reward great posts.
          </p>
          <div className={actionStack}>
            <Button
              onClick={() => onSetTopMenuSectionSection('recommend')}
              color="brownOrange"
              variant="soft"
              tone="raised"
              size="md"
            >
              <Icon icon="heart" />
              <span>Recommend Posts</span>
            </Button>
            <Button
              onClick={() => onSetTopMenuSectionSection('reward')}
              color="pink"
              variant="soft"
              tone="raised"
              size="md"
            >
              <Icon icon="certificate" />
              <span>Reward Posts</span>
            </Button>
          </div>
        </div>
      </div>
    </ErrorBoundary>
  );
}

const startMenuContainer = css`
  display: grid;
  gap: 1.8rem;
  width: 100%;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
`;

const sectionCard = css`
  position: relative;
  display: flex;
  flex-direction: column;
  gap: 1.4rem;
  padding: 1.8rem 2rem;
  border-radius: ${wideBorderRadius};
  background: rgba(255, 255, 255, 0.94);
  border: 1px solid var(--home-panel-card-border, rgba(148, 163, 184, 0.35));
  box-shadow: none;
  min-height: 18rem;
`;

const sectionHeader = css`
  display: flex;
  gap: 1.2rem;
  align-items: center;
`;

const sectionLabel = css`
  font-size: 1.2rem;
  text-transform: uppercase;
  letter-spacing: 0.12em;
  font-weight: 700;
  color: rgba(15, 23, 42, 0.66);
`;

const sectionTitle = css`
  margin: 0.4rem 0 0;
  font-size: 2.1rem;
  font-weight: 700;
  color: var(--home-panel-heading, ${Color.darkerGray()});
`;

const sectionDescription = css`
  margin: 0;
  font-size: 1.45rem;
  line-height: 1.6;
  color: rgba(15, 23, 42, 0.72);
`;

const actionStack = css`
  display: flex;
  flex-direction: column;
  gap: 0.9rem;
  margin-top: auto;
`;
