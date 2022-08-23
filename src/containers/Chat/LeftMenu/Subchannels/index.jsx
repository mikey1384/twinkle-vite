import PropTypes from 'prop-types';
import ErrorBoundary from '~/components/ErrorBoundary';
import Icon from '~/components/Icon';
import { css } from '@emotion/css';
import { Color, mobileMaxWidth } from '~/constants/css';

SubChannels.propTypes = {
  displayedThemeColor: PropTypes.string,
  subChannelPath: PropTypes.string
};

export default function SubChannels({ displayedThemeColor, subChannelPath }) {
  return (
    <ErrorBoundary componentPath="Chat/LeftMenu/Subchannels">
      <div
        className={css`
          > nav {
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
        <nav className={subChannelPath === 'home' ? 'active' : ''}>
          <Icon icon="home" />
          <span style={{ marginLeft: '1rem' }}>Home</span>
        </nav>
        <nav className={subChannelPath === 'chat' ? 'active' : ''}>
          <Icon icon="comments" />
          <span style={{ marginLeft: '1rem' }}>General Chat</span>
        </nav>
        <nav className={subChannelPath === 'announcement' ? 'active' : ''}>
          <Icon icon="bullhorn" />
          <span style={{ marginLeft: '1rem' }}>Announcements</span>
        </nav>
      </div>
    </ErrorBoundary>
  );
}
