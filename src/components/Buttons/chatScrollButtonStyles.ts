import { css } from '@emotion/css';
import type { CSSProperties } from 'react';
import { Color } from '~/constants/css';
import { themeRegistry, type ThemeName } from '~/theme';

export function chatScrollButtonStyle(
  theme: string,
  opacity = 1
): CSSProperties {
  const themeName = Object.prototype.hasOwnProperty.call(themeRegistry, theme)
    ? (theme as ThemeName)
    : 'logoBlue';
  const color = Color[themeName];
  const text = themeName === 'gold' ? '#000' : '#fff';
  // Preserve the original theme hue: the arrow is translucent at rest,
  // while the new-message pill and hover state use the solid color.
  return {
    '--chat-scroll-bg': color(opacity),
    '--chat-scroll-text': text,
    '--chat-scroll-hover-bg': color(),
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
  > svg {
    flex-shrink: 0;
  }
  -webkit-tap-highlight-color: transparent;
  touch-action: manipulation;
`;
