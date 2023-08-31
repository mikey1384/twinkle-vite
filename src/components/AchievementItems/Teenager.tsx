import React from 'react';
import TeenagerBadge from '~/assets/teenager.png';
import ItemPanel from './ItemPanel';

export default function Teenager({
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
  return (
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
          <a
            style={{ fontWeight: 'bold', cursor: 'pointer' }}
            onClick={() => console.log('clicked')}
          >
            additional profile details
          </a>
        </>,
        'Get birthdate verified',
        'Survive childhood and enter teenage years and beyond'
      ]}
      badgeSrc={TeenagerBadge}
    />
  );
}
