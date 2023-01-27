import PropTypes from 'prop-types';

Searched.propTypes = {
  poster: PropTypes.string
};

export default function Searched({ poster }) {
  return (
    <div
      style={{
        width: '100%'
      }}
    >
      {poster} Searched results go here
    </div>
  );
}
