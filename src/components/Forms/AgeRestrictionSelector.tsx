import React, { memo, useMemo } from 'react';
import { css } from '@emotion/css';
import { Color, mobileMaxWidth, borderRadius } from '~/constants/css';
import { useKeyContext } from '~/contexts';
import TeenagerBadge from '~/assets/teenager.png';
import AdultBadge from '~/assets/adult.png';

export type AgeRestriction = 'teenager' | 'adult' | null;

const containerClass = css`
  display: flex;
  align-items: stretch;
  flex-wrap: wrap;
  gap: 0.7rem;
  @media (max-width: ${mobileMaxWidth}) {
    gap: 0.5rem;
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

function AgeRestrictionSelector({
  ageRestriction,
  onChange,
  showAdultOption = false,
  style
}: {
  ageRestriction: AgeRestriction;
  onChange: (value: AgeRestriction) => void;
  showAdultOption?: boolean;
  style?: React.CSSProperties;
}) {
  const profileTheme = useKeyContext((v) => v.myState.profileTheme);

  const baseButtonClass = useMemo(
    () => css`
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 0.7rem 1rem;
      border-radius: ${borderRadius};
      cursor: pointer;
      transition: background 0.18s ease, border-color 0.18s ease,
        box-shadow 0.18s ease;
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

      &:focus {
        outline: none;
      }

      &.selected {
        border: 2px solid ${Color[profileTheme]()};
      }

      @media (max-width: ${mobileMaxWidth}) {
        padding: 0.5rem 0.7rem;
        font-size: 1.2rem;
      }
    `,
    [profileTheme]
  );

  function handleKeyDown(e: React.KeyboardEvent, value: AgeRestriction) {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onChange(value);
    }
  }

  return (
    <div style={style}>
      <div
        className={containerClass}
        role="radiogroup"
        aria-label="Content visibility"
      >
        <div
          className={`${baseButtonClass} ${
            !ageRestriction || (ageRestriction === 'adult' && !showAdultOption)
              ? 'selected'
              : ''
          }`}
          role="radio"
          aria-checked={
            !ageRestriction || (ageRestriction === 'adult' && !showAdultOption)
          }
          tabIndex={0}
          onClick={() => onChange(null)}
          onKeyDown={(e) => handleKeyDown(e, null)}
          aria-label="Visible to everyone"
        >
          Everyone
        </div>
        <div
          className={`${baseButtonClass} ${badgeButtonClass} ${
            ageRestriction === 'teenager' ? 'selected' : ''
          }`}
          role="radio"
          aria-checked={ageRestriction === 'teenager'}
          tabIndex={0}
          onClick={() => onChange('teenager')}
          onKeyDown={(e) => handleKeyDown(e, 'teenager')}
          aria-label="Only visible to users aged 13 and above"
        >
          <span className="badge-label">13+</span>
          <img src={TeenagerBadge} alt="" aria-hidden="true" />
        </div>
        {showAdultOption && (
          <div
            className={`${baseButtonClass} ${badgeButtonClass} ${
              ageRestriction === 'adult' ? 'selected' : ''
            }`}
            role="radio"
            aria-checked={ageRestriction === 'adult'}
            tabIndex={0}
            onClick={() => onChange('adult')}
            onKeyDown={(e) => handleKeyDown(e, 'adult')}
            aria-label="Only visible to users aged 18 and above"
          >
            <span className="badge-label">18+</span>
            <img src={AdultBadge} alt="" aria-hidden="true" />
          </div>
        )}
      </div>
    </div>
  );
}

export default memo(AgeRestrictionSelector);
