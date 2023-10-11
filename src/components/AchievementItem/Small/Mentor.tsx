import React from 'react';
import MentorBadge from '~/assets/mentor.png';
import ItemThumbPanel from './ItemThumbPanel';

export default function Mentor({
  isThumb,
  thumbSize,
  data: { title },
  style
}: {
  isThumb?: boolean;
  thumbSize?: string;
  data: {
    title: string;
  };
  style?: React.CSSProperties;
}) {
  return (
    <ItemThumbPanel
      isThumb={isThumb}
      itemName={title}
      thumbSize={thumbSize}
      badgeSrc={MentorBadge}
      style={style}
    />
  );
}
