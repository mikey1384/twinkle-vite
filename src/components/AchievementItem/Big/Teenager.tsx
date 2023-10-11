import React, { useState } from 'react';
import TeenagerBadge from '~/assets/teenager.png';
import ItemPanel from './ItemPanel';
import ErrorBoundary from '~/components/ErrorBoundary';
import FormModal from '../FormModal';
import { useKeyContext } from '~/contexts';

export default function Teenager({
  isNotification,
  data: { id, ap, title, description, milestones, unlockMessage },
  style
}: {
  isNotification?: boolean;
  data: {
    id: number;
    ap: number;
    title: string;
    description: string;
    unlockMessage: string;
    milestones: { name: string; completed: boolean }[];
  };
  style?: React.CSSProperties;
}) {
  const { userId, unlockedAchievementIds } = useKeyContext((v) => v.myState);
  const [formModalShown, setFormModalShown] = useState(false);
  return (
    <ErrorBoundary componentPath="AchievementItems/Teenager">
      <ItemPanel
        isNotification={isNotification}
        style={style}
        ap={ap}
        isUnlocked={unlockedAchievementIds.includes(id)}
        itemName={title}
        milestones={milestones}
        description={description}
        unlockMessage={unlockMessage}
        requirements={[
          <>
            Submit{' '}
            {userId ? (
              <a
                style={{ fontWeight: 'bold', cursor: 'pointer' }}
                onClick={() => setFormModalShown(true)}
              >
                additional profile details
              </a>
            ) : (
              <span>additional profile details</span>
            )}{' '}
            and get your birthdate verified
          </>,
          'Survive childhood and enter teenage years and beyond'
        ]}
        badgeSrc={TeenagerBadge}
      />
      {formModalShown && <FormModal onHide={() => setFormModalShown(false)} />}
    </ErrorBoundary>
  );
}
