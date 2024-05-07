import React, { useMemo } from 'react';
import DropdownButton from '~/components/Buttons/DropdownButton';
import { Color } from '~/constants/css';
import { capitalize } from '~/helpers/stringHelpers';

export default function ColorFilter({
  selectedColor = 'any',
  onSelectColor,
  onDropdownShown
}: {
  selectedColor?: string;
  onSelectColor: (v: string) => void;
  onDropdownShown: () => void;
}) {
  const menuProps = useMemo(() => {
    const colors = ['any', 'blue', 'pink', 'orange', 'magenta', 'gold'];
    const rearrangedColors = colors.filter((color) => color !== selectedColor);
    return rearrangedColors.map((color) => ({
      label: (
        <b
          style={{
            color:
              Color[
                color === 'any'
                  ? 'darkerGray'
                  : color === 'blue'
                  ? 'logoBlue'
                  : color
              ]()
          }}
        >
          {capitalize(color)}
        </b>
      ),
      onClick: () => onSelectColor(color)
    }));
  }, [onSelectColor, selectedColor]);

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center'
      }}
    >
      <div className="label">Color</div>
      <div style={{ marginTop: '0.5rem' }}>
        <DropdownButton
          skeuomorphic
          color={
            selectedColor === 'any'
              ? 'darkerGray'
              : selectedColor === 'blue'
              ? 'logoBlue'
              : selectedColor
          }
          text={selectedColor}
          onDropdownShown={onDropdownShown}
          menuProps={menuProps}
          icon="caret-down"
        />
      </div>
    </div>
  );
}
