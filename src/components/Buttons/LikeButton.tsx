import React, { memo, useMemo, useState } from 'react';
import Button from '~/components/Button';
import Icon from '~/components/Icon';
import ErrorBoundary from '~/components/ErrorBoundary';
import { Theme } from '~/constants/css';
import { useAppContext, useContentContext, useKeyContext } from '~/contexts';
const likeLabel = 'Like';
const likedLabel = 'Liked';

function LikeButton({
  className,
  contentId,
  contentType,
  filled,
  likes,
  labelClassName,
  hideLabel,
  style,
  theme,
  onClick = () => null
}: {
  className?: string;
  contentId: number;
  contentType: string;
  filled?: boolean;
  likes: Array<{ id: number }>;
  labelClassName?: string;
  hideLabel?: boolean;
  style?: React.CSSProperties;
  theme?: string;
  onClick: (v?: any) => void;
}) {
  const likeContent = useAppContext((v) => v.requestHelpers.likeContent);
  const onLikeContent = useContentContext((v) => v.actions.onLikeContent);
  const userId = useKeyContext((v) => v.myState.userId);
  const profileTheme = useKeyContext((v) => v.myState.profileTheme);
  const [loading, setLoading] = useState(false);
  const liked = useMemo(() => {
    let userLikedThis = false;
    for (let i = 0; i < likes.length; i++) {
      if (likes[i].id === userId) userLikedThis = true;
    }
    return userLikedThis;
  }, [likes, userId]);
  const {
    likeButton: { color: likeButtonColor },
    likeButtonPressed: { color: likeButtonPressedColor }
  } = Theme(theme || profileTheme);

  return (
    <ErrorBoundary componentPath="LikeButton">
      <Button
        loading={loading}
        className={className}
        color={(filled && liked) || !filled ? likeButtonPressedColor : likeButtonColor}
        variant={filled || liked ? 'solid' : 'soft'}
        tone="raised"
        style={style}
        onClick={async () => {
          try {
            setLoading(true);
            const newLikes = await likeContent({
              id: contentId,
              contentType
            });
            if (userId) {
              onLikeContent({ likes: newLikes, contentType, contentId });
              onClick({ likes: newLikes, isUnlike: liked });
            }
          } catch (error) {
            console.error(error);
          } finally {
            setLoading(false);
          }
        }}
      >
        <Icon icon="thumbs-up" />
        {!hideLabel && (
          <span className={labelClassName} style={{ marginLeft: '0.7rem' }}>
            {liked ? `${likedLabel}!` : likeLabel}
          </span>
        )}
      </Button>
    </ErrorBoundary>
  );
}

export default memo(LikeButton);
