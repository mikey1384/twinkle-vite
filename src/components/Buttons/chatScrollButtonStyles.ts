import { css } from '@emotion/css';
import type { CSSProperties } from 'react';
import { themeRegistry, type ThemeName } from '~/theme';

function backgroundForWhiteText(background: string) {
  let channels = background.match(/[\d.]+/g)?.slice(0, 3).map(Number);
  if (!channels || channels.length !== 3) return '#273449';
  const maximumLuminance = 1.05 / 4.5 - 0.05;
  while (luminance(channels) > maximumLuminance) {
    channels = channels.map(value => Math.floor(value * 0.98));
  }
  return `rgb(${channels.join(', ')})`;

  function luminance(values: number[]) {
    const linear = values.map(value => {
      const channel = value / 255;
      return channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4;
    });
    return 0.2126 * linear[0] + 0.7152 * linear[1] + 0.0722 * linear[2];
  }
}

export function chatScrollButtonStyle(theme: string): CSSProperties {
  const { general } = themeRegistry[theme as ThemeName] || themeRegistry.logoBlue;
  const isGold = theme === 'gold';
  // Keep white labels stable between rest and hover. Deepen the theme shade
  // when needed instead of switching its foreground to black.
  const text = isGold ? '#000' : '#fff';
  return {
    '--chat-scroll-bg': isGold ? general.bg : backgroundForWhiteText(general.bg),
    '--chat-scroll-text': text,
    '--chat-scroll-hover-bg': isGold ? general.hoverBg : backgroundForWhiteText(general.hoverBg),
    '--chat-scroll-hover-text': text
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
