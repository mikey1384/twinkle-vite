import React from 'react';
import { css } from '@emotion/css';
import { useNavigate } from 'react-router-dom';
import Button from '~/components/Button';
import Icon from '~/components/Icon';
import { useAppContext } from '~/contexts';
import { Color } from '~/constants/css';
import useCrewView from './useCrewView';

// The message a crew's chat opens with (rootType 'meetupQuestCrew'): where
// the crew is on its path, read live from the server. The full checklist sits
// in the chat's right sidebar (CrewTrackerPanel); this card is what phones see.
export default function CrewChatCard({ crewId }: { crewId: number }) {
  const navigate = useNavigate();
  const trackMeetupQuestView = useAppContext(
    (v) => v.requestHelpers.trackMeetupQuestView
  );
  const crew = useCrewView(crewId);
  if (!crew?.progress) return null;
  const { progress } = crew;
  const current = progress.steps.find((step) => step.key === progress.currentStep);
  const isDone = crew.status === 'completed';
  return (
    <div
      className={css`
        display: flex;
        align-items: center;
        gap: 1rem;
        flex-wrap: wrap;
        border: 1px solid ${Color.logoBlue(0.35)};
        background: ${Color.logoBlue(0.05)};
        border-radius: 8px;
        padding: 1.2rem 1.4rem;
        margin-top: 0.5rem;
        max-width: 46rem;
        /* from 768px the chat's right sidebar already shows this path */
        @media (min-width: 768px) {
          display: none;
        }
      `}
    >
      <Icon icon="users" style={{ color: Color.logoBlue() }} />
      <div
        className={css`
          flex: 1;
          min-width: 18rem;
          font-size: 1.35rem;
          color: ${Color.black()};
          line-height: 1.4;
        `}
      >
        <b>{crew.displayName}</b>
        <div>
          {isDone
            ? 'Your meetup is done. Plan another one any time.'
            : current
            ? `Step ${current.number} of ${progress.steps.length}: ${current.label}. ${progress.blocking.replace(/^Next:\s*/, '')}`
            : ''}
        </div>
      </div>
      <Button
        size="sm"
        color="logoBlue"
        onClick={() => {
          trackMeetupQuestView('crew_banner_open');
          navigate(`/achievements/bridge-builder/crew/${crewId}`);
        }}
      >
        Open crew page
      </Button>
    </div>
  );
}
