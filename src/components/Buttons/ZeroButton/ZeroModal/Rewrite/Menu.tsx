import React, { useMemo } from 'react';
import Button from '~/components/Button';
import DropdownButton from '~/components/Buttons/DropdownButton';
import Icon from '~/components/Icon';
import { Color } from '~/constants/css';
import { socket } from '~/constants/io';
import { ResponseObj } from '../types';
import { isMobile } from '~/helpers';

const deviceIsMobile = isMobile(navigator);

export default function Menu({
  content,
  style,
  loadingType,
  onSetLoadingType,
  onSetSelectedStyle,
  onSetWordLevel,
  responseObj,
  selectedStyle,
  wordLevel,
  onPrepareAudio,
  onUpdateIdentifier
}: {
  content: string;
  style?: React.CSSProperties;
  loadingType: string;
  onSetLoadingType: (loadingType: string) => void;
  onSetSelectedStyle: (style: string) => void;
  onSetWordLevel: (wordLevel: string) => void;
  responseObj: ResponseObj;
  selectedStyle: string;
  wordLevel: string;
  onPrepareAudio: (contentToRead: string) => void;
  onUpdateIdentifier: (identifier: number) => void;
}) {
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
        disabled={loadingType === 'easy'}
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
              listStyle={{ minWidth: '30ch' }}
              menuProps={[
                {
                  label: `Zero's own style`,
                  key: 'zero',
                  onClick: () => onSetSelectedStyle('zero')
                },
                {
                  label: `Shakespearean style`,
                  key: 'shakespear',
                  onClick: () => onSetSelectedStyle('shakespear')
                },
                {
                  label: 'YouTuber style',
                  key: 'youtuber',
                  onClick: () => onSetSelectedStyle('youtuber')
                },
                {
                  label: 'Poem',
                  key: 'poem',
                  onClick: () => onSetSelectedStyle('poem')
                },
                {
                  label: `KPOP style`,
                  key: 'kpop',
                  onClick: () => onSetSelectedStyle('kpop')
                },
                {
                  label: `Rap style`,
                  key: 'rap',
                  onClick: () => onSetSelectedStyle('rap')
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
              listStyle={{ minWidth: '25ch' }}
              menuProps={[
                {
                  label: 'Easy',
                  onClick: () => onSetWordLevel('easy')
                },
                {
                  label: 'Intermediate',
                  onClick: () => onSetWordLevel('intermediate')
                },
                {
                  label: 'Hard',
                  onClick: () => onSetWordLevel('hard')
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
            disabled={loadingType === 'rewrite'}
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
        disabled={loadingType === 'grammar'}
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

  async function handleButtonClick(type: 'rewrite' | 'easy' | 'grammar') {
    onSetLoadingType(type);

    const responseText = getResponseText();

    if (!responseText) {
      const newIdentifier = Math.floor(Math.random() * 1000000000);
      socket.emit('get_zeros_review', {
        type,
        content,
        command,
        wordLevel,
        identifier: newIdentifier,
        style: selectedStyle
      });
      onUpdateIdentifier(newIdentifier);
    } else {
      if (deviceIsMobile) return;
      await onPrepareAudio(responseText);
    }

    function getResponseText() {
      if (type !== 'rewrite') {
        return responseObj[type];
      }
      return responseObj[type]?.[selectedStyle]?.[wordLevel];
    }
  }
}
