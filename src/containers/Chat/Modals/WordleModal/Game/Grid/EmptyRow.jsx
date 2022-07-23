import PropTypes from 'prop-types';
import Cell from './Cell';

EmptyRow.propTypes = {
  maxWordLength: PropTypes.number
};
export default function EmptyRow({ maxWordLength }) {
  const emptyCells = Array.from(Array(maxWordLength));

  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'center',
        marginBottom: '0.5rem'
      }}
    >
      {emptyCells.map((_, i) => (
        <Cell key={i} />
      ))}
    </div>
  );
}
