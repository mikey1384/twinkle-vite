import React, { memo } from 'react';
import Icon from '~/components/Icon';
import { Color } from '~/constants/css';
import { priceTable } from '~/constants/defaultValues';

interface PriceTextProps {
  isRecommendedByUser: boolean;
  switchButtonShown: boolean;
}

function PriceText({ isRecommendedByUser, switchButtonShown }: PriceTextProps) {
  if (isRecommendedByUser) return null;
  return (
    <span
      style={{
        marginLeft: switchButtonShown ? 0 : '0.7rem',
        color: Color.darkBlue(),
        fontSize: '1.3rem'
      }}
    >
      (<Icon icon={['far', 'badge-dollar']} /> {priceTable.recommendation})
    </span>
  );
}

export default memo(PriceText);
