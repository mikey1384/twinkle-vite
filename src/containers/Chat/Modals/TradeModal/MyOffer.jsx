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
        padding: '1rem',
        border: `1px solid ${Color.borderGray()}`,
        borderRadius,
        ...style
      }}
    >
      What you offer
    </div>
  );
}
