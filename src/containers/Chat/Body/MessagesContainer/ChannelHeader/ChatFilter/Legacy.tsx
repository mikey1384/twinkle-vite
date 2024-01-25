import React from 'react';
import Button from '~/components/Button';
import Icon from '~/components/Icon';
import ErrorBoundary from '~/components/ErrorBoundary';
import FilterBar from '~/components/FilterBar';
import { Color, mobileMaxWidth } from '~/constants/css';
import { css } from '@emotion/css';

export default function ChatFilter({
  canChangeTopic,
  topicObj
}: {
  canChangeTopic: boolean;
  topicObj: {
    content: string;
    timeStamp: number;
    reloadTimeStamp: number;
    reloader: any;
    uploader: any;
  };
}) {
  const { content } = topicObj;

  return (
    <ErrorBoundary componentPath="Chat/Body/MessageContainer/ChannelHeader/ChatFilter">
      <div
        className={css`
          width: 100%;
          display: flex;
          justify-content: flex-end;
        `}
      >
        <FilterBar
          bordered
          className={css`
            height: 4.5rem !important;
            font-size: 1.6rem !important;
            margin: 0 !important;
            background-color: ${Color.white(0.7)} !important;
            &:hover {
              background: ${Color.white()} !important;
            }
            @media (max-width: ${mobileMaxWidth}) {
              font-size: 1.3rem !important;
              &:hover {
                background: ${Color.white(0.7)} !important;
              }
            }
          `}
        >
          <nav className="active" onClick={() => console.log('clicked')}>
            All
          </nav>
          <nav className="" onClick={() => console.log('topic')}>
            <div
              style={{
                width: '100%',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                height: '100%',
                position: 'relative'
              }}
            >
              <div>
                {canChangeTopic
                  ? content || 'Topic'
                  : 'Topic feature not purchased'}
              </div>
              <Button
                style={{
                  position: 'absolute',
                  right: '1rem',
                  width: 'auto',
                  height: 'CALC(100% - 1rem)'
                }}
                disabled={!canChangeTopic}
                color="darkerGray"
                skeuomorphic
                onClick={() => console.log('clicked')}
              >
                <Icon icon="chevron-down" />
              </Button>
            </div>
          </nav>
        </FilterBar>
      </div>
    </ErrorBoundary>
  );
}
