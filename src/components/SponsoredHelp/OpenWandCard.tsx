import React, { useEffect, useRef, useState } from 'react';
import { css } from '@emotion/css';
import { useNavigate } from 'react-router-dom';
import GameCTAButton from '~/components/Buttons/GameCTAButton';
import Icon from '~/components/Icon';
import Loading from '~/components/Loading';
import { useAppContext, useKeyContext } from '~/contexts';
import { Color, mobileMaxWidth } from '~/constants/css';
import BuildMessageCard, {
  BuildMessageCardChip
} from '~/containers/Chat/Message/MessageBody/BuildMessageCard';
import { GUIDE_PICTURE } from '~/containers/App/WelcomeTour/Greeter';
import {
  OPEN_WAND_SITE,
  openWandPath,
  openWandSpotsLine,
  sponsoredHelpPersonaName,
  type OpenWandCardView
} from '~/helpers/sponsoredHelp';

// An open wand card (twinkle-api helpers/sponsoredHelp/openCards.ts),
// embedded in a Subject as /wand/<id>. Anyone who reads it can press it
// once: Zero or Ciel then helps THEM (a plan in their own Zero/Ciel chat
// first, nothing happens until they confirm). The author sponsors the first
// few people (first come, first served); after that, or with no
// sponsorship, it still works on the reader's own AI Energy, and the card
// says so before they press. Every state is the server's: sponsored spots
// left, own Energy (and why), "coming soon" for a domain card while domain
// sales aren't open for this reader, closed. The same look as WandCard.
//
// asReader: the composer's live preview, drawn the way a reader sees it
// (the author's own view has counts and Copy link instead of the button).
export default function OpenWandCard({
  openCardId,
  initialCard = null,
  asReader = false,
  onRemove
}: {
  openCardId: number;
  initialCard?: OpenWandCardView | null;
  asReader?: boolean;
  // the composer's preview: take the card out of the draft
  onRemove?: () => void;
}) {
  const myId = Number(useKeyContext((v) => v.myState.userId) || 0);
  const navigate = useNavigate();
  const loadOpenWandCard = useAppContext((v) => v.requestHelpers.loadOpenWandCard);
  const pressOpenWandCard = useAppContext((v) => v.requestHelpers.pressOpenWandCard);
  const closeOpenWandCard = useAppContext((v) => v.requestHelpers.closeOpenWandCard);
  const shareOpenWandCard = useAppContext((v) => v.requestHelpers.shareOpenWandCard);
  const onOpenSigninModal = useAppContext((v) => v.user.actions.onOpenSigninModal);
  const [card, setCard] = useState<OpenWandCardView | null>(initialCard);
  const [loadFailed, setLoadFailed] = useState(false);
  const [working, setWorking] = useState('');
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);
  const mounted = useRef(true);

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

  // signing in or out changes what the card says to this reader
  useEffect(() => {
    let cancelled = false;
    setLoadFailed(false);
    Promise.resolve(loadOpenWandCard(openCardId))
      .then((data: any) => {
        if (!cancelled && data?.card) setCard(data.card);
      })
      .catch(() => {
        if (!cancelled) setLoadFailed(true);
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [openCardId, myId]);

  if (!card) {
    return (
      <div className={wrapClass} data-open-wand={openCardId}>
        {loadFailed ? (
          <div className={mutedClass}>This wand card couldn’t be loaded.</div>
        ) : (
          <Loading style={{ height: '6rem' }} />
        )}
      </div>
    );
  }

  const persona = sponsoredHelpPersonaName(card.persona);
  const themeName = card.persona === 'ciel' ? 'pink' : 'logoBlue';
  const buttonVariant = card.persona === 'ciel' ? 'pink' : 'logoBlue';
  const viewer = asReader ? 'member' : card.viewer;
  const mine = asReader ? null : card.mine;
  // the composer's preview: what a reader sees (a domain card is drawn as
  // for a reader who can use it)
  const state =
    asReader && card.state !== 'closed'
      ? card.sponsorCap > 0 && card.sponsoredLeft > 0
        ? 'sponsored'
        : 'own_energy'
      : card.state;
  const reason = asReader ? (card.sponsorCap > 0 ? (card.sponsoredLeft > 0 ? '' : 'used_up') : 'not_sponsored') : card.reason;
  const author = card.senderUsername || 'A member';
  const spots = openWandSpotsLine(card);

  return (
    <div className={wrapClass} data-open-wand={card.openCardId} data-state={state} data-viewer={viewer}>
      <BuildMessageCard
        themeName={themeName}
        bannerIcon="wand-magic-sparkles"
        bannerText={
          viewer === 'author'
            ? `Your wand card · anyone who reads it can use it`
            : state === 'sponsored'
              ? `${author} is sponsoring ${persona} to help you`
              : `${author} shared ${persona}’s help`
        }
        chips={
          <>
            {spots && state !== 'coming_soon' && state !== 'closed' ? (
              <BuildMessageCardChip icon={state === 'sponsored' || viewer === 'author' ? 'user-group' : 'bolt'} themeName={themeName}>
                {spots}
              </BuildMessageCardChip>
            ) : null}
            <BuildMessageCardChip muted>{persona}</BuildMessageCardChip>
          </>
        }
        actions={renderActions()}
      >
        <div className={taskRowClass}>
          {/* a div, not an img: rich text styles every img inside it */}
          <div
            className={portraitClass}
            style={{ backgroundImage: `url(${GUIDE_PICTURE[card.persona]})` }}
            aria-hidden
          />
          <div className={taskMainClass}>
            <div className={taskClass}>{card.task}</div>
            <div className={lineClass}>{line()}</div>
          </div>
        </div>
        {error ? (
          <div className={errorClass} role="alert">
            {error}
          </div>
        ) : null}
      </BuildMessageCard>
      {onRemove ? (
        <button type="button" className={removeClass} onClick={onRemove}>
          <Icon icon="times" /> Remove
        </button>
      ) : null}
    </div>
  );

  function line() {
    if (viewer === 'author') {
      const spent = card!.spentPercent ? ` So far: ${formatPercent(card!.spentPercent)} of your Energy.` : '';
      const used = `${card!.presses} ${card!.presses === 1 ? 'person' : 'people'} used it.`;
      if (state === 'closed') return `You closed this card. ${used}${spent}`;
      if (card!.published === false) return 'Only you can see this card until you post it.';
      if (card!.sponsorCap <= 0) return `People use it with their own AI Energy. ${used}`;
      return `The first ${card!.sponsorCap} people who press it use up to ${card!.perPersonPercent}% of your AI Energy each; after that, people use their own. ${used}${spent}`;
    }
    if (mine) {
      if (mine.status === 'completed') return `${persona} helped you with this.`;
      if (['declined', 'expired', 'failed'].includes(mine.status)) return `You’ve used your turn on this card.`;
      return mine.paidBy === 'self'
        ? `${persona} is helping you with this in your ${persona} chat, with your own AI Energy.`
        : `${persona} is helping you with this in your ${persona} chat, paid with ${author}’s AI Energy.`;
    }
    switch (state) {
      case 'coming_soon':
        return 'Domains are coming soon. Your app already works at its free lumine.app address.';
      case 'closed':
        return 'This card isn’t available right now.';
      case 'own_energy':
        if (reason === 'used_up') return 'Sponsored spots are used up. You can still use it with your own AI Energy.';
        if (reason === 'author_out') return `${author}’s AI Energy for this is used up for today. You can still use it with your own AI Energy.`;
        return `Press it and ${persona} helps you, using your own AI Energy. You see the plan first.`;
      default:
        return `Press it and ${persona} helps you, paid with ${author}’s AI Energy. You see the plan first.`;
    }
  }

  function renderActions() {
    if (viewer === 'author') {
      return (
        <>
          <GameCTAButton variant="neutral" size="sm" icon={copied ? 'check' : 'link'} onClick={handleCopy}>
            {copied ? 'Copied' : 'Copy link'}
          </GameCTAButton>
          {state !== 'closed' ? (
            <GameCTAButton variant="neutral" size="sm" loading={working === 'close'} onClick={handleClose}>
              Stop new uses
            </GameCTAButton>
          ) : null}
        </>
      );
    }
    if (mine) {
      return mine.assistantPathId ? (
        <GameCTAButton
          variant={buttonVariant}
          size="sm"
          icon="comment"
          onClick={() => navigate(`/chat/${mine.assistantPathId}`)}
        >
          Open in {persona} chat
        </GameCTAButton>
      ) : null;
    }
    if (state !== 'sponsored' && state !== 'own_energy') return null;
    if (viewer === 'guest') {
      return (
        <GameCTAButton variant={buttonVariant} size="sm" icon="key" onClick={() => onOpenSigninModal()}>
          Sign in to use it
        </GameCTAButton>
      );
    }
    return (
      <GameCTAButton
        variant={buttonVariant}
        size="sm"
        icon="wand-magic-sparkles"
        loading={working === 'press'}
        onClick={asReader ? () => {} : handlePress}
      >
        Have {persona} help me
      </GameCTAButton>
    );
  }

  async function handlePress() {
    if (working) return;
    setWorking('press');
    setError('');
    try {
      // the payer the reader is looking at; the server refuses if it changed
      const expectedPayer = state === 'sponsored' ? 'sponsor' : 'self';
      const data = await pressOpenWandCard(card!.openCardId, expectedPayer);
      if (!mounted.current) return;
      if (data?.card) setCard(data.card);
      const path = data?.request?.assistantPathId || data?.card?.mine?.assistantPathId;
      if (path) navigate(`/chat/${path}`);
    } catch (pressError: any) {
      if (!mounted.current) return;
      setError(pressError?.message || 'Something went wrong. Please try again.');
      // the refusal may have changed what the card should say
      try {
        const data = await loadOpenWandCard(card!.openCardId);
        if (mounted.current && data?.card) setCard(data.card);
      } catch {
        // keep the last server state
      }
    } finally {
      if (mounted.current) setWorking('');
    }
  }

  async function handleClose() {
    if (working) return;
    setWorking('close');
    setError('');
    try {
      const data = await closeOpenWandCard(card!.openCardId);
      if (mounted.current && data?.card) setCard(data.card);
    } catch (closeError: any) {
      if (mounted.current) setError(closeError?.message || 'Something went wrong. Please try again.');
    } finally {
      if (mounted.current) setWorking('');
    }
  }

  async function handleCopy() {
    try {
      // sharing the link makes a draft card public
      if (card!.published === false) {
        const data = await shareOpenWandCard(card!.openCardId);
        if (mounted.current && data?.card) setCard(data.card);
      }
      await navigator.clipboard.writeText(`${OPEN_WAND_SITE}${openWandPath(card!.openCardId)}`);
      setCopied(true);
      window.setTimeout(() => mounted.current && setCopied(false), 1800);
    } catch {
      setError('Couldn’t copy. The link is ' + `${OPEN_WAND_SITE}${openWandPath(card!.openCardId)}`);
    }
  }
}

function formatPercent(percent: number) {
  return percent < 1 ? 'less than 1%' : `${Math.round(percent)}%`;
}

const wrapClass = css`
  width: 100%;
  max-width: 56rem;
  margin: 0 auto;
  text-align: left;
`;

const taskRowClass = css`
  display: flex;
  align-items: flex-start;
  gap: 1.1rem;
  margin-top: 0.2rem;
`;

const portraitClass = css`
  width: 4.8rem;
  height: 4.8rem;
  flex-shrink: 0;
  border-radius: 50%;
  background-color: ${Color.highlightGray()};
  background-size: cover;
  background-position: top center;
  border: 2px solid ${Color.borderGray()};
  @media (max-width: ${mobileMaxWidth}) {
    width: 4rem;
    height: 4rem;
  }
`;

const taskMainClass = css`
  flex: 1;
  min-width: 0;
`;

const taskClass = css`
  margin: 0.1rem 0 0;
  font-size: 1.7rem;
  line-height: 1.4;
  font-weight: 700;
  color: ${Color.black()};
  word-break: break-word;
  @media (max-width: ${mobileMaxWidth}) {
    font-size: 1.55rem;
  }
`;

const lineClass = css`
  margin: 0.4rem 0 0;
  font-size: 1.35rem;
  line-height: 1.5;
  color: ${Color.darkerGray()};
`;

const mutedClass = css`
  margin: 0;
  padding: 1rem;
  font-size: 1.3rem;
  color: ${Color.gray()};
  text-align: center;
`;

const errorClass = css`
  margin: 0.8rem 0 0;
  font-size: 1.3rem;
  color: ${Color.rose()};
`;

const removeClass = css`
  margin: 0.5rem 0 0 auto;
  display: flex;
  align-items: center;
  gap: 0.4rem;
  background: none;
  border: none;
  padding: 0.3rem 0.2rem;
  cursor: pointer;
  font-size: 1.25rem;
  font-weight: 700;
  color: ${Color.darkerGray()};
  &:hover {
    color: ${Color.rose()};
  }
`;
