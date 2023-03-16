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
      return { label: 'In KPOP lyrics style', key: 'kpop' };
    }
    if (selectedStyle === 'shakespear') {
      return { label: 'In Shakespearean style', key: 'shakespear' };
    }
    if (selectedStyle === 'poem') {
      return { label: 'In the form of a poem', key: 'poem' };
    }
    if (selectedStyle === 'rap') {
      return { label: 'In rap style', key: 'rap' };
    }
    return {};
  }, [selectedStyle]);
  const command = useMemo(() => {
    if (selectedStyle === 'zero') {
      return `Please make the text above sound more natural using ${wordLevel} words.`;
    } else {
      return `Please rewrite the text above ${styleLabelObj.label.toLowerCase()} using ${wordLevel} words.`;
    }
  }, [selectedStyle, wordLevel, styleLabelObj]);

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
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginTop: '1rem'
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', alignItems: 'center' }}>
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
                  label: `Shakespearean style`,
                  key: 'shakespear',
                  onClick: () => setSelectedStyle('shakespear')
                },
                {
                  label: 'Poem',
                  key: 'poem',
                  onClick: () => setSelectedStyle('poem')
                },
                {
                  label: `KPOP style`,
                  key: 'kpop',
                  onClick: () => setSelectedStyle('kpop')
                },
                {
                  label: `Rap style`,
                  key: 'rap',
                  onClick: () => setSelectedStyle('rap')
                }
              ].filter((v) => v.key !== styleLabelObj.key)}
            />
          </div>
          <div
            style={{ display: 'flex', marginTop: '1rem', alignItems: 'center' }}
          >
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
          </div>
        </div>
        <div>
          <Button
            skeuomorphic
            color="darkBlue"
            loading={loadingType === 'rewrite'}
            style={{ marginLeft: '1rem' }}
            onClick={() => handleButtonClick('rewrite')}
          >
            Go
          </Button>
        </div>
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
    const response = await getZerosReview({ type, content, command });
    onSetLoadingType(null);
    onSetResponse(response);
    onSetLoadingProgress(0);
  }
}
