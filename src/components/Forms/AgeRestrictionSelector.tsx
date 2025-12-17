import React from 'react';
import { css } from '@emotion/css';
import { Color, mobileMaxWidth, borderRadius } from '~/constants/css';
import TeenagerBadge from '~/assets/teenager.png';
import AdultBadge from '~/assets/adult.png';

export type AgeRestriction = 'teenager' | 'adult' | null;

const containerClass = css`
  display: flex;
  align-items: stretch;
  gap: 0.7rem;
  @media (max-width: ${mobileMaxWidth}) {
    gap: 0.5rem;
  }
`;

const baseButtonClass = css`
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0.7rem 1rem;
  border-radius: ${borderRadius};
  cursor: pointer;
  transition: background 0.18s ease, border-color 0.18s ease;
  border: 1px solid ${Color.borderGray()};
  background: #fff;
  font-family: 'Ubuntu', sans-serif, Arial, Helvetica;
  font-weight: 600;
  font-size: 1.3rem;
  color: ${Color.darkerGray()};

  &:hover {
    background: ${Color.highlightGray()};
    border-color: ${Color.darkerBorderGray()};
  }

  &.selected {
    border-color: ${Color.black()};
    background: ${Color.highlightGray()};
  }

  @media (max-width: ${mobileMaxWidth}) {
    padding: 0.5rem 0.7rem;
    font-size: 1.2rem;
  }
`;

const badgeButtonClass = css`
  position: relative;
  padding: 0.5rem;
  min-width: 4.5rem;
  overflow: visible;

  img {
    width: 3.5rem;
    height: 3.5rem;
    object-fit: contain;
  }

  .badge-label {
    position: absolute;
    bottom: 0.3rem;
    left: 50%;
    transform: translateX(-50%);
    font-size: 0.9rem;
    font-weight: 700;
    color: #fff;
    background: rgba(0, 0, 0, 0.6);
    padding: 0.1rem 0.4rem;
    border-radius: 3px;
  }

  @media (max-width: ${mobileMaxWidth}) {
    min-width: 3.5rem;
    padding: 0.4rem;
    img {
      width: 2rem;
      height: 2rem;
    }
    .badge-label {
      font-size: 0.8rem;
      bottom: 0.2rem;
    }
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
          className={`${baseButtonClass} ${
            ageRestriction === null ? 'selected' : ''
          }`}
          onClick={() => onChange(null)}
          title="Visible to everyone"
        >
          Everyone
        </div>
        <div
          className={`${baseButtonClass} ${badgeButtonClass} ${
            ageRestriction === 'teenager' ? 'selected' : ''
          }`}
          onClick={() => onChange('teenager')}
          title="Only visible to users aged 13+"
        >
          <span className="badge-label">13+</span>
          <img src={TeenagerBadge} alt="13+" />
        </div>
        <div
          className={`${baseButtonClass} ${badgeButtonClass} ${
            ageRestriction === 'adult' ? 'selected' : ''
          }`}
          onClick={() => onChange('adult')}
          title="Only visible to users aged 18+"
        >
          <span className="badge-label">18+</span>
          <img src={AdultBadge} alt="18+" />
        </div>
      </div>
    </div>
  );
}
