import React, { useEffect, useRef, useState } from 'react';
import Modal from '~/components/Modal';
import Button from '~/components/Button';
import Icon from '~/components/Icon';
import TopicRequestStatus from '~/containers/Chat/Modals/TopicRequestStatus';
import {
  chatTopicModalClass,
  chatTopicSectionClass,
  chatTopicThemeStyle
} from '~/containers/Chat/Modals/topicStyles';
import { useAppContext } from '~/contexts';
import {
  AI_IMAGE_COLLECTION_NAME_MAX,
  type AIImageCollection
} from '~/helpers/aiImageHistory';
import CollectionRow from './CollectionRow';
import CollectionSettingsModal from './CollectionSettingsModal';
import NoCollectionYet from './NoCollectionYet';
import StartCollectionForm from './StartCollectionForm';

// The Zero/Ciel "Topics" window (Chat Modals/TopicSelectorModal), for image
// collections: start one by name, then each row has Settings and Use, and
// the one in use says "Current:". Everything shown comes from the server.
export default function CollectionsModal({
  activeCollectionId,
  themeColor = 'logoBlue',
  modalLevel = 3,
  onHide,
  onUse,
  onCollectionChanged,
  onCollectionDeleted,
  onCollectionsChange
}: {
  activeCollectionId: number | null;
  themeColor?: string;
  modalLevel?: number;
  onHide: () => void;
  onUse: (collection: AIImageCollection) => void;
  onCollectionChanged: (collection: AIImageCollection) => void;
  onCollectionDeleted: (id: number) => void;
  // the canonical list, whenever it changes (the bar's chips follow it)
  onCollectionsChange?: (collections: AIImageCollection[]) => void;
}) {
  const loadAIImageCollections = useAppContext(
    (v) => v.requestHelpers.loadAIImageCollections
  );
  const createAIImageCollection = useAppContext(
    (v) => v.requestHelpers.createAIImageCollection
  );
  const [collections, setCollections] = useState<AIImageCollection[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [loadError, setLoadError] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const [newName, setNewName] = useState('');
  const [starting, setStarting] = useState(false);
  const [startError, setStartError] = useState('');
  const [editingId, setEditingId] = useState<number | null>(null);
  // a just-started collection opens its settings on the picture picker
  const [pickOnOpen, setPickOnOpen] = useState(false);
  const startingRef = useRef(false);

  useEffect(() => {
    let ignore = false;
    setLoadError(false);
    loadAIImageCollections({ fresh: true })
      .then((data: { collections: AIImageCollection[] }) => {
        if (ignore) return;
        setCollections(data?.collections || []);
        setLoaded(true);
      })
      .catch((error: unknown) => {
        console.error(error);
        if (!ignore) setLoadError(true);
      });
    return () => {
      ignore = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [retryCount]);

  useEffect(() => {
    if (loaded) onCollectionsChange?.(collections);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [collections, loaded]);

  const empty = loaded && !collections.length;
  const editing = collections.find((c) => c.id === editingId) || null;
  const startForm = (
    <StartCollectionForm
      label={empty ? 'Collection name' : 'Start a Collection'}
      value={newName}
      onChange={setNewName}
      starting={starting}
      error={startError}
      themeColor={themeColor}
      onStart={handleStart}
    />
  );

  return (
    <Modal
      modalKey="ImageCollectionsModal"
      aria-label="Collections"
      className={chatTopicModalClass}
      isOpen
      onClose={onHide}
      title="Collections"
      size="md"
      modalLevel={modalLevel}
      footer={
        <Button variant="ghost" onClick={onHide}>
          Close
        </Button>
      }
    >
      <div
        style={{
          width: '100%',
          fontSize: 'calc(16 * var(--px))',
          ...chatTopicThemeStyle(themeColor)
        }}
      >
        {loadError ? (
          <TopicRequestStatus
            message="Couldn't load your collections. Please try again."
            onRetry={() => setRetryCount((count) => count + 1)}
          />
        ) : !loaded ? (
          <p style={{ textAlign: 'center', color: '#526176' }}>
            <Icon icon="spinner" pulse /> Loading your collections…
          </p>
        ) : empty ? (
          <NoCollectionYet>{startForm}</NoCollectionYet>
        ) : (
          <>
            {startForm}
            <h3 className={chatTopicSectionClass}>My Collections</h3>
            {collections.map((collection) => (
              <CollectionRow
                key={collection.id}
                collection={collection}
                isCurrent={collection.id === activeCollectionId}
                onSettings={() => {
                  setPickOnOpen(false);
                  setEditingId(collection.id);
                }}
                onUse={() => onUse(collection)}
              />
            ))}
          </>
        )}
      </div>
      {editing && (
        <CollectionSettingsModal
          collection={editing}
          themeColor={themeColor}
          modalLevel={modalLevel + 1}
          openPickerFirst={pickOnOpen}
          onHide={() => setEditingId(null)}
          onSaved={handleSaved}
          onDeleted={handleDeleted}
        />
      )}
    </Modal>
  );

  async function handleStart() {
    const name = newName.trim();
    if (
      startingRef.current ||
      !name ||
      newName.length > AI_IMAGE_COLLECTION_NAME_MAX
    ) {
      return;
    }
    startingRef.current = true;
    setStarting(true);
    setStartError('');
    try {
      const { collection } = await createAIImageCollection({ name });
      setCollections((current) => [
        collection,
        ...current.filter((c) => c.id !== collection.id)
      ]);
      setNewName('');
      setPickOnOpen(true);
      setEditingId(collection.id);
    } catch (error: any) {
      console.error(error);
      setStartError(
        error?.message || "Couldn't start this collection. Please try again."
      );
    } finally {
      startingRef.current = false;
      setStarting(false);
    }
  }

  function handleSaved(collection: AIImageCollection) {
    setCollections((current) =>
      current.map((c) => (c.id === collection.id ? collection : c))
    );
    onCollectionChanged(collection);
  }

  function handleDeleted(id: number) {
    setCollections((current) => current.filter((c) => c.id !== id));
    setEditingId(null);
    onCollectionDeleted(id);
  }
}
