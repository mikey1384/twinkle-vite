import React from 'react';
import { css, cx } from '@emotion/css';
import Icon from '~/components/Icon';
import { borderRadius, mobileMaxWidth } from '~/constants/css';
import type { PublicBuildSort } from './types';

const sortOptions: Array<{ value: PublicBuildSort; label: string }> = [
  { value: 'recent', label: 'Newest' },
  { value: 'popular', label: 'Most Viewed' },
  { value: 'forks', label: 'Most Forked' }
];

const searchWrapClass = css`
  margin: 0 0 2rem;
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 0.75rem;
`;

const searchFieldClass = css`
  position: relative;
  flex: 1;
  min-width: 0;
  color: var(--chat-text);

  > svg {
    position: absolute;
    left: 1rem;
    top: 50%;
    transform: translateY(-50%);
    color: #418ceb;
    font-size: 1.2rem;
    pointer-events: none;
  }
`;

const searchInputClass = css`
  width: 100%;
  height: 3.45rem;
  box-sizing: border-box;
  border: 1px solid var(--ui-border);
  border-radius: ${borderRadius};
  background: #fff;
  color: var(--chat-text);
  font-size: 1.15rem;
  font-weight: 700;
  padding: 0 3rem 0 3rem;
  outline: none;
  transition:
    border-color 0.18s ease,
    box-shadow 0.18s ease;

  &::placeholder {
    color: rgba(55, 65, 81, 0.55);
    font-weight: 700;
  }

  &:focus {
    border-color: #418ceb;
    box-shadow: 0 0 0 3px rgba(65, 140, 235, 0.14);
  }
`;

const searchClearButtonClass = css`
  position: absolute;
  right: 0.55rem;
  top: 50%;
  transform: translateY(-50%);
  width: 2.2rem;
  height: 2.2rem;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border: 0;
  border-radius: 50%;
  background: rgba(55, 65, 81, 0.08);
  color: rgba(31, 41, 55, 0.76);
  cursor: pointer;
  transition:
    background 0.18s ease,
    color 0.18s ease;

  &:hover,
  &:focus-visible {
    background: rgba(65, 140, 235, 0.14);
    color: #1d4ed8;
    outline: none;
  }
`;

const sortRowClass = css`
  display: inline-flex;
  align-items: center;
  gap: 0.45rem;

  @media (max-width: ${mobileMaxWidth}) {
    width: 100%;
  }
`;

const sortButtonClass = css`
  appearance: none;
  height: 3.45rem;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0 1rem;
  border: 1px solid var(--ui-border);
  border-radius: ${borderRadius};
  background: #fff;
  color: rgba(31, 41, 55, 0.76);
  font-size: 1.05rem;
  font-weight: 800;
  cursor: pointer;
  white-space: nowrap;
  transition:
    background 0.18s ease,
    border-color 0.18s ease,
    color 0.18s ease;

  &.active {
    border-color: #418ceb;
    background: rgba(65, 140, 235, 0.12);
    color: #1d4ed8;
  }

  @media (max-width: ${mobileMaxWidth}) {
    flex: 1;
    padding: 0 0.5rem;
  }
`;

export default function Search({
  value,
  sort,
  sortShown,
  onChange,
  onClear,
  onSortChange
}: {
  value: string;
  sort: PublicBuildSort;
  sortShown: boolean;
  onChange: (value: string) => void;
  onClear: () => void;
  onSortChange: (sort: PublicBuildSort) => void;
}) {
  return (
    <div className={searchWrapClass}>
      <label className={searchFieldClass}>
        <Icon icon="search" />
        <input
          aria-label="Search builds"
          className={searchInputClass}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder="Search apps by title, creator, or type"
        />
        {value ? (
          <button
            type="button"
            className={searchClearButtonClass}
            aria-label="Clear build search"
            onClick={onClear}
          >
            <Icon icon="times" />
          </button>
        ) : null}
      </label>
      {sortShown ? (
        <div className={sortRowClass} role="group" aria-label="Sort results">
          {sortOptions.map((option) => (
            <button
              key={option.value}
              type="button"
              className={cx(sortButtonClass, sort === option.value && 'active')}
              onClick={() => onSortChange(option.value)}
            >
              {option.label}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
