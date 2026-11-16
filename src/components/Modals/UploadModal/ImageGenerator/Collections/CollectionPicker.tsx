import React, { useState } from 'react';
import type { AIImageCollection } from '~/helpers/aiImageHistory';
import CollectionBar from './CollectionBar';
import CollectionsModal from './CollectionsModal';
import useAIImageCollections from './useAIImageCollections';
import { canAddCollection } from './collectionStarters';

// The collection bar and its Collections window, for every place a member
// makes or edits a picture with their own collections (Make Images and the
// image editor, which Picture Day edits use too). The parent owns which
// collections are picked, so its requests send exactly what the bar shows.
export default function CollectionPicker({
  userId,
  active,
  onChange,
  disabled,
  themeColor,
  invitePictures,
  modalLevel
}: {
  userId?: number | null;
  // the picked collections, in order
  active: AIImageCollection[];
  onChange: (next: AIImageCollection[]) => void;
  disabled?: boolean;
  themeColor?: string;
  invitePictures?: { id: number; path: string }[];
  modalLevel?: number;
}) {
  const { collections, setCollections } = useAIImageCollections(userId);
  const [shown, setShown] = useState(false);

  return (
    <>
      <CollectionBar
        activeCollections={active}
        collections={collections}
        invitePictures={invitePictures}
        disabled={disabled}
        themeColor={themeColor}
        onOpen={() => setShown(true)}
        onPick={(collection) => onChange([collection])}
        onClear={(id) => onChange(active.filter((item) => item.id !== id))}
      />
      {shown && (
        <CollectionsModal
          activeCollections={active}
          themeColor={themeColor}
          modalLevel={modalLevel}
          onHide={() => setShown(false)}
          onCollectionsChange={setCollections}
          onUse={(collection) => {
            onChange([collection]);
            setShown(false);
          }}
          onAdd={(collection) => {
            if (canAddCollection(active, collection)) {
              onChange([...active, collection]);
            }
            setShown(false);
          }}
          onCollectionChanged={(collection) => {
            if (!active.some((item) => item.id === collection.id)) return;
            onChange(
              active.map((item) =>
                item.id === collection.id ? collection : item
              )
            );
          }}
          onCollectionDeleted={(id) => {
            if (!active.some((item) => item.id === id)) return;
            onChange(active.filter((item) => item.id !== id));
          }}
        />
      )}
    </>
  );
}
