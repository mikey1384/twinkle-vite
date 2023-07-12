import React from 'react';
import FounderBadge from './founder.png';
import ItemPanel from '../ItemPanel';

export default function Founder({ style }: { style?: React.CSSProperties }) {
  return (
    <ItemPanel
      style={style}
      itemName="The Founder"
      description="This badge is a testament to the daring innovators who have taken the leap to start their own business. As an entrepreneur, you've done more than just create a company - you've realized a dream, transformed a vision into reality, and carved your own path in the business world. This badge celebrates your bold journey of entrepreneurship, symbolizing your resilience, your inventive spirit, and your steadfast dedication to bringing your unique business idea to life."
      requirements={['Found a new business']}
      badgeSrc={FounderBadge}
    />
  );
}
