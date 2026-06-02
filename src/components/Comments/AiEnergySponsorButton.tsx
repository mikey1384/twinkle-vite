import React, { useEffect, useState } from 'react';
import { css } from '@emotion/css';
import Button from '~/components/Button';
import Icon from '~/components/Icon';
import { CIEL_TWINKLE_ID, ZERO_TWINKLE_ID } from '~/constants/defaultValues';
import { Color } from '~/constants/css';
import {
  useAppContext,
  useContentContext,
  useKeyContext,
  useNotiContext
} from '~/contexts';
import { Comment } from '~/types';
import { useThemeTokens } from '~/theme/hooks/useThemeTokens';

const PLACEHOLDER_SUFFIX =
  'needs AI Energy to reply. Someone can sponsor this reply.';
const PLACEHOLDER_KIND = 'zero_ciel_public_reply';
const REPLYING_REVALIDATE_DELAY_MS = 45 * 1000;
type SponsorState =
  | 'idle'
  | 'sponsoring'
  | 'replying'
  | 'checkingExisting'
  | 'finished';

function parseCommentSettings(settings: any) {
  if (!settings) return {};
  if (typeof settings === 'object') return settings;
  if (typeof settings !== 'string') return {};
  try {
    return JSON.parse(settings);
  } catch {
    return {};
  }
}

export function getAiEnergyPlaceholderName(comment?: Comment | null) {
  const uploaderId = Number(comment?.uploader?.id || 0);
  const aiName =
    uploaderId === Number(ZERO_TWINKLE_ID)
      ? 'Zero'
      : uploaderId === Number(CIEL_TWINKLE_ID)
        ? 'Ciel'
        : '';
  if (!aiName) return '';
  if ((comment?.content || '').trim() !== `${aiName} ${PLACEHOLDER_SUFFIX}`) {
    return '';
  }
  const targetCommentId = Number(comment?.replyId || comment?.commentId || 0);
  if (!targetCommentId) return '';
  const marker = parseCommentSettings(
    comment?.settings
  ).aiEnergySponsorPlaceholder;
  if (
    marker?.kind !== PLACEHOLDER_KIND ||
    marker?.aiUsername !== aiName ||
    marker?.resolvedAt ||
    Number(marker?.targetCommentId || 0) !== targetCommentId
  ) {
    return '';
  }
  return aiName;
}

export function shouldRenderAiEnergySponsorNotice(comment?: Comment | null) {
  return !!getAiEnergyPlaceholderName(comment);
}

function getAiEnergyPlaceholderStatusToken(comment?: Comment | null) {
  const marker = parseCommentSettings(
    comment?.settings
  ).aiEnergySponsorPlaceholder;
  return typeof marker?.statusToken === 'string' ? marker.statusToken : '';
}

