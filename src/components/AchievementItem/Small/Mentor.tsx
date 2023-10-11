import React from 'react';
import MentorBadge from '~/assets/mentor.png';
import ItemThumbPanel from './ItemThumbPanel';

export default function Mentor({
  isThumb,
  data: { title },
  style
}: {
  isThumb?: boolean;
  data: {
    title: string;
  };
  style?: React.CSSProperties;
}) {
  return (
    <ItemThumbPanel
      isThumb={isThumb}
      itemName={title}
      badgeSrc={MentorBadge}
      style={style}
    />
  );
}
