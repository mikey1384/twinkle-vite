import React from 'react';
import ErrorBoundary from '~/components/ErrorBoundary';
import Button from '~/components/Button';
import Icon from '~/components/Icon';
import { useHomeContext } from '~/contexts';
import { css } from '@emotion/css';

export default function StartMenu() {
  const onSetTopMenuSectionSection = useHomeContext(
    (v) => v.actions.onSetTopMenuSectionSection
  );

  return (
    <ErrorBoundary componentPath="Home/Earn/ActivitySuggester/StartMenu">
      <div
        className={css`
          > section {
            display: flex;
            flex-direction: column;
            width: 100%;
          }
        `}
        style={{
          width: '100%',
          display: 'flex',
          flexDirection: 'column'
        }}
      >
        <section>
          <p>Earn XP</p>
          <Button
            onClick={() => onSetTopMenuSectionSection('subject')}
            style={{ marginTop: '0.7rem' }}
            filled
            color="logoBlue"
          >
            <Icon icon="bolt" />
            <span style={{ marginLeft: '0.7rem' }}>Answer Subjects</span>
          </Button>
        </section>
        <section style={{ marginTop: '2rem' }}>
          <p>Earn Karma Points</p>
          <Button
            onClick={() => onSetTopMenuSectionSection('recommend')}
            style={{ marginTop: '0.7rem' }}
            filled
            color="brownOrange"
          >
            <Icon icon="heart" />
            <span style={{ marginLeft: '0.7rem' }}>Recommend posts</span>
          </Button>
          <Button
            onClick={() => onSetTopMenuSectionSection('reward')}
            style={{ marginTop: '0.7rem' }}
            filled
            color="pink"
          >
            <Icon icon="certificate" />
            <span style={{ marginLeft: '0.7rem' }}>Reward posts</span>
          </Button>
        </section>
      </div>
    </ErrorBoundary>
  );
}
