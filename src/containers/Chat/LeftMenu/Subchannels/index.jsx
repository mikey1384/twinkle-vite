import PropTypes from 'prop-types';
import ErrorBoundary from '~/components/ErrorBoundary';
import Item from './Item';
import Icon from '~/components/Icon';
import { Color } from '~/constants/css';

SubChannels.propTypes = {
  displayedThemeColor: PropTypes.string
};

export default function SubChannels({ displayedThemeColor }) {
  return (
    <ErrorBoundary componentPath="Chat/LeftMenu/Subchannels">
      <div
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
        <Item>
          <Icon icon="home" />
          <span style={{ marginLeft: '1rem' }}>Home</span>
        </Item>
        <Item>
          <Icon icon="comments" />
          <span style={{ marginLeft: '1rem' }}>Free Chat</span>
        </Item>
        <Item>
          <Icon icon="bullhorn" />
          <span style={{ marginLeft: '1rem' }}>Announcements</span>
        </Item>
      </div>
    </ErrorBoundary>
  );
}
