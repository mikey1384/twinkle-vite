import PropTypes from 'prop-types';
import { Color } from '~/constants/css';

Heading.propTypes = {
  color: PropTypes.string,
  children: PropTypes.node
};

export default function Heading({ color, children }) {
  return (
    <div
      style={{
        marginTop: '1rem',
        marginBottom: '0.5rem',
        width: '100%',
        display: 'flex',
        justifyContent: 'center',
        padding: '2rem',
        fontSize: '2rem',
        fontFamily: 'Roboto, monospace',
        fontWeight: 'bold',
        backgroundColor: Color[color](),
        color: '#fff'
      }}
    >
      {children}
    </div>
  );
}
