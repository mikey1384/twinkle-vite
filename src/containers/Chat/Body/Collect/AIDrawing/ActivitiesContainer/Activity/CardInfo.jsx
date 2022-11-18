import PropTypes from 'prop-types';
import { wordLevelHash } from '~/constants/defaultValues';
import { Color } from '~/constants/css';

CardInfo.propTypes = {
  style: PropTypes.object
};

export default function CardInfo({ style }) {
  return (
    <div style={style}>
      <div>
        created an{' '}
        <b style={{ color: Color[wordLevelHash[4].cardColor]() }}>
          {wordLevelHash[4].cardLabel}
        </b>{' '}
        card
      </div>
    </div>
  );
}
