import { useMemo } from 'react';
import PropTypes from 'prop-types';
import ErrorBoundary from '~/components/ErrorBoundary';
import { SELECTED_LANGUAGE } from '~/constants/defaultValues';
import { Color } from '~/constants/css';
import { css } from '@emotion/css';
import { createPortal } from 'react-dom';

Tooltip.propTypes = {
  myId: PropTypes.number,
  onMouseEnter: PropTypes.func.isRequired,
  onMouseLeave: PropTypes.func.isRequired,
  parentContext: PropTypes.object.isRequired,
  displayedReactedUsers: PropTypes.array,
  reactedUserIds: PropTypes.array,
  onShowAllReactedUsers: PropTypes.func
};

export default function Tooltip({
  myId,
  parentContext,
  onMouseEnter,
  onMouseLeave,
  displayedReactedUsers,
  reactedUserIds,
  onShowAllReactedUsers
}) {
  const { x, y, width, height } = parentContext;
  const displaysToTheRight = useMemo(() => {
    return window.innerWidth / 2 - x > 0;
  }, [x]);
  const isReversed = useMemo(() => {
    return window.innerHeight / 2 - y < 0;
  }, [y]);
  const otherReactedUserNumber = useMemo(() => {
    return reactedUserIds.length - displayedReactedUsers.length;
  }, [displayedReactedUsers, reactedUserIds]);

  const peopleWhoReactedText = useMemo(() => {
    if (displayedReactedUsers.length === 2 && otherReactedUserNumber === 0) {
      if (SELECTED_LANGUAGE === 'kr') {
        return `${displayedReactedUsers[0].username}${
          displayedReactedUsers[0].id === myId ? '' : '님'
        }과 ${displayedReactedUsers[1].username}${
          displayedReactedUsers[1].id === myId ? '' : '님'
        }`;
      }
      return `${displayedReactedUsers[0].username} and ${displayedReactedUsers[1].username}`;
    }
    if (SELECTED_LANGUAGE === 'kr') {
      return (
        <>
          {displayedReactedUsers
            .map((user) => `${user.username}${user.id === myId ? '' : '님'}`)
            .join(', ')}
          {otherReactedUserNumber > 0 ? (
            <>
              {', '}
              <a
                style={{
                  fontWeight: 'bold',
                  cursor: 'pointer'
                }}
                onClick={onShowAllReactedUsers}
              >
                외 {otherReactedUserNumber}명
              </a>
            </>
          ) : null}
        </>
      );
    }
    return (
      <>
        {displayedReactedUsers.map((user) => user.username).join(', ')}
        {otherReactedUserNumber > 0 ? (
          <>
            {', '}
            <a
              style={{
                fontWeight: 'bold',
                cursor: 'pointer'
              }}
              onClick={onShowAllReactedUsers}
            >
              and {otherReactedUserNumber} other
              {otherReactedUserNumber === 1 ? '' : 's'}
            </a>
          </>
        ) : null}
      </>
    );
  }, [
    displayedReactedUsers,
    myId,
    onShowAllReactedUsers,
    otherReactedUserNumber
  ]);

  return createPortal(
    <ErrorBoundary
      componentPath="Message/Reactions/Tooltip"
      style={{
        zIndex: 100_000_000,
        top: 0,
        position: 'fixed'
      }}
    >
      <div
        onMouseEnter={onMouseEnter}
        onMouseLeave={onMouseLeave}
        className={css`
          padding: 0.5rem;
          font-size: 1.2rem;
          min-width: ${displayedReactedUsers.length === 1 &&
          otherReactedUserNumber === 0
            ? '5rem'
            : '8rem'};
          text-align: center;
          position: absolute;
          left: ${`${
            displaysToTheRight ? `${x}px` : `CALC(${x}px + ${width}px)`
          }`};
          top: ${isReversed
            ? `CALC(${y}px - 0.5rem)`
            : `CALC(${y}px + ${height}px + 0.5rem)`};
          transform: translate(
            ${displaysToTheRight ? 0 : '-100%'},
            ${isReversed ? '-100%' : 0}
          );
          border: none;
          background: #fff;
          box-shadow: 1px 1px 2px ${Color.black(0.6)};
        `}
      >
        {peopleWhoReactedText}
      </div>
    </ErrorBoundary>,
    document.getElementById('outer-layer')
  );
}
