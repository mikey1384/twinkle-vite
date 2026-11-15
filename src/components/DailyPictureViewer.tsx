import React, { useEffect, useState } from 'react';
import Button from '~/components/Button';
import Icon from '~/components/Icon';
import ImageModal from '~/components/Modals/ImageModal';
import { Color } from '~/constants/css';
import { cloudFrontURL } from '~/constants/defaultValues';
import { useAppContext, useContentContext, useKeyContext } from '~/contexts';

// Picture Day pictures open in the site's standard image viewer (Mikey
// 11-15), like every other picture: Download and Edit Image in its footer.
// For the member's OWN picture the editor gets one more button that makes
// the edit the reflection's picture. The edit is paid from their AI Battery
// by the editor itself; the server keeps the original among the day's
// pictures, so the member can go back to it.
export type DailyPictureSurface = 'result' | 'post' | 'gallery';

export interface DailyPictureChange {
  picturePath: string;
  pictureStyle: string;
  previousPath: string | null;
}

const USE_LABEL = 'Use for my reflection';

export function useDailyPicture({
  picturePath,
  pictureStyle = '',
  responseId,
  ownerId,
  surface
}: {
  picturePath: string;
  pictureStyle?: string | null;
  responseId?: number | null;
  ownerId?: number | null;
  surface: DailyPictureSurface;
}) {
  const myId = useKeyContext((v) => v.myState.userId);
  const applyDailyPicture = useAppContext(
    (v) => v.requestHelpers.applyDailyPicture
  );
  const trackDailyPictureEdit = useAppContext(
    (v) => v.requestHelpers.trackDailyPictureEdit
  );
  const onEditContent = useContentContext((v) => v.actions.onEditContent);
  const isOwner =
    !!myId && !!responseId && !!ownerId && Number(myId) === Number(ownerId);
  // the canonical answer of this screen's last change, until the shown
  // copy catches up with it
  const [changed, setChanged] = useState<DailyPictureChange | null>(null);
  // the picture before this visit's first edit, to go back to
  const [originalPath, setOriginalPath] = useState<string | null>(null);
  const [viewerOpen, setViewerOpen] = useState(false);
  const [restoring, setRestoring] = useState(false);
  const [restoreError, setRestoreError] = useState('');

  useEffect(() => {
    setChanged((prev) =>
      prev && prev.picturePath !== picturePath ? null : prev
    );
  }, [picturePath]);

  const shownPath = changed?.picturePath || picturePath;
  const shownStyle = changed ? changed.pictureStyle : pictureStyle || '';

  async function apply(args: {
    editRequestId?: string;
    path?: string;
  }): Promise<string | null> {
    if (!isOwner || !responseId) return 'This picture is not yours to change.';
    try {
      const result = await applyDailyPicture({
        responseId,
        surface,
        ...args
      });
      if (!result?.picturePath) {
        return result?.error || "Couldn't change your picture. Please try again.";
      }
      const next: DailyPictureChange = {
        picturePath: result.picturePath,
        pictureStyle: result.pictureStyle || '',
        previousPath: result.previousPath || null
      };
      // every surface showing this reflection reads it from the store
      onEditContent({
        contentType: 'dailyReflection',
        contentId: responseId,
        data: {
          picturePath: next.picturePath,
          pictureStyle: next.pictureStyle
        }
      });
      setChanged(next);
      if (args.path && args.path === originalPath) {
        setOriginalPath(null);
      } else if (!originalPath && next.previousPath) {
        setOriginalPath(next.previousPath);
      }
      return null;
    } catch (error: any) {
      return error?.message || "Couldn't change your picture. Please try again.";
    }
  }

  async function restoreOriginal() {
    if (!originalPath || restoring) return;
    setRestoring(true);
    setRestoreError('');
    const error = await apply({ path: originalPath });
    if (error) setRestoreError(error);
    setRestoring(false);
  }

  const viewer = viewerOpen ? (
    <DailyPictureModal
      picturePath={shownPath}
      responseId={responseId}
      isOwner={isOwner}
      onApply={apply}
      onTrack={(event) => void trackDailyPictureEdit({ surface, event })}
      onHide={() => setViewerOpen(false)}
    />
  ) : null;

  return {
    isOwner,
    shownPath,
    shownStyle,
    openViewer: () => setViewerOpen(true),
    viewer,
    canRestoreOriginal: isOwner && !!originalPath && originalPath !== shownPath,
    restoreOriginal,
    restoring,
    restoreError,
    apply
  };
}

// The standard image viewer for one Picture Day picture. isCurrent false (the
// private gallery's other pictures) adds a direct "Use for my reflection".
export function DailyPictureModal({
  picturePath,
  responseId,
  caption,
  isOwner,
  isCurrent = true,
  onApply,
  onTrack,
  onHide
}: {
  picturePath: string;
  // the reflection, so an edit names the picture it was made from
  responseId?: number | null;
  caption?: string;
  isOwner: boolean;
  isCurrent?: boolean;
  onApply: (args: { editRequestId?: string; path?: string }) => Promise<string | null>;
  onTrack?: (event: 'opened' | 'started' | 'completed' | 'failed') => void;
  onHide: () => void;
}) {
  const [using, setUsing] = useState(false);
  const [useError, setUseError] = useState('');
  return (
    <ImageModal
      onHide={onHide}
      src={`${cloudFrontURL}/${picturePath}`}
      caption={caption}
      hasCaption={!!caption}
      downloadable
      onEditEvent={onTrack}
      editedImageAction={
        isOwner
          ? {
              label: USE_LABEL,
              onUse: (requestId) => onApply({ editRequestId: requestId }),
              ...(responseId
                ? { editSource: { responseId, path: picturePath } }
                : {})
            }
          : undefined
      }
      extraActions={
        isOwner && !isCurrent ? (
          <>
            <Button
              color="green"
              loading={using}
              onClick={handleUseThisPicture}
            >
              <Icon icon="check" />
              <span style={{ marginLeft: '0.5rem' }}>{USE_LABEL}</span>
            </Button>
            {useError && (
              <span role="alert" style={{ color: Color.rose(), fontWeight: 600 }}>
                {useError}
              </span>
            )}
          </>
        ) : null
      }
    />
  );

  async function handleUseThisPicture() {
    if (using) return;
    setUsing(true);
    setUseError('');
    const error = await onApply({ path: picturePath });
    setUsing(false);
    if (error) {
      setUseError(error);
      return;
    }
    onHide();
  }
}
