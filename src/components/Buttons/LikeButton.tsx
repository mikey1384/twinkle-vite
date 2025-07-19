import React, { memo, useMemo, useState } from 'react';
import PropTypes from 'prop-types';
import Button from '~/components/Button';
import Icon from '~/components/Icon';
import ErrorBoundary from '~/components/ErrorBoundary';
import { Theme } from '~/constants/css';
import { useAppContext, useContentContext, useKeyContext } from '~/contexts';
import localize from '~/constants/localize';

const likeLabel = localize('like');
const likedLabel = localize('liked');

LikeButton.propTypes = {
  className: PropTypes.string,
  contentId: PropTypes.number.isRequired,
  contentType: PropTypes.string.isRequired,
  filled: PropTypes.bool,
  likes: PropTypes.array.isRequired,
  style: PropTypes.object,
  theme: PropTypes.string,
  onClick: PropTypes.func
};
function LikeButton({
  className,
  contentId,
  contentType,
  filled,
  likes,
  style,
  theme,
  onClick = () => null
}: {
  className?: string;
  contentId: number;
  contentType: string;
  filled?: boolean;
  likes: Array<{ id: number }>;
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
        color={
          (filled && liked) || !filled
            ? likeButtonPressedColor
            : likeButtonColor
        }
        filled={filled || liked}
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
        <span style={{ marginLeft: '0.7rem' }}>
          {liked ? `${likedLabel}!` : likeLabel}
        </span>
      </Button>
    </ErrorBoundary>
  );
}

export default memo(LikeButton);
