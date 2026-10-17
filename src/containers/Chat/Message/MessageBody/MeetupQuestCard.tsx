import React from 'react';
import { css } from '@emotion/css';
import { useNavigate } from 'react-router-dom';
import Button from '~/components/Button';
import Icon from '~/components/Icon';
import { useAppContext } from '~/contexts';
import { Color, borderRadius } from '~/constants/css';

// Bridge Builder notification DMs (twinkle-api user/routes/meetupQuest.ts and
// meetupStory.ts): a founder's crew invite (rootType 'meetupQuestInvite',
// rootId = crew id), or a crew's story sent for the admins' approval
// ('meetupStory', rootId = story id).
export default function MeetupQuestCard({
  crewId,
  username,
  isStory = false
}: {
  crewId: number;
  username: string;
  // rootType 'meetupStory': a crew sent its Bridge Builder story for the
  // admins' approval (crewId is then the story id)
  isStory?: boolean;
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
        border: 1px solid ${Color.logoBlue(0.35)};
        background: ${Color.logoBlue(0.05)};
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
        <Icon icon="users" style={{ color: Color.logoBlue(), marginRight: '0.6rem' }} />
        {isStory ? (
          <>
            <b>{username}</b>&apos;s crew sent their{' '}
            {achievementTitle ? `${achievementTitle} ` : ''}story for your
            approval.
          </>
        ) : (
          <>
            <b>{username}</b> invited you to join their{' '}
            {achievementTitle ? `${achievementTitle} ` : ''}crew.
          </>
        )}
      </div>
      <div>
        <Button
          size="sm"
          color="logoBlue"
          onClick={() =>
            navigate(
              isStory
                ? `/bridge-builder/stories/${crewId}`
                : `/achievements/bridge-builder/crew/${crewId}`
            )
          }
        >
          {isStory ? 'Review the story' : 'See the invitation'}
        </Button>
      </div>
    </div>
  );
}
