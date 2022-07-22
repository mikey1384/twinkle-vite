import React, { useMemo, useState } from 'react';
import PropTypes from 'prop-types';
import Icon from '~/components/Icon';
import Button from '~/components/Button';
import Input from '~/components/Texts/Input';
import IconSelectionModal from '../IconSelectionModal';
import { exceedsCharLimit } from '~/helpers/stringHelpers';
import { Color } from '~/constants/css';
import { css } from '@emotion/css';

ForkButtonItem.propTypes = {
  onSetInputState: PropTypes.func.isRequired,
  forkButton: PropTypes.object,
  style: PropTypes.object,
  editedForkButtonIds: PropTypes.array,
  editedForkButtonsObj: PropTypes.object
};

export default function ForkButtonItem({
  editedForkButtonIds,
  editedForkButtonsObj,
  forkButton,
  style,
  onSetInputState
}) {
  const [iconSelectionModalShown, setIconSelectionModalShown] = useState(false);
  const headingExceedsCharLimit = useMemo(
    () =>
      exceedsCharLimit({
        contentType: 'interactive',
        inputType: 'heading',
        text: forkButton.label
      }),
    [forkButton.label]
  );

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        width: '100%',
        height: '100%',
        ...style
      }}
    >
      <div style={{ padding: '1rem 1.5rem 1rem 0' }}>
        <Button
          onClick={() => setIconSelectionModalShown(true)}
          skeuomorphic
          color={forkButton.icon ? 'black' : 'orange'}
        >
          {forkButton.icon ? (
            <Icon icon={forkButton.icon} />
          ) : (
            <Icon icon="plus" />
          )}
        </Button>
      </div>
      <div
        key={forkButton.id}
        style={{
          fontSize: '1.5rem',
          padding: '1rem 2rem',
          display: 'flex',
          flexGrow: 1,
          border: `1px solid ${Color.borderGray()}`
        }}
      >
        <Input
          onChange={(text) => {
            onSetInputState({
              editedForkButtonsObj: {
                ...editedForkButtonsObj,
                [forkButton.id]: {
                  ...forkButton,
                  label: text
                }
              }
            });
          }}
          placeholder="Enter option label..."
          value={forkButton.label}
          style={{ width: '100%', ...headingExceedsCharLimit?.style }}
        />
      </div>
      <div
        style={{
          fontSize: '1.7rem',
          width: '2.5rem',
          display: 'flex',
          justifyContent: 'flex-end'
        }}
      >
        {forkButton.id > 2 && (
          <Icon
            className={css`
              color: ${Color.darkerGray()};
              &:hover {
                color: ${Color.black()};
              }
            `}
            style={{ cursor: 'pointer' }}
            onClick={() =>
              onSetInputState({
                editedForkButtonIds: editedForkButtonIds.filter(
                  (forkButtonId) => forkButtonId !== forkButton.id
                )
              })
            }
            icon="times"
          />
        )}
      </div>
      {iconSelectionModalShown && (
        <IconSelectionModal
          selectedIcon={forkButton.icon}
          onSelectIcon={(icon) =>
            onSetInputState({
              editedForkButtonsObj: {
                ...editedForkButtonsObj,
                [forkButton.id]: {
                  ...forkButton,
                  icon
                }
              }
            })
          }
          onHide={() => setIconSelectionModalShown(false)}
        />
      )}
    </div>
  );
}
