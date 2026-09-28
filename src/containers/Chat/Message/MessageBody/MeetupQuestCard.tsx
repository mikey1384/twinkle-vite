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
  username,
  isInvite = false,
  isSlot = false
}: {
  crewId: number;
  username: string;
  // rootType 'meetupQuestInvite': a founder invited the recipient
  isInvite?: boolean;
  // rootType 'meetupQuestSlot': the coordinator set up the crew's slot
  isSlot?: boolean;
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
        {isSlot ? (
          <>
            <b>{username}</b> set up your crew&apos;s meetup slot. See the
            date, time and place on your crew page.
          </>
        ) : isInvite ? (
          <>
            <b>{username}</b> invited you to join their{' '}
            {achievementTitle ? `${achievementTitle} ` : ''}meetup quest crew.
          </>
        ) : (
          <>
            <b>{username}</b>&apos;s crew (#{crewId}) sent their{' '}
            {achievementTitle ? `${achievementTitle} ` : ''}meetup quest for
            review.
          </>
        )}
      </div>
      <div>
        <Button
          size="sm"
          color="logoBlue"
          onClick={() =>
            navigate(
              isInvite || isSlot
                ? `/achievements/bridge-builder/crew/${crewId}`
                : `/achievements/bridge-builder/desk?crew=${crewId}`
            )
          }
        >
          {isSlot ? 'See your meetup' : isInvite ? 'See the invitation' : 'Open the review'}
        </Button>
      </div>
    </div>
  );
}
