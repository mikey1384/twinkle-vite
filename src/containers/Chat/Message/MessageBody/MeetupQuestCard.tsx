import React from 'react';
import { css } from '@emotion/css';
import { useNavigate } from 'react-router-dom';
import Button from '~/components/Button';
import Icon from '~/components/Icon';
import { useAppContext } from '~/contexts';
import { Color, borderRadius } from '~/constants/css';

// The notification DM an admin gets when a meetup quest crew sends its plan
// or its video (twinkle-api user/routes/meetupQuest.ts, rootType
// 'meetupQuest', rootId = crew id). The review itself happens on the quest
// page, or with `lumine admin meetup`.
export default function MeetupQuestCard({
  crewId,
  username
}: {
  crewId: number;
  username: string;
}) {
  const navigate = useNavigate();
  const achievementTitle = useAppContext(
    (v) => v.user.state.achievementsObj?.meetup?.title
  );
  return (
    <div
      className={css`
        margin-top: 0.5rem;
        padding: 1.2rem 1.4rem;
        border: 1px solid ${Color.purple(0.35)};
        background: ${Color.purple(0.05)};
        border-radius: ${borderRadius};
        display: flex;
        flex-direction: column;
        gap: 0.8rem;
        max-width: 42rem;
      `}
    >
      <div
        className={css`
          font-size: 1.4rem;
          color: ${Color.black()};
        `}
      >
        <Icon icon="users" style={{ color: Color.purple(), marginRight: '0.6rem' }} />
        <b>{username}</b>&apos;s crew (#{crewId}) sent their{' '}
        {achievementTitle ? `${achievementTitle} ` : ''}meetup quest for review.
      </div>
      <div>
        <Button
          size="sm"
          color="purple"
          onClick={() => navigate(`/achievements/bridge-builder?crew=${crewId}`)}
        >
          Open the review
        </Button>
      </div>
    </div>
  );
}
