import React, { useState } from 'react';
import MeetupBadge from '~/assets/meetup.png';
import ItemPanel from './ItemPanel';
import ErrorBoundary from '~/components/ErrorBoundary';
import FormModal from '../FormModal';
import { Link } from 'react-router-dom';
import { useKeyContext } from '~/contexts';

const DARK_CITADEL_PRIVATE_ROOM_PATH = '/app/2610/vigil/megacitadel/private';

export default function Meetup({
  isThumb,
  isNotification,
  data: { id, ap, title, description, progressObj, unlockMessage },
  style
}: {
  isThumb?: boolean;
  isNotification?: boolean;
  data: {
    id: number;
    ap: number;
    title: string;
    description: string;
    unlockMessage: string;
    progressObj: { label: string; currentValue: number; targetValue: number };
  };
  style?: React.CSSProperties;
}) {
  const [formModalShown, setFormModalShown] = useState(false);
  const unlockedAchievementIds = useKeyContext(
    (v) => v.myState.unlockedAchievementIds
  );
  return (
    <ErrorBoundary componentPath="AchievementItems/Big/Meetup">
      <ItemPanel
        isThumb={isThumb}
        isNotification={isNotification}
        itemId={id}
        style={style}
        ap={ap}
        isUnlocked={unlockedAchievementIds.includes(id)}
        itemName={title}
        description={description}
        unlockMessage={unlockMessage}
        anyOf
        requirements={[
          <>
            Attend a Twinkle Intensive, Twinkle Fireside Chat, or any other
            meetup events and{' '}
            <a
              onClick={() => setFormModalShown(true)}
              style={{ fontWeight: 'bold', cursor: 'pointer' }}
            >
              let us know
            </a>
          </>,
          <>
            Bring a friend who isn&apos;t on Twinkle yet: play{' '}
            <Link
              to={DARK_CITADEL_PRIVATE_ROOM_PATH}
              style={{ fontWeight: 'bold' }}
            >
              The Dark Citadel
            </Link>{' '}
            together for 10 minutes in a private room while they&apos;re a
            guest, and they sign up (or, if you moderate our Minecraft server,
            vouch for a new player who joins Twinkle)
          </>
        ]}
        progressObj={progressObj}
        badgeSrc={MeetupBadge}
      />
      {formModalShown && (
        <FormModal type="meetup" onHide={() => setFormModalShown(false)} />
      )}
    </ErrorBoundary>
  );
}
