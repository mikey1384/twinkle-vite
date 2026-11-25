import React, { useEffect, useRef, useState } from 'react';
import { css } from '@emotion/css';
import { useNavigate } from 'react-router-dom';
import GameCTAButton from '~/components/Buttons/GameCTAButton';
import Icon from '~/components/Icon';
import Loading from '~/components/Loading';
import { useAppContext, useKeyContext } from '~/contexts';
import { Color, mobileMaxWidth } from '~/constants/css';
import BuildMessageCard, { BuildMessageCardChip } from './BuildMessageCard';
import { parseMessageSettings } from './messageSettings';
import {
  type SponsoredHelpView,
  isSponsoredHelpBusy,
  sponsoredHelpPersonaName,
  sponsoredHelpResultLabel,
  sponsoredHelpStatusLine,
  sponsoredHelpStepLabel
} from '~/helpers/sponsoredHelp';
import MakeChoice from '~/containers/App/WelcomeTour/MakeChoice';
import { startWelcomeTour } from '~/containers/App/WelcomeTour/store';
import type { WelcomeTourData } from '~/containers/App/WelcomeTour/rules';
import { GUIDE_COLOR, GUIDE_SOFT } from '~/containers/App/WelcomeTour/styles';

// A sponsored "Have Zero/Ciel do this" request (twinkle-api
// helpers/sponsoredHelp/service.ts), in two places:
// - variant 'dm': the sender's message in the 1:1 chat. The recipient gets
//   the button; the sender sees whether it was used.
// - variant 'assistant': the card in the recipient's own Zero/Ciel chat.
//   It shows Zero/Ciel's summary of the validated plan (written by the
//   model from the plan itself) with Confirm, Change and No thanks.
// Every state comes from the server; the card polls while the server is
// planning or running and never assumes an outcome.
export default function SponsoredHelpCard({
  request: initialRequest,
  variant,
  inMessageRow = false
}: {
  request: SponsoredHelpView;
  variant: 'dm' | 'assistant';
  // inside the normal message row (author picture, name, time): no outer
  // padding of its own, aligned with the message text
  inMessageRow?: boolean;
}) {
  const myId = Number(useKeyContext((v) => v.myState.userId) || 0);
  const navigate = useNavigate();
  const loadSponsoredHelp = useAppContext((v) => v.requestHelpers.loadSponsoredHelp);
  const pressSponsoredHelp = useAppContext((v) => v.requestHelpers.pressSponsoredHelp);
  const confirmSponsoredHelp = useAppContext((v) => v.requestHelpers.confirmSponsoredHelp);
  const changeSponsoredHelp = useAppContext((v) => v.requestHelpers.changeSponsoredHelp);
  const declineSponsoredHelp = useAppContext((v) => v.requestHelpers.declineSponsoredHelp);
  const cancelSponsoredHelp = useAppContext((v) => v.requestHelpers.cancelSponsoredHelp);
  const loadWelcomeTour = useAppContext((v) => v.requestHelpers.loadWelcomeTour);
  const [request, setRequest] = useState<SponsoredHelpView>(initialRequest);
  const [working, setWorking] = useState<string>('');
  const [error, setError] = useState('');
  const [changing, setChanging] = useState(false);
  const [note, setNote] = useState('');
  const [ideaShown, setIdeaShown] = useState(false);
  // the welcome card: "What do you want to make?" before Show me! plans the
  // first build (never a random one), and the same tour's stops
  const [choosing, setChoosing] = useState(false);
  const [tour, setTour] = useState<WelcomeTourData | null>(null);
  const mounted = useRef(true);

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

  // A newer hydration (reload, live relay) replaces what the card holds.
  useEffect(() => {
    setRequest((current) =>
      !current || initialRequest.status !== current.status ||
      (initialRequest.planRevision || 0) > (current.planRevision || 0)
        ? initialRequest
        : current
    );
  }, [initialRequest]);

  const busy = isSponsoredHelpBusy(request.status);
  useEffect(() => {
    if (!busy) return;
    const timer = window.setInterval(async () => {
      try {
        const data = await loadSponsoredHelp(request.id);
        if (mounted.current && data?.request) setRequest(data.request);
      } catch {
        // keep the last server state; the next tick tries again
      }
    }, 2500);
    return () => window.clearInterval(timer);
  }, [busy, loadSponsoredHelp, request.id]);

  // A waiting card in the member's own Zero/Ciel chat can be started (or
  // declined) by Zero/Ciel when the member says so in chat; while it waits
  // and the page is in view, check now and then so the card follows.
  const waitingInAssistantChat =
    variant === 'assistant' &&
    request.status === 'sent' &&
    myId === request.recipientId;
  useEffect(() => {
    if (!waitingInAssistantChat) return;
    const timer = window.setInterval(async () => {
      if (document.visibilityState !== 'visible') return;
      try {
        const data = await loadSponsoredHelp(request.id);
        if (mounted.current && data?.request && data.request.status !== 'sent') {
          setRequest(data.request);
        }
      } catch {
        // keep the last server state; the next tick tries again
      }
    }, 6000);
    return () => window.clearInterval(timer);
  }, [waitingInAssistantChat, loadSponsoredHelp, request.id]);

  const persona = sponsoredHelpPersonaName(request.persona);
  const isWelcome = !!request.isWelcome;
  const isRecipient = myId === request.recipientId;
  const showsTour = variant === 'assistant' && isWelcome && isRecipient;
  useEffect(() => {
    if (!showsTour) return;
    let cancelled = false;
    Promise.resolve(loadWelcomeTour())
      .then((data: any) => {
        if (!cancelled && data?.tour?.stops?.length) setTour(data);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showsTour]);
  const isSender = myId === request.senderId;
  const themeName = request.persona === 'ciel' ? 'pink' : 'logoBlue';
  const statusLine = sponsoredHelpStatusLine(request, { isSender, isRecipient, variant });

  if (variant === 'dm') {
    return (
      <div className={inMessageRow ? rowWrapClass : wrapClass} data-sponsored-help={request.id}>
        <BuildMessageCard
          themeName={themeName}
          bannerIcon="wand-magic-sparkles"
          bannerText={
            isRecipient
              ? `${request.senderUsername} sponsored ${persona} to help you`
              : `You sponsored ${persona} to help ${request.recipientUsername}`
          }
          chips={
            <>
              <BuildMessageCardChip icon="bolt" themeName={themeName}>
                {request.energyPercent}% AI Energy
              </BuildMessageCardChip>
              {statusLine ? (
                <BuildMessageCardChip muted>{statusLine}</BuildMessageCardChip>
              ) : null}
            </>
          }
          actions={
            isRecipient && request.status === 'sent' ? (
              <>
                <GameCTAButton
                  variant={request.persona === 'ciel' ? 'pink' : 'logoBlue'}
                  size="md"
                  icon="wand-magic-sparkles"
                  loading={working === 'press'}
                  onClick={() => handlePress()}
                >
                  Have {persona} do this
                </GameCTAButton>
                <GameCTAButton
                  variant="neutral"
                  size="md"
                  loading={working === 'decline'}
                  onClick={handleDecline}
                >
                  No thanks
                </GameCTAButton>
              </>
            ) : isRecipient && (request.status === 'awaiting_confirm' || request.status === 'planning') ? (
              <GameCTAButton
                variant={request.persona === 'ciel' ? 'pink' : 'logoBlue'}
                size="md"
                icon="comment"
                loading={working === 'press'}
                onClick={() => handlePress()}
              >
                Open in {persona} chat
              </GameCTAButton>
            ) : isSender && request.status === 'sent' ? (
              <GameCTAButton
                variant="neutral"
                size="md"
                loading={working === 'cancel'}
                onClick={handleCancel}
              >
                Take back
              </GameCTAButton>
            ) : null
          }
        >
          <p className={taskClass}>{request.task}</p>
          {error ? <p className={errorClass}>{error}</p> : null}
        </BuildMessageCard>
      </div>
    );
  }

  const steps = request.steps || [];
  const project = steps.find((step) => step.action === 'create_lumine_project');
  const result = request.result || {};
  return (
    <div className={inMessageRow ? rowWrapClass : wrapClass} data-sponsored-help-card={request.id}>
      <BuildMessageCard
        themeName={themeName}
        bannerIcon="wand-magic-sparkles"
        bannerText={
          isWelcome
            ? `${persona} · welcome to Twinkle`
            : `From ${request.senderUsername} · sponsored help`
        }
        chips={
          <>
            <BuildMessageCardChip icon={isWelcome ? 'gift' : 'bolt'} themeName={themeName}>
              {isWelcome
                ? 'Free from Twinkle'
                : `${request.energyPercent}% AI Energy from ${request.senderUsername}`}
            </BuildMessageCardChip>
            {statusLine ? <BuildMessageCardChip muted>{statusLine}</BuildMessageCardChip> : null}
          </>
        }
        actions={renderAssistantActions()}
      >
        {isWelcome && request.greeting ? (
          <p className={summaryClass}>{request.greeting}</p>
        ) : null}
        {request.status === 'planning' ? (
          <div className={thinkingClass}>
            <Loading style={{ height: '2.4rem', width: '2.4rem', margin: 0 }} />
            <span>
              {isWelcome
                ? `${persona} is getting it ready…`
                : `${persona} is reading ${request.senderUsername}’s request…`}
            </span>
          </div>
        ) : request.summary ? (
          <p className={summaryClass}>{request.summary}</p>
        ) : null}
        {request.summary && steps.length > 0 && request.status !== 'planning' ? (
          <ol className={stepsClass} aria-label="What will happen">
            {steps.map((step, index) => (
              <li key={index}>
                <Icon
                  icon={
                    step.action === 'create_lumine_project'
                      ? 'code-branch'
                      : step.action === 'start_chat_session'
                        ? 'comment'
                        : 'arrow-right'
                  }
                />
                <span>{sponsoredHelpStepLabel(step)}</span>
              </li>
            ))}
          </ol>
        ) : null}
        {project && request.status !== 'planning' ? (
          <div className={ideaClass}>
            <button
              type="button"
              className={ideaToggleClass}
              onClick={() => setIdeaShown((shown) => !shown)}
            >
              <Icon icon={ideaShown ? 'chevron-up' : 'chevron-down'} />
              {ideaShown ? 'Hide' : 'Show'} what Lumine gets
            </button>
            {ideaShown ? <p className={ideaTextClass}>{project.idea}</p> : null}
          </div>
        ) : null}
        {isWelcome ? null : (
          <details className={requestDetailsClass}>
            <summary>{request.senderUsername}’s request</summary>
            <p>{request.task}</p>
          </details>
        )}
        {changing && request.status === 'awaiting_confirm' ? (
          <div className={changeClass}>
            <textarea
              aria-label="What should change?"
              placeholder="What should change? (for example: call it Krill World)"
              value={note}
              maxLength={300}
              onChange={(event) => setNote(event.target.value)}
            />
            <div className={changeActionsClass}>
              <GameCTAButton
                variant={request.persona === 'ciel' ? 'pink' : 'logoBlue'}
                size="sm"
                loading={working === 'change'}
                disabled={note.trim().length < 2}
                onClick={handleChange}
              >
                Update the plan
              </GameCTAButton>
              <GameCTAButton variant="neutral" size="sm" onClick={() => setChanging(false)}>
                Never mind
              </GameCTAButton>
            </div>
          </div>
        ) : null}
        {isWelcome && choosing && request.status === 'sent' && tour ? (
          <div
            className={makeBoxClass}
            style={
              {
                '--guide': GUIDE_COLOR[request.persona],
                '--guide-soft': GUIDE_SOFT[request.persona]
              } as React.CSSProperties
            }
          >
            <MakeChoice
              tree={tour.tour.makeChoices}
              free={tour.free.card}
              working={working === 'press'}
              onDone={({ idea }) => handlePress(idea)}
              onCancel={() => setChoosing(false)}
            />
          </div>
        ) : null}
        {showsTour && tour ? (
          <div className={tourListClass}>
            <span>Take the tour with {persona}:</span>
            <div>
              {tour.tour.stops.map((stop) => (
                <button
                  key={stop.key}
                  type="button"
                  onClick={() => startWelcomeTour({ stopKey: stop.key, guide: request.persona })}
                >
                  {stop.title}
                </button>
              ))}
            </div>
          </div>
        ) : null}
        {error ? <p className={errorClass}>{error}</p> : null}
      </BuildMessageCard>
    </div>
  );

  function renderAssistantActions() {
    if (!isRecipient) return null;
    if (request.status === 'awaiting_confirm' && !changing) {
      return (
        <>
          {steps.length > 0 ? (
            <GameCTAButton
              variant={request.persona === 'ciel' ? 'pink' : 'logoBlue'}
              size="md"
              icon="check"
              loading={working === 'confirm'}
              onClick={handleConfirm}
            >
              Confirm
            </GameCTAButton>
          ) : null}
          {(request.changesLeft || 0) > 0 ? (
            <GameCTAButton variant="neutral" size="md" icon="pencil-alt" onClick={() => setChanging(true)}>
              Change
            </GameCTAButton>
          ) : null}
          <GameCTAButton
            variant="neutral"
            size="md"
            loading={working === 'decline'}
            onClick={handleDecline}
          >
            No thanks
          </GameCTAButton>
        </>
      );
    }
    if (isWelcome && request.status === 'sent') {
      if (choosing && tour) return null;
      // The greeting's own button: first "What do you want to make?", then
      // press plans right here in this card from their choice.
      return (
        <>
          <GameCTAButton
            variant={request.persona === 'ciel' ? 'pink' : 'logoBlue'}
            size="md"
            icon="wand-magic-sparkles"
            loading={working === 'press'}
            onClick={() => (tour ? setChoosing(true) : handlePress())}
          >
            {request.failureCode ? 'Try again' : 'Show me!'}
          </GameCTAButton>
          <GameCTAButton
            variant="neutral"
            size="md"
            loading={working === 'decline'}
            onClick={handleDecline}
          >
            Maybe later
          </GameCTAButton>
        </>
      );
    }
    if (request.status === 'sent' && request.failureCode) {
      return (
        <GameCTAButton
          variant={request.persona === 'ciel' ? 'pink' : 'logoBlue'}
          size="md"
          icon="redo"
          loading={working === 'press'}
          onClick={() => handlePress()}
        >
          Try again
        </GameCTAButton>
      );
    }
    if (request.status === 'completed' && result.buildId) {
      return (
        <GameCTAButton
          variant={request.persona === 'ciel' ? 'pink' : 'logoBlue'}
          size="md"
          icon="arrow-right"
          onClick={() =>
            navigate(`/build/${result.buildId}`, {
              state: { initialPrompt: result.idea || '' }
            })
          }
        >
          Open “{result.buildTitle}”
        </GameCTAButton>
      );
    }
    if (request.status === 'completed' && result.path) {
      return (
        <GameCTAButton
          variant={request.persona === 'ciel' ? 'pink' : 'logoBlue'}
          size="md"
          icon="arrow-right"
          onClick={() => navigate(String(result.path))}
        >
          {sponsoredHelpResultLabel(result)}
        </GameCTAButton>
      );
    }
    return null;
  }

  async function run(label: string, action: () => Promise<any>) {
    if (working) return null;
    setWorking(label);
    setError('');
    try {
      const data = await action();
      if (mounted.current && data?.request) setRequest(data.request);
      return data;
    } catch (requestError: any) {
      if (mounted.current) setError(requestError?.message || 'Something went wrong. Please try again.');
      // The server's state may have moved on (another tab, an expiry).
      try {
        const fresh = await loadSponsoredHelp(request.id);
        if (mounted.current && fresh?.request) setRequest(fresh.request);
      } catch {
        // keep what we have
      }
      return null;
    } finally {
      if (mounted.current) setWorking('');
    }
  }

  async function handlePress(memberChoice?: string) {
    const data = await run('press', () => pressSponsoredHelp(request.id, memberChoice));
    if (data) setChoosing(false);
    const pathId = Number(data?.request?.assistantPathId || request.assistantPathId || 0);
    if (data && variant === 'dm' && pathId) navigate(`/chat/${pathId}`);
  }

  async function handleConfirm() {
    const data = await run('confirm', () =>
      confirmSponsoredHelp({ requestId: request.id, planHash: request.planHash || '' })
    );
    const action = data?.clientAction;
    if (action?.type === 'open_build' && action.buildId) {
      navigate(`/build/${action.buildId}`, { state: { initialPrompt: action.initialPrompt } });
    } else if (action?.type === 'navigate' && action.path) {
      navigate(action.path);
    }
  }

  async function handleChange() {
    const data = await run('change', () =>
      changeSponsoredHelp({ requestId: request.id, note: note.trim() })
    );
    if (data) {
      setChanging(false);
      setNote('');
    }
  }

  async function handleDecline() {
    await run('decline', () => declineSponsoredHelp(request.id));
  }

  async function handleCancel() {
    await run('cancel', () => cancelSponsoredHelp(request.id));
  }
}

const wrapClass = css`
  width: 100%;
  padding: 0.6rem 1rem;
  display: flex;
  justify-content: flex-start;
  > div {
    max-width: 56rem;
    width: 100%;
  }
  @media (max-width: ${mobileMaxWidth}) {
    padding: 0.6rem 0.5rem;
  }
`;

const rowWrapClass = css`
  width: 100%;
  padding: 0.4rem 0 0.2rem;
  > div {
    max-width: 56rem;
    width: 100%;
  }
`;

const taskClass = css`
  margin: 0.4rem 0 0;
  font-size: 1.5rem;
  line-height: 1.5;
  color: ${Color.darkerGray()};
  white-space: pre-wrap;
  word-break: break-word;
`;

const summaryClass = css`
  margin: 0.4rem 0 0;
  font-size: 1.55rem;
  line-height: 1.55;
  color: ${Color.black()};
  white-space: pre-wrap;
  word-break: break-word;
`;

const thinkingClass = css`
  display: flex;
  align-items: center;
  gap: 0.8rem;
  font-size: 1.45rem;
  color: ${Color.darkerGray()};
  padding: 0.4rem 0;
`;

const stepsClass = css`
  list-style: none;
  margin: 1rem 0 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  li {
    display: flex;
    align-items: flex-start;
    gap: 0.7rem;
    font-size: 1.35rem;
    color: ${Color.darkerGray()};
    background: ${Color.highlightGray()};
    border-radius: 0.8rem;
    padding: 0.6rem 0.9rem;
    svg {
      margin-top: 0.25rem;
      color: ${Color.gray()};
    }
  }
`;

const ideaClass = css`
  margin-top: 0.6rem;
`;

const ideaToggleClass = css`
  background: none;
  border: none;
  padding: 0;
  cursor: pointer;
  font-size: 1.3rem;
  font-weight: 600;
  color: ${Color.logoBlue()};
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
`;

const ideaTextClass = css`
  margin: 0.5rem 0 0;
  font-size: 1.35rem;
  line-height: 1.5;
  white-space: pre-wrap;
  word-break: break-word;
  color: ${Color.darkerGray()};
  border-left: 3px solid ${Color.borderGray()};
  padding-left: 0.9rem;
`;

const requestDetailsClass = css`
  margin-top: 0.8rem;
  font-size: 1.3rem;
  color: ${Color.gray()};
  summary {
    cursor: pointer;
  }
  p {
    margin: 0.4rem 0 0;
    white-space: pre-wrap;
    word-break: break-word;
    color: ${Color.darkerGray()};
  }
`;

const changeClass = css`
  margin-top: 1rem;
  display: flex;
  flex-direction: column;
  gap: 0.6rem;
  textarea {
    width: 100%;
    min-height: 6rem;
    font-size: 1.45rem;
    padding: 0.8rem;
    border-radius: 0.8rem;
    border: 1px solid ${Color.borderGray()};
    resize: vertical;
    font-family: inherit;
  }
`;

const changeActionsClass = css`
  display: flex;
  gap: 0.6rem;
  flex-wrap: wrap;
`;

const errorClass = css`
  margin: 0.8rem 0 0;
  font-size: 1.3rem;
  color: ${Color.rose()};
`;

// Above the opening line of a session a sponsored request started in the
// member's own Zero/Ciel chat, so they know where the line came from (they
// confirmed it on the card). Only in their AI chat; anywhere else a member
// could write the same settings on their own message.
export function SponsoredHelpStartChip({
  settings,
  isAIChat
}: {
  settings: any;
  isAIChat: boolean;
}) {
  const start = (parseMessageSettings(settings) as any).sponsoredHelpStart;
  if (!isAIChat || !start || typeof start.senderUsername !== 'string' || !start.senderUsername) {
    return null;
  }
  return (
    <span className={startChipClass}>
      <Icon icon="wand-magic-sparkles" style={{ marginRight: '0.5rem' }} />
      Started with {start.senderUsername}’s sponsored help
    </span>
  );
}

const startChipClass = css`
  display: inline-flex;
  align-items: center;
  max-width: 100%;
  margin-bottom: 0.4rem;
  padding: 0.2rem 1rem;
  border-radius: 999px;
  background: ${Color.logoBlue(0.08)};
  color: ${Color.darkerGray()};
  font-size: 1.2rem;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

// "What do you want to make?" in the welcome tour's own dialogue look
const makeBoxClass = css`
  margin-top: 1rem;
  padding: 1.2rem 1.4rem;
  border-radius: 1.2rem;
  background: #121833;
  color: #f3f5ff;
`;

// the same tour's stops: each opens the guided tour at that stop
const tourListClass = css`
  margin-top: 1.2rem;
  > span {
    display: block;
    font-size: 1.25rem;
    font-weight: 700;
    color: ${Color.darkerGray()};
    margin-bottom: 0.5rem;
  }
  > div {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
  }
  button {
    border: 1px solid ${Color.borderGray()};
    background: #fff;
    border-radius: 999px;
    padding: 0.35rem 0.9rem;
    font-size: 1.25rem;
    font-weight: 600;
    color: ${Color.darkerGray()};
    cursor: pointer;
    &:hover {
      border-color: ${Color.logoBlue()};
      color: ${Color.logoBlue()};
    }
  }
  @media (max-width: ${mobileMaxWidth}) {
    button {
      font-size: 1.2rem;
    }
  }
`;
