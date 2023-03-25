import { useMemo } from 'react';
import PropTypes from 'prop-types';
import ErrorBoundary from '~/components/ErrorBoundary';
import Icon from '~/components/Icon';
import Subchannel from './Subchannel';
import { Link } from 'react-router-dom';
import { css } from '@emotion/css';
import { Color, mobileMaxWidth } from '~/constants/css';
import { useChatContext, useKeyContext } from '~/contexts';

SubChannels.propTypes = {
  currentChannel: PropTypes.object,
  currentPathId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  displayedThemeColor: PropTypes.string,
  selectedChannelId: PropTypes.number,
  subchannelIds: PropTypes.arrayOf(PropTypes.number),
  subchannelObj: PropTypes.object,
  subchannelPath: PropTypes.string
};

export default function SubChannels({
  currentChannel,
  currentPathId,
  displayedThemeColor,
  selectedChannelId,
  subchannelIds,
  subchannelObj,
  subchannelPath
}) {
  const {
    chatUnread: { color: chatUnreadColor }
  } = useKeyContext((v) => v.theme);
  const currentChannelNumUnreads = useMemo(() => {
    return currentChannel?.numUnreads || 0;
  }, [currentChannel?.numUnreads]);
  const onUpdateLastSubchannelPath = useChatContext(
    (v) => v.actions.onUpdateLastSubchannelPath
  );
  const subchannels = useMemo(() => {
    const result = [];
    for (let subchannelId of subchannelIds) {
      const subchannel = subchannelObj[subchannelId];
      if (subchannel) {
        result.push(subchannel);
      }
    }
    return result;
  }, [subchannelIds, subchannelObj]);
  const badgeShown = useMemo(() => {
    return currentChannelNumUnreads > 0 && !!subchannelPath;
  }, [currentChannelNumUnreads, subchannelPath]);

  return (
    <ErrorBoundary componentPath="Chat/LeftMenu/Subchannels">
      <div
        className={css`
          a {
            &:hover {
              text-decoration: none;
            }
          }
          nav {
            color: ${Color.darkerGray()};
            cursor: pointer;
            width: 100%;
            padding: 0.7rem 2.5rem;
            text-align: left;
            font-size: 1.4rem;
            font-family: Helvetica;
            &:hover {
              background: ${Color.checkboxAreaGray()};
            }
            &.active {
              color: ${Color.vantaBlack()};
              background: ${Color.highlightGray()};
            }
            @media (max-width: ${mobileMaxWidth}) {
              padding: 0.7rem 1rem;
              font-size: 1.2rem;
            }
          }
        `}
        style={{
          border: `1px solid ${Color[displayedThemeColor](0.5)}`,
          padding: '0.5rem 0',
          marginTop: '2rem',
          marginLeft: '1rem',
          marginRight: '1rem',
          marginBottom: '-1rem',
          display: 'flex',
          flexDirection: 'column'
        }}
      >
        <Link
          onClick={() =>
            onUpdateLastSubchannelPath({
              channelId: selectedChannelId,
              path: '',
              currentSubchannelPath: subchannelPath
            })
          }
          to={`/chat/${currentPathId}`}
        >
          <nav
            style={{ display: 'flex', alignItems: 'center' }}
            className={!subchannelPath ? 'active' : ''}
          >
            <Icon icon="home" />
            <div
              style={{
                marginLeft: '1rem',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexGrow: 1
              }}
            >
              <div>Main (Wordle)</div>
              {badgeShown && (
                <div
                  style={{
                    background: Color[chatUnreadColor]?.(),
                    display: 'flex',
                    color: '#fff',
                    fontWeight: 'bold',
                    fontSize: '1.5rem',
                    minWidth: '1.5rem',
                    height: '1.5rem',
                    borderRadius: '50%',
                    lineHeight: 1,
                    justifyContent: 'center',
                    alignItems: 'center'
                  }}
                />
              )}
            </div>
          </nav>
        </Link>
        {subchannels.map((subchannel) => {
          return (
            <Subchannel
              key={subchannel.id}
              chatUnreadColor={chatUnreadColor}
              currentPathId={currentPathId}
              selectedChannelId={selectedChannelId}
              subchannel={subchannel}
              subchannelPath={subchannelPath}
              onUpdateLastSubchannelPath={onUpdateLastSubchannelPath}
            />
          );
        })}
      </div>
    </ErrorBoundary>
  );
}
