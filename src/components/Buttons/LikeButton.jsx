import PropTypes from 'prop-types';
import { memo, useMemo, useState } from 'react';
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
  contentType: PropTypes.string.isRequired,
  contentId: PropTypes.number.isRequired,
  filled: PropTypes.bool,
  likes: PropTypes.array,
  onClick: PropTypes.func,
  style: PropTypes.object,
  theme: PropTypes.string
};

function LikeButton({
  className,
  contentId,
  contentType,
  filled,
  likes,
  style,
  theme,
  onClick = () => {}
}) {
  const likeContent = useAppContext((v) => v.requestHelpers.likeContent);
  const onLikeContent = useContentContext((v) => v.actions.onLikeContent);
  const { userId, profileTheme } = useKeyContext((v) => v.myState);
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
        componentPath="LikeButton"
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
          }
          setLoading(false);
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
