import PropTypes from 'prop-types';
import ErrorBoundary from '~/components/ErrorBoundary';
import Item from './Item';
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
          padding: '1rem',
          marginTop: '2rem',
          marginLeft: '1rem',
          marginRight: '1rem',
          marginBottom: '-1rem',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center'
        }}
      >
        <Item />
        <Item />
        <Item />
      </div>
    </ErrorBoundary>
  );
}
