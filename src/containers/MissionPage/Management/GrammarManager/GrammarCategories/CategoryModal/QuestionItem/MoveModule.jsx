import PropTypes from 'prop-types';

MoveModule.propTypes = {
  categories: PropTypes.array.isRequired
};

export default function MoveModule({ categories }) {
  return (
    <div>
      {categories.map((category, index) => (
        <div key={index}>{category}</div>
      ))}
    </div>
  );
}
