import { css } from '@emotion/css';
import type { CSSProperties } from 'react';
import { themeRegistry, type ThemeName } from '~/theme';

function readableText(background: string) {
  const channels = background.match(/[\d.]+/g)?.slice(0, 3).map(Number);
  if (!channels || channels.length !== 3) return '#000';
  const linear = channels.map(value => {
    const channel = value / 255;
    return channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4;
  });
  const luminance = 0.2126 * linear[0] + 0.7152 * linear[1] + 0.0722 * linear[2];
  return 1.05 / (luminance + 0.05) >= 4.5 ? '#fff' : '#000';
}

export function chatScrollButtonStyle(theme: string): CSSProperties {
  const { general } = themeRegistry[theme as ThemeName] || themeRegistry.logoBlue;
  return {
    '--chat-scroll-bg': general.bg,
    '--chat-scroll-text': readableText(general.bg),
    '--chat-scroll-hover-bg': general.hoverBg,
    '--chat-scroll-hover-text': readableText(general.hoverBg)
  } as CSSProperties;
}

// Both floating chat controls share one target size, palette and focus treatment.
export const chatScrollButtonClass = css`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  min-width: 44px;
  min-height: 44px;
  max-width: calc(100% - 24px);
  border: 1px solid rgba(0, 0, 0, 0.12);
  background: var(--chat-scroll-bg);
  color: var(--chat-scroll-text);
  font-family: inherit;
  font-size: 14px;
  font-weight: 600;
  line-height: 1.4;
  cursor: pointer;
  &:focus-visible {
    outline: 2px solid #273449;
    outline-offset: 3px;
    box-shadow: 0 0 0 3px #fff;
  }
  @media (hover: hover) and (pointer: fine) {
    &:hover {
      background: var(--chat-scroll-hover-bg);
      color: var(--chat-scroll-hover-text);
    }
  }
  > svg { flex-shrink: 0; }
  -webkit-tap-highlight-color: transparent;
  touch-action: manipulation;
`;
