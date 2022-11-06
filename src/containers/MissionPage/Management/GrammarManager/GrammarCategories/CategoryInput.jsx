import PropTypes from 'prop-types';
import Input from '~/components/Texts/Input';

CategoryInput.propTypes = {
  categoryText: PropTypes.string,
  onChange: PropTypes.func.isRequired
};

export default function CategoryInput({ onChange, categoryText }) {
  return (
    <Input
      onChange={onChange}
      placeholder="Enter category..."
      value={categoryText}
      style={{ width: '100%' }}
    />
  );
}
