import React, { useMemo, useRef, useEffect } from 'react';
import Input from '~/components/Texts/Input';
import Icon from '~/components/Icon';
import { css } from '@emotion/css';
import { Color, mobileMaxWidth } from '~/constants/css';

interface PriceRangeSearchProps {
  priceRange: { min: string; max: string };
  onPriceRangeChange: (newPriceRange: { min: string; max: string }) => void;
}

export default function PriceRangeSearch({
  priceRange,
  onPriceRangeChange
}: PriceRangeSearchProps) {
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showClearButton = useMemo(
    () => priceRange.min !== '' || priceRange.max !== '',
    [priceRange.min, priceRange.max]
  );

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

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
        onChange={(text) => handlePriceChange('min', text)}
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
        onChange={(text) => handlePriceChange('max', text)}
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
      {showClearButton && (
        <button
          onClick={handleClear}
          className={css`
            margin-left: 0.5rem;
            padding: 0.5rem;
            border: none;
            background-color: ${Color.logoBlue()};
            color: white;
            border-radius: 50%;
            width: 25px;
            height: 25px;
            display: flex;
            align-items: center;
            justify-content: center;
            cursor: pointer;
            &:hover {
              background-color: ${Color.logoBlue(0.8)};
            }
            @media (max-width: ${mobileMaxWidth}) {
              width: 20px;
              height: 20px;
            }
          `}
        >
          <Icon icon="times" />
        </button>
      )}
    </div>
  );

  function handlePriceChange(type: 'min' | 'max', value: string) {
    const sanitizedValue = Number(value) <= 0 ? '' : Number(value).toString();
    const newPriceRange = { ...priceRange, [type]: sanitizedValue };

    onPriceRangeChange(newPriceRange);

    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = setTimeout(() => {
       
      let { min, max } = newPriceRange;
      const minNum = min === '' ? 0 : Number(min);
      const maxNum = max === '' ? Infinity : Number(max);

      if (minNum > maxNum && max !== '') {
        const correctedRange = { min: max, max: min };
        onPriceRangeChange(correctedRange);
      }
    }, 1000);
  }

  function handleClear() {
    onPriceRangeChange({ min: '', max: '' });
  }
}
