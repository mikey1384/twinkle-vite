import PropTypes from 'prop-types';
import { Color } from '~/constants/css';

CardInfo.propTypes = {
  style: PropTypes.object,
  quality: PropTypes.string
};

const qualityProps = {
  common: {
    color: Color.vantaBlack(),
    fontWeight: 'normal'
  },
  superior: {
    color: Color.darkBlue(),
    fontWeight: 'bold'
  },
  rare: {
    color: Color.purple(),
    fontWeight: 'bold'
  },
  elite: {
    color: Color.brownOrange(),
    fontWeight: 'bold'
  },
  legendary: {
    color: Color.darkGold(),
    fontWeight: 'bold'
  }
};

export default function CardInfo({ quality, style }) {
  return (
    <div style={style}>
      <div>
        created {quality === 'elite' ? 'an' : 'a'}{' '}
        <span style={{ ...qualityProps[quality] }}>{quality}</span> card
      </div>
    </div>
  );
}
