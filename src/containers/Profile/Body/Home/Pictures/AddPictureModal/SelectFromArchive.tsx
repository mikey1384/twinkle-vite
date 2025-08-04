import React, { useEffect, useState } from 'react';
import { useAppContext } from '~/contexts';
import Loading from '~/components/Loading';
import ArchivedPicture from './ArchivedPicture';
import LoadMoreButton from '~/components/Buttons/LoadMoreButton';

export default function SelectFromArchive({
  currentPictures,
  selectedPictureIds,
  onSetSelectedPictureIds
}: {
  currentPictures: any[];
  selectedPictureIds: number[];
  onSetSelectedPictureIds: (arg0: any) => any;
}) {
  const loadUserPictures = useAppContext(
    (v) => v.requestHelpers.loadUserPictures
  );
  const [loadMoreButtonShown, setLoadMoreButtonShown] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [loading, setLoading] = useState(false);
  const [pictures, setPictures] = useState<{ id: number; src: string }[]>([]);

  useEffect(() => {
    init();
    async function init() {
      setLoading(true);
      const { pictures: pics, loadMoreShown } = await loadUserPictures({
        exclude: currentPictures
      });
      setPictures(pics);
      setLoadMoreButtonShown(loadMoreShown && pics.length > 0);
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div
      style={{
        width: '100%',
        display: 'flex',
        justifyContent: 'center',
        flexWrap: 'wrap',
        marginTop: '-1rem'
      }}
    >
      {loading ? (
        <Loading style={{ height: '10rem' }} />
      ) : pictures.length === 0 ? (
        <div style={{ fontSize: '2rem' }}>Your picture archive is empty</div>
      ) : (
        pictures.map((picture) => (
          <ArchivedPicture
            key={picture.id}
            selectedPictureIds={selectedPictureIds}
            onDeleteArchivedPicture={(pictureId) => {
              setPictures((pictures) =>
                pictures.filter(
                  (picture: { id: number }) =>
                    Number(picture.id) !== Number(pictureId)
                )
              );
              onSetSelectedPictureIds((selectedPictureIds: number[]) =>
                selectedPictureIds.filter(
                  (id) => Number(id) !== Number(pictureId)
                )
              );
            }}
            onSelect={(pictureId) =>
              onSetSelectedPictureIds((selectedPictureIds: number[]) =>
                selectedPictureIds.includes(pictureId)
                  ? selectedPictureIds.filter(
                      (id) => Number(id) !== Number(pictureId)
                    )
                  : selectedPictureIds.concat(Number(pictureId))
              )
            }
            picture={picture}
            style={{ margin: '0.5rem', cursor: 'pointer' }}
          />
        ))
      )}
      {pictures.length > 0 && loadMoreButtonShown && (
        <LoadMoreButton
          style={{ marginTop: '2rem', width: '100%', fontSize: '2rem' }}
          transparent
          onClick={handleLoadMore}
          loading={loadingMore}
        />
      )}
    </div>
  );

  async function handleLoadMore() {
    if (!pictures.length) return;

    setLoadingMore(true);

    const lastId = pictures[pictures.length - 1].id;
    const { pictures: pics, loadMoreShown } = await loadUserPictures({
      lastPictureId: lastId,
      exclude: currentPictures
    });

    setPictures((prev) => prev.concat(pics));
    setLoadMoreButtonShown(loadMoreShown && pics.length > 0);
    setLoadingMore(false);
  }
}
