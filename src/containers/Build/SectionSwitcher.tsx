import React from 'react';
import { css, cx } from '@emotion/css';
import Icon from '~/components/Icon';
import ScopedTheme from '~/theme/ScopedTheme';
import { mobileMaxWidth } from '~/constants/css';
import type { BuildStudioSection } from '~/contexts/Build/reducer';

const switcherClass = css`
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0.55rem;
  width: 100%;
  margin-bottom: 1.2rem;
  padding: 0.4rem;
  box-sizing: border-box;
  border: 1px solid var(--ui-border);
  border-radius: 1.4rem;
  background: #fff;
  box-shadow: 0 4px 14px rgba(0, 0, 0, 0.05);

  @media (max-width: ${mobileMaxWidth}) {
    gap: 0.35rem;
    margin-bottom: 1rem;
    padding: 0.3rem;
    border-radius: 1.1rem;
  }
`;

const sectionButtonClass = css`
  min-width: 0;
  min-height: 4.4rem;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.7rem;
  padding: 0.7rem 1rem;
  border: 1px solid transparent;
  border-radius: 1rem;
  background: transparent;
  color: var(--chat-text);
  opacity: 0.62;
  font-size: 1.2rem;
  font-weight: 900;
  cursor: pointer;
  transition:
    background-color 0.16s ease,
    border-color 0.16s ease,
    color 0.16s ease,
    opacity 0.16s ease,
    transform 0.16s ease;

  &:hover,
  &:focus-visible {
    opacity: 0.9;
    background: color-mix(
      in srgb,
      var(--role-filterActive-color, #418ceb) 8%,
      #fff
    );
    outline: none;
  }

  &:focus-visible {
    box-shadow: 0 0 0 3px
      color-mix(
        in srgb,
        var(--role-filterActive-color, #418ceb) 24%,
        transparent
      );
  }

  &.active {
    border-color: var(--role-filterActive-color, #418ceb);
    background: var(--role-filterActive-color, #418ceb);
    color: #fff;
    opacity: 1;
    box-shadow: 0 4px 10px
      color-mix(
        in srgb,
        var(--role-filterActive-color, #418ceb) 24%,
        transparent
      );
  }

  &.active:hover {
    transform: translateY(-1px);
  }

  @media (max-width: ${mobileMaxWidth}) {
    min-height: 4.1rem;
    gap: 0.45rem;
    padding: 0.6rem 0.45rem;
    border-radius: 0.85rem;
    font-size: 1.1rem;
  }
`;

const sections: Array<{
  icon: string;
  label: string;
  value: BuildStudioSection;
}> = [
  { icon: 'rocket-launch', label: 'App Builds', value: 'apps' },
  { icon: 'robot', label: 'AI Prompts', value: 'prompts' }
];

export default function SectionSwitcher({
  activeSection,
  color,
  onChange
}: {
  activeSection: BuildStudioSection;
  color?: string;
  onChange: (section: BuildStudioSection) => void;
}) {
  return (
    <ScopedTheme theme={color || 'logoBlue'} roles={['filterActive']}>
      <nav className={switcherClass} aria-label="Build Studio section">
        {sections.map((section) => (
          <button
            key={section.value}
            type="button"
            className={cx(
              sectionButtonClass,
              activeSection === section.value && 'active'
            )}
            aria-current={activeSection === section.value ? 'page' : undefined}
            onClick={() => onChange(section.value)}
          >
            <Icon icon={section.icon} />
            {section.label}
          </button>
        ))}
      </nav>
    </ScopedTheme>
  );
}
