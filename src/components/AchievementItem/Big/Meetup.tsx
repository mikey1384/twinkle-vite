import React from 'react';
import MeetupBadge from '~/assets/meetup.png';
import ItemPanel from './ItemPanel';
import { useKeyContext } from '~/contexts';

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
  const { unlockedAchievementIds } = useKeyContext((v) => v.myState);
  return (
    <ItemPanel
      isThumb={isThumb}
      isNotification={isNotification}
      style={style}
      ap={ap}
      isUnlocked={unlockedAchievementIds.includes(id)}
      itemName={title}
      description={description}
      unlockMessage={unlockMessage}
      requirements={[
        <>
          Attend a Twinkle Intensive, Twinkle Fireside Chat, or any other meetup
          events and{' '}
          <a style={{ fontWeight: 'bold', cursor: 'pointer' }}>
            let Mikey know
          </a>
        </>
      ]}
      progressObj={progressObj}
      badgeSrc={MeetupBadge}
    />
  );
}
