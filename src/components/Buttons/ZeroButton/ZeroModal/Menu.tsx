import React, { useState, useMemo } from 'react';
import Button from '~/components/Button';
import DropdownButton from '~/components/Buttons/DropdownButton';
import Icon from '~/components/Icon';
import { Color } from '~/constants/css';
import { useAppContext } from '~/contexts';

interface Props {
  content: any;
  style?: any;
  loadingType: string;
  onSetLoadingType: (loadingType: string) => void;
  onSetLoadingProgress: (loadingProgress: number) => void;
  onSetResponse: (response: any) => void;
}
export default function Menu({
  content,
  style,
  loadingType,
  onSetLoadingType,
  onSetLoadingProgress,
  onSetResponse
}: Props) {
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
    if (selectedStyle === 'youtuber') {
      return { label: 'In YouTuber style', key: 'youtuber' };
    }
    return {};
  }, [selectedStyle]);
  const command = useMemo(() => {
    if (selectedStyle === 'zero') {
      return `Please make the text above sound more natural using ${wordLevel} words.`;
    } else {
      return `Please rewrite the text above ${styleLabelObj?.label?.toLowerCase()} using ${wordLevel} words.`;
    }
  }, [selectedStyle, wordLevel, styleLabelObj]);

  return (
    <div style={style}>
      <Button
        skeuomorphic
        color="strongPink"
        loading={loadingType === 'easy'}
        onClick={() => handleButtonClick('easy')}
      >
        <Icon icon="play" />
        <span style={{ marginLeft: '0.7rem' }}>Make it easy to understand</span>
      </Button>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginTop: '2rem'
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <div>
              <b style={{ color: Color.green() }}>Rewrite</b> it
            </div>
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
                  label: 'YouTuber style',
                  key: 'youtuber',
                  onClick: () => setSelectedStyle('youtuber')
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
            color="green"
            loading={loadingType === 'rewrite'}
            style={{ marginLeft: '1rem' }}
            onClick={() => handleButtonClick('rewrite')}
          >
            <Icon icon="play" />
            <span style={{ marginLeft: '0.7rem' }}>Rewrite</span>
          </Button>
        </div>
      </div>
      <Button
        skeuomorphic
        color="logoBlue"
        loading={loadingType === 'grammar'}
        style={{ marginTop: '2rem' }}
        onClick={() => handleButtonClick('grammar')}
      >
        <Icon icon="play" />
        <span style={{ marginLeft: '0.7rem' }}>
          Grammar (Remember, Zero is not always right)
        </span>
      </Button>
    </div>
  );

  async function handleButtonClick(type: string) {
    onSetLoadingType(type);
    const response = await getZerosReview({ type, content, command });
    onSetLoadingType('');
    onSetResponse(response);
    onSetLoadingProgress(0);
  }
}
