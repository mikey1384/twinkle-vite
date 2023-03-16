import PropTypes from 'prop-types';
import Button from '~/components/Button';
import DropdownButton from '~/components/Buttons/DropdownButton';
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
        color="darkBlue"
        loading={loadingType === 'easy'}
        onClick={() => handleButtonClick('easy')}
      >
        <Icon icon="play" />
        <span style={{ marginLeft: '0.5rem' }}>Make it easy to understand</span>
      </Button>
      <div style={{ display: 'flex', alignItems: 'center', marginTop: '1rem' }}>
        Rewrite it in
        <DropdownButton
          icon="chevron-down"
          skeuomorphic
          text="your own style"
          color="darkerGray"
          listStyle={{ minWidth: '30ch' }}
          menuProps={[
            {
              label: `Zero's own style`,
              onClick: () => console.log('own')
            }
          ]}
        />
        using
        <DropdownButton
          icon="chevron-down"
          skeuomorphic
          text="Easy"
          color="darkerGray"
          menuProps={[
            {
              label: 'Easy',
              onClick: () => console.log('easy')
            },
            {
              label: 'Intermediate',
              onClick: () => console.log('easy')
            },
            {
              label: 'Hard',
              onClick: () => console.log('easy')
            }
          ]}
        />
        words
        <Button
          skeuomorphic
          color="darkBlue"
          loading={loadingType === 'natural'}
          style={{ marginLeft: '1rem' }}
          onClick={() => handleButtonClick('natural')}
        >
          <Icon icon="play" />
          <span style={{ marginLeft: '0.5rem' }}>Go</span>
        </Button>
      </div>
      <Button
        skeuomorphic
        color="darkBlue"
        loading={loadingType === 'grammar'}
        style={{ marginTop: '1rem' }}
        onClick={() => handleButtonClick('grammar')}
      >
        <Icon icon="play" />
        <span style={{ marginLeft: '0.5rem' }}>
          Grammar (Remember, Zero is not always right)
        </span>
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
