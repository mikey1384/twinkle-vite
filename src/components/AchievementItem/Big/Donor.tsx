import React from 'react';
import DonorBadge from '~/assets/donor.png';
import ItemPanel from './ItemPanel';
import ErrorBoundary from '~/components/ErrorBoundary';
import { useKeyContext } from '~/contexts';

export default function Donor({
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
    <ErrorBoundary componentPath="AchievementItems/Big/Donor">
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
        requirements={['Donate 10,000,000 Twinkle Coins']}
        progressObj={progressObj}
        badgeSrc={DonorBadge}
      />
    </ErrorBoundary>
  );
}
