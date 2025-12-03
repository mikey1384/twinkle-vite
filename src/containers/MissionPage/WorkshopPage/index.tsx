import React from 'react';
import { css } from '@emotion/css';
import { Color, mobileMaxWidth } from '~/constants/css';
import ErrorBoundary from '~/components/ErrorBoundary';
import Icon from '~/components/Icon';
import PromptWorkshop from './PromptWorkshop';
import MyTopicsManager from '../SystemPromptShared/MyTopicsManager';

export default function WorkshopPage({
  mission,
  onSetMissionState
}: {
  mission: any;
  onSetMissionState: (params: { missionId: number; newState: any }) => void;
}) {
  return (
    <div
      className={css`
        display: flex;
        flex-direction: column;
        width: 100%;
        gap: 1.4rem;
      `}
    >
      <header
        className={css`
          display: flex;
          flex-direction: column;
          gap: 0.8rem;
          padding: 1.2rem 1.8rem;
          background: #fff;
          border: 1px solid var(--ui-border);
          border-radius: 8px;
          @media (max-width: ${mobileMaxWidth}) {
            border-radius: 0;
            border-left: 0;
            border-right: 0;
            padding: 1.1rem 1.4rem;
          }
        `}
      >
        <h2
          className={css`
            margin: 0;
            font-size: 2.3rem;
            font-weight: 700;
            @media (max-width: ${mobileMaxWidth}) {
              font-size: 2rem;
            }
          `}
        >
          Prompt Workshop
        </h2>
        <p
          className={css`
            margin: 0;
            color: #666;
            font-size: 1.3rem;
            line-height: 1.6;
          `}
        >
          Create custom system prompts to personalize your AI conversations with
          Zero and Ciel.
        </p>
      </header>
      <div
        className={css`
          background: #fff;
          border: 1px solid var(--ui-border);
          border-radius: 8px;
          @media (max-width: ${mobileMaxWidth}) {
            border-radius: 0;
            border-left: 0;
            border-right: 0;
          }
        `}
      >
        <div
          className={css`
            padding: 1.2rem 1.8rem;
            @media (max-width: ${mobileMaxWidth}) {
              padding: 1.1rem 1.4rem;
            }
          `}
        >
          <div
            className={css`
              display: flex;
              align-items: center;
              gap: 1rem;
            `}
          >
            <Icon
              icon="wand-magic-sparkles"
              style={{
                fontSize: '1.8rem',
                color: Color.darkerGray()
              }}
            />
            <div>
              <h3
                className={css`
                  margin: 0;
                  font-size: 1.8rem;
                  color: ${Color.black()};
                  font-weight: 700;
                `}
              >
                Prompt Factory
              </h3>
              <p
                className={css`
                  margin: 0.3rem 0 0;
                  font-size: 1.2rem;
                  color: ${Color.darkerGray()};
                `}
              >
                Generate and test custom system prompts
              </p>
            </div>
          </div>
        </div>
        <div
          className={css`
            padding: 1.5rem 1.8rem 1.8rem;
            border-top: 1px solid var(--ui-border);
            @media (max-width: ${mobileMaxWidth}) {
              padding: 1.5rem 1.4rem 1.4rem;
            }
          `}
        >
          <ErrorBoundary componentPath="MissionPage/WorkshopPage/PromptWorkshop">
            <PromptWorkshop
              mission={mission}
              onSetMissionState={onSetMissionState}
            />
          </ErrorBoundary>
        </div>
      </div>
      <MyTopicsManager />
    </div>
  );
}
