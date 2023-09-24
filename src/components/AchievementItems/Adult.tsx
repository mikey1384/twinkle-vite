import React, { useState } from 'react';
import TeenagerBadge from '~/assets/adult.png';
import ItemPanel from './ItemPanel';
import ErrorBoundary from '~/components/ErrorBoundary';
import FormModal from './FormModal';
import { useKeyContext } from '~/contexts';

export default function Adult({
  isNotification,
  data: { isUnlocked, ap, title, description, milestones, unlockMessage },
  style
}: {
  isNotification?: boolean;
  data: {
    ap: number;
    isUnlocked: boolean;
    title: string;
    description: string;
    unlockMessage: string;
    milestones: { name: string; completed: boolean }[];
  };
  style?: React.CSSProperties;
}) {
  const { userId } = useKeyContext((v) => v.myState);
  const [formModalShown, setFormModalShown] = useState(false);
  return (
    <ErrorBoundary componentPath="AchievementItems/Teenager">
      <ItemPanel
        isNotification={isNotification}
        style={style}
        ap={ap}
        isUnlocked={isUnlocked}
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
      {formModalShown && <FormModal onHide={() => setFormModalShown(false)} />}
    </ErrorBoundary>
  );
}
