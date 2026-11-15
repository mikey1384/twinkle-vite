import React, { useEffect, useRef, useState } from 'react';
import Modal from '~/components/Modal';
import Button from '~/components/Button';
import Icon from '~/components/Icon';
import {
  chatTopicButtonStyle,
  chatTopicModalClass
} from '~/containers/Chat/Modals/topicStyles';
import { useAppContext } from '~/contexts';
import {
  AI_IMAGE_COLLECTION_IMAGES_MAX,
  mergeAIImageHistoryPages,
  type AIImageCollection,
  type AIImageHistoryItem
} from '~/helpers/aiImageHistory';
import ImageHistory from '../ImageHistory';

const PAGE_SIZE = 18;

// Choosing a collection's pictures from My Images: the same grid as the
// My Images tab (ImageHistory), where a tap picks or unpicks a picture.
export default function CollectionPicturePicker({
  initialImages,
  themeColor = 'logoBlue',
  modalLevel = 5,
  onHide,
  onDone
}: {
  initialImages: AIImageCollection['images'];
  themeColor?: string;
  modalLevel?: number;
  onHide: () => void;
  onDone: (images: AIImageCollection['images']) => void;
}) {
  const loadAIImageHistory = useAppContext(
    (v) => v.requestHelpers.loadAIImageHistory
  );
  const loadAIImageHistoryImage = useAppContext(
    (v) => v.requestHelpers.loadAIImageHistoryImage
  );
  const [picked, setPicked] = useState(initialImages);
  const [images, setImages] = useState<AIImageHistoryItem[]>([]);
  const [nextBefore, setNextBefore] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);
  const [fullNotice, setFullNotice] = useState(false);
  const loadingRef = useRef(false);

  useEffect(() => {
    void loadPage(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <Modal
      modalKey="ImageCollectionPicturePicker"
      isOpen
      onClose={onHide}
      size="lg"
      modalLevel={modalLevel}
      title="Choose Pictures"
      aria-label="Choose pictures for this collection"
      className={chatTopicModalClass}
      footer={
        <>
          <Button variant="ghost" onClick={onHide}>
            Cancel
          </Button>
          <Button
            color={themeColor}
            style={chatTopicButtonStyle(themeColor)}
            onClick={() => onDone(picked)}
          >
            Done
          </Button>
        </>
      }
    >
      <ImageHistory
        images={images}
        loading={loading}
        failed={failed}
        hasMore={!!nextBefore}
        selectingId={null}
        selectDisabled={false}
        themeColor={themeColor}
        pickedIds={picked.map((image) => image.id)}
        intro={
          fullNotice ? (
            <>
              <Icon icon="images" /> A collection holds up to{' '}
              {AI_IMAGE_COLLECTION_IMAGES_MAX} pictures. Tap a picked one to
              take it out.
            </>
          ) : (
            <>
              <Icon icon="images" /> Tap pictures of your characters to add
              them ({picked.length}/{AI_IMAGE_COLLECTION_IMAGES_MAX}).
            </>
          )
        }
        emptyMessage="Make a picture first. Then you can add it to a collection."
        onLoadMore={() => loadPage(nextBefore)}
        onRetry={() => loadPage(images.length ? nextBefore : null)}
        onSelect={handleToggle}
        onLoadFullImage={loadFullImage}
      />
    </Modal>
  );

  function handleToggle(image: AIImageHistoryItem) {
    if (image.status !== 'completed' || !image.path) return;
    if (picked.some((item) => item.id === image.id)) {
      setFullNotice(false);
      setPicked(picked.filter((item) => item.id !== image.id));
      return;
    }
    if (picked.length >= AI_IMAGE_COLLECTION_IMAGES_MAX) {
      setFullNotice(true);
      return;
    }
    setPicked([...picked, { id: image.id, path: image.path }]);
  }

  async function loadPage(before: number | null) {
    if (loadingRef.current) return;
    loadingRef.current = true;
    setLoading(true);
    setFailed(false);
    try {
      const data = await loadAIImageHistory({ before, limit: PAGE_SIZE });
      const page: AIImageHistoryItem[] = (data?.images || []).filter(
        (image: AIImageHistoryItem) => image.status === 'completed'
      );
      setImages((current) =>
        before ? mergeAIImageHistoryPages(current, page) : page
      );
      setNextBefore(data?.nextBefore || null);
    } catch (error) {
      console.error('Failed to load pictures:', error);
      setFailed(true);
    } finally {
      loadingRef.current = false;
      setLoading(false);
    }
  }

  async function loadFullImage(image: AIImageHistoryItem) {
    try {
      const data = await loadAIImageHistoryImage(image.id);
      return data?.imageUrl || null;
    } catch {
      return null;
    }
  }
}
