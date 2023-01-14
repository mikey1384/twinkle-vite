import { useMemo } from 'react';
import PropTypes from 'prop-types';
import DropdownButton from '~/components/Buttons/DropdownButton';
import { capitalize } from '~/helpers/stringHelpers';
import { Color } from '~/constants/css';

QualityFilter.propTypes = {
  selectedQuality: PropTypes.string,
  onDropdownShown: PropTypes.func,
  onSelectQuality: PropTypes.func,
  style: PropTypes.object
};

export default function QualityFilter({
  selectedQuality,
  onDropdownShown,
  onSelectQuality,
  style
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
                  ? 'orange'
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
          skeuomorphic
          color={
            selectedQuality === 'superior'
              ? 'green'
              : selectedQuality === 'rare'
              ? 'purple'
              : selectedQuality === 'elite'
              ? 'orange'
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
