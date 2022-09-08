import { useContext, useMemo } from 'react';
import PropTypes from 'prop-types';
import LocalContext from '../Context';
import ErrorBoundary from '~/components/ErrorBoundary';
import Icon from '~/components/Icon';
import { Link } from 'react-router-dom';
import { css } from '@emotion/css';
import { Color, mobileMaxWidth } from '~/constants/css';
import { useChatContext } from '~/contexts';

SubChannels.propTypes = {
  currentPathId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  displayedThemeColor: PropTypes.string,
  selectedChannelId: PropTypes.number,
  subchannelIds: PropTypes.arrayOf(PropTypes.number),
  subchannelObj: PropTypes.object
};

export default function SubChannels({
  currentPathId,
  displayedThemeColor,
  selectedChannelId,
  subchannelIds,
  subchannelObj
}) {
  const {
    state: { lastSubchannelPaths }
  } = useContext(LocalContext);
  const lastSubchannelPath = useMemo(
    () => lastSubchannelPaths[selectedChannelId],
    [lastSubchannelPaths, selectedChannelId]
  );
  const onUpdateLastSubchannelPath = useChatContext(
    (v) => v.actions.onUpdateLastSubchannelPath
  );
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
              path: ''
            })
          }
          to={`/chat/${currentPathId}`}
        >
          <nav className={!lastSubchannelPath ? 'active' : ''}>
            <Icon icon="home" />
            <span style={{ marginLeft: '1rem' }}>Main</span>
          </nav>
        </Link>
        {subchannelIds.map((subchannelId) => (
          <Link
            key={subchannelId}
            to={`/chat/${currentPathId}/${subchannelObj[subchannelId].path}`}
            onClick={() =>
              onUpdateLastSubchannelPath({
                channelId: selectedChannelId,
                path: subchannelObj[subchannelId].path
              })
            }
          >
            <nav
              className={
                lastSubchannelPath === subchannelObj[subchannelId].path
                  ? 'active'
                  : ''
              }
            >
              <Icon icon={subchannelObj[subchannelId].icon} />
              <span style={{ marginLeft: '1rem' }}>
                {subchannelObj[subchannelId].label}
              </span>
            </nav>
          </Link>
        ))}
      </div>
    </ErrorBoundary>
  );
}
