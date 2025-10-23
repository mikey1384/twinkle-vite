import React, { useMemo } from 'react';
import DropdownButton from '~/components/Buttons/DropdownButton';
import { capitalize } from '~/helpers/stringHelpers';
import { Color } from '~/constants/css';

export default function QualityFilter({
  selectedQuality,
  onDropdownShown,
  onSelectQuality,
  selectedFilter,
  style
}: {
  selectedQuality: string;
  onDropdownShown: (isShown: boolean) => void;
  onSelectQuality: (quality: string) => void;
  selectedFilter: string;
  style: React.CSSProperties;
}) {
  const menuProps = useMemo(() => {
    const qualities = [
      'any',
      'common',
      'superior',
      'rare',
      'elite',
      'legendary'
    ];
    const rearrangedQualities = qualities.filter(
      (quality) => quality !== selectedQuality
    );
    return rearrangedQualities.map((quality) => ({
      label: (
        <b
          style={{
            color:
              Color[
                quality === 'superior'
                  ? 'green'
                  : quality === 'rare'
                  ? 'purple'
                  : quality === 'elite'
                  ? 'redOrange'
                  : quality === 'legendary'
                  ? 'gold'
                  : 'darkerGray'
              ]()
          }}
        >
          {capitalize(quality)}
        </b>
      ),
      onClick: () => onSelectQuality(quality)
    }));
  }, [onSelectQuality, selectedQuality]);

  const buttonColor =
    selectedQuality === 'superior'
      ? 'green'
      : selectedQuality === 'rare'
      ? 'purple'
      : selectedQuality === 'elite'
      ? 'redOrange'
      : selectedQuality === 'legendary'
      ? 'gold'
      : 'darkerGray';
  const buttonVariant = buttonColor === 'darkerGray' ? 'solid' : 'soft';

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
        <b>Quality:</b>
      </div>
      <div style={{ marginLeft: '1rem' }}>
        <DropdownButton
          isMenuShownWhenMounted={selectedFilter === 'quality'}
          variant={buttonVariant}
          tone="raised"
          color={buttonColor}
          icon="caret-down"
          text={selectedQuality}
          onDropdownShown={onDropdownShown}
          menuProps={menuProps}
        />
      </div>
    </div>
  );
}
