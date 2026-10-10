import React, { useEffect, useState } from 'react';
import { css } from '@emotion/css';
import { Color } from '~/constants/css';
import { useAppContext } from '~/contexts';
import { describeModeration } from './replyTargetSummary';

// The quoted moderator-action notice: "Deleted post by PigBar: 1111…". It
// reads the record and the removed content through the same requests the
// notice card itself makes, so a quote shows no more than the notice does.
export default function ModerationTargetDetail({
  modificationId
}: {
  modificationId: number;
}) {
  const loadModificationItem = useAppContext(
    (v) => v.requestHelpers.loadModificationItem
  );
  const loadDeletedContent = useAppContext(
    (v) => v.requestHelpers.loadDeletedContent
  );
  const loadDeletedMessage = useAppContext(
    (v) => v.requestHelpers.loadDeletedMessage
  );
  const [text, setText] = useState('');

  useEffect(() => {
    let cancelled = false;
    void load();
    return () => {
      cancelled = true;
    };

    async function load() {
      try {
        const item = await loadModificationItem(modificationId);
        if (!item?.contentId || !item?.contentType) return;
        const isChat = item.contentType === 'chat';
        const content = isChat
          ? await loadDeletedMessage(item.contentId)
          : await loadDeletedContent({
              contentId: item.contentId,
              contentType: item.contentType
            });
        if (cancelled) return;
        setText(
          describeModeration({
            action: item.action,
            isChat,
            author: content?.uploader?.username,
            body:
              content?.content ||
              content?.title ||
              content?.description ||
              content?.fileName
          })
        );
      } catch (error) {
        console.error(error);
      }
    }
    // Context request helpers are stable.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [modificationId]);

  if (!text) return null;
  return (
    <div
      className={css`
        color: ${Color.darkGray()};
        font-size: 1.1rem;
        font-weight: 700;
        overflow-wrap: anywhere;
      `}
    >
      {text}
    </div>
  );
}
