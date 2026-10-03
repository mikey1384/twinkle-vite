import React from 'react';
import { css } from '@emotion/css';
import { useNavigate } from 'react-router-dom';
import Button from '~/components/Button';
import Icon from '~/components/Icon';
import { useAppContext } from '~/contexts';
import { Color } from '~/constants/css';
import { formatSlot } from '~/containers/BridgeBuilderQuest/staff/shared';
import useCrewView from './useCrewView';

const cardClass = css`
  margin: 0 1rem 1rem;
  padding: 1.2rem 1.3rem;
  border: 1px solid var(--ui-border);
  border-radius: 1.2rem;
  background: #fff;
  font-size: 1.3rem;
  line-height: 1.45;
  color: ${Color.black()};
  @container chat-context (max-width: 180px) {
    margin: 0 0.4rem 0.8rem;
    padding: 0.9rem 0.8rem;
  }
`;

const eyebrowClass = css`
  font-size: 1.1rem;
  font-weight: bold;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  color: ${Color.darkGray()};
  margin-bottom: 0.5rem;
`;

const mutedClass = css`
  color: ${Color.darkerGray()};
`;

// The crew hub in the chat's left "In this chat" column (the room a group
// without subchats leaves empty): ONE card about the meetup itself, meetup.com
// style: what is planned, when and where, who is coming. The path and the next
// action live in the right sidebar (CrewTrackerPanel), so nothing is repeated
// here. Every value is the server's (crew view); actions live on the crew page.
export default function CrewHubPanel({ crewId }: { crewId: number }) {
  const navigate = useNavigate();
  const trackMeetupQuestView = useAppContext(
    (v) => v.requestHelpers.trackMeetupQuestView
  );
  const crew = useCrewView(crewId);
  if (!crew?.progress) return null;
  const { plan, venue, adult } = crew;
  const slot = venue?.status === 'set' ? venue.confirmedSlot : null;
  const isDone = crew.status === 'completed';

  let headline = 'Nothing planned yet';
  let detail = '';
  if (isDone) {
    headline = 'Meetup done';
    detail = 'Great job. Plan another one any time.';
  } else if (slot) {
    headline = formatSlot(slot);
    detail =
      [venue.branch && `${venue.branch} branch`, venue.room]
        .filter(Boolean)
        .join(' · ') ||
      plan.area ||
      'Set up by staff';
  } else if (plan.status === 'pending') {
    headline = 'Plan sent';
    detail = 'Staff are reviewing it.';
  } else if (plan.status === 'approved') {
    headline = 'Plan approved';
    detail =
      venue?.status === 'offered'
        ? 'Staff offered a classroom and times.'
        : 'Waiting for a time and place.';
  } else if (plan.status === 'sent_back') {
    headline = 'Staff asked for changes';
    detail = plan.note || '';
  }
  const grownUp = adult?.name
    ? `${adult.name} (${adult.kind === 'teacher' ? 'Twinkle teacher' : 'parent'}) is coming`
    : '';

  const go = (to: string, kind: 'crew_hub_open' | 'crew_hub_examples') => {
    trackMeetupQuestView(kind);
    navigate(to);
  };

  return (
    <div style={{ paddingTop: '0.4rem' }}>
      <div className={cardClass}>
        <div className={eyebrowClass}>
          <Icon icon="calendar-day" style={{ marginRight: '0.5rem' }} />
          Next meetup
        </div>
        <div style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>{headline}</div>
        {detail && (
          <div className={mutedClass} style={{ marginTop: '0.3rem' }}>
            {detail}
          </div>
        )}
        {!!plan.activity && plan.status !== 'none' && (
          <div
            className={css`
              margin-top: 0.7rem;
              color: ${Color.darkerGray()};
              display: -webkit-box;
              -webkit-box-orient: vertical;
              -webkit-line-clamp: 3;
              overflow: hidden;
            `}
          >
            <Icon icon="lightbulb" style={{ marginRight: '0.5rem', color: Color.gold() }} />
            {plan.activity}
          </div>
        )}
        {grownUp && (
          <div className={mutedClass} style={{ marginTop: '0.7rem' }}>
            <Icon icon="user-shield" style={{ marginRight: '0.5rem' }} />
            {grownUp}
          </div>
        )}
        {/* the sidebar's "Open crew page" already covers a crew with no plan yet */}
        {(slot || isDone || plan.status !== 'none') && (
          <Button
            size="sm"
            color="logoBlue"
            style={{ marginTop: '1rem', width: '100%' }}
            onClick={() => go(`/achievements/bridge-builder/crew/${crewId}`, 'crew_hub_open')}
          >
            See the details
          </Button>
        )}
        {headline === 'Nothing planned yet' && (
          <button
            type="button"
            onClick={() => go('/bridge-builder/examples', 'crew_hub_examples')}
            className={css`
              margin-top: 0.8rem;
              padding: 0;
              border: 0;
              background: none;
              cursor: pointer;
              font-family: inherit;
              font-size: 1.25rem;
              font-weight: bold;
              color: ${Color.logoBlue()};
            `}
          >
            Need ideas? See example meetups
          </button>
        )}
      </div>
    </div>
  );
}
