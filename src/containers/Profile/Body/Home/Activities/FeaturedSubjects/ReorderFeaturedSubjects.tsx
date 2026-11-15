import React, { useMemo, useState } from 'react';
import Modal from '~/components/Modal';
import Button from '~/components/Button';
import SortableListGroup from '~/components/SortableListGroup';
import { isEqual } from 'lodash';
import { useAppContext } from '~/contexts';
import { useRoleColor } from '~/theme/hooks/useRoleColor';
import { Color } from '~/constants/css';
import { getPlainPreviewText } from '~/helpers/stringHelpers';
import { profileFeaturedItemKey } from '~/helpers/profileFeatured';

// Featured subjects and comments are ordered together. Keys are "type:id"
// because a subject and a comment can share an id.
export default function ReorderFeaturedSubjects({
  items,
  onHide,
  onSubmit
}: {
  items: any[];
  onHide: () => void;
  onSubmit: (saved: { items: any[]; refs?: any[] }) => void;
}) {
  const doneRole = useRoleColor('done', { fallback: 'blue' });
  const doneColor = useMemo(
    () => doneRole.getColor() || Color.blue(),
    [doneRole]
  );
  const saveProfileFeaturedItems = useAppContext(
    (v) => v.requestHelpers.saveProfileFeaturedItems
  );
  const initialKeys = useMemo(() => items.map(profileFeaturedItemKey), [items]);
  const itemObj = useMemo(() => {
    const result: Record<string, any> = {};
    for (const item of items) {
      result[profileFeaturedItemKey(item)] = {
        label:
          item?.contentType === 'comment'
            ? getCommentLabel(item)
            : item?.title || ''
      };
    }
    return result;
  }, [items]);
  const [itemKeys, setItemKeys] = useState<string[]>(initialKeys);
  const [isReordering, setIsReordering] = useState(false);

  return (
    <Modal
      modalKey="ReorderFeaturedSubjects"
      isOpen
      onClose={onHide}
      title="Reorder Featured"
      footer={
        <>
          <Button variant="ghost" onClick={onHide}>
            Cancel
          </Button>
          <Button
            disabled={isEqual(itemKeys, initialKeys)}
            loading={isReordering}
            color={doneColor}
            onClick={handleSubmit}
          >
            Done
          </Button>
        </>
      }
    >
      <SortableListGroup<string>
        listItemObj={itemObj}
        itemIds={itemKeys}
        onMove={handleMove}
      />
    </Modal>
  );

  function handleMove({
    sourceId,
    targetId
  }: {
    sourceId: string;
    targetId: string;
  }) {
    const sourceIndex = itemKeys.indexOf(sourceId);
    const targetIndex = itemKeys.indexOf(targetId);
    const nextKeys = [...itemKeys];
    nextKeys.splice(sourceIndex, 1);
    nextKeys.splice(targetIndex, 0, sourceId);
    setItemKeys(nextKeys);
  }

  async function handleSubmit() {
    setIsReordering(true);
    try {
      const saved = await saveProfileFeaturedItems(
        itemKeys.map((key) => {
          const [contentType, contentId] = key.split(':');
          return {
            contentType: contentType as 'subject' | 'comment',
            contentId: Number(contentId)
          };
        })
      );
      onSubmit({ items: saved?.items || [], refs: saved?.refs });
    } catch (error) {
      console.error('Error while reordering featured profile items:', error);
    } finally {
      setIsReordering(false);
    }
  }
}

// Plain text like every other reorder list; "Comment:" tells the two apart.
function getCommentLabel(comment: any) {
  if (comment?.secretHidden) return 'Comment: secret';
  const text = getPlainPreviewText(String(comment?.content || '')).trim();
  if (!text) return 'Comment';
  return `Comment: ${text.length > 80 ? `${text.slice(0, 80).trimEnd()}…` : text}`;
}
