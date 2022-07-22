import React from 'react';
import PropTypes from 'prop-types';
import Button from '~/components/Button';
import Icon from '~/components/Icon';
import { css } from '@emotion/css';
import { Color, mobileMaxWidth } from '~/constants/css';

ForkButtons.propTypes = {
  descriptionShown: PropTypes.bool,
  forkButtonIds: PropTypes.array.isRequired,
  forkButtonsObj: PropTypes.object.isRequired,
  onForkButtonClick: PropTypes.func.isRequired,
  selectedForkButtonId: PropTypes.number
};

export default function ForkButtons({
  descriptionShown,
  forkButtonIds,
  forkButtonsObj,
  onForkButtonClick,
  selectedForkButtonId
}) {
  return (
    <div
      className={css`
        margin-top: ${descriptionShown ? '5rem' : '3rem'};
        display: flex;
        flex-direction: column;
        align-items: center;
        @media (max-width: ${mobileMaxWidth}) {
          margin-top: 3rem;
        }
      `}
    >
      {forkButtonIds.map((buttonId, index) => {
        const button = forkButtonsObj[buttonId];
        return (
          <Button
            key={buttonId}
            skeuomorphic
            style={{ marginTop: index === 0 ? 0 : '1rem', lineHeight: 1.5 }}
            onClick={() => onForkButtonClick(buttonId)}
          >
            {button.icon && <Icon icon={button.icon} />}
            <span style={{ marginLeft: button.icon ? '0.7rem' : 0 }}>
              {button.label}
            </span>
            {selectedForkButtonId === buttonId ? (
              <Icon
                icon="check"
                style={{ marginLeft: '0.7rem', color: Color.green() }}
              />
            ) : null}
          </Button>
        );
      })}
    </div>
  );
}
