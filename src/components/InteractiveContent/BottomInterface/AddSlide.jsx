import React, { useMemo, useState } from 'react';
import PropTypes from 'prop-types';
import Button from '~/components/Button';
import Icon from '~/components/Icon';
import SelectArchivedSlideModal from '../SelectArchivedSlideModal';
import { useAppContext, useInteractiveContext } from '~/contexts';
import { borderRadius, Color, mobileMaxWidth } from '~/constants/css';
import { css } from '@emotion/css';

AddSlide.propTypes = {
  archivedSlides: PropTypes.array.isRequired,
  interactiveId: PropTypes.number.isRequired,
  lastFork: PropTypes.object
};

export default function AddSlide({ archivedSlides, interactiveId, lastFork }) {
  const appendInteractiveSlide = useAppContext(
    (v) => v.requestHelpers.appendInteractiveSlide
  );
  const recoverArchivedSlide = useAppContext(
    (v) => v.requestHelpers.recoverArchivedSlide
  );
  const onAddNewInteractiveSlide = useInteractiveContext(
    (v) => v.actions.onAddNewInteractiveSlide
  );
  const onChangeNumUpdates = useInteractiveContext(
    (v) => v.actions.onChangeNumUpdates
  );
  const onConcatDisplayedSlides = useInteractiveContext(
    (v) => v.actions.onConcatDisplayedSlides
  );
  const onRecoverArchivedSlide = useInteractiveContext(
    (v) => v.actions.onRecoverArchivedSlide
  );
  const onSetSlideState = useInteractiveContext(
    (v) => v.actions.onSetSlideState
  );
  const forkOptionNotSelected = useMemo(() => {
    return lastFork && !lastFork?.selectedForkButtonId;
  }, [lastFork]);

  const [selectArchivedSlideModalShown, setSelectArchivedSlideModalShown] =
    useState(false);

  return (
    <div
      className={css`
        background: ${forkOptionNotSelected ? Color.logoBlue() : '#fff'};
        color: ${forkOptionNotSelected ? '#fff' : Color.black()};
        border-radius: ${borderRadius};
        padding: 1.5rem;
        display: flex;
        align-items: center;
        justify-content: center;
        width: 100%;
        border: 1px solid
          ${forkOptionNotSelected ? Color.logoBlue() : Color.borderGray()};
        @media (max-width: ${mobileMaxWidth}) {
          border-radius: 0;
          border-left: 0;
          border-right: 0;
        }
      `}
    >
      <div style={{ display: 'flex' }}>
        {forkOptionNotSelected ? (
          <div style={{ fontSize: '2.5rem' }}>
            <Icon icon="arrow-up" />
            <span style={{ marginLeft: '1rem' }}>
              Please select a branch first
            </span>
          </div>
        ) : (
          <div
            style={{ width: '100%', display: 'flex', flexDirection: 'column' }}
          >
            <Button onClick={handleAddNewSlide} skeuomorphic>
              <Icon icon="plus" />
              <span style={{ marginLeft: '0.7rem' }}>Insert a New Slide</span>
            </Button>
            {archivedSlides.length > 0 && (
              <>
                <div
                  style={{
                    width: '100%',
                    fontSize: '1.5rem',
                    fontWeight: 'bold',
                    textAlign: 'center',
                    marginTop: '1rem'
                  }}
                >
                  <Icon icon="minus" /> OR <Icon icon="minus" />
                </div>
                <Button
                  style={{ marginTop: '1rem' }}
                  onClick={() => setSelectArchivedSlideModalShown(true)}
                  skeuomorphic
                >
                  <Icon icon="archive" />
                  <span style={{ marginLeft: '0.7rem' }}>
                    Choose from Archived Slides
                  </span>
                </Button>
              </>
            )}
          </div>
        )}
      </div>
      {selectArchivedSlideModalShown && (
        <SelectArchivedSlideModal
          interactiveId={interactiveId}
          archivedSlides={archivedSlides}
          onDone={handleRecoverArchivedSlide}
          onHide={() => setSelectArchivedSlideModalShown(false)}
        />
      )}
    </div>
  );

  async function handleRecoverArchivedSlide(selectedSlideId) {
    const numUpdates = await recoverArchivedSlide({
      interactiveId,
      selectedSlideId,
      lastFork
    });
    onChangeNumUpdates({ interactiveId, numUpdates });
    onRecoverArchivedSlide({
      interactiveId,
      slideId: selectedSlideId,
      forkedFrom: lastFork?.id
    });
    onConcatDisplayedSlides({
      interactiveId,
      newSlides: [selectedSlideId]
    });
    onSetSlideState({
      interactiveId,
      slideId: selectedSlideId,
      newState: {
        forkedFrom: lastFork?.id
      }
    });
    setSelectArchivedSlideModalShown(false);
  }

  async function handleAddNewSlide() {
    const { slide, numUpdates } = await appendInteractiveSlide({
      interactiveId,
      lastFork
    });
    onChangeNumUpdates({ interactiveId, numUpdates });
    onAddNewInteractiveSlide({ interactiveId, lastFork, slide });
  }
}
