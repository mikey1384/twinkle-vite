import React, { useMemo } from 'react';
import DropdownButton from '~/components/Buttons/DropdownButton';
import { Color, mobileMaxWidth } from '~/constants/css';
import { capitalize } from '~/helpers/stringHelpers';
import { css } from '@emotion/css';

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
    const colors = [
      'any',
      'blue',
      'pink',
      'orange',
      'magenta',
      'gold',
      'black'
    ];
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

  const buttonColor =
    selectedColor === 'any'
      ? 'darkerGray'
      : selectedColor === 'blue'
      ? 'logoBlue'
      : selectedColor;
  const buttonVariant = buttonColor === 'darkerGray' ? 'solid' : 'soft';

  return (
    <div className={containerClass}>
      <div className="label">Color</div>
      <div className={controlClass}>
        <DropdownButton
          variant={buttonVariant}
          tone="raised"
          color={buttonColor}
          text={capitalize(selectedColor)}
          onDropdownShown={onDropdownShown}
          menuProps={menuProps}
          icon="caret-down"
          stretch
        />
      </div>
    </div>
  );
}

const containerClass = css`
  display: flex;
  flex-direction: column;
  align-items: stretch;
  gap: 0.6rem;
  width: 100%;
  text-align: left;
  @media (max-width: ${mobileMaxWidth}) {
    gap: 0.5rem;
  }
`;

const controlClass = css`
  width: 100%;
  display: flex;
  align-items: center;
`;
