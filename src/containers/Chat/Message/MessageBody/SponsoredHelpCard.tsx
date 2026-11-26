import React, { useEffect, useRef, useState, useSyncExternalStore } from 'react';
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
import { GUIDE_PICTURE } from '~/containers/App/WelcomeTour/Greeter';
import { startWelcomeTour, welcomeTourProgress } from '~/containers/App/WelcomeTour/store';
import WandActionBar, { WandQuietButton } from '~/components/SponsoredHelp/WandActionBar';
import { resolveWandActions } from '~/components/SponsoredHelp/wandActions';
import {
  newerWelcomeTourState,
  projectOpenPrompt,
  welcomeTourButton,
  welcomeTourResumeKey,
  type WelcomeTourData,
  type WelcomeTourProject
} from '~/containers/App/WelcomeTour/rules';

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
  // the welcome tour (its stops are the welcome card's chapters)
  const [tour, setTour] = useState<WelcomeTourData | null>(null);
  // where this tab's running tour is (the card's "Continue the tour")
  const tourProgress = useSyncExternalStore(welcomeTourProgress.subscribe, welcomeTourProgress.get);
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
  const buttonVariant = request.persona === 'ciel' ? 'pink' : 'logoBlue';
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
          actions={renderDmActions()}
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
  const cardProject: WelcomeTourProject | null =
    request.status === 'completed' && Number(result.buildId) > 0
      ? {
          buildId: Number(result.buildId),
          title: String(result.buildTitle || 'your project'),
          idea: String(result.idea || '')
        }
      : null;
  return (
    <div className={inMessageRow ? rowWrapClass : wrapClass} data-sponsored-help-card={request.id}>
      <BuildMessageCard
        themeName={themeName}
        bannerIcon="wand-magic-sparkles"
        bannerText={
          isWelcome
            ? `${persona} · welcome to Twinkle`
            : request.openCardId
              ? `From ${request.senderUsername}’s wand card${request.paidBy === 'self' ? ' · your own AI Energy' : ''}`
              : `From ${request.senderUsername} · sponsored help`
        }
        chips={
          <>
            <BuildMessageCardChip icon={isWelcome ? 'gift' : 'bolt'} themeName={themeName}>
              {isWelcome
                ? 'Free from Twinkle'
                : request.paidBy === 'self'
                  ? `Up to ${request.energyPercent}% of your AI Energy`
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
        {error ? <p className={errorClass}>{error}</p> : null}
      </BuildMessageCard>
    </div>
  );

  // The one wand action model (components/SponsoredHelp/wandActions.ts): the
  // server's definition for this card, or the card's own defaults on an
  // older API. The welcome card's chapters are the tour's stops.
  function actionModel() {
    return resolveWandActions(request.actions, {
      mainAction: {
        label: isWelcome ? `Start the tour with ${persona}` : `Have ${persona} do this`,
        runs: 'all'
      },
      ...(isWelcome && tour
        ? {
            chaptersTitle: `Take the tour with ${persona}:`,
            chapters: tour.tour.stops.map((stop) => ({ id: stop.key, label: stop.title }))
          }
        : {}),
      backup: { label: isWelcome ? 'Maybe later' : 'No thanks', action: 'decline' }
    });
  }

  function renderDmActions() {
    const model = actionModel();
    if (isRecipient && request.status === 'sent') {
      return (
        <WandActionBar
          model={model}
          variant={buttonVariant}
          mainIcon="wand-magic-sparkles"
          mainLoading={working === 'press'}
          onMain={() => handlePress()}
          onBackup={handleDecline}
          backupLoading={working === 'decline'}
        />
      );
    }
    if (isRecipient && (request.status === 'awaiting_confirm' || request.status === 'planning')) {
      return (
        <WandActionBar
          model={model}
          variant={buttonVariant}
          mainLabel={`Open in ${persona} chat`}
          mainIcon="comment"
          mainLoading={working === 'press'}
          onMain={() => handlePress()}
        />
      );
    }
    if (isSender && request.status === 'sent') {
      return (
        <WandActionBar
          model={model}
          variant={buttonVariant}
          extras={
            <WandQuietButton loading={working === 'cancel'} onClick={handleCancel}>
              Take back
            </WandQuietButton>
          }
        />
      );
    }
    return null;
  }

  function renderAssistantActions() {
    if (!isRecipient) return null;
    const model = actionModel();
    if (request.status === 'awaiting_confirm' && !changing) {
      // the plan's own confirmation: Confirm runs it, Change and No thanks
      return (
        <WandActionBar
          model={model}
          variant={buttonVariant}
          mainLabel="Confirm"
          mainIcon="check"
          mainLoading={working === 'confirm'}
          onMain={steps.length > 0 ? handleConfirm : undefined}
          onBackup={handleDecline}
          backupLoading={working === 'decline'}
          extras={
            (request.changesLeft || 0) > 0 ? (
              <WandQuietButton onClick={() => setChanging(true)}>Change</WandQuietButton>
            ) : null
          }
        />
      );
    }
    // The welcome card (Mikey 11-26): the main button runs the whole tour in
    // its order, its Lumine stop being the free first build ("What do you
    // want to make?" then this card's plan) or, once made, their project;
    // the chips start the tour at one stop; "Maybe later" while it waits.
    if (showsTour && tour && !['planning', 'asking', 'awaiting_confirm'].includes(request.status)) {
      const button = welcomeTourButton({
        guideName: persona,
        stops: tour.tour.stops,
        resumeKey: welcomeTourResumeKey(tourResumeState())
      });
      return (
        <WandActionBar
          model={model}
          variant={buttonVariant}
          mainLabel={button.progress ? 'Continue the tour' : undefined}
          mainProgress={button.progress}
          mainPortrait={GUIDE_PICTURE[request.persona]}
          onMain={() => handleStartTour()}
          onChapter={(stopKey) => handleStartTour(stopKey)}
          onBackup={request.status === 'sent' ? handleDecline : undefined}
          backupLoading={working === 'decline'}
          extras={
            cardProject ? (
              <WandQuietButton onClick={handleOpenProject}>Open “{cardProject.title}”</WandQuietButton>
            ) : request.status === 'completed' && result.path ? (
              <WandQuietButton onClick={() => navigate(String(result.path))}>
                {sponsoredHelpResultLabel(result)}
              </WandQuietButton>
            ) : null
          }
        />
      );
    }
    if (isWelcome && request.status === 'sent') {
      // the tour isn't available: the card's own first build
      return (
        <WandActionBar
          model={model}
          variant={buttonVariant}
          mainLabel={request.failureCode ? 'Try again' : 'Show me!'}
          mainIcon="wand-magic-sparkles"
          mainLoading={working === 'press'}
          onMain={() => handlePress()}
          onBackup={handleDecline}
          backupLoading={working === 'decline'}
        />
      );
    }
    if (request.status === 'sent' && request.failureCode) {
      return (
        <WandActionBar
          model={model}
          variant={buttonVariant}
          mainLabel="Try again"
          mainIcon="redo"
          mainLoading={working === 'press'}
          onMain={() => handlePress()}
        />
      );
    }
    if (request.status === 'completed' && result.buildId) {
      return (
        <WandActionBar
          model={model}
          variant={buttonVariant}
          mainLabel={`Open “${result.buildTitle}”`}
          mainIcon="arrow-right"
          onMain={() => openBuild(Number(result.buildId), result)}
        />
      );
    }
    if (request.status === 'completed' && result.path) {
      return (
        <WandActionBar
          model={model}
          variant={buttonVariant}
          mainLabel={sponsoredHelpResultLabel(result)}
          mainIcon="arrow-right"
          onMain={() => navigate(String(result.path))}
        />
      );
    }
    return null;
  }

  // where the tour stands: the server's state, or this account's newer
  // confirmed one from the running tour (never another account's)
  function tourResumeState() {
    return newerWelcomeTourState(tour?.state || null, tourProgress, myId);
  }

  function handleStartTour(stopKey?: string) {
    startWelcomeTour({ guide: request.persona, source: 'card', stopKey, project: cardProject });
  }

  function handleOpenProject() {
    if (!cardProject) return;
    openBuild(cardProject.buildId, result);
  }

  // Opening a project never starts a run the member didn't choose (review
  // 11-26 P0): the idea goes along only while Twinkle's free first run on
  // it is still the one that would start (lumineRunSponsored); the editor
  // sends it only while the project has no chat yet.
  function openBuild(buildId: number, from: SponsoredHelpView['result']) {
    const initialPrompt = projectOpenPrompt(from);
    navigate(`/build/${buildId}`, initialPrompt ? { state: { initialPrompt } } : undefined);
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

