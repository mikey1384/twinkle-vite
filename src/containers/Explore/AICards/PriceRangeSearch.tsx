import React from 'react';
import Input from '~/components/Texts/Input';
import { css } from '@emotion/css';
import { Color } from '~/constants/css';

interface PriceRangeSearchProps {
  priceRange: { min: string; max: string };
  onPriceRangeChange: (newPriceRange: { min: string; max: string }) => void;
}

export default function PriceRangeSearch({
  priceRange,
  onPriceRangeChange
}: PriceRangeSearchProps) {
  return (
    <div
      className={css`
        margin-top: 0.5rem;
        display: flex;
        align-items: center;
        border-radius: 20px;
        padding: 0.3rem;
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        border: 1px solid ${Color.borderGray()};
        background-color: #fff;
      `}
    >
      <Input
        placeholder="Min"
        type="number"
        value={priceRange.min}
        onChange={(text) => onPriceRangeChange({ ...priceRange, min: text })}
        className={css`
          width: 80px;
          font-size: 1.3rem;
          padding: 0.5rem;
          border: none;
          background-color: white;
          color: ${Color.darkerGray()};
          border-radius: 15px;
          &::placeholder {
            color: ${Color.gray()};
          }
        `}
      />
      <span
        className={css`
          margin: 0 0.5rem;
          color: ${Color.gray()};
          font-size: 1.3rem;
        `}
      >
        -
      </span>
      <Input
        placeholder="Max"
        type="number"
        value={priceRange.max}
        onChange={(text) => onPriceRangeChange({ ...priceRange, max: text })}
        className={css`
          width: 80px;
          font-size: 1.3rem;
          padding: 0.5rem;
          border: none;
          background-color: white;
          color: ${Color.darkerGray()};
          border-radius: 15px;
          &::placeholder {
            color: ${Color.gray()};
          }
        `}
      />
    </div>
  );
}
