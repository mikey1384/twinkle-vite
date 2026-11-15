import React, { useEffect, useMemo, useState } from 'react';
import Modal from '~/components/Modal';
import Button from '~/components/Button';
import Loading from '~/components/Loading';
import SortableListGroup from '~/components/SortableListGroup';
import { isEqual } from 'lodash';
import { useAppContext } from '~/contexts';
import { useRoleColor } from '~/theme/hooks/useRoleColor';
import { Color } from '~/constants/css';
import { getPlainPreviewText } from '~/helpers/stringHelpers';
import { profileFeaturedItemKey } from '~/helpers/profileFeatured';
import Banner from '~/components/Banner';
import {
  FEATURED_STALE_CODE,
  useFeaturedManageList
} from './useFeaturedManageList';

// Featured subjects and comments are ordered together. Keys are "type:id"
// because a subject and a comment can share an id. The list is the owner's
// whole stored list (useFeaturedManageList), unavailable entries included.
export default function ReorderFeaturedSubjects({
  onHide,
  onSubmit
}: {
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
  const manage = useFeaturedManageList();
  const initialKeys = manage.keys;
  const itemObj = useMemo(() => {
    const result: Record<string, any> = {};
    for (const item of manage.items) {
      result[profileFeaturedItemKey(item)] = {
        unavailable: !!item?.unavailable,
        label: item?.unavailable
          ? `Unavailable ${item?.contentType === 'comment' ? 'comment' : 'subject'}`
          : item?.contentType === 'comment'
            ? getCommentLabel(item)
            : item?.title || ''
      };
    }
    return result;
  }, [manage.items]);
  const [itemKeys, setItemKeys] = useState<string[]>([]);
  const [isReordering, setIsReordering] = useState(false);
  const [notice, setNotice] = useState('');

  // every (re)load starts from the server's list
  useEffect(() => {
    setItemKeys(manage.keys);
  }, [manage.keys, manage.version]);

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
            disabled={!manage.loaded || isEqual(itemKeys, initialKeys)}
            loading={isReordering}
            color={doneColor}
            onClick={handleSubmit}
          >
            Done
          </Button>
        </>
      }
    >
      {(notice || manage.loadError) && (
        <Banner style={{ marginBottom: '1.5rem', fontSize: '1.4rem' }}>
          {notice || manage.loadError}
        </Banner>
      )}
      {!manage.loaded ? (
        <Loading />
      ) : (
        <SortableListGroup<string>
          listItemObj={itemObj}
          itemIds={itemKeys}
          onMove={handleMove}
          renderItemActions={(item, key) =>
            item?.unavailable ? (
              <Button
                variant="ghost"
                size="sm"
                color="rose"
                onClick={() =>
                  setItemKeys((current) => current.filter((k) => k !== key))
                }
              >
                Remove
              </Button>
            ) : null
          }
        />
      )}
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
    setNotice('');
    try {
      const saved = await saveProfileFeaturedItems(
        itemKeys.map((key) => {
          const [contentType, contentId] = key.split(':');
          return {
            contentType: contentType as 'subject' | 'comment',
            contentId: Number(contentId)
          };
        }),
        manage.revision
      );
      onSubmit({ items: saved?.items || [], refs: saved?.refs });
    } catch (error: any) {
      if (error?.code === FEATURED_STALE_CODE) {
        // changed in another tab or from a comment's menu: start over from it
        setNotice(error.message);
        await manage.reload();
      } else {
        console.error('Error while reordering featured profile items:', error);
        setNotice(error?.message || "Couldn't save. Please try again.");
      }
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
