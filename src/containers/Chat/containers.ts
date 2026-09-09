import { css } from '@emotion/css';
import { mobileMaxWidth } from '~/constants/css';

// Shared by the live chat and the isolated design preview. Keep these surfaces
// independent of message state, scrolling, and each panel's width allocation.
export const chatWorkspaceClass = css`
  --chat-panel-bg: #fff;
  --chat-side-bg: #f8fafc;
  --chat-panel-border: #e2e8f0;
  --chat-panel-radius: 14px;
  --chat-muted-text: #64748b;
  --chat-secondary-text: #526176;
  --chat-focus-ring: color-mix(in srgb, var(--theme-bg, #418ceb) 60%, #0f172a);
  width: 100%;
  height: 100%;
  min-height: 0;
  display: flex;
  gap: 0.8rem;
  padding: 0.8rem;
  position: relative;
  font-size: 1.6rem;
  background: #f1f4f8;

  @media (max-height: 560px) {
    padding-block: 0.4rem;
  }
  @media (max-width: ${mobileMaxWidth}) {
    --chat-panel-radius: 0px;
    width: 170vw;
    height: calc(100% - var(--mobile-nav-total-height));
    gap: 0;
    padding: 0;
    touch-action: pan-x pan-y;
  }
`;

export const chatPanelClass = css`
  background: var(--chat-panel-bg, #fff);
  border: 1px solid var(--chat-panel-border, #e2e8f0);
  border-radius: var(--chat-panel-radius, 14px);
  min-height: 0;

  &[data-chat-panel='navigation'],
  &[data-chat-panel='details'] {
    background: var(--chat-side-bg, #f8fafc);
  }
  &[data-chat-panel='conversation'] {
    box-shadow: 0 2px 10px rgba(30, 41, 59, 0.04);
  }
  @media (max-width: ${mobileMaxWidth}) {
    border-radius: 0;
    border-width: 0 0 0 1px;
    &[data-chat-panel='navigation'] {
      border-left: 0;
    }
    &[data-chat-panel='conversation'] {
      box-shadow: none;
    }
  }
`;

export const chatHeaderClass = css`
  background: var(--chat-panel-bg, #fff);
  border-bottom: 1px solid var(--chat-panel-border, #e2e8f0);
  border-radius: var(--chat-panel-radius, 14px)
    var(--chat-panel-radius, 14px) 0 0;
`;

export const chatComposerClass = css`
  padding: 1rem;
  background: var(--chat-side-bg, #f8fafc);
  border-top: 1px solid var(--chat-panel-border, #e2e8f0);
  border-radius: 0 0 var(--chat-panel-radius, 14px)
    var(--chat-panel-radius, 14px);
`;

export const chatComposerInputClass = css`
  && {
    border-color: var(--chat-panel-border, #e2e8f0);
    &:focus {
      border-color: var(--chat-focus-ring, #475569);
      box-shadow: 0 0 0 2px var(--chat-title-bg);
    }
    &::placeholder,
    &:focus::placeholder {
      color: var(--chat-muted-text, #64748b);
    }
  }
`;

export const chatChannelRowClass = css`
  display: block;
  color: inherit;
  text-decoration: none;
  &:hover, &:focus-visible {
    color: inherit;
    text-decoration: none;
  }
  position: relative;
  width: 100%;
  height: 6.5rem;
  padding: 1rem;
  border: 0;
  cursor: pointer;
  touch-action: manipulation;
  transition: background-color 120ms ease;

  &[aria-current='page'] {
    background: #e8eaed;
  }
  &:focus-visible {
    outline: 2px solid var(--chat-focus-ring, #475569);
    outline-offset: -2px;
  }
  @media (hover: hover) and (pointer: fine) {
    &:hover {
      background: #f0f1f3;
    }
    &[aria-current='page']:hover {
      background: #e8eaed;
    }
  }
  @media (prefers-reduced-motion: reduce) {
    transition: none;
  }
`;

export const chatSubnavRowClass = css`
  color: #475569;
  background: transparent;
  border: 0;
  cursor: pointer;
  width: 100%;
  min-height: 36px;
  padding: 0.7rem 1rem;
  text-align: left;
  font-size: max(14px, 1.4rem);
  font-family: inherit;
  line-height: 1.45;
  border-radius: 8px;
  touch-action: manipulation;
  @media (max-width: ${mobileMaxWidth}) {
    min-height: 44px;
  }
  &:focus-visible {
    outline: 2px solid var(--chat-focus-ring, #475569);
    outline-offset: -2px;
  }
  @media (hover: hover) and (pointer: fine) {
    &:hover {
      background: var(--chat-hover-bg, #edf2f8);
    }
  }
  &.active {
    color: #1e293b;
    font-weight: 600;
    background: var(--chat-title-bg, #edf4ff);
  }
`;
