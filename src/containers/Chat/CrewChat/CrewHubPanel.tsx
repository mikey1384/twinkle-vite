import React from 'react';
import { css } from '@emotion/css';
import { useNavigate } from 'react-router-dom';
import Button from '~/components/Button';
import Icon from '~/components/Icon';
import { useAppContext } from '~/contexts';
import { Color } from '~/constants/css';
import CheckinButton from '~/containers/BridgeBuilderQuest/Checkin/CheckinButton';
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
  @media (width <= 1512px) { @container chat-context (max-width: 180px) {
    margin: 0 0.4rem 0.8rem;
    padding: 0.9rem 0.8rem;
  } }
@media (width > 1512px) { @container chat-context (max-width: 18rem) {
    margin: 0 0.4rem 0.8rem;
    padding: 0.9rem 0.8rem;
  } }
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
// without subchats leaves empty): ONE card about meeting up: ready, or who
// checked in, with the Check in button. The path and the next action live in
// the right sidebar (CrewTrackerPanel), so nothing is repeated here. Every
// value is the server's (crew view).
export default function CrewHubPanel({ crewId }: { crewId: number }) {
  const navigate = useNavigate();
  const trackMeetupQuestView = useAppContext(
    (v) => v.requestHelpers.trackMeetupQuestView
  );
  const crew = useCrewView(crewId);
  if (!crew?.progress) return null;
  const met = !!crew.completedAt;
  const checkedIn = crew.members.filter((member) => member.attended);
  const ready = crew.progress.crewReady;
  const headline = met ? 'Your crew met up!' : ready ? 'Ready to meet up' : 'Your crew is forming';
  const detail = met
    ? `Checked in: ${checkedIn.map((member) => member.username).join(', ')}`
    : ready
      ? 'When you’re together, check each other in.'
      : crew.progress.blocking.replace(/^Next:\s*/, '');

  const go = (to: string, kind: 'crew_hub_open' | 'crew_hub_examples') => {
    trackMeetupQuestView(kind);
    navigate(to);
  };

  return (
    <div style={{ paddingTop: '0.4rem' }}>
      <div className={cardClass}>
        <div className={eyebrowClass}>
          <Icon icon="qrcode" style={{ marginRight: '0.5rem' }} />
          Meet up
        </div>
        <div style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>{headline}</div>
        {detail && (
          <div className={mutedClass} style={{ marginTop: '0.3rem' }}>
            {detail}
          </div>
        )}
        {ready && crew.viewer.isMember && crew.status === 'active' && (
          <div style={{ marginTop: '1rem' }}>
            <CheckinButton size="sm" label="Check in together" />
          </div>
        )}
        {met && (
          <Button
            size="sm"
            color="logoBlue"
            style={{ marginTop: '1rem', width: '100%' }}
            onClick={() => go(`/achievements/bridge-builder/crew/${crewId}`, 'crew_hub_open')}
          >
            Make our story page
          </Button>
        )}
        {!met && (
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
