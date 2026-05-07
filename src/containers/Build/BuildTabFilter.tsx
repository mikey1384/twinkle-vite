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
  --build-tab-accent: var(
    --role-filterActive-color,
    var(--role-filter-color, #1d4ed8)
  );
  --build-tab-accent-soft: color-mix(
    in srgb,
    var(--build-tab-accent) 14%,
    transparent
  );
  --build-tab-accent-hover: color-mix(
    in srgb,
    var(--build-tab-accent) 8%,
    transparent
  );
  margin: -0.7rem 0 1.4rem;
  border: 1px solid var(--ui-border, rgba(65, 140, 235, 0.24));
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
    background: var(--build-tab-accent-soft);
    color: var(--build-tab-accent) !important;
  }

  > .nav-section > nav:not(.active):hover {
    background: var(--build-tab-accent-hover);
    transform: translateY(-1px);
  }
`;

const compactTabFilterClass = css`
  --build-tab-accent: var(
    --role-filterActive-color,
    var(--role-filter-color, #1d4ed8)
  );
  --build-tab-accent-soft: color-mix(
    in srgb,
    var(--build-tab-accent) 14%,
    transparent
  );
  --build-tab-accent-hover: color-mix(
    in srgb,
    var(--build-tab-accent) 8%,
    transparent
  );
  margin: 0;
  border: 0;
  border-bottom: 1px solid var(--ui-border, rgba(65, 140, 235, 0.16));
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
    background: var(--build-tab-accent-soft);
    color: var(--build-tab-accent) !important;
  }

  > .nav-section > nav:not(.active):hover {
    background: var(--build-tab-accent-hover);
  }
`;

const miniTabFilterClass = css`
  --build-tab-accent: var(
    --role-filterActive-color,
    var(--role-filter-color, #1d4ed8)
  );
  --build-tab-accent-soft: color-mix(
    in srgb,
    var(--build-tab-accent) 14%,
    transparent
  );
  --build-tab-accent-hover: color-mix(
    in srgb,
    var(--build-tab-accent) 8%,
    transparent
  );
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
    background: var(--build-tab-accent-soft);
    color: var(--build-tab-accent) !important;
    box-shadow:
      inset 0 0 0 1px
        color-mix(in srgb, var(--build-tab-accent) 24%, transparent),
      0 1px 5px rgba(15, 23, 42, 0.08);
  }

  > .nav-section > nav:not(.active):hover {
    background: var(--build-tab-accent-hover);
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
        height: isMini ? '2.75rem' : isCompact ? '3.15rem' : '3.4rem',
        fontSize: '1.1rem'
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
