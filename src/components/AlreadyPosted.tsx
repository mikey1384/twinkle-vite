import React, { useEffect, useMemo, useState } from 'react';
import Banner from '~/components/Banner';
import Icon from '~/components/Icon';
import Link from '~/components/Link';
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
  const byThisUserRole = useRoleColor('alreadyPostedByThisUser', {
    fallback: 'orange',
    opacity: 1
  });
  const byOtherUserRole = useRoleColor('alreadyPostedByOtherUser', {
    fallback: 'logoBlue',
    opacity: 1
  });
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

  const postedByDifferentUser =
    typeof uploaderId === 'number' &&
    typeof existingContent?.uploader === 'number' &&
    uploaderId !== existingContent.uploader;
  const bannerColorKey = postedByDifferentUser
    ? byOtherUserRole.colorKey
    : byThisUserRole.colorKey;

  const textBlockClass = css`
    display: flex;
    flex-direction: column;
    gap: 0.4rem;
    line-height: 1.5;
    flex: 1;
    > strong {
      font-size: 1.6rem;
    }
    a {
      color: #fff;
      font-weight: 600;
      text-decoration: underline;
    }
  `;

  return show ? (
    <Banner
      color={bannerColorKey}
      style={{
        textAlign: 'left',
        justifyContent: 'flex-start',
        alignItems: 'center',
        gap: '1rem',
        margin: 0,
        width: '100%',
        ...style
      }}
    >
      <Icon
        icon={postedByDifferentUser ? 'clone' : 'history'}
        style={{ fontSize: '2.1rem', marginTop: '0.1rem' }}
      />
      <div className={textBlockClass}>
        <strong>
          {postedByDifferentUser
            ? 'Already shared on Twinkle'
            : 'You already posted this'}
        </strong>
        <span>
          This content has{' '}
          <Link
            to={`/${contentType === 'url' ? 'link' : 'video'}s/${
              existingContent.id
            }`}
          >
            already been posted before
            {postedByDifferentUser ? ' by someone else' : ''}
          </Link>
          .
        </span>
      </div>
    </Banner>
  ) : null;
}
