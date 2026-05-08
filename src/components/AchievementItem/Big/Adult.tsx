import React from 'react';
import adultBadge from '~/assets/adult.png';
import AgeMilestoneItem from './AgeMilestoneItem';

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
  return (
    <AgeMilestoneItem
      badgeSrc={adultBadge}
      componentPath="AchievementItems/Big/Adult"
      isThumb={isThumb}
      isNotification={isNotification}
      data={{ id, ap, title, description, milestones, unlockMessage }}
      secondaryRequirement="Close the chapter on teenage years. Enter adulthood"
      style={style}
    />
  );
}
