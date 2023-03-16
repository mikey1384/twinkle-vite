import PropTypes from 'prop-types';
import Button from '~/components/Button';
import Icon from '~/components/Icon';
import { useAppContext } from '~/contexts';

Menu.propTypes = {
  content: PropTypes.string.isRequired,
  loadingType: PropTypes.string,
  onSetLoadingType: PropTypes.func.isRequired,
  onSetResponse: PropTypes.func.isRequired,
  onSetLoadingProgress: PropTypes.func.isRequired,
  style: PropTypes.object
};

export default function Menu({
  content,
  style,
  loadingType,
  onSetLoadingType,
  onSetLoadingProgress,
  onSetResponse
}) {
  const getZerosReview = useAppContext((v) => v.requestHelpers.getZerosReview);
  return (
    <div style={style}>
      <Button
        skeuomorphic
        color="logoBlue"
        loading={loadingType === 'easy'}
        onClick={() => handleButtonClick('easy')}
      >
        Make it easier to understand
      </Button>
      <div style={{ display: 'flex', alignItems: 'center', marginTop: '1rem' }}>
        Rewrite it in
        <Button skeuomorphic>your own style</Button>
        using
        <Button skeuomorphic>Simple</Button>
        words.
        <Button
          skeuomorphic
          color="green"
          loading={loadingType === 'natural'}
          style={{ marginLeft: '1rem' }}
          onClick={() => handleButtonClick('natural')}
        >
          <Icon icon="play" />
          <span style={{ marginLeft: '0.5rem' }}>Run</span>
        </Button>
      </div>
      <Button
        skeuomorphic
        color="pink"
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
    onSetLoadingProgress(0);
  }
}
