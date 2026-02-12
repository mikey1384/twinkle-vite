import React, { useEffect, useState } from 'react';
import Modal from '~/components/Modal';
import Button from '~/components/Button';
import Icon from '~/components/Icon';
import Loading from '~/components/Loading';
import { useAppContext } from '~/contexts';
import { css } from '@emotion/css';
import { Color } from '~/constants/css';

export default function WallpaperPickerModal({
  currentBuildId,
  onSetWallpaper,
  onHide
}: {
  currentBuildId: number | null;
  onSetWallpaper: (buildId: number | null) => void;
  onHide: () => void;
}) {
  const loadMyBuilds = useAppContext((v) => v.requestHelpers.loadMyBuilds);
  const [builds, setBuilds] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState<number | null>(
    currentBuildId
  );

  useEffect(() => {
    handleLoad();
    async function handleLoad() {
      const data = await loadMyBuilds();
      if (data) {
        const withCode = (data || []).filter(
          (b: any) => b.code && b.code.trim().length > 0
        );
        setBuilds(withCode);
      }
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const hasChanged = selectedId !== currentBuildId;

  return (
    <Modal
      isOpen
      onClose={onHide}
      title="Choose Wallpaper"
      size="md"
      footer={
        <div
          style={{
            display: 'flex',
            justifyContent: 'flex-end',
            gap: '1rem',
            width: '100%'
          }}
        >
          <Button
            variant="solid"
            tone="raised"
            color="darkerGray"
            onClick={onHide}
          >
            Cancel
          </Button>
          <Button
            variant="solid"
            tone="raised"
            color="blue"
            disabled={!hasChanged}
            onClick={() => onSetWallpaper(selectedId)}
          >
            Set
          </Button>
        </div>
      }
    >
      {loading ? (
        <Loading />
      ) : builds.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '2rem' }}>
          <p>Create a build to use as your wallpaper.</p>
        </div>
      ) : (
        <div>
          {currentBuildId && (
            <div
              onClick={() => setSelectedId(null)}
              className={css`
                padding: 1rem;
                margin-bottom: 1rem;
                border: 2px solid
                  ${selectedId === null ? Color.blue() : Color.borderGray()};
                border-radius: 0.5rem;
                cursor: pointer;
                display: flex;
                align-items: center;
                gap: 0.7rem;
                background: ${selectedId === null
                  ? Color.highlightGray()
                  : '#fff'};
                &:hover {
                  background: ${Color.highlightGray()};
                }
              `}
            >
              <Icon icon="times-circle" />
              <span>Clear Wallpaper</span>
            </div>
          )}
          <div
            className={css`
              display: flex;
              flex-direction: column;
              gap: 0.5rem;
              max-height: 50vh;
              overflow-y: auto;
            `}
          >
            {builds.map((build: any) => (
              <div
                key={build.id}
                onClick={() => setSelectedId(build.id)}
                className={css`
                  padding: 1rem;
                  border: 2px solid
                    ${selectedId === build.id
                      ? Color.blue()
                      : Color.borderGray()};
                  border-radius: 0.5rem;
                  cursor: pointer;
                  display: flex;
                  align-items: center;
                  gap: 1rem;
                  background: ${selectedId === build.id
                    ? Color.highlightGray()
                    : '#fff'};
                  &:hover {
                    background: ${Color.highlightGray()};
                  }
                `}
              >
                {build.thumbnailUrl ? (
                  <img
                    src={build.thumbnailUrl}
                    alt=""
                    className={css`
                      width: 4rem;
                      height: 3rem;
                      object-fit: cover;
                      border-radius: 0.3rem;
                    `}
                  />
                ) : (
                  <div
                    className={css`
                      width: 4rem;
                      height: 3rem;
                      display: flex;
                      align-items: center;
                      justify-content: center;
                      background: ${Color.highlightGray()};
                      border-radius: 0.3rem;
                    `}
                  >
                    <Icon icon="code" />
                  </div>
                )}
                <span style={{ fontWeight: 'bold' }}>{build.title}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </Modal>
  );
}
