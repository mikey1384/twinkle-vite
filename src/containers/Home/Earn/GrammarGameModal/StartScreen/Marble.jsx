import PropTypes from 'prop-types';
import { Color } from '~/constants/css';
import { useKeyContext } from '~/contexts';

Marble.propTypes = {
  letterGrade: PropTypes.string,
  style: PropTypes.object
};

export default function Marble({ letterGrade = 'A', style }) {
  const theme = useKeyContext((v) => v.theme);

  return (
    <div
      style={{
        display: 'inline-block',
        width: '3rem',
        height: '3rem',
        ...style
      }}
    >
      <div
        style={{
          borderRadius: '100%',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          background: Color[theme[`grammarGameScore${letterGrade}`]?.color](),
          color: '#fff',
          fontWeight: 'bold',
          width: '100%',
          height: '100%'
        }}
      >
        {letterGrade}
      </div>
    </div>
  );
}
