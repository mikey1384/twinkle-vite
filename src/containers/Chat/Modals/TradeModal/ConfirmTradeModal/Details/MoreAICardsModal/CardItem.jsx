import PropTypes from 'prop-types';
import CardThumb from '../../../CardThumb';
import { borderRadius, mobileMaxWidth } from '~/constants/css';
import { css } from '@emotion/css';

CardItem.propTypes = {
  card: PropTypes.object.isRequired
};

export default function CardItem({ card }) {
  return (
    <div
      style={{
        position: 'relative',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'column',
        padding: '1rem',
        borderRadius
      }}
      className={css`
        margin: 0.3%;
        width: 16%;
        @media (max-width: ${mobileMaxWidth}) {
          margin: 1%;
          width: 30%;
        }
      `}
    >
      <CardThumb card={card} />
    </div>
  );
}
