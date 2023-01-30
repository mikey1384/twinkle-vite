import PropTypes from 'prop-types';
import { borderRadius, Color } from '~/constants/css';

MyWant.propTypes = {
  style: PropTypes.object
};

export default function MyWant({ style }) {
  return (
    <div
      style={{
        width: '100%',
        ...style
      }}
    >
      <p>I want...</p>
      <div
        style={{
          padding: '1rem',
          border: `1px solid ${Color.borderGray()}`,
          display: 'flex',
          justifyContent: 'center',
          borderRadius
        }}
      >
        What you want
      </div>
    </div>
  );
}
