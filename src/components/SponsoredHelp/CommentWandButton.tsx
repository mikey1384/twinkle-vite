import React, { useContext, useEffect, useState } from 'react';
import Button from '~/components/Button';
import Icon from '~/components/Icon';
import LocalContext from '~/components/Comments/Context';
import SponsoredHelpModal from '~/containers/Chat/Modals/SponsoredHelpModal';
import { useAppContext, useKeyContext } from '~/contexts';
import { useRoleColor } from '~/theme/hooks/useRoleColor';
import { loadWandConfig, type WandConfig } from './config';

// What a top-level comment can be on and still have someone to address: the
// post's owner (twinkle-api helpers/sponsoredHelp/cards.ts). Replies are
// always for the person replied to.
const TOP_LEVEL_PARENTS = new Set(['subject', 'video', 'url', 'aiStory', 'user']);

// The magic wand beside a comment box: a wand card attached to the comment,
// for the person being replied to (or the post's owner on a top-level
// comment). Everyone sees the card; only that person can press it.
export default function CommentWandButton({
  parent,
  rootCommentId,
  targetCommentId,
  subjectId,
  addressee,
  theme
}: {
  parent: { contentType: string; contentId: number; uploader?: { id?: number; username?: string } };
  rootCommentId?: number | null;
  targetCommentId?: number | null;
  subjectId?: number | null;
  // who the card would be for, when the box knows it (for the title)
  addressee?: { id?: number; username?: string } | null;
  // the comment box's theme, so the wand matches its upload button
  theme?: string;
}) {
  const myId = Number(useKeyContext((v) => v.myState.userId) || 0);
  const loadSponsoredHelpConfig = useAppContext((v) => v.requestHelpers.loadSponsoredHelpConfig);
  const { onWandCommentPosted } = useContext<{ [key: string]: any }>(LocalContext);
  const [config, setConfig] = useState<WandConfig | null>(null);
  const [shown, setShown] = useState(false);
  const { colorKey: color } = useRoleColor('button', { themeName: theme, fallback: 'logoBlue' });
  const { colorKey: hoverColor } = useRoleColor('buttonHovered', { themeName: theme, fallback: 'logoBlue' });

  useEffect(() => {
    if (!myId) return;
    let cancelled = false;
    void loadWandConfig(loadSponsoredHelpConfig).then((value) => {
      if (!cancelled) setConfig(value);
    });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [myId]);

  const isReply = !!targetCommentId;
  const forWhom = isReply ? addressee : parent.contentType === 'user' ? { id: parent.contentId } : parent.uploader || addressee;
  const available =
    !!myId &&
    config?.enabled === true &&
    config?.cards === true &&
    typeof onWandCommentPosted === 'function' &&
    (isReply || TOP_LEVEL_PARENTS.has(parent.contentType)) &&
    !(Number(forWhom?.id) > 0 && Number(forWhom?.id) === myId);
  if (!available) return null;

  return (
    <>
      <Button
        aria-label={`Have Zero or Ciel do something for ${forWhom?.username || 'them'}`}
        variant="soft"
        tone="raised"
        color={color}
        hoverColor={hoverColor}
        mobilePadding="0.5rem"
        style={{ height: '4rem', width: '4rem', marginLeft: '1rem', padding: 0 }}
        onClick={() => setShown(true)}
      >
        <Icon icon="wand-magic-sparkles" />
      </Button>
      {shown ? (
        <SponsoredHelpModal
          target={{
            parentType: parent.contentType,
            parentId: parent.contentId,
            rootCommentId: rootCommentId || null,
            targetCommentId: targetCommentId || null,
            subjectId: subjectId || null
          }}
          recipientUsername={forWhom?.username || ''}
          percents={config?.percents}
          maxObjectives={config?.maxObjectives}
          objectiveMaxLength={config?.objectiveMaxLength}
          onHide={() => setShown(false)}
          onSent={(result) => {
            if (result?.comment) {
              onWandCommentPosted({ comment: result.comment, isReply, rootCommentId, targetCommentId });
            }
          }}
        />
      ) : null}
    </>
  );
}
