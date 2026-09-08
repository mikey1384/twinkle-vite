import React from 'react';
import { css, cx } from '@emotion/css';
import { mobileMaxWidth } from '~/constants/css';
import { SPLIT_NAVIGATION_MEDIA_QUERY } from '../constants/layout';
import { chatPanelClass } from '../containers';

export default function Layout({
  controls,
  filters,
  channelNavigation,
  channels
}: {
  controls: React.ReactNode;
  filters: React.ReactNode;
  channelNavigation?: React.ReactNode;
  channels: React.ReactNode;
}) {
  return (
    <div
      data-chat-navigation
      data-chat-panel="navigation"
      data-has-channel-navigation={!!channelNavigation}
      className={cx(chatPanelClass, css`
        display: flex;
        flex-direction: column;
        flex: 0 0 auto;
        height: 100%;
        min-height: 0;
        width: 16vw;
        position: relative;

        @media (min-width: 768px) and (max-width: 1023px) {
          width: 22vw;
        }

        @media (max-width: ${mobileMaxWidth}) {
          width: 40vw;
          flex-shrink: 1;
          touch-action: pan-y;
        }

        @media ${SPLIT_NAVIGATION_MEDIA_QUERY} {
          &[data-has-channel-navigation='true'] {
            display: grid;
            width: 32vw;
            grid-template-columns: repeat(2, minmax(0, 1fr));
            grid-template-rows: minmax(0, auto) auto minmax(11rem, 1fr);
            grid-template-areas:
              'controls context'
              'filters context'
              'channels context';
          }
        }
      `)}
    >
      <div
        aria-label="Chat shortcuts"
        tabIndex={0}
        className={css`
          grid-area: controls;
          flex: 0 0 auto;
          min-width: 0;
          min-height: 0;
          position: relative;
          z-index: 5;
          @media (max-height: 560px) {
            flex-shrink: 1;
            overflow-y: auto;
            overflow-x: hidden;
            overscroll-behavior-y: contain;
            scrollbar-width: thin;
          }
        `}
      >
        {controls}
      </div>
      <div
        className={css`
          grid-area: filters;
          flex: 0 0 auto;
          min-width: 0;
          position: relative;
          z-index: 5;
        `}
      >
        {filters}
      </div>
      {channelNavigation ? (
        <section
          aria-label="Current chat navigation"
          className={css`
            grid-area: context;
            display: flex;
            flex-direction: column;
            flex: 0 1 auto;
            min-width: 0;
            min-height: 0;
            max-height: 42%;
            @media (max-height: 560px) {
              min-height: min(10rem, 25%);
            }

            @media ${SPLIT_NAVIGATION_MEDIA_QUERY} {
              height: 100%;
              max-height: none;
              background: var(--chat-panel-bg, #fff);
              border-left: 1px solid var(--chat-panel-border, #e2e8f0);
              border-radius: 0 var(--chat-panel-radius, 14px)
                var(--chat-panel-radius, 14px) 0;
              padding-bottom: 1rem;
            }
          `}
        >
          <div
            className={css`
              display: none;
              @media ${SPLIT_NAVIGATION_MEDIA_QUERY} {
                display: block;
                flex: 0 0 auto;
                padding: 1.2rem 1rem;
                color: var(--chat-muted-text, #64748b);
                font-size: 1.2rem;
                font-weight: 600;
                letter-spacing: 0.02em;
              }
            `}
          >
            In this chat
          </div>
          <div
            className={css`
              display: flex;
              flex-direction: column;
              flex: 1 1 auto;
              min-width: 0;
              min-height: 0;
            `}
          >
            {channelNavigation}
          </div>
        </section>
      ) : null}
      <div
        className={css`
          grid-area: channels;
          display: flex;
          flex-direction: column;
          flex: 1 1 0;
          min-width: 0;
          min-height: min(13rem, 30%);

          @media ${SPLIT_NAVIGATION_MEDIA_QUERY} {
            min-height: 0;
          }
        `}
      >
        {channels}
      </div>
    </div>
  );
}
