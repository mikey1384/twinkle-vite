import PropTypes from 'prop-types';
import { Color } from '~/constants/css';
import { useKeyContext } from '~/contexts';

Marble.propTypes = {
  letterGrade: PropTypes.string,
  style: PropTypes.object
};

export default function Marble({ letterGrade, style }) {
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
          border: letterGrade ? '0' : `1px solid ${Color.borderGray()}`,
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          background: letterGrade
            ? Color[theme[`grammarGameScore${letterGrade}`]?.color]()
            : '#fff',
          color: '#fff',
          fontWeight: 'bold',
          width: '100%',
          height: '100%'
        }}
      >
        <span style={{ opacity: letterGrade ? 1 : 0 }}>
          {letterGrade || 'N'}
        </span>
      </div>
    </div>
  );
}
