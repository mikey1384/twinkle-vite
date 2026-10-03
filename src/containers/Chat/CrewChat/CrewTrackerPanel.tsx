import React from 'react';
import { css } from '@emotion/css';
import { useNavigate } from 'react-router-dom';
import Button from '~/components/Button';
import Icon from '~/components/Icon';
import { useAppContext } from '~/contexts';
import { Color } from '~/constants/css';
import { STEP_ICONS } from '~/containers/BridgeBuilderQuest/StepTracker';
import useCrewView from './useCrewView';

// The crew's path as a checklist, in the chat's right sidebar under the
// member list: what is done, what to do next, what comes after. Server-owned
// numbers only (the crew page owns every action).
export default function CrewTrackerPanel({ crewId }: { crewId: number }) {
  const navigate = useNavigate();
  const trackMeetupQuestView = useAppContext(
    (v) => v.requestHelpers.trackMeetupQuestView
  );
  const crew = useCrewView(crewId);
  if (!crew?.progress) return null;
  const { progress } = crew;
  const isDone = crew.status === 'completed';
  return (
    <div
      className={css`
        margin: 2rem 1rem 0;
        padding-top: 1.6rem;
        border-top: 1px solid var(--ui-border);
      `}
    >
      <div
        className={css`
          font-size: 1.5rem;
          font-weight: bold;
          color: ${Color.black()};
          margin-bottom: 1rem;
        `}
      >
        <Icon icon="route" style={{ color: Color.logoBlue(), marginRight: '0.6rem' }} />
        Your crew&apos;s path
      </div>
      <ol
        className={css`
          list-style: none;
          margin: 0;
          padding: 0;
          display: flex;
          flex-direction: column;
          gap: 0.9rem;
        `}
      >
        {progress.steps.map((step) => {
          const done = step.state === 'done';
          const current = step.state === 'current';
          return (
            <li
              key={step.key}
              aria-current={current ? 'step' : undefined}
              className={css`
                display: flex;
                gap: 0.9rem;
                align-items: flex-start;
              `}
            >
              <span
                className={css`
                  width: 2.4rem;
                  height: 2.4rem;
                  flex-shrink: 0;
                  border-radius: 50%;
                  display: inline-flex;
                  align-items: center;
                  justify-content: center;
                  font-size: 1.1rem;
                  color: #fff;
                  background: ${done
                    ? Color.green()
                    : current
                    ? Color.logoBlue()
                    : Color.lightGray()};
                `}
              >
                {done ? (
                  <Icon icon="check" />
                ) : current ? (
                  <Icon icon={STEP_ICONS[step.key]} />
                ) : (
                  <span style={{ color: Color.darkGray() }}>{step.number}</span>
                )}
              </span>
              <div
                className={css`
                  min-width: 0;
                  font-size: 1.3rem;
                  line-height: 1.35;
                  color: ${current ? Color.black() : done ? Color.darkerGray() : Color.gray()};
                `}
              >
                <div style={{ fontWeight: current ? 'bold' : 'normal' }}>{step.label}</div>
                {(current || !done) && (
                  <div
                    className={css`
                      font-size: 1.2rem;
                      color: ${current ? Color.darkerGray() : Color.gray()};
                    `}
                  >
                    {step.detail}
                  </div>
                )}
              </div>
            </li>
          );
        })}
      </ol>
      {!isDone && progress.blocking && (
        <div
          role="status"
          className={css`
            margin-top: 1.2rem;
            padding: 0.9rem 1.1rem;
            border-radius: 0.8rem;
            border-left: 0.4rem solid ${Color.logoBlue()};
            background: ${Color.logoBlue(0.08)};
            font-size: 1.3rem;
            color: ${Color.black()};
            line-height: 1.4;
          `}
        >
          <b>Next up: </b>
          {progress.blocking.replace(/^Next:\s*/, '')}
        </div>
      )}
      <Button
        size="sm"
        color="logoBlue"
        style={{ marginTop: '1.2rem', width: '100%' }}
        onClick={() => {
          trackMeetupQuestView('crew_panel_open');
          navigate(`/achievements/bridge-builder/crew/${crewId}`);
        }}
      >
        Open crew page
      </Button>
    </div>
  );
}
