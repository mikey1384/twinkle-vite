import React, { useContext, useEffect, useState } from 'react';
import Button from '~/components/Button';
import Icon from '~/components/Icon';
import LocalContext from '~/components/Comments/Context';
import SponsoredHelpModal from '~/containers/Chat/Modals/SponsoredHelpModal';
import { useAppContext, useKeyContext } from '~/contexts';
import { useRoleColor } from '~/theme/hooks/useRoleColor';
import { canMakeOpenWandCard, loadWandConfig, type WandConfig } from './config';
import { appendOpenWandEmbed } from '~/helpers/sponsoredHelp';

// What a top-level comment can be on and still have someone to address: the
// post's owner (twinkle-api helpers/sponsoredHelp/cards.ts). Replies are
// always for the person replied to.
const TOP_LEVEL_PARENTS = new Set(['subject', 'video', 'url', 'aiStory', 'user']);

// The magic wand beside a comment box: a wand card attached to the comment,
// for the person being replied to (or the post's owner on a top-level
// comment). Everyone sees the card; only that person can press it.
// It also makes an open wand card (anyone who reads it can press it) and
// puts it into the comment being written: the only choice on your own post
// (nobody to address), "For <name> / Anyone who reads it" on a reply.
export default function CommentWandButton({
  parent,
  rootCommentId,
  targetCommentId,
  subjectId,
  addressee,
  theme,
  insertText
}: {
  parent: { contentType: string; contentId: number; uploader?: { id?: number; username?: string } };
  rootCommentId?: number | null;
  targetCommentId?: number | null;
  subjectId?: number | null;
  // who the card would be for, when the box knows it (for the title)
  addressee?: { id?: number; username?: string } | null;
  // the comment box's theme, so the wand matches its upload button
  theme?: string;
  // puts text into the comment box (open wand cards)
  insertText?: (update: (text: string) => string) => void;
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
  const addressedAvailable =
    !!myId &&
    config?.enabled === true &&
    config?.cards === true &&
    typeof onWandCommentPosted === 'function' &&
    (isReply || TOP_LEVEL_PARENTS.has(parent.contentType)) &&
    !(Number(forWhom?.id) > 0 && Number(forWhom?.id) === myId);
  const openAvailable = !!myId && canMakeOpenWandCard(config) && typeof insertText === 'function';
  if (!addressedAvailable && !openAvailable) return null;

  return (
    <>
      <Button
        aria-label={
          addressedAvailable ? `Have Zero or Ciel do something for ${forWhom?.username || 'them'}` : 'Add a wand card'
        }
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
          openMode={openAvailable ? (addressedAvailable ? 'choice' : 'only') : undefined}
          openDefaultCap={config?.openCardDefaultCap}
          openMaxCap={config?.openCardMaxCap}
          openPerPersonPercent={config?.openCardPerPersonPercent}
          onInserted={(openCardId) => insertText?.((text) => appendOpenWandEmbed(text, openCardId))}
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
