import PropTypes from 'prop-types';
import Input from '~/components/Texts/Input';
import Button from '~/components/Button';
import Icon from '~/components/Icon';
import { stringIsEmpty } from '~/helpers/stringHelpers';

CategoryInput.propTypes = {
  categoryText: PropTypes.string,
  onChange: PropTypes.func.isRequired
};

export default function CategoryInput({ onChange, categoryText }) {
  return (
    <div style={{ display: 'flex' }}>
      <Input
        onChange={onChange}
        placeholder="Enter category..."
        value={categoryText}
        style={{ width: '100%' }}
      />
      {!stringIsEmpty(categoryText) && (
        <Button color="blue" filled style={{ marginLeft: '1rem' }}>
          <Icon icon="plus" />
        </Button>
      )}
    </div>
  );
}
