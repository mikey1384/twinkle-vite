import React from 'react';
import { css } from '@emotion/css';
import { Color, mobileMaxWidth } from '~/constants/css';
import TeenagerBadge from '~/assets/teenager.png';
import AdultBadge from '~/assets/adult.png';

export type AgeRestriction = 'teenager' | 'adult' | null;

const containerClass = css`
  display: flex;
  align-items: center;
  gap: 1rem;
  @media (max-width: ${mobileMaxWidth}) {
    gap: 0.7rem;
  }
`;

const badgeButtonClass = css`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 0.5rem;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s ease;
  border: 2px solid transparent;
  background: ${Color.wellGray()};
  min-width: 5rem;

  &:hover {
    background: ${Color.highlightGray()};
  }

  &.selected {
    border-color: ${Color.darkGray()};
    background: ${Color.highlightGray()};
  }

  &.none-selected {
    border-color: ${Color.darkGray()};
    background: ${Color.highlightGray()};
  }

  img {
    width: 2.5rem;
    height: 2.5rem;
    object-fit: contain;
    opacity: 0.5;
    transition: opacity 0.2s ease;
  }

  &.selected img,
  &:hover img {
    opacity: 1;
  }

  span {
    font-size: 1.1rem;
    margin-top: 0.3rem;
    color: ${Color.darkerGray()};
  }

  @media (max-width: ${mobileMaxWidth}) {
    min-width: 4rem;
    padding: 0.4rem;
    img {
      width: 2rem;
      height: 2rem;
    }
    span {
      font-size: 1rem;
    }
  }
`;

const noneButtonClass = css`
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0.5rem 1rem;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s ease;
  border: 2px solid transparent;
  background: ${Color.wellGray()};
  font-size: 1.2rem;
  color: ${Color.darkerGray()};
  height: 100%;
  min-height: 4.5rem;

  &:hover {
    background: ${Color.highlightGray()};
  }

  &.selected {
    border-color: ${Color.darkGray()};
    background: ${Color.highlightGray()};
  }

  @media (max-width: ${mobileMaxWidth}) {
    padding: 0.4rem 0.7rem;
    font-size: 1.1rem;
    min-height: 3.8rem;
  }
`;

export default function AgeRestrictionSelector({
  ageRestriction,
  onChange,
  style
}: {
  ageRestriction: AgeRestriction;
  onChange: (value: AgeRestriction) => void;
  style?: React.CSSProperties;
}) {
  return (
    <div style={style}>
      <div className={containerClass}>
        <div
          className={`${noneButtonClass} ${
            ageRestriction === null ? 'selected' : ''
          }`}
          onClick={() => onChange(null)}
          title="Visible to everyone"
        >
          Everyone
        </div>
        <div
          className={`${badgeButtonClass} ${
            ageRestriction === 'teenager' ? 'selected' : ''
          }`}
          onClick={() => onChange('teenager')}
          title="Only visible to users aged 13+"
        >
          <img src={TeenagerBadge} alt="13+" />
          <span>13+</span>
        </div>
        <div
          className={`${badgeButtonClass} ${
            ageRestriction === 'adult' ? 'selected' : ''
          }`}
          onClick={() => onChange('adult')}
          title="Only visible to users aged 18+"
        >
          <img src={AdultBadge} alt="18+" />
          <span>18+</span>
        </div>
      </div>
    </div>
  );
}
