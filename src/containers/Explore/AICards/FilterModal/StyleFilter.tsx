import React, { useMemo } from 'react';
import DropdownButton from '~/components/Buttons/DropdownButton';
import { capitalize } from '~/helpers/stringHelpers';

export default function StyleFilter({
  selectedStyle,
  onDropdownShown,
  onSelectStyle,
  selectedFilter,
  style
}: {
  selectedStyle: string;
  onDropdownShown: (isShown: boolean) => void;
  onSelectStyle: (style: string) => void;
  selectedFilter: string;
  style: React.CSSProperties;
}) {
  const menuProps = useMemo(() => {
    const styles = [
      'expressionism',
      'realism',
      'abstract',
      'hyperrealism',
      'impressionism',
      'cubism',
      'surrealism',
      'medieval',
      'pop art',
      'watercolor',
      'comic book',
      'pixel art',
      'anime',
      'graphite drawing',
      'ukiyo-e'
    ];
    const rearrangedStyles = styles.filter((style) => style !== selectedStyle);
    return rearrangedStyles.map((style) => ({
      label: <b>{capitalize(style)}</b>,
      onClick: () => onSelectStyle(style)
    }));
  }, [onSelectStyle, selectedStyle]);

  return (
    <div
      style={{
        padding: '1rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        ...style
      }}
    >
      <div>
        <b>Style:</b>
      </div>
      <div style={{ marginLeft: '1rem' }}>
        <DropdownButton
          isMenuShownWhenMounted={selectedFilter === 'style'}
          skeuomorphic
          icon="caret-down"
          text={selectedStyle}
          onDropdownShown={onDropdownShown}
          menuProps={menuProps}
        />
      </div>
    </div>
  );
}
