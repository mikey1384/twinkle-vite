import React, { useState } from 'react';
import Carousel from '~/components/Carousel';
import VideoThumb from '~/components/VideoThumb';
import DropdownButton from '~/components/Buttons/DropdownButton';
import EditTitleForm from '~/components/Forms/EditTitleForm';
import EditPlaylistModal from './Modals/EditPlaylistModal';
import PlaylistModal from '~/components/Modals/PlaylistModal';
import ConfirmModal from '~/components/Modals/ConfirmModal';
import Link from '~/components/Link';
import Icon from '~/components/Icon';
import { css } from '@emotion/css';
import { Color, mobileMaxWidth } from '~/constants/css';
import { charLimit } from '~/constants/defaultValues';
import { useAppContext, useExploreContext, useKeyContext } from '~/contexts';
import localize from '~/constants/localize';

const byLabel = localize('by');
const changeVideosLabel = localize('changeVideos');
const editTitleLabel = localize('editTitle');
const reorderVideosLabel = localize('reorderVideos');
const removeLabel = localize('remove');
const removePlaylistLabel = localize('removePlaylist');
const cellSpacing = 12;
const numSlides = 4;

export default function PlaylistCarousel({
  id: playlistId,
  numPlaylistVids,
  playlist,
  showAllButton,
  title,
  uploader,
  userIsUploader
}: {
  id: number;
  numPlaylistVids: number;
  playlist: any[];
  showAllButton: boolean;
  title: string;
  uploader: string;
  userIsUploader: boolean;
}) {
  const deletePlaylist = useAppContext((v) => v.requestHelpers.deletePlaylist);
  const editPlaylistTitle = useAppContext(
    (v) => v.requestHelpers.editPlaylistTitle
  );
  const canEditPlaylists = useKeyContext((v) => v.myState.canEditPlaylists);
  const carouselColor = useKeyContext((v) => v.theme.carousel.color);
  const onDeletePlaylist = useExploreContext((v) => v.actions.onDeletePlaylist);
  const onEditPlaylistTitle = useExploreContext(
    (v) => v.actions.onEditPlaylistTitle
  );
  const [savingEdit, setSavingEdit] = useState(false);
  const [onEdit, setOnEdit] = useState(false);
  const [changePLVideosModalShown, setChangePLVideosModalShown] =
    useState(false);
  const [reorderPLVideosModalShown, setReorderPLVideosModalShown] =
    useState(false);
  const [deleteConfirmModalShown, setDeleteConfirmModalShown] = useState(false);
  const [playlistModalShown, setPlaylistModalShown] = useState(false);

  return (
    <div
      className={css`
        margin-bottom: 1.5rem;
        &:last-child {
          margin-bottom: 0;
        }
      `}
    >
      <div
        className={css`
          position: relative;
          display: flex;
          align-items: center;
          padding-bottom: 0.8rem;
          p {
            font-size: 2.2rem;
            font-weight: bold;
            cursor: pointer;
            display: inline;
            > a {
              color: ${Color.darkGray()};
              text-decoration: none;
              &:hover {
                transition: color 0.3s;
                color: ${Color[carouselColor]()};
              }
            }
          }
          small {
            font-size: 1.5rem;
            color: ${Color.gray()};
          }
        `}
      >
        {onEdit ? (
          <EditTitleForm
            autoFocus
            savingEdit={savingEdit}
            maxLength={charLimit.playlist.title}
            style={{ width: '90%' }}
            title={title}
            onEditSubmit={handleEditedTitleSubmit}
            onClickOutSide={() => setOnEdit(false)}
          />
        ) : (
          <div>
            <p>
              <Link to={`/playlists/${playlistId}`}>{title}</Link>
              &nbsp;
              <small>
                {byLabel} {uploader}
              </small>
            </p>
          </div>
        )}
        {!onEdit && (userIsUploader || canEditPlaylists) && (
          <DropdownButton
            skeuomorphic
            icon="chevron-down"
            color="darkerGray"
            listStyle={{ minWidth: '15rem' }}
            style={{ position: 'absolute', right: 0 }}
            menuProps={[
              {
                label: (
                  <>
                    <Icon icon="pencil-alt" />
                    <span style={{ marginLeft: '1rem' }}>{editTitleLabel}</span>
                  </>
                ),
                onClick: () => setOnEdit(true)
              },
              {
                label: (
                  <>
                    <Icon icon="film" />
                    <span style={{ marginLeft: '1rem' }}>
                      {changeVideosLabel}
                    </span>
                  </>
                ),
                onClick: () => setChangePLVideosModalShown(true)
              },
              {
                label: (
                  <>
                    <Icon icon="sort" />
                    <span style={{ marginLeft: '1rem' }}>
                      {reorderVideosLabel}
                    </span>
                  </>
                ),
                onClick: () => setReorderPLVideosModalShown(true)
              },
              {
                separator: true
              },
              {
                label: (
                  <>
                    <Icon icon="trash-alt" />
                    <span style={{ marginLeft: '1rem' }}>{removeLabel}</span>
                  </>
                ),
                onClick: () => setDeleteConfirmModalShown(true)
              }
            ]}
          />
        )}
      </div>
      <Carousel
        progressBar={false}
        slidesToShow={numSlides}
        slidesToScroll={numSlides}
        cellSpacing={cellSpacing}
        slideWidthMultiplier={0.99}
        showAllButton={showAllButton}
        onShowAll={() => setPlaylistModalShown(true)}
      >
        {renderThumbs()}
      </Carousel>
      {playlistModalShown && (
        <PlaylistModal
          title={title}
          onHide={() => setPlaylistModalShown(false)}
          playlistId={playlistId}
        />
      )}
      {changePLVideosModalShown && (
        <EditPlaylistModal
          modalType="change"
          numPlaylistVids={numPlaylistVids}
          playlistId={playlistId}
          onHide={() => setChangePLVideosModalShown(false)}
        />
      )}
      {reorderPLVideosModalShown && (
        <EditPlaylistModal
          modalType="reorder"
          numPlaylistVids={numPlaylistVids}
          playlistId={playlistId}
          onHide={() => setReorderPLVideosModalShown(false)}
        />
      )}
      {deleteConfirmModalShown && (
        <ConfirmModal
          title={removePlaylistLabel}
          onConfirm={handleDeleteConfirm}
          onHide={() => setDeleteConfirmModalShown(false)}
        />
      )}
    </div>
  );

  function renderThumbs() {
    return playlist.map((thumb, index) => {
      return (
        <VideoThumb
          className={css`
            @media (max-width: ${mobileMaxWidth}) {
              a {
                font-size: 1.3rem;
              }
              .username {
                font-size: 1rem;
              }
            }
          `}
          to={`videos/${thumb.videoId}?playlist=${playlistId}`}
          key={index}
          video={{
            id: thumb.videoId,
            byUser: thumb.byUser,
            content: thumb.content,
            rewardLevel: thumb.rewardLevel,
            title: thumb.video_title,
            description: thumb.video_description,
            uploaderName: thumb.video_uploader,
            likes: thumb.likes
          }}
          user={{ username: thumb.video_uploader, id: thumb.video_uploader_id }}
        />
      );
    });
  }

  async function handleEditedTitleSubmit(title: string) {
    setSavingEdit(true);
    await editPlaylistTitle({ title, playlistId });
    onEditPlaylistTitle({ playlistId, title });
    setOnEdit(false);
    setSavingEdit(false);
  }

  async function handleDeleteConfirm() {
    setDeleteConfirmModalShown(false);
    await deletePlaylist(playlistId);
    onDeletePlaylist(playlistId);
  }
}
