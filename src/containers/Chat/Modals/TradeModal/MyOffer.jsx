import PropTypes from 'prop-types';
import { borderRadius, Color } from '~/constants/css';

MyOffer.propTypes = {
  style: PropTypes.object
};

export default function MyOffer({ style }) {
  return (
    <div
      style={{
        width: '100%',
        ...style
      }}
    >
      <p style={{ fontWeight: 'bold' }}>I offer...</p>
      <div
        style={{
          marginTop: '0.5rem',
          padding: '1rem',
          border: `1px solid ${Color.borderGray()}`,
          display: 'flex',
          justifyContent: 'center',
          borderRadius
        }}
      >
        What you offer
      </div>
    </div>
  );
}
