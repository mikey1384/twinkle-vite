import PropTypes from 'prop-types';
import Button from '~/components/Button';
import { useAppContext } from '~/contexts';

Menu.propTypes = {
  content: PropTypes.string.isRequired,
  loadingType: PropTypes.string,
  onSetLoadingType: PropTypes.func.isRequired,
  onSetResponse: PropTypes.func.isRequired,
  style: PropTypes.object
};

export default function Menu({
  content,
  style,
  loadingType,
  onSetLoadingType,
  onSetResponse
}) {
  const getZerosReview = useAppContext((v) => v.requestHelpers.getZerosReview);
  return (
    <div style={style}>
      <Button
        skeuomorphic
        loading={loadingType === 'easy'}
        onClick={() => handleButtonClick('easy')}
      >
        Make it easier to understand
      </Button>
      <Button
        skeuomorphic
        loading={loadingType === 'natural'}
        style={{ marginTop: '1rem' }}
        onClick={() => handleButtonClick('natural')}
      >
        Rewrite this in your own way
      </Button>
      <Button
        skeuomorphic
        loading={loadingType === 'grammar'}
        style={{ marginTop: '1rem' }}
        onClick={() => handleButtonClick('grammar')}
      >
        Grammar (Remember, Zero is not always right)
      </Button>
    </div>
  );

  async function handleButtonClick(type) {
    onSetLoadingType(type);
    const response = await getZerosReview({ type, content });
    onSetLoadingType(null);
    onSetResponse(response);
  }
}
