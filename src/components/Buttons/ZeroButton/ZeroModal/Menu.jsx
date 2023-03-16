import { useState, useMemo } from 'react';
import PropTypes from 'prop-types';
import Button from '~/components/Button';
import DropdownButton from '~/components/Buttons/DropdownButton';
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
  const [selectedStyle, setSelectedStyle] = useState('zero');
  const [wordLevel, setWordLevel] = useState('intermediate');
  const styleLabelObj = useMemo(() => {
    if (selectedStyle === 'zero') {
      return { label: `In your own style`, key: 'zero' };
    }
    if (selectedStyle === 'kpop') {
      return { label: 'In KPOP style', key: 'kpop' };
    }
    return {};
  }, [selectedStyle]);
  return (
    <div style={style}>
      <Button
        skeuomorphic
        color="darkBlue"
        loading={loadingType === 'easy'}
        onClick={() => handleButtonClick('easy')}
      >
        Make it easy to understand
      </Button>
      <div style={{ display: 'flex', alignItems: 'center', marginTop: '1rem' }}>
        Rewrite it
        <DropdownButton
          icon="chevron-down"
          skeuomorphic
          text={styleLabelObj.label}
          color="darkerGray"
          listStyle={{ minWidth: '30ch' }}
          menuProps={[
            {
              label: `Zero's own style`,
              key: 'zero',
              onClick: () => setSelectedStyle('zero')
            },
            {
              label: `KPOP style`,
              key: 'kpop',
              onClick: () => setSelectedStyle('kpop')
            }
          ].filter((v) => v.key !== styleLabelObj.key)}
        />
        using
        <DropdownButton
          icon="chevron-down"
          skeuomorphic
          text={wordLevel}
          color="darkerGray"
          listStyle={{ minWidth: '25ch' }}
          menuProps={[
            {
              label: 'Easy',
              onClick: () => setWordLevel('easy')
            },
            {
              label: 'Intermediate',
              onClick: () => setWordLevel('intermediate')
            },
            {
              label: 'Hard',
              onClick: () => setWordLevel('hard')
            }
          ].filter(
            (v) => v.label.toLowerCase() !== wordLevel.toLocaleLowerCase()
          )}
        />
        words
        <Button
          skeuomorphic
          color="darkBlue"
          loading={loadingType === 'natural'}
          style={{ marginLeft: '1rem' }}
          onClick={() => handleButtonClick('natural')}
        >
          Go
        </Button>
      </div>
      <Button
        skeuomorphic
        color="darkBlue"
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
