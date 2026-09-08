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
  padding: 12px;
  margin-bottom: 8px;
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  background: #fff;
  &[data-current='true'] {
    background: color-mix(in srgb, var(--chat-topic-accent, #418ceb) 7%, #fff);
    border-left: 3px solid var(--chat-topic-accent, #418ceb);
  }
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
  margin: 20px 0 10px;
  padding-left: 10px;
  border-left: 3px solid var(--chat-topic-accent, #418ceb);
  color: #334155;
  font-size: max(17px, 1.7rem);
  font-weight: 600;
  line-height: 1.5;
`;

export const chatTopicFiltersClass = css`
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  padding: 4px;
  margin: 20px 0 12px;
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  background: #f8fafc;
  button {
    flex: 1 1 auto;
    min-height: 44px;
    padding: 8px 12px;
    border: 1px solid transparent;
    border-radius: 7px;
    background: transparent;
    color: #526176;
    font: inherit;
    font-size: 14px;
    font-weight: 600;
    cursor: pointer;
    &[aria-pressed='true'] {
      border-color: #cbd5e1;
      background: white;
      color: #273449;
      box-shadow: inset 0 -3px var(--chat-topic-accent, #418ceb);
    }
    &:hover { background: white; }
    &:focus-visible { outline: 2px solid #334155; outline-offset: 2px; }
  }
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
