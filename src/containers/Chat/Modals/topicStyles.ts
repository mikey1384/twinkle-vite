import { css } from '@emotion/css';
import type { CSSProperties } from 'react';
import { resolveColorValue } from '~/theme/resolveColor';
import { themeRegistry, ThemeName } from '~/theme';

export function chatTopicButtonStyle(themeColor: string): CSSProperties {
  const { general } = themeRegistry[themeColor as ThemeName] || themeRegistry.logoBlue;
  function readableText(background: string) {
    const channels = background.match(/[\d.]+/g)?.slice(0, 3).map(Number);
    if (!channels || channels.length !== 3) return '#172033';
    const linear = channels.map(value => {
      const channel = value / 255;
      return channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4;
    });
    const luminance = 0.2126 * linear[0] + 0.7152 * linear[1] + 0.0722 * linear[2];
    return 1.05 / (luminance + 0.05) >= 4.5 ? '#fff' : '#000';
  }
  return {
    color: 'var(--chat-topic-button-text)',
    '--chat-topic-button-text': readableText(general.bg),
    '--chat-topic-button-hover-text': readableText(general.hoverBg)
  } as CSSProperties;
}

export function chatTopicThemeStyle(themeColor: string): CSSProperties {
  return { '--chat-topic-accent': resolveColorValue(themeColor) || '#418ceb' } as CSSProperties;
}

// Shared only by chat topic dialogs. Keep controls in normal flow so long
// titles and phone layouts never compete with absolutely positioned actions.
export const chatTopicRowClass = css`
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  align-items: center;
  gap: 12px;
  min-width: 0;
  width: 100%;
  padding: 14px 0;
  margin-bottom: 0;
  border: 0;
  border-bottom: 1px solid #e9edf2;
  background: transparent;
  @media (max-width: 600px) {
    grid-template-columns: minmax(0, 1fr);
    gap: 10px;
  }
`;

export const chatTopicTitleClass = css`
  min-width: 0;
  color: #273449;
  font-size: max(16px, 1.6rem);
  font-weight: 600;
  line-height: 1.5;
  overflow-wrap: anywhere;
`;

export const chatTopicMetadataClass = css`
  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
  gap: 4px 8px;
  margin-top: 4px;
  color: #526176;
  font-size: 14px;
  line-height: 1.5;
  small {
    font-size: 12px;
  }
`;

export const chatTopicActionsClass = css`
  display: flex;
  flex-wrap: wrap;
  justify-content: flex-end;
  align-items: center;
  gap: 6px;
  max-width: 280px;
  min-width: 0;
  > button {
    border: 0;
    border-radius: 6px;
    font-family: inherit;
    font-weight: 500;
    text-transform: none;
  }
  @media (max-width: 600px) {
    max-width: none;
  }
`;

export const chatTopicActionStyle = {
  minHeight: 44,
  minWidth: 44,
  fontSize: '14px',
  color: '#334155'
};

export const chatTopicSectionClass = css`
  margin: 24px 0 4px;
  color: #64748b;
  font-size: 14px;
  font-weight: 600;
  line-height: 1.5;
`;

export const chatTopicModalClass = css`
  > div:first-child > div {
    font-size: 18px;
  }
  button[aria-label='Close modal'] {
    width: 44px;
    height: 44px;
    font-size: 16px;
    color: #334155;
  }
`;
