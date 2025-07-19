import React, { useEffect, useMemo, useState } from 'react';
import PropTypes from 'prop-types';
import SectionPanel from '~/components/SectionPanel';
import Button from '~/components/Button';
import DropdownButton from '~/components/Buttons/DropdownButton';
import Frame from './Frame';
import Icon from '~/components/Icon';
import DeleteInterface from './DeleteInterface';
import AddPictureModal from './AddPictureModal';
import { objectify } from '~/helpers';
import { useAppContext, useKeyContext } from '~/contexts';
import { css } from '@emotion/css';
import ErrorBoundary from '~/components/ErrorBoundary';
import ReorderInterface from './ReorderInterface';
import NoPictures from './NoPictures';
import localize from '~/constants/localize';

const addPictureLabel = localize('addPicture');
const deleteLabel = localize('delete');
const deletePicturesLabel = localize('deletePictures');
const picturesLabel = localize('pictures');
const reorderLabel = localize('reorder');
const reorderPicturesByDraggingLabel = localize('reorderPicturesByDragging');

Pictures.propTypes = {
  numPics: PropTypes.number,
  pictures: PropTypes.array,
  profileId: PropTypes.number,
  selectedTheme: PropTypes.string
};

export default function Pictures({
  numPics,
  profileId,
  pictures,
  selectedTheme
}: {
  numPics: number;
  profileId: number;
  pictures: any[];
  selectedTheme: string;
}) {
  const userId = useKeyContext((v) => v.myState.userId);
  const banned = useKeyContext((v) => v.myState.banned);
  const [saveDisabled, setSaveDisabled] = useState(false);
  const [addPictureModalShown, setAddPictureModalShown] = useState(false);
  const [reorderMode, setReorderMode] = useState(false);
  const [deleteMode, setDeleteMode] = useState(false);
  const [reorderedPictureIds, setReorderedPictureIds] = useState<number[]>([]);
  const [remainingPictures, setRemainingPictures] = useState(pictures || []);
  const deleteProfilePictures = useAppContext(
    (v) => v.requestHelpers.deleteProfilePictures
  );
  const reorderProfilePictures = useAppContext(
    (v) => v.requestHelpers.reorderProfilePictures
  );
  const updateUserPictures = useAppContext(
    (v) => v.requestHelpers.updateUserPictures
  );
  const onSetUserState = useAppContext((v) => v.user.actions.onSetUserState);
  const addPictureButtonDisabled = useMemo(() => {
    return pictures.length >= numPics;
  }, [numPics, pictures]);
  useEffect(() => {
    setReorderedPictureIds(pictures.map((picture) => Number(picture.id)));
    setRemainingPictures(pictures);
  }, [pictures]);

  const menuButtons = useMemo(() => {
    if (userId !== profileId || !pictures) return null;
    return deleteMode || reorderMode ? (
      <div style={{ display: 'flex' }}>
        <Button color="vantaBlack" transparent onClick={handleCancel}>
          Cancel
        </Button>
        <Button
          skeuomorphic
          disabled={saveDisabled}
          style={{ marginLeft: '1rem' }}
          onClick={handleConfirm}
        >
          Save
        </Button>
      </div>
    ) : (
      <div style={{ display: 'flex' }}>
        <Button
          disabled={addPictureButtonDisabled}
          color="darkerGray"
          skeuomorphic
          onClick={() => setAddPictureModalShown(true)}
        >
          <Icon icon="plus" />
          <span style={{ marginLeft: '0.7rem' }}>
            {addPictureLabel} ({pictures.length}/{numPics})
          </span>
        </Button>
        <DropdownButton
          skeuomorphic
          icon="ellipsis-h"
          color="darkerGray"
          style={{ marginLeft: '1rem' }}
          menuProps={[
            ...(pictures.length > 1
              ? [
                  {
                    label: (
                      <>
                        <Icon icon="sort" />
                        <span style={{ marginLeft: '1rem' }}>
                          {reorderLabel}
                        </span>
                      </>
                    ),
                    onClick: () => setReorderMode(true)
                  }
                ]
              : []),
            {
              label: (
                <>
                  <Icon icon="trash-alt" />
                  <span style={{ marginLeft: '1rem' }}>{deleteLabel}</span>
                </>
              ),
              onClick: () => setDeleteMode(true)
            }
          ]}
        />
      </div>
    );

    function handleCancel() {
      if (deleteMode) {
        handlePictureDeleteCancel();
      } else {
        handlePictureReorderCancel();
      }
    }

    function handlePictureDeleteCancel() {
      setDeleteMode(false);
      setRemainingPictures(pictures);
    }

    function handlePictureReorderCancel() {
      setReorderMode(false);
      setReorderedPictureIds(pictures.map((picture) => Number(picture.id)));
    }

    function handleConfirm() {
      if (deleteMode) {
        handlePictureDeleteConfirm();
      } else {
        handlePictureReorderConfirm();
      }
    }

    async function handlePictureDeleteConfirm() {
      setSaveDisabled(true);
      const success = await deleteProfilePictures(remainingPictures);
      if (success) {
        onSetUserState({
          userId: profileId,
          newState: { pictures: remainingPictures }
        });
      }
      setSaveDisabled(false);
      setDeleteMode(false);
    }

    async function handlePictureReorderConfirm() {
      setSaveDisabled(true);
      const success = await reorderProfilePictures(reorderedPictureIds);
      if (success) {
        const pictureObj = objectify(pictures);
        onSetUserState({
          userId: profileId,
          newState: {
            pictures: reorderedPictureIds.map(
              (pictureId) => pictureObj[pictureId]
            )
          }
        });
      }
      setSaveDisabled(false);
      setReorderMode(false);
    }

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    deleteMode,
    reorderMode,
    numPics,
    pictures,
    remainingPictures,
    reorderedPictureIds,
    saveDisabled
  ]);

  return (
    <ErrorBoundary componentPath="Profile/Body/Home/Pictures/index">
      {pictures && pictures.length > 0 ? (
        <SectionPanel
          button={menuButtons}
          customColorTheme={selectedTheme}
          loaded
          title={
            deleteMode
              ? deletePicturesLabel
              : reorderMode
              ? reorderPicturesByDraggingLabel
              : picturesLabel
          }
        >
          <div
            style={{
              display: 'flex',
              justifyContent: 'center',
              marginTop: '-1rem'
            }}
          >
            {deleteMode ? (
              <DeleteInterface
                remainingPictures={remainingPictures}
                numPictures={pictures.length}
                onSetRemainingPictures={setRemainingPictures}
              />
            ) : reorderMode ? (
              <ReorderInterface
                reorderedPictureIds={reorderedPictureIds}
                pictures={pictures}
                numPictures={pictures.length}
                onSetReorderedPictureIds={(pictureIds: (string | number)[]) =>
                  setReorderedPictureIds(
                    pictureIds.map((pictureId) => Number(pictureId))
                  )
                }
              />
            ) : (
              <div
                className={css`
                  width: ${pictures.length > 5
                    ? '100%'
                    : pictures.length > 3
                    ? '95%'
                    : '75%'};
                  display: flex;
                  justify-content: center;
                  height: auto;
                `}
              >
                {pictures.map((picture, index) => (
                  <Frame
                    key={picture.id}
                    numPictures={pictures.length}
                    picture={picture}
                    userIsUploader={profileId === userId}
                    onUpdatePictureCaption={handleUpdatePictureCaption}
                    style={{ marginLeft: index === 0 ? 0 : '1rem' }}
                  />
                ))}
              </div>
            )}
          </div>
        </SectionPanel>
      ) : (
        <NoPictures
          onAddButtonClick={() => setAddPictureModalShown(true)}
          profileId={profileId}
          numPics={numPics}
        />
      )}
      {addPictureModalShown && (
        <AddPictureModal
          onHide={() => setAddPictureModalShown(false)}
          onConfirm={handleAddPictures}
          profileId={profileId}
          currentPictures={pictures}
          maxNumSelectable={numPics - pictures.length}
        />
      )}
    </ErrorBoundary>
  );

  async function handleAddPictures({
    selectedPictureIds
  }: {
    selectedPictureIds: number[];
  }) {
    if (banned?.posting) {
      return;
    }
    const pics = await updateUserPictures([
      ...selectedPictureIds,
      ...pictures.map((picture) => Number(picture.id))
    ]);
    onSetUserState({ userId: profileId, newState: { pictures: pics } });
    setAddPictureModalShown(false);
  }

  function handleUpdatePictureCaption({
    caption,
    pictureId
  }: {
    caption: string;
    pictureId: number;
  }) {
    onSetUserState({
      userId: profileId,
      newState: {
        pictures: pictures.map((picture) =>
          Number(picture.id) === Number(pictureId)
            ? {
                ...picture,
                caption
              }
            : picture
        )
      }
    });
  }
}
