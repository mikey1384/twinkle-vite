import React from 'react';
import { css } from '@emotion/css';
import FilterBar from '~/components/FilterBar';
import Icon from '~/components/Icon';
import { borderRadius } from '~/constants/css';

export interface BuildTabFilterOption<T extends string = string> {
  value: T;
  label: string;
  icon?: string;
}

interface BuildTabFilterProps<T extends string = string> {
  activeTab: T;
  color?: string;
  density?: 'default' | 'compact' | 'mini';
  onChange: (tab: T) => void;
  tabs: Array<BuildTabFilterOption<T>>;
}

const defaultTabFilterClass = css`
  margin: -0.7rem 0 1.4rem;
  border: 1px solid rgba(65, 140, 235, 0.24);
  border-radius: ${borderRadius};
  padding: 0.35rem;
  background: #fff;

  > .nav-section > nav {
    border-bottom: none !important;
    border-radius: 10px;
    transition:
      background-color 0.15s ease,
      color 0.15s ease,
      transform 0.15s ease;
  }

  > .nav-section > nav > a {
    display: inline-flex;
    align-items: center;
    gap: 0.45rem;
  }

  > .nav-section > nav.active {
    background: rgba(65, 140, 235, 0.14);
    color: #1d4ed8 !important;
  }

  > .nav-section > nav:not(.active):hover {
    background: rgba(65, 140, 235, 0.08);
    transform: translateY(-1px);
  }
`;

const compactTabFilterClass = css`
  margin: 0;
  border: 0;
  border-bottom: 1px solid rgba(65, 140, 235, 0.16);
  border-radius: 0;
  padding: 0.35rem;
  background: #fff;

  > .nav-section {
    gap: 0.35rem;
  }

  > .nav-section > nav {
    min-width: max-content;
    border-bottom: none !important;
    border-radius: 9px;
    padding: 0.52rem 0.55rem;
    transition:
      background-color 0.15s ease,
      color 0.15s ease;
  }

  > .nav-section > nav > a {
    display: inline-flex;
    align-items: center;
    gap: 0.35rem;
  }

  > .nav-section > nav.active {
    background: rgba(65, 140, 235, 0.14);
    color: #1d4ed8 !important;
  }

  > .nav-section > nav:not(.active):hover {
    background: rgba(65, 140, 235, 0.08);
  }
`;

const miniTabFilterClass = css`
  margin: 0;
  border: 0;
  border-bottom: 1px solid rgba(15, 23, 42, 0.08);
  border-radius: 0;
  padding: 0.25rem 0.35rem;
  background: #f8fbff;

  > .nav-section {
    gap: 0.3rem;
  }

  > .nav-section > nav {
    min-width: max-content;
    border-bottom: none !important;
    border-radius: 999px;
    padding: 0.42rem 0.55rem;
    transition:
      background-color 0.15s ease,
      color 0.15s ease;
  }

  > .nav-section > nav > a {
    display: inline-flex;
    align-items: center;
    gap: 0.3rem;
  }

  > .nav-section > nav.active {
    background: rgba(65, 140, 235, 0.14);
    color: #1d4ed8 !important;
    box-shadow:
      inset 0 0 0 1px rgba(65, 140, 235, 0.24),
      0 1px 5px rgba(15, 23, 42, 0.08);
  }

  > .nav-section > nav:not(.active):hover {
    background: rgba(65, 140, 235, 0.08);
  }
`;

export default function BuildTabFilter<T extends string = string>({
  activeTab,
  color,
  density = 'default',
  onChange,
  tabs
}: BuildTabFilterProps<T>) {
  const isCompact = density === 'compact';
  const isMini = density === 'mini';
  return (
    <FilterBar
      className={
        isMini
          ? miniTabFilterClass
          : isCompact
            ? compactTabFilterClass
            : defaultTabFilterClass
      }
      color={color}
      style={{
        margin: 0,
        height: isMini ? '2.35rem' : isCompact ? '2.9rem' : '3.4rem',
        fontSize: isMini ? '0.75rem' : isCompact ? '0.82rem' : '1rem'
      }}
    >
      {tabs.map((tab) => (
        <nav
          key={tab.value}
          className={activeTab === tab.value ? 'active' : ''}
          onClick={() => onChange(tab.value)}
        >
          <a>
            {tab.icon ? <Icon icon={tab.icon} /> : null}
            {tab.label}
          </a>
        </nav>
      ))}
    </FilterBar>
  );
}
