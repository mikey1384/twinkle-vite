import React, { useMemo } from 'react';
import DropdownButton from '~/components/Buttons/DropdownButton';
import { Color, mobileMaxWidth } from '~/constants/css';
import { capitalize } from '~/helpers/stringHelpers';
import { css } from '@emotion/css';

export default function QualityFilter({
  selectedQuality = 'any',
  onSelectQuality,
  onDropdownShown
}: {
  selectedQuality?: string;
  onSelectQuality: (v: string) => void;
  onDropdownShown: () => void;
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
    <div className={containerClass}>
      <div className="label">Quality</div>
      <div className={controlClass}>
        <DropdownButton
          variant={buttonVariant}
          tone="raised"
          color={buttonColor}
          icon="caret-down"
          text={capitalize(selectedQuality)}
          onDropdownShown={onDropdownShown}
          menuProps={menuProps}
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
