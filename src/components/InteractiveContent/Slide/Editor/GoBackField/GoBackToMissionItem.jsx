import React from 'react';
import PropTypes from 'prop-types';
import Icon from '~/components/Icon';
import { Color, borderRadius } from '~/constants/css';
import { useKeyContext } from '~/contexts';
import { css } from '@emotion/css';

GoBackToMissionItem.propTypes = {
  style: PropTypes.object,
  selectedSlideId: PropTypes.number,
  onClick: PropTypes.func.isRequired
};

export default function GoBackToMissionItem({
  style,
  selectedSlideId,
  onClick
}) {
  const {
    itemSelected: { color: itemSelectedColor, opacity: itemSelectedOpacity }
  } = useKeyContext((v) => v.theme);
  const highlightColor = Color[itemSelectedColor](itemSelectedOpacity);

  return (
    <div
      onClick={onClick}
      style={{
        ...style,
        boxShadow: selectedSlideId === 0 ? `0 0 3px ${highlightColor}` : null,
        border:
          selectedSlideId === 0
            ? `0.3rem solid ${highlightColor}`
            : `1px solid ${Color.borderGray()}`
      }}
      className={css`
        width: 100%;
        cursor: pointer;
        padding: 1rem;
        border-radius: ${borderRadius};
        background: #fff;
        .label {
          color: ${Color.black()};
          transition: color 1s;
        }
        transition: background 0.5s, border 0.5s, box-shadow 0.5s;
        &:hover {
          border-color: ${Color.darkerBorderGray()};
          .label {
            color: ${Color.black()};
          }
          background: ${Color.highlightGray()};
        }
      `}
    >
      <p style={{ fontWeight: 'bold', fontSize: '1.5rem' }}>
        <Icon icon="home" />
        <span style={{ marginLeft: '0.7rem' }}>Back to Mission</span>
      </p>
    </div>
  );
}
