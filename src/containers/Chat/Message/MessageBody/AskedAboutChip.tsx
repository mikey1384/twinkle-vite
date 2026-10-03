import React from 'react';
import { css } from '@emotion/css';
import { Link } from 'react-router-dom';
import Icon from '~/components/Icon';
import { Color } from '~/constants/css';
import { parseMessageSettings } from './messageSettings';

// "About: comment by sam": what the member pressed "Ask Zero/Ciel" on, shown
// above their message (the server verified it and stored it on the message).
export default function AskedAboutChip({ settings }: { settings: unknown }) {
  const asked = parseMessageSettings(settings).askedAbout;
  if (!asked || typeof asked.label !== 'string' || !asked.label) return null;
  const path =
    // an in-site path only (`//host` would leave the site)
    typeof asked.path === 'string' && asked.path.startsWith('/') && !asked.path.startsWith('//')
      ? asked.path
      : '';
  const body = (
    <>
      <Icon icon="paperclip" style={{ marginRight: '0.5rem' }} />
      About: {asked.label}
    </>
  );
  const chipClass = css`
    display: inline-flex;
    align-items: center;
    max-width: 100%;
    margin-bottom: 0.4rem;
    padding: 0.2rem 1rem;
    border-radius: 999px;
    background: ${Color.logoBlue(0.08)};
    color: ${Color.darkerGray()};
    font-size: 1.2rem;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  `;
  return path ? (
    <Link to={path} className={chipClass}>
      {body}
    </Link>
  ) : (
    <span className={chipClass}>{body}</span>
  );
}
