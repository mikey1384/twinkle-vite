import React, { useMemo } from 'react';
import DropdownButton from '~/components/Buttons/DropdownButton';
import { Color } from '~/constants/css';
import { capitalize } from '~/helpers/stringHelpers';

export default function QualityFilter({
  selectedQuality = 'any',
  onSelectQuality,
  onDropdownShown
}: {
  selectedQuality?: string;
  onSelectQuality: (v: string) => void;
  onDropdownShown: (isShown: boolean) => void;
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

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center'
      }}
    >
      <div className="label">Quality</div>
      <div style={{ marginTop: '0.5rem' }}>
        <DropdownButton
          skeuomorphic
          color={
            selectedQuality === 'superior'
              ? 'green'
              : selectedQuality === 'rare'
              ? 'purple'
              : selectedQuality === 'elite'
              ? 'redOrange'
              : selectedQuality === 'legendary'
              ? 'gold'
              : 'darkerGray'
          }
          icon="caret-down"
          text={selectedQuality}
          onDropdownShown={onDropdownShown}
          menuProps={menuProps}
        />
      </div>
    </div>
  );
}
