import React from 'react';
import MentorBadge from './mentor.png';
import ItemPanel from '../ItemPanel';

export default function Mentor({ style }: { style?: React.CSSProperties }) {
  return (
    <ItemPanel
      style={style}
      itemName="Starlight Mentor"
      description="This honor is bestowed upon the exceptional individuals at Twinkle Academy who have taken up the noble task of guiding young minds towards knowledge. As a Starlight Mentor, your passion and wisdom illuminate the path of learning, inspiring those around you. Wear this badge with pride, for you are a beacon in the vast expanse of education."
      requirements={['Take a full-time teaching position at Twinkle Academy']}
      badgeSrc={MentorBadge}
    />
  );
}
