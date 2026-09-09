import React from 'react';
import { css, cx } from '@emotion/css';
import { mobileMaxWidth } from '~/constants/css';
import { SPLIT_NAVIGATION_MEDIA_QUERY } from '../constants/layout';
import { chatPanelClass } from '../containers';
import ResizeHandle from './ResizeHandle';
import Shortcuts from './Shortcuts';
import useNavigationLayout from './hooks/useNavigationLayout';
import { RESIZE_HANDLE_WIDTH } from './helpers/navigationSizing';

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
  const layout = useNavigationLayout(!!channelNavigation);
  return (
    <div
      ref={layout.navigationRef}
      style={layout.style}
      data-chat-navigation
      data-chat-panel="navigation"
      data-has-channel-navigation={!!channelNavigation}
      className={cx(chatPanelClass, css`
        display: flex;
        flex-direction: column;
        flex: 0 0 auto;
        height: 100%;
        min-height: 0;
        width: calc(var(--chat-channel-width, 200px) + 2px);
        position: relative;

        @media (max-width: ${mobileMaxWidth}) {
          width: 40vw;
          flex-shrink: 1;
          touch-action: pan-y;
        }

        @media ${SPLIT_NAVIGATION_MEDIA_QUERY} {
          &[data-has-channel-navigation='true'] {
            display: grid;
            width: calc(var(--chat-channel-width, 200px) + var(--chat-context-width, 184px) + ${RESIZE_HANDLE_WIDTH + 2}px);
            grid-template-columns: var(--chat-channel-width, 200px) ${RESIZE_HANDLE_WIDTH}px var(--chat-context-width, 184px);
            grid-template-rows: minmax(0, auto) auto minmax(11rem, 1fr);
            grid-template-areas:
              'controls . context'
              'filters . context'
              'channels . context';
          }
        }
      `)}
    >
      <div
        aria-label="Chat shortcuts"
        tabIndex={0}
        className={css`
          grid-area: controls;
          container: chat-channels / inline-size;
          flex: 0 0 auto;
          min-width: 0;
          min-height: 0;
          position: relative;
          z-index: 7;
        `}
      >
        <Shortcuts>{controls}</Shortcuts>
      </div>
      <div
        className={css`
          grid-area: filters;
          container: chat-channels / inline-size;
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
            container: chat-context / inline-size;
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
              @container chat-context (max-width: 180px) {
                padding: 1rem 0.7rem 0.4rem;
                font-size: 1.1rem;
              }
            `}
          >
            In this chat
          </div>
          <div
            aria-label="Subchannels and topics"
            tabIndex={0}
            className={css`
              display: flex;
              flex-direction: column;
              flex: 1 1 auto;
              min-width: 0;
              min-height: 0;
              @media (max-width: 1023px) {
                display: block;
                overflow-y: auto;
                overscroll-behavior-y: contain;
                scrollbar-width: thin;
                padding-bottom: 1rem;
              }
            `}
          >
            {channelNavigation}
          </div>
        </section>
      ) : null}
      <div
        className={css`
          grid-area: channels;
          container: chat-channels / inline-size;
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
      {layout.resizable ? (
        <>
          <ResizeHandle
            panel="channels"
            width={layout.widths.channels}
            maximum={layout.getMaximum('channels')}
            active={layout.resizingPanel === 'channels'}
            betweenColumns={layout.split}
            onPointerDown={layout.onPointerDown}
            onKeyDown={layout.onKeyDown}
            onReset={layout.onReset}
          />
          {layout.split ? (
            <ResizeHandle
              panel="context"
              width={layout.widths.context}
              maximum={layout.getMaximum('context')}
              active={layout.resizingPanel === 'context'}
              onPointerDown={layout.onPointerDown}
              onKeyDown={layout.onKeyDown}
              onReset={layout.onReset}
            />
          ) : null}
        </>
      ) : null}
    </div>
  );
}
