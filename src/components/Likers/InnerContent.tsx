import React, { useMemo, memo } from 'react';
import UsernameText from '~/components/Texts/UsernameText';
import ErrorBoundary from '~/components/ErrorBoundary';
import { useRoleColor } from '~/theme/useRoleColor';

function InnerContent({
  likes = [],
  userId,
  wordBreakEnabled,
  onLinkClick,
  target,
  defaultText = '',
  theme
}: {
  likes?: Array<{ id: number; username: string }>;
  userId: number;
  wordBreakEnabled?: boolean;
  onLinkClick: () => void;
  target?: string;
  defaultText?: string;
  theme?: any;
}) {
  const { color: linkColor } = useRoleColor('link', {
    themeName: theme,
    fallback: 'logoBlue'
  });
  const userLiked = useMemo(() => {
    for (const like of likes) {
      if (like?.id === userId) {
        return true;
      }
    }
    return false;
  }, [likes, userId]);

  const totalLikes = useMemo(() => {
    return userLiked ? likes.length - 1 : likes.length;
  }, [likes.length, userLiked]);

  const otherLikes = useMemo(
    () => likes.filter((like) => like?.id !== userId),
    [likes, userId]
  );

  if (userLiked) {
    if (totalLikes > 0) {
      if (totalLikes === 1) {
        const firstOtherLike = otherLikes[0];
        if (!firstOtherLike) return null;

        return (
          <ErrorBoundary componentPath="Likers/InnerContent/YouAndOneTotalLike/EN">
            <div key={`you-and-one-total-like-en-${totalLikes}`}>
              You and{' '}
              <UsernameText
                wordBreakEnabled={wordBreakEnabled}
                color={linkColor}
                user={{
                  id: firstOtherLike.id,
                  username: firstOtherLike.username
                }}
              />{' '}
              like {`this${target ? ' ' + target : ''}.`}
            </div>
          </ErrorBoundary>
        );
      } else {
        return (
          <ErrorBoundary componentPath="Likers/InnerContent/YouAndMultiTotalLikes/EN">
            <div key={`you-and-multi-total-likes-en-${totalLikes}`}>
              You and{' '}
            <a
              style={{
                cursor: 'pointer',
                fontWeight: 'bold',
                color: linkColor
              }}
              onClick={() => onLinkClick()}
            >
                {totalLikes} others
              </a>{' '}
              like {`this${target ? ' ' + target : ''}.`}
            </div>
          </ErrorBoundary>
        );
      }
    }
    return (
      <ErrorBoundary componentPath="Likers/InnerContent/YouLike/EN">
        <div key={`you-like-en-${totalLikes}`}>
          You like {`this${target ? ' ' + target : ''}.`}
        </div>
      </ErrorBoundary>
    );
  } else if (totalLikes > 0) {
    if (totalLikes === 1) {
      const firstLike = likes[0];
      if (!firstLike) return null;

      return (
        <ErrorBoundary componentPath="Likers/InnerContent/OneTotalLike/EN">
          <div key={`one-total-like-en-${totalLikes}`}>
            <UsernameText
              wordBreakEnabled={wordBreakEnabled}
              color={linkColor}
              user={firstLike}
            />{' '}
            likes {`this${target ? ' ' + target : ''}.`}
          </div>
        </ErrorBoundary>
      );
    } else {
      return (
        <ErrorBoundary componentPath="Likers/InnerContent/MultiTotalLikes/EN">
          <div key={`multi-total-likes-en-${totalLikes}`}>
            <a
              style={{
                cursor: 'pointer',
                fontWeight: 'bold',
                color: linkColor
              }}
              onClick={() => onLinkClick()}
            >
              {totalLikes} people
            </a>{' '}
            like {`this${target ? ' ' + target : ''}.`}
          </div>
        </ErrorBoundary>
      );
    }
  } else {
    return (
      <ErrorBoundary componentPath="Likers/InnerContent/Default">
        <div key={`default-text-${totalLikes}`}>{defaultText}</div>
      </ErrorBoundary>
    );
  }
}

export default memo(InnerContent, (prev, next) => {
  return (
    prev.likes?.length === next.likes?.length && prev.userId === next.userId
  );
});
