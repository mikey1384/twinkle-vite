import React, { useState } from 'react';
import TeenagerBadge from '~/assets/adult.png';
import ItemPanel from './ItemPanel';
import ErrorBoundary from '~/components/ErrorBoundary';
import FormModal from '../FormModal';
import { useKeyContext } from '~/contexts';

export default function Adult({
  isThumb,
  isNotification,
  data: { id, ap, title, description, milestones, unlockMessage },
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
    milestones: { name: string; completed: boolean }[];
  };
  style?: React.CSSProperties;
}) {
  const { userId, unlockedAchievementIds } = useKeyContext((v) => v.myState);
  const [formModalShown, setFormModalShown] = useState(false);
  return (
    <ErrorBoundary componentPath="AchievementItems/Big/Adult">
      <ItemPanel
        isThumb={isThumb}
        isNotification={isNotification}
        itemId={id}
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
          'Close the chapter on teenage years. Enter adulthood'
        ]}
        badgeSrc={TeenagerBadge}
      />
      {formModalShown && (
        <FormModal type="dob" onHide={() => setFormModalShown(false)} />
      )}
    </ErrorBoundary>
  );
}
