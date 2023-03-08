import PropTypes from 'prop-types';
import CloseButton from '~/components/Buttons/CloseButton';
import { Color } from '~/constants/css';

SelectedWord.propTypes = {
  selectedWord: PropTypes.string,
  onClear: PropTypes.func.isRequired,
  style: PropTypes.object
};

export default function SelectedWord({ selectedWord, onClear, style }) {
  return (
    <div
      style={{
        position: 'relative',
        fontWeight: 'bold',
        fontSize: '2rem',
        fontFamily: "'Roboto', sans-serif",
        color: Color.logoBlue(),
        display: 'flex',
        ...style
      }}
    >
      {selectedWord || 'Any'}
      {selectedWord && (
        <div
          style={{
            position: 'relative',
            display: 'flex',
            alignItems: 'center',
            marginLeft: '0.7rem'
          }}
        >
          <CloseButton
            style={{
              padding: 0,
              margin: 0,
              right: 0,
              top: 0,
              display: 'block',
              position: 'static',
              width: '1.7rem',
              height: '1.7rem',
              background: Color.logoBlue()
            }}
            onClick={onClear}
          />
        </div>
      )}
    </div>
  );
}
