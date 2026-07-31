import React from 'react';
import { css } from '@emotion/css';
import Icon from '~/components/Icon';
import { mobileMaxWidth } from '~/constants/css';

const displayFontFamily =
  "'Trebuchet MS', 'Comic Sans MS', 'Segoe UI', 'Arial Rounded MT Bold', -apple-system, BlinkMacSystemFont, Helvetica, Arial, sans-serif";

const heroClass = css`
  margin-bottom: 2rem;
  padding: 2rem 2.2rem;
  border: 1px solid var(--ui-border);
  border-radius: 2.2rem;
  background: #fff;
  box-shadow: 0 4px 14px rgba(0, 0, 0, 0.05);
  overflow: hidden;

  @media (max-width: ${mobileMaxWidth}) {
    padding: 1.5rem;
  }
`;

const headerClass = css`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1.4rem;

  @media (max-width: ${mobileMaxWidth}) {
    align-items: stretch;
    flex-direction: column;
    gap: 1rem;
  }
`;

const copyClass = css`
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 0.7rem;
`;

const badgeClass = css`
  width: fit-content;
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.4rem 0.85rem;
  border: 1px solid rgba(65, 140, 235, 0.28);
  border-radius: 999px;
  background: rgba(65, 140, 235, 0.12);
  color: #1d4ed8;
  font-family: ${displayFontFamily};
  font-size: 1.1rem;
  font-weight: 900;
  text-transform: uppercase;
  letter-spacing: 0.04em;
`;

const titleClass = css`
  margin: 0;
  color: var(--chat-text);
  font-family: ${displayFontFamily};
  font-size: 2.8rem;
  font-weight: 900;
  line-height: 1.1;

  @media (max-width: ${mobileMaxWidth}) {
    font-size: 2.3rem;
  }
`;

const bodyClass = css`
  max-width: 44rem;
  margin: 0;
  color: var(--chat-text);
  opacity: 0.82;
  font-size: 1.25rem;
  line-height: 1.5;
`;

const actionClass = css`
  flex: 0 0 auto;

  @media (max-width: ${mobileMaxWidth}) {
    button {
      width: 100%;
    }
  }
`;

export default function StudioHero({
  action,
  badgeIcon,
  badgeLabel,
  children,
  description,
  title
}: {
  action: React.ReactNode;
  badgeIcon: string;
  badgeLabel: string;
  children?: React.ReactNode;
  description: React.ReactNode;
  title: string;
}) {
  return (
    <section className={heroClass}>
      <div className={headerClass}>
        <div className={copyClass}>
          <span className={badgeClass}>
            <Icon icon={badgeIcon} />
            {badgeLabel}
          </span>
          <h1 className={titleClass}>{title}</h1>
          <p className={bodyClass}>{description}</p>
        </div>
        <div className={actionClass}>{action}</div>
      </div>
      {children}
    </section>
  );
}
