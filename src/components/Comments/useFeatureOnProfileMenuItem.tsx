import React, { useEffect, useState } from 'react';
import Icon from '~/components/Icon';
import { useAppContext, useKeyContext, useProfileContext } from '~/contexts';
import { useToast } from '~/contexts/Toast';
import {
  applyMyProfileFeaturedRefs,
  ensureMyProfileFeaturedRefs,
  useMyProfileFeaturedRefs
} from '~/helpers/profileFeatured';

const featureLabel = 'Feature on my profile';
const removeLabel = 'Remove from profile';

// "Feature on my profile" / "Remove from profile" in a member's own comment
// menu. The label comes from the server's list (loaded once per member), the
// change is the server's answer (never assumed), and the notice after it
// can be tapped to undo, which puts a removed comment back in its old place.
export function useFeatureOnProfileMenuItem({
  comment,
  userIsUploader,
  labelMarginLeft = '1rem',
  style
}: {
  comment: any;
  userIsUploader: boolean;
  labelMarginLeft?: number | string;
  style?: React.CSSProperties;
}) {
  const userId = Number(useKeyContext((v) => v.myState.userId)) || 0;
  const username = useKeyContext((v) => v.myState.username);
  const loadMyProfileFeaturedRefs = useAppContext(
    (v) => v.requestHelpers.loadMyProfileFeaturedRefs
  );
  const setCommentFeaturedOnProfile = useAppContext(
    (v) => v.requestHelpers.setCommentFeaturedOnProfile
  );
  const onLoadFeaturedSubjects = useProfileContext(
    (v) => v.actions.onLoadFeaturedSubjects
  );
  const showToast = useToast();
  const [pending, setPending] = useState(false);
  const commentId = Number(comment?.id) || 0;
  const eligible =
    !!userId &&
    !!userIsUploader &&
    commentId > 0 &&
    !comment?.isDeleted &&
    !comment?.isDeleteNotification &&
    !comment?.isNotification &&
    !comment?.notFound;

  useEffect(() => {
    if (!eligible) return;
    ensureMyProfileFeaturedRefs({ userId, load: loadMyProfileFeaturedRefs });
  }, [eligible, loadMyProfileFeaturedRefs, userId]);

  const myFeatured = useMyProfileFeaturedRefs(userId);
  if (!eligible) return null;
  const featuredIndex = myFeatured.refs.findIndex(
    (ref) => ref.contentType === 'comment' && ref.contentId === commentId
  );
  const isFeatured = featuredIndex >= 0;

  return {
    label: (
      <>
        <Icon icon={pending ? 'spinner' : 'star'} pulse={pending} />
        <span style={{ marginLeft: labelMarginLeft }}>
          {isFeatured ? removeLabel : featureLabel}
        </span>
      </>
    ),
    disabled: !myFeatured.loaded || pending,
    onClick: () => handleToggle(!isFeatured, featuredIndex),
    style
  };

  async function saveFeatured(featured: boolean, position?: number) {
    setPending(true);
    try {
      const data = await setCommentFeaturedOnProfile({
        commentId,
        featured,
        position
      });
      applyMyProfileFeaturedRefs(userId, data?.refs);
      if (username && Array.isArray(data?.items)) {
        onLoadFeaturedSubjects({ username, subjects: data.items });
      }
      return data;
    } finally {
      setPending(false);
    }
  }

  async function handleToggle(featured: boolean, previousIndex: number) {
    try {
      await saveFeatured(featured);
      // the site's message toast; a tap on it undoes (as other toasts take
      // a tap to act). The toast stays up until it times out, so a second
      // tap must not undo again.
      let undone = false;
      showToast({
        message: featured
          ? 'Featured on your profile. Tap to undo.'
          : 'Removed from your profile. Tap to undo.',
        duration: 6000,
        onClick: () => {
          if (undone) return;
          undone = true;
          handleUndo(featured, previousIndex);
        }
      });
    } catch (error: any) {
      showToast({
        message: error?.message || 'Could not update your profile. Try again.'
      });
    }
  }

  async function handleUndo(featured: boolean, previousIndex: number) {
    try {
      await saveFeatured(!featured, featured ? undefined : previousIndex);
    } catch (error: any) {
      showToast({
        message: error?.message || 'Could not undo that. Try again.'
      });
    }
  }
}
