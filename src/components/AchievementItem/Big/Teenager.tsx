import React from 'react';
import teenagerBadge from '~/assets/teenager.png';
import AgeMilestoneItem from './AgeMilestoneItem';

export default function Teenager({
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
      badgeSrc={teenagerBadge}
      componentPath="AchievementItems/Teenager"
      isThumb={isThumb}
      isNotification={isNotification}
      data={{ id, ap, title, description, milestones, unlockMessage }}
      secondaryRequirement="Survive childhood and enter teenage years and beyond"
      style={style}
    />
  );
}
