import React from 'react';
import MentorBadge from '~/assets/mentor.png';
import ItemThumbPanel from './ItemThumbPanel';

export default function Mentor({
  data: { title },
  style
}: {
  data: {
    title: string;
  };
  style?: React.CSSProperties;
}) {
  return (
    <ItemThumbPanel itemName={title} badgeSrc={MentorBadge} style={style} />
  );
}
