import React, { useState } from 'react';
import ItemPanel from './ItemPanel';
import ErrorBoundary from '~/components/ErrorBoundary';
import FormModal from '../FormModal';
import { useKeyContext } from '~/contexts';

interface AgeMilestoneItemProps {
  badgeSrc: string;
  componentPath: string;
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
  secondaryRequirement: string;
  style?: React.CSSProperties;
}

export default function AgeMilestoneItem({
  badgeSrc,
  componentPath,
  isThumb,
  isNotification,
  data: { id, ap, title, description, milestones, unlockMessage },
  secondaryRequirement,
  style
}: AgeMilestoneItemProps) {
  const userId = useKeyContext((v) => v.myState.userId);
  const unlockedAchievementIds = useKeyContext(
    (v) => v.myState.unlockedAchievementIds
  );
  const [formModalShown, setFormModalShown] = useState(false);

  return (
    <ErrorBoundary componentPath={componentPath}>
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
          secondaryRequirement
        ]}
        badgeSrc={badgeSrc}
      />
      {formModalShown ? (
        <FormModal type="dob" onHide={() => setFormModalShown(false)} />
      ) : null}
    </ErrorBoundary>
  );
}