export default function AiEnergySponsorButton({
  comment,
  style,
  theme
}: {
  comment: Comment;
  style?: React.CSSProperties;
  theme?: string;
}) {
  const { themeName } = useThemeTokens({ themeName: theme });
  const sponsorAiEnergyCommentReply = useAppContext(
    (v) => v.requestHelpers.sponsorAiEnergyCommentReply
  );
  const loadAiEnergyCommentReplySponsorStatus = useAppContext(
    (v) => v.requestHelpers.loadAiEnergyCommentReplySponsorStatus
  );
  const onEditContent = useContentContext((v) => v.actions.onEditContent);
  const onUpdateTodayStats = useNotiContext(
    (v) => v.actions.onUpdateTodayStats
  );
  const userId = useKeyContext((v) => v.myState.userId);
  const [message, setMessage] = useState('');
  const [sponsorState, setSponsorState] = useState<SponsorState>('idle');
  const [sponsorStatusToken, setSponsorStatusToken] = useState('');
  const aiName = getAiEnergyPlaceholderName(comment);
  const statusToken =
    sponsorStatusToken || getAiEnergyPlaceholderStatusToken(comment);
  const disabled = sponsorState !== 'idle';
  const buttonLabel =
    sponsorState === 'replying'
      ? `${aiName} is replying`
      : sponsorState === 'finished' || sponsorState === 'checkingExisting'
        ? 'Already sponsored'
        : sponsorState === 'sponsoring'
          ? 'Sponsoring'
          : 'Sponsor';
  const buttonIcon =
    sponsorState === 'sponsoring' ||
    sponsorState === 'replying' ||
    sponsorState === 'checkingExisting'
      ? 'spinner'
      : 'bolt';

  useEffect(() => {
    setMessage('');
    setSponsorStatusToken('');
    setSponsorState('idle');
  }, [comment.id]);

  useEffect(() => {
    if (sponsorState !== 'replying' && sponsorState !== 'checkingExisting')
      return;
    let canceled = false;
    let revalidateTimer: number | undefined;
    void revalidateSponsorStatus();

    return () => {
      canceled = true;
      if (revalidateTimer) {
        window.clearTimeout(revalidateTimer);
      }
    };

    function scheduleRevalidation() {
      revalidateTimer = window.setTimeout(() => {
        void revalidateSponsorStatus();
      }, REPLYING_REVALIDATE_DELAY_MS);
    }

    async function revalidateSponsorStatus() {
      try {
        const result = await loadAiEnergyCommentReplySponsorStatus({
          placeholderCommentId: comment.id,
          statusToken
        });
        if (canceled) return;
        if (result?.status === 'retryable') {
          setSponsorState(
            sponsorState === 'checkingExisting' ? 'finished' : 'idle'
          );
          return;
        }
        if (result?.status === 'replaced') {
          if (result.comment) {
            onEditContent({
              contentType: 'comment',
              contentId: comment.id,
              data: result.comment
            });
          }
          setSponsorState('finished');
          return;
        }
        if (sponsorState === 'checkingExisting') {
          setSponsorState('finished');
          return;
        }
        scheduleRevalidation();
      } catch (error: any) {
        if (canceled) return;
        if (error?.status === 404) {
          setSponsorState('finished');
          return;
        }
        if (sponsorState === 'checkingExisting') {
          setSponsorState('finished');
          return;
        }
        scheduleRevalidation();
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [comment.id, sponsorState, statusToken]);

  if (!aiName) return null;

  async function handleSponsorReply() {
    if (disabled) return;
    if (!userId) {
      setMessage('Sign in to sponsor this reply.');
      return;
    }
    setMessage('');
    setSponsorState('sponsoring');
    try {
      const result = await sponsorAiEnergyCommentReply({
        placeholderCommentId: comment.id
      });
      if (result?.aiUsagePolicy) {
        onUpdateTodayStats({
          newStats: {
            aiUsagePolicy: result.aiUsagePolicy
          }
        });
      }
      if (result?.statusToken) {
        setSponsorStatusToken(result.statusToken);
      }
      if (
        result?.status === 'accepted' ||
        result?.status === 'processing' ||
        result?.status === 'completed'
      ) {
        setSponsorState('replying');
        return;
      }
      if (result?.status === 'already_generated') {
        setSponsorState('checkingExisting');
        return;
      }
      setSponsorState('finished');
    } catch (error: any) {
      setSponsorState('idle');
      setMessage(error?.message || 'Unable to sponsor this reply.');
      if (error?.aiUsagePolicy) {
        onUpdateTodayStats({
          newStats: {
            aiUsagePolicy: error.aiUsagePolicy
          }
        });
      }
    }
  }

  return (
    <div className={sponsorNoticeCls} style={style}>
      <div className={batteryIconCls} aria-hidden="true">
        <div className={batteryShellCls}>
          {Array.from({ length: 5 }).map((_, index) => (
            <span key={index} className={batterySegmentCls} />
          ))}
        </div>
      </div>
      <div className={sponsorCopyCls}>
        <div className={sponsorTitleCls}>{aiName} needs AI Energy</div>
        <div className={sponsorBodyCls}>
          Sponsor this reply with your Energy so {aiName} can answer here.
        </div>
        {message && <div className={sponsorMessageCls}>{message}</div>}
      </div>
      <Button
        variant="soft"
        tone="raised"
        size="sm"
        disabled={disabled}
        disabledOpacity={disabled ? 0.72 : undefined}
        onClick={handleSponsorReply}
        color={themeName}
      >
        <Icon
          icon={buttonIcon}
          pulse={
            sponsorState === 'sponsoring' ||
            sponsorState === 'replying' ||
            sponsorState === 'checkingExisting'
          }
        />
        <span style={{ marginLeft: '0.6rem' }}>{buttonLabel}</span>
      </Button>
    </div>
  );
}

const sponsorNoticeCls = css`
  align-items: center;
  background: linear-gradient(180deg, var(--chat-title-bg), var(--chat-bg));
  border: 1px solid var(--ui-border);
  border-left: 4px solid var(--theme-bg);
  border-radius: 8px;
  box-shadow: 0 8px 24px rgba(15, 23, 42, 0.08);
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
  justify-content: center;
  margin: 0.6rem auto 0;
  max-width: 62rem;
  padding: 1rem 1.1rem;
  width: min(100%, 62rem);
`;

const batteryIconCls = css`
  align-items: center;
  background: #ffffff;
  border: 1px solid var(--ui-border);
  border-radius: 8px;
  display: flex;
  height: 3.8rem;
  justify-content: center;
  width: 5rem;
`;

const batteryShellCls = css`
  border: 2px solid var(--theme-border);
  border-radius: 5px;
  display: grid;
  gap: 0.2rem;
  grid-template-columns: repeat(5, 1fr);
  height: 1.8rem;
  padding: 0.2rem;
  position: relative;
  width: 3.5rem;

  &::after {
    background: var(--theme-border);
    border-radius: 0 3px 3px 0;
    content: '';
    height: 0.8rem;
    position: absolute;
    right: -0.5rem;
    top: 0.3rem;
    width: 0.4rem;
  }
`;

const batterySegmentCls = css`
  background: var(--chat-border);
  border-radius: 2px;
  opacity: 0.32;
`;

const sponsorCopyCls = css`
  flex: 1;
  min-width: 22rem;
`;

const sponsorTitleCls = css`
  color: var(--theme-border);
  font-size: 1.45rem;
  font-weight: 800;
  line-height: 1.25;
`;

const sponsorBodyCls = css`
  color: ${Color.darkerGray()};
  font-size: 1.35rem;
  font-weight: 600;
  line-height: 1.35;
  margin-top: 0.2rem;
`;

const sponsorMessageCls = css`
  color: ${Color.gray()};
  font-size: 1.2rem;
  font-weight: 600;
  margin-top: 0.4rem;
`;
