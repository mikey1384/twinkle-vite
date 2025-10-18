import React, { useEffect, useMemo, useState } from 'react';
import Link from '~/components/Link';
import { Color } from '~/constants/css';
import { css } from '@emotion/css';
import { useAppContext, useContentContext } from '~/contexts';
import { useContentState } from '~/helpers/hooks';
import { useRoleColor } from '~/theme/useRoleColor';

export default function AlreadyPosted({
  contentId,
  contentType,
  changingPage,
  style,
  uploaderId,
  url,
  videoCode
}: {
  contentId: number;
  contentType: 'url' | 'video';
  changingPage?: boolean;
  style?: React.CSSProperties;
  uploaderId?: number;
  url?: string;
  videoCode?: string;
}) {
  const { getColor: getByThisUserColor } = useRoleColor(
    'alreadyPostedByThisUser',
    {
      fallback: 'orange',
      opacity: 1
    }
  );
  const { getColor: getByOtherUserColor } = useRoleColor(
    'alreadyPostedByOtherUser',
    {
      fallback: 'logoBlue',
      opacity: 1
    }
  );
  const checkContentUrl = useAppContext(
    (v) => v.requestHelpers.checkContentUrl
  );
  const onSetExistingContent = useContentContext(
    (v) => v.actions.onSetExistingContent
  );
  const { existingContent, byUser } = useContentState({
    contentType,
    contentId
  });
  const [loading, setLoading] = useState(false);
  const show = useMemo(() => {
    return (
      !changingPage &&
      !loading &&
      existingContent?.id &&
      existingContent.id !== contentId &&
      !(byUser && uploaderId !== existingContent.uploader)
    );
  }, [byUser, changingPage, contentId, existingContent, loading, uploaderId]);

  useEffect(() => {
    if (!existingContent && uploaderId) {
      checkExists();
    }

    async function checkExists() {
      setLoading(true);
      const { content } = await checkContentUrl({
        contentType,
        url,
        videoCode
      });
      onSetExistingContent({ contentId, contentType, content });
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [url, uploaderId]);

  return show ? (
    <div
      style={{
        fontSize: '1.6rem',
        padding: '1rem',
        color: '#fff',
        backgroundColor:
          uploaderId !== existingContent.uploader
            ? getByOtherUserColor() || Color.logoBlue()
            : getByThisUserColor() || Color.orange(),
        ...style
      }}
      className={css`
        > a {
          color: #fff;
          font-weight: bold;
        }
      `}
    >
      This content has{' '}
      <Link
        style={{ fontWeight: 'bold' }}
        to={`/${contentType === 'url' ? 'link' : 'video'}s/${
          existingContent.id
        }`}
      >
        already been posted before
        {uploaderId !== existingContent.uploader ? ' by someone else' : ''}
      </Link>
    </div>
  ) : null;
}
