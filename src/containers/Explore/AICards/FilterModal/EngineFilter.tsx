import React, { useMemo } from 'react';
import DropdownButton from '~/components/Buttons/DropdownButton';
import { Color } from '~/constants/css';

export default function EngineFilter({
  selectedEngine = 'any',
  onSelectEngine,
  onDropdownShown,
  selectedFilter,
  style
}: {
  selectedEngine?: 'any' | 'DALL-E 2' | 'DALL-E 3' | 'image-1';
  onSelectEngine: (
    v: 'any' | 'DALL-E 2' | 'DALL-E 3' | 'image-1'
  ) => void;
  onDropdownShown: (isShown: boolean) => void;
  selectedFilter: string;
  style?: React.CSSProperties;
}) {
  const menuProps = useMemo(() => {
    const engines: Array<'any' | 'DALL-E 2' | 'DALL-E 3' | 'image-1'> = [
      'any',
      'DALL-E 2',
      'DALL-E 3',
      'image-1'
    ];
    const rearranged = engines.filter((e) => e !== selectedEngine);
    return rearranged.map((engine) => ({
      label: (
        <b
          style={{
            color: Color.darkerGray()
          }}
        >
          {engine === 'any' ? 'Any' : engine === 'image-1' ? 'image-1' : engine}
        </b>
      ),
      onClick: () => onSelectEngine(engine)
    }));
  }, [onSelectEngine, selectedEngine]);

  const buttonColor = 'darkerGray';
  const buttonVariant = 'solid';

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
        <b>Model:</b>
      </div>
      <div style={{ marginLeft: '1rem' }}>
        <DropdownButton
          isMenuShownWhenMounted={selectedFilter === 'engine'}
          variant={buttonVariant}
          tone="raised"
          color={buttonColor}
          icon="caret-down"
          text={selectedEngine === 'any' ? 'Any' : selectedEngine}
          onDropdownShown={onDropdownShown}
          menuProps={menuProps}
        />
      </div>
    </div>
  );
}
