import PropTypes from 'prop-types';
import { qualityProps } from '~/constants/defaultValues';

CardInfo.propTypes = {
  style: PropTypes.object,
  quality: PropTypes.string
};

export default function CardInfo({ quality, style }) {
  return (
    <div style={style}>
      <div>
        collected {quality === 'elite' ? 'an' : 'a'}{' '}
        <span style={{ ...qualityProps[quality] }}>{quality}</span> card
      </div>
    </div>
  );
}
