import React, { memo } from 'react';
import Icon from '~/components/Icon';
import { Color } from '~/constants/css';
import { priceTable } from '~/constants/defaultValues';

interface PriceTextProps {
  isRecommendedByUser: boolean;
}

function PriceText({ isRecommendedByUser }: PriceTextProps) {
  if (isRecommendedByUser) return null;
  return (
    <span
      style={{
        marginLeft: '0.7rem',
        color: Color.darkGold(),
        fontWeight: 700,
        fontSize: '1.3rem'
      }}
    >
      (<Icon icon="coins" /> {priceTable.recommendation})
    </span>
  );
}

export default memo(PriceText);
