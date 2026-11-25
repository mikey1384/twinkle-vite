import React, { useEffect, useRef, useState } from 'react';
import { css, cx } from '@emotion/css';
import { useNavigate } from 'react-router-dom';
import GameCTAButton from '~/components/Buttons/GameCTAButton';
import Icon from '~/components/Icon';
import Loading from '~/components/Loading';
import { useAppContext, useChatContext, useKeyContext } from '~/contexts';
import { Color, mobileMaxWidth } from '~/constants/css';
import BuildMessageCard, {
  BuildMessageCardChip
} from '~/containers/Chat/Message/MessageBody/BuildMessageCard';
import { openAssistantDock } from '~/containers/App/AssistantDock/dockState';
import { startAiVoiceCall } from '~/helpers/aiVoiceCall';
import {
  againConfirmText,
  againRefusalText,
  cardActions,
  cardIsBusy,
  confirmAllPlanHashes,
  objectiveActions,
  objectiveStateLabel,
  sponsoredHelpPersonaName,
  sponsoredHelpStepLabel,
  wandTalkContext,
  wandViewerFor,
  type SponsoredHelpAgainEstimate,
  type SponsoredHelpCardView,
  type SponsoredHelpObjectiveView
} from '~/helpers/sponsoredHelp';
import WandChoice from './WandChoice';

type Place = 'dm' | 'comment' | 'assistant';

// A wand card with 1 to 3 objectives (twinkle-api helpers/sponsoredHelp/
// cards.ts), in three places:
// - 'dm': the sender's message in a one-on-one chat. The recipient gets a
//   button per objective and "Do all of these"; the sender sees each one's
//   status and can take back what nobody pressed.
// - 'comment': attached to a comment. Everyone sees the objectives and their
//   states; only the person it is for can press (and "Do it again").
// - 'assistant': the recipient's own Zero/Ciel chat card: each objective's
//   question, plan, Confirm / Change / No thanks, Confirm all, the running
//   objective's text/voice switch, and "Do it again" with its cost.
// Every state is the server's; the card polls while something is happening
// and never assumes an outcome.
export default function WandCard({
  card: initialCard,
  place,
  inMessageRow = false
}: {
  card: SponsoredHelpCardView;
  place: Place;
  inMessageRow?: boolean;
}) {
  const myId = Number(useKeyContext((v) => v.myState.userId) || 0);
  const navigate = useNavigate();
  const loadSponsoredHelpCard = useAppContext((v) => v.requestHelpers.loadSponsoredHelpCard);
  const pressSponsoredHelp = useAppContext((v) => v.requestHelpers.pressSponsoredHelp);
  const pressAllSponsoredHelp = useAppContext((v) => v.requestHelpers.pressAllSponsoredHelp);
  const confirmSponsoredHelp = useAppContext((v) => v.requestHelpers.confirmSponsoredHelp);
  const confirmAllSponsoredHelp = useAppContext((v) => v.requestHelpers.confirmAllSponsoredHelp);
  const changeSponsoredHelp = useAppContext((v) => v.requestHelpers.changeSponsoredHelp);
  const declineSponsoredHelp = useAppContext((v) => v.requestHelpers.declineSponsoredHelp);
  const declineSponsoredHelpCard = useAppContext((v) => v.requestHelpers.declineSponsoredHelpCard);
  const cancelSponsoredHelpCard = useAppContext((v) => v.requestHelpers.cancelSponsoredHelpCard);
  const answerSponsoredHelp = useAppContext((v) => v.requestHelpers.answerSponsoredHelp);
  const loadSponsoredHelpAgain = useAppContext((v) => v.requestHelpers.loadSponsoredHelpAgain);
  const startSponsoredHelpAgain = useAppContext((v) => v.requestHelpers.startSponsoredHelpAgain);
  const zeroChannelId = useChatContext((v) => v.state.zeroChannelId);
  const cielChannelId = useChatContext((v) => v.state.cielChannelId);
  const [card, setCard] = useState<SponsoredHelpCardView>(initialCard);
  const [working, setWorking] = useState('');
  const [error, setError] = useState('');
  const [changingId, setChangingId] = useState(0);
  const [note, setNote] = useState('');
  const [ideaShownId, setIdeaShownId] = useState(0);
  const [again, setAgain] = useState<{ requestId: number; estimate: SponsoredHelpAgainEstimate | null } | null>(null);
  const mounted = useRef(true);

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

  // A newer hydration (reload, live relay) replaces what the card holds; a
  // re-render with the same server state keeps what polling found since.
  const initialSignature = cardSignature(initialCard);
  const lastInitialSignature = useRef(initialSignature);
  useEffect(() => {
    if (lastInitialSignature.current === initialSignature) return;
    lastInitialSignature.current = initialSignature;
    setCard(initialCard);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialSignature]);

  const viewer = wandViewerFor(card, myId);
  const persona = sponsoredHelpPersonaName(card.persona);
  const busy = cardIsBusy(card);
  // Zero/Ciel can start objectives or take an answer from chat, so a card
  // that waits on the member checks now and then too.
  const waitingOnMember =
    viewer === 'recipient' &&
    card.objectives.some((objective) => objective.status === 'sent' || objective.status === 'asking');
  useEffect(() => {
    if (!busy && !waitingOnMember) return;
    const timer = window.setInterval(
      async () => {
        if (!busy && document.visibilityState !== 'visible') return;
        try {
          const data = await loadSponsoredHelpCard(card.cardId);
          if (mounted.current && data?.card) setCard(data.card);
        } catch {
          // keep the last server state; the next tick tries again
        }
      },
      busy ? 2500 : 6000
    );
    return () => window.clearInterval(timer);
  }, [busy, waitingOnMember, loadSponsoredHelpCard, card.cardId]);

  const themeName = card.persona === 'ciel' ? 'pink' : 'logoBlue';
  const buttonVariant = card.persona === 'ciel' ? 'pink' : 'logoBlue';
  const actions = cardActions({ ...card, viewer }, { place });
  const count = card.objectives.length;
  const done = card.objectives.filter((objective) => objective.state === 'done').length;

  return (
    <div
      className={inMessageRow ? rowWrapClass : wrapClass}
      data-wand-card={card.cardId}
      data-wand-place={place}
    >
      <BuildMessageCard
        themeName={themeName}
        bannerIcon="wand-magic-sparkles"
        bannerText={bannerText()}
        chips={
          <>
            {viewer !== 'bystander' && card.energyPercent ? (
              <BuildMessageCardChip icon="bolt" themeName={themeName}>
                {Math.round(card.energyPercent)}% AI Energy from {viewer === 'sender' ? 'you' : card.senderUsername}
              </BuildMessageCardChip>
            ) : null}
            <BuildMessageCardChip muted>
              {count > 1 ? `${done} of ${count} done` : done ? 'Done' : persona}
            </BuildMessageCardChip>
          </>
        }
        actions={renderCardActions()}
      >
        <ol className={listClass} aria-label="What to do">
          {card.objectives.map((objective) => renderObjective(objective))}
        </ol>
        {error ? (
          <p className={errorClass} role="alert">
            {error}
          </p>
        ) : null}
      </BuildMessageCard>
    </div>
  );

  function bannerText() {
    if (viewer === 'recipient') {
      return place === 'assistant'
        ? `From ${card.senderUsername} · sponsored help`
        : `${card.senderUsername} sponsored ${persona} to help you`;
    }
    if (viewer === 'sender') return `You sponsored ${persona} to help ${card.recipientUsername}`;
    return `${card.senderUsername} asked ${persona} to help ${card.recipientUsername}`;
  }

  function renderObjective(objective: SponsoredHelpObjectiveView) {
    const label = objectiveStateLabel(objective, {
      persona: card.persona,
      viewer,
      recipientUsername: card.recipientUsername
    });
    const buttons = objectiveActions(objective, { viewer, place });
    const full = viewer === 'recipient' && place !== 'dm';
    const project = (objective.steps || []).find((step) => step.action === 'create_lumine_project');
    return (
      <li
        key={objective.index}
        className={objectiveClass}
        data-state={objective.state}
        data-wand-objective={objective.index + 1}
      >
        <span className={cx(numberClass, stateTone[objective.state])}>
          {objective.state === 'done' ? <Icon icon="check" /> : objective.index + 1}
        </span>
        <div className={objectiveMainClass}>
          <div className={objectiveTopClass}>
            <p className={objectiveTextClass}>{objective.text}</p>
            {label ? (
              <span className={cx(stateChipClass, stateTone[objective.state])}>
                {objective.state === 'working' ? <Icon icon="spinner" pulse /> : null}
                {label}
              </span>
            ) : null}
          </div>
          {full && place === 'assistant' ? renderDetails(objective, project) : null}
          {full && place === 'comment' && objective.state === 'done' && objective.result?.buildTitle ? (
            <p className={resultClass}>Made “{objective.result.buildTitle}”</p>
          ) : null}
          {again?.requestId === objective.requestId ? renderAgain(objective) : null}
          {changingId === objective.requestId && objective.status === 'awaiting_confirm' ? (
            <div className={changeClass}>
              <textarea
                aria-label="What should change?"
                placeholder="What should change? (for example: call it Krill World)"
                value={note}
                maxLength={300}
                onChange={(event) => setNote(event.target.value)}
              />
              <div className={rowActionsClass}>
                <GameCTAButton
                  variant={buttonVariant}
                  size="sm"
                  loading={working === `change:${objective.requestId}`}
                  disabled={note.trim().length < 2}
                  onClick={() => handleChange(objective)}
                >
                  Update the plan
                </GameCTAButton>
                <GameCTAButton variant="neutral" size="sm" onClick={() => setChangingId(0)}>
                  Never mind
                </GameCTAButton>
              </div>
            </div>
          ) : null}
          {buttons.length && changingId !== objective.requestId && again?.requestId !== objective.requestId ? (
            <div className={rowActionsClass}>{buttons.map((action) => renderObjectiveButton(action, objective, project))}</div>
          ) : null}
        </div>
      </li>
    );
  }

  function renderDetails(objective: SponsoredHelpObjectiveView, project?: any) {
    if (objective.status === 'planning') {
      return (
        <div className={thinkingClass}>
          <Loading style={{ height: '2rem', width: '2rem', margin: 0 }} />
          <span>{persona} is reading this…</span>
        </div>
      );
    }
    if (objective.status === 'asking' && objective.question) {
      return (
        <WandChoice
          persona={card.persona}
          question={objective.question}
          working={working === `answer:${objective.requestId}`}
          onAnswer={(answer) => handleAnswer(objective, answer)}
        />
      );
    }
    if (objective.status === 'awaiting_confirm' || objective.status === 'running' || objective.status === 'completed') {
      return (
        <>
          {objective.summary && objective.status === 'awaiting_confirm' ? (
            <p className={summaryClass}>{objective.summary}</p>
          ) : null}
          {objective.status === 'awaiting_confirm' && (objective.steps || []).length ? (
            <ul className={stepsClass} aria-label="What will happen">
              {(objective.steps || []).map((step, index) => (
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
            </ul>
          ) : null}
          {project && objective.status === 'awaiting_confirm' ? (
            <div>
              <button
                type="button"
                className={linkButtonClass}
                onClick={() => setIdeaShownId((id) => (id === objective.requestId ? 0 : objective.requestId))}
              >
                <Icon icon={ideaShownId === objective.requestId ? 'chevron-up' : 'chevron-down'} />
                {ideaShownId === objective.requestId ? 'Hide' : 'Show'} what Lumine gets
              </button>
              {ideaShownId === objective.requestId ? <p className={ideaClass}>{project.idea}</p> : null}
            </div>
          ) : null}
          {objective.status === 'running' ? (
            <p className={mutedClass}>Keep going here, or switch to a call with {persona} any time.</p>
          ) : null}
          {objective.status === 'completed' && objective.result?.buildTitle ? (
            <p className={resultClass}>Made “{objective.result.buildTitle}”</p>
          ) : null}
        </>
      );
    }
    if (objective.status === 'sent' && objective.failureCode) {
      return <p className={mutedClass}>That didn’t work this time. Try again?</p>;
    }
    return null;
  }

  function renderObjectiveButton(action: string, objective: SponsoredHelpObjectiveView, project?: any) {
    const key = `${action}:${objective.requestId}`;
    switch (action) {
      case 'press':
        return (
          <GameCTAButton
            key={key}
            variant={buttonVariant}
            size="sm"
            icon="wand-magic-sparkles"
            loading={working === key}
            onClick={() => handlePress(objective)}
          >
            {objective.failureCode ? 'Try again' : count > 1 ? 'Do this one' : `Have ${persona} do this`}
          </GameCTAButton>
        );
      case 'open_chat':
        return (
          <GameCTAButton key={key} variant="neutral" size="sm" icon="comment" onClick={openChat}>
            Open in {persona} chat
          </GameCTAButton>
        );
      case 'confirm':
        return (
          <GameCTAButton
            key={key}
            variant={buttonVariant}
            size="sm"
            icon="check"
            loading={working === key}
            onClick={() => handleConfirm(objective)}
          >
            Confirm
          </GameCTAButton>
        );
      case 'change':
        return (
          <GameCTAButton
            key={key}
            variant="neutral"
            size="sm"
            icon="pencil-alt"
            onClick={() => {
              setNote('');
              setChangingId(objective.requestId);
            }}
          >
            Change
          </GameCTAButton>
        );
      case 'decline':
        return (
          <GameCTAButton
            key={key}
            variant="neutral"
            size="sm"
            loading={working === key}
            onClick={() => run(key, () => declineSponsoredHelp(objective.requestId))}
          >
            No thanks
          </GameCTAButton>
        );
      case 'again':
        return (
          <GameCTAButton
            key={key}
            variant="neutral"
            size="sm"
            icon="redo"
            loading={working === key}
            onClick={() => handleAgainAsk(objective)}
          >
            Do it again
          </GameCTAButton>
        );
      case 'open_result':
        return (
          <GameCTAButton
            key={key}
            variant={buttonVariant}
            size="sm"
            icon="arrow-right"
            onClick={() =>
              objective.result?.buildId
                ? navigate(`/build/${objective.result.buildId}`, {
                    state: { initialPrompt: objective.result.idea || project?.idea || '' }
                  })
                : navigate(String(objective.result?.path || '/'))
            }
          >
            {objective.result?.buildId ? `Open “${objective.result.buildTitle}”` : 'Open the page'}
          </GameCTAButton>
        );
      case 'talk':
        return (
          <div key={key} className={talkClass} role="group" aria-label={`Talk with ${persona}`}>
            <button type="button" onClick={() => handleTalk(objective, 'text')}>
              <Icon icon="comment" /> Type
            </button>
            <button type="button" onClick={() => handleTalk(objective, 'voice')}>
              <Icon icon="phone-volume" /> Call {persona}
            </button>
          </div>
        );
      default:
        return null;
    }
  }

  function renderAgain(objective: SponsoredHelpObjectiveView) {
    const estimate = again?.estimate;
    if (!estimate) {
      return (
        <div className={againClass}>
          <Loading style={{ height: '2rem', width: '2rem', margin: 0 }} />
        </div>
      );
    }
    if (!estimate.enough) {
      return (
        <div className={cx(againClass, againLowClass)} role="alert" data-wand-again="low">
          <p>
            <Icon icon="battery-empty" /> {againRefusalText(estimate)}
          </p>
          <div className={rowActionsClass}>
            <GameCTAButton variant="neutral" size="sm" onClick={() => setAgain(null)}>
              OK
            </GameCTAButton>
          </div>
        </div>
      );
    }
    const key = `again-start:${objective.requestId}`;
    return (
      <div className={againClass} data-wand-again="confirm">
        <p>
          <Icon icon="bolt" /> {againConfirmText(estimate)} {card.senderUsername} isn’t charged again.
        </p>
        <div className={rowActionsClass}>
          <GameCTAButton
            variant={buttonVariant}
            size="sm"
            icon="redo"
            loading={working === key}
            onClick={() => handleAgainStart(objective)}
          >
            Yes, do it again
          </GameCTAButton>
          <GameCTAButton variant="neutral" size="sm" onClick={() => setAgain(null)}>
            Not now
          </GameCTAButton>
        </div>
      </div>
    );
  }

  function renderCardActions() {
    const buttons: React.ReactNode[] = [];
    if (actions.confirmAll) {
      buttons.push(
        <GameCTAButton
          key="confirm-all"
          variant={buttonVariant}
          size="md"
          icon="check"
          loading={working === 'confirm-all'}
          onClick={handleConfirmAll}
        >
          Confirm all
        </GameCTAButton>
      );
    }
    if (actions.doAll) {
      buttons.push(
        <GameCTAButton
          key="do-all"
          variant={buttonVariant}
          size="md"
          icon="wand-magic-sparkles"
          loading={working === 'do-all'}
          onClick={handleDoAll}
        >
          Do all of these
        </GameCTAButton>
      );
    }
    if (actions.noThanks) {
      buttons.push(
        <GameCTAButton
          key="no-thanks"
          variant="neutral"
          size="md"
          loading={working === 'no-thanks'}
          onClick={() => run('no-thanks', () => declineSponsoredHelpCard(card.cardId))}
        >
          No thanks
        </GameCTAButton>
      );
    }
    if (actions.takeBack) {
      buttons.push(
        <GameCTAButton
          key="take-back"
          variant="neutral"
          size="md"
          loading={working === 'take-back'}
          onClick={() => run('take-back', () => cancelSponsoredHelpCard(card.cardId))}
        >
          Take back
        </GameCTAButton>
      );
    }
    return buttons.length ? <>{buttons}</> : null;
  }

  async function run(label: string, action: () => Promise<any>) {
    if (working) return null;
    setWorking(label);
    setError('');
    try {
      const data = await action();
      if (!mounted.current) return data;
      if (data?.card?.cardId) setCard(data.card);
      else await refresh();
      return data;
    } catch (requestError: any) {
      if (mounted.current) setError(requestError?.message || 'Something went wrong. Please try again.');
      await refresh();
      return null;
    } finally {
      if (mounted.current) setWorking('');
    }
  }

  async function refresh() {
    try {
      const fresh = await loadSponsoredHelpCard(card.cardId);
      if (mounted.current && fresh?.card) setCard(fresh.card);
    } catch {
      // keep what we have
    }
  }

  function openChat(pathId?: number) {
    const id = Number(pathId || card.assistantPathId || 0);
    if (id) navigate(`/chat/${id}`);
  }

  async function handlePress(objective: SponsoredHelpObjectiveView) {
    const data = await run(`press:${objective.requestId}`, () => pressSponsoredHelp(objective.requestId));
    if (data && place !== 'assistant') openChat(Number(data?.request?.assistantPathId || 0));
  }

  async function handleDoAll() {
    const data = await run('do-all', () => pressAllSponsoredHelp(card.cardId));
    if (data && place !== 'assistant') openChat(Number(data?.card?.assistantPathId || 0));
  }

  async function handleAnswer(objective: SponsoredHelpObjectiveView, answer: string) {
    await run(`answer:${objective.requestId}`, () =>
      answerSponsoredHelp({ requestId: objective.requestId, answer })
    );
  }

  async function handleChange(objective: SponsoredHelpObjectiveView) {
    const data = await run(`change:${objective.requestId}`, () =>
      changeSponsoredHelp({ requestId: objective.requestId, note: note.trim() })
    );
    if (data) {
      setChangingId(0);
      setNote('');
    }
  }

  async function handleConfirm(objective: SponsoredHelpObjectiveView) {
    const data = await run(`confirm:${objective.requestId}`, () =>
      confirmSponsoredHelp({ requestId: objective.requestId, planHash: objective.planHash || '' })
    );
    followClientAction(data?.clientAction);
  }

  async function handleConfirmAll() {
    const data = await run('confirm-all', () =>
      confirmAllSponsoredHelp({ cardId: card.cardId, planHashes: confirmAllPlanHashes(card) })
    );
    followClientAction(data?.clientAction);
  }

  function followClientAction(action: any) {
    if (action?.type === 'open_build' && action.buildId) {
      navigate(`/build/${action.buildId}`, { state: { initialPrompt: action.initialPrompt } });
    } else if (action?.type === 'navigate' && action.path) {
      navigate(action.path);
    }
  }

  async function handleAgainAsk(objective: SponsoredHelpObjectiveView) {
    setAgain({ requestId: objective.requestId, estimate: null });
    setError('');
    try {
      const estimate = await loadSponsoredHelpAgain(objective.requestId);
      if (mounted.current) setAgain({ requestId: objective.requestId, estimate });
    } catch (requestError: any) {
      if (mounted.current) {
        setAgain(null);
        setError(requestError?.message || 'Something went wrong. Please try again.');
      }
    }
  }

  async function handleAgainStart(objective: SponsoredHelpObjectiveView) {
    const data = await run(`again-start:${objective.requestId}`, () => startSponsoredHelpAgain(objective.requestId));
    if (data) {
      setAgain(null);
      if (place !== 'assistant') openChat(Number(data?.card?.assistantPathId || data?.request?.assistantPathId || 0));
    }
  }

  // Text or a voice call with Zero/Ciel about this card, through the one
  // AssistantDock: it carries the card as what they are asking about (the
  // server re-reads it), and its own switch moves between text and voice.
  function handleTalk(objective: SponsoredHelpObjectiveView, mode: 'text' | 'voice') {
    const context = wandTalkContext(card, objective);
    const assistant = persona as 'Zero' | 'Ciel';
    openAssistantDock(assistant, context, 0);
    if (mode !== 'voice') return;
    const channelId = Number(card.persona === 'ciel' ? cielChannelId : zeroChannelId);
    if (!channelId) return;
    void startAiVoiceCall(channelId, 0, { assistant, askedAbout: context, continuation: true }).catch(() => {});
  }
}

function cardSignature(card: SponsoredHelpCardView) {
  return `${card.cardId}:${card.objectives
    .map((objective) => `${objective.requestId}.${objective.status}.${objective.planRevision || 0}.${objective.question?.question || ''}`)
    .join('|')}`;
}

// The card on a comment: loaded for whoever is looking (only the person it
// is for gets the controls).
export function CommentWandCard({
  cardId,
  commentId,
  fallback = null
}: {
  cardId: number;
  commentId: number;
  // the comment's own text, shown until (or unless) the card loads
  fallback?: React.ReactNode;
}) {
  const loadSponsoredHelpCard = useAppContext((v) => v.requestHelpers.loadSponsoredHelpCard);
  const [card, setCard] = useState<SponsoredHelpCardView | null>(null);
  useEffect(() => {
    let cancelled = false;
    Promise.resolve(loadSponsoredHelpCard(cardId))
      .then((data: any) => {
        if (!cancelled && data?.card && Number(data.card.commentId) === Number(commentId)) setCard(data.card);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cardId, commentId]);
  if (!card) return <>{fallback}</>;
  return <WandCard card={card} place="comment" inMessageRow />;
}

const wrapClass = css`
  width: 100%;
  padding: 0.6rem 1rem;
  display: flex;
  justify-content: flex-start;
  > div {
    max-width: 58rem;
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
    max-width: 58rem;
    width: 100%;
  }
`;

const listClass = css`
  list-style: none;
  margin: 0.6rem 0 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 0.7rem;
`;

const objectiveClass = css`
  display: flex;
  gap: 0.9rem;
  align-items: flex-start;
  padding: 0.9rem 1rem;
  border-radius: 1rem;
  background: ${Color.highlightGray()};
  border: 1px solid transparent;
  &[data-state='asking'],
  &[data-state='deciding'] {
    background: #fff;
    border-color: ${Color.borderGray()};
  }
  @media (max-width: ${mobileMaxWidth}) {
    padding: 0.8rem;
    gap: 0.7rem;
  }
`;

const numberClass = css`
  flex-shrink: 0;
  width: 2.6rem;
  height: 2.6rem;
  border-radius: 50%;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 1.3rem;
  font-weight: 800;
  background: #fff;
  color: ${Color.darkerGray()};
  border: 1px solid ${Color.borderGray()};
`;

const objectiveMainClass = css`
  flex: 1;
  min-width: 0;
`;

const objectiveTopClass = css`
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 0.8rem;
  flex-wrap: wrap;
`;

const objectiveTextClass = css`
  margin: 0.2rem 0 0;
  flex: 1 1 18rem;
  min-width: 0;
  font-size: 1.5rem;
  line-height: 1.45;
  font-weight: 600;
  color: ${Color.black()};
  white-space: pre-wrap;
  word-break: break-word;
`;

const stateChipClass = css`
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.25rem 0.9rem;
  border-radius: 999px;
  font-size: 1.15rem;
  font-weight: 700;
  white-space: nowrap;
  background: #fff;
  color: ${Color.darkerGray()};
  border: 1px solid ${Color.borderGray()};
`;

const toneDone = css`
  background: ${Color.green(0.12)} !important;
  color: rgb(24, 128, 28) !important;
  border-color: ${Color.green(0.35)} !important;
`;
const toneActive = css`
  background: ${Color.logoBlue(0.1)} !important;
  color: ${Color.logoBlue()} !important;
  border-color: ${Color.logoBlue(0.35)} !important;
`;
const toneAsk = css`
  background: ${Color.gold(0.2)} !important;
  color: rgb(140, 98, 0) !important;
  border-color: ${Color.gold(0.6)} !important;
`;
const toneFailed = css`
  background: ${Color.rose(0.08)} !important;
  color: ${Color.rose()} !important;
  border-color: ${Color.rose(0.3)} !important;
`;
const toneQuiet = css`
  color: ${Color.gray()} !important;
`;
const stateTone: Record<string, string> = {
  pending: '',
  working: toneActive,
  asking: toneAsk,
  deciding: toneActive,
  done: toneDone,
  declined: toneQuiet,
  failed: toneFailed,
  expired: toneQuiet,
  cancelled: toneQuiet
};

const rowActionsClass = css`
  display: flex;
  flex-wrap: wrap;
  gap: 0.6rem;
  margin-top: 0.8rem;
`;

const thinkingClass = css`
  display: flex;
  align-items: center;
  gap: 0.7rem;
  margin-top: 0.6rem;
  font-size: 1.35rem;
  color: ${Color.darkerGray()};
`;

const summaryClass = css`
  margin: 0.6rem 0 0;
  font-size: 1.45rem;
  line-height: 1.55;
  color: ${Color.black()};
  white-space: pre-wrap;
  word-break: break-word;
`;

const stepsClass = css`
  list-style: none;
  margin: 0.7rem 0 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
  li {
    display: flex;
    align-items: flex-start;
    gap: 0.6rem;
    font-size: 1.3rem;
    color: ${Color.darkerGray()};
    background: ${Color.highlightGray()};
    border-radius: 0.8rem;
    padding: 0.5rem 0.8rem;
    svg {
      margin-top: 0.25rem;
      color: ${Color.gray()};
    }
  }
`;

const linkButtonClass = css`
  margin-top: 0.5rem;
  background: none;
  border: none;
  padding: 0;
  cursor: pointer;
  font-size: 1.25rem;
  font-weight: 700;
  color: ${Color.logoBlue()};
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
`;

const ideaClass = css`
  margin: 0.4rem 0 0;
  font-size: 1.3rem;
  line-height: 1.5;
  white-space: pre-wrap;
  word-break: break-word;
  color: ${Color.darkerGray()};
  border-left: 3px solid ${Color.borderGray()};
  padding-left: 0.8rem;
`;

const mutedClass = css`
  margin: 0.5rem 0 0;
  font-size: 1.3rem;
  color: ${Color.gray()};
`;

const resultClass = css`
  margin: 0.4rem 0 0;
  font-size: 1.3rem;
  font-weight: 600;
  color: ${Color.darkerGray()};
`;

const changeClass = css`
  margin-top: 0.8rem;
  textarea {
    width: 100%;
    min-height: 5.5rem;
    font-size: 1.4rem;
    padding: 0.7rem;
    border-radius: 0.8rem;
    border: 1px solid ${Color.borderGray()};
    resize: vertical;
    font-family: inherit;
  }
`;

const againClass = css`
  margin-top: 0.8rem;
  padding: 0.9rem 1rem;
  border-radius: 1rem;
  background: ${Color.gold(0.14)};
  border: 1px solid ${Color.gold(0.5)};
  p {
    margin: 0;
    font-size: 1.4rem;
    line-height: 1.45;
    color: ${Color.black()};
  }
  svg {
    margin-right: 0.3rem;
  }
`;

const againLowClass = css`
  background: ${Color.rose(0.06)};
  border-color: ${Color.rose(0.35)};
  svg {
    color: ${Color.rose()};
  }
`;

const talkClass = css`
  display: inline-flex;
  border-radius: 999px;
  border: 1px solid ${Color.borderGray()};
  overflow: hidden;
  background: #fff;
  button {
    border: none;
    background: transparent;
    padding: 0.55rem 1.1rem;
    font-size: 1.3rem;
    font-weight: 700;
    color: ${Color.darkerGray()};
    cursor: pointer;
    display: inline-flex;
    align-items: center;
    gap: 0.45rem;
    &:hover {
      background: ${Color.highlightGray()};
    }
  }
  button + button {
    border-left: 1px solid ${Color.borderGray()};
  }
`;

const errorClass = css`
  margin: 0.8rem 0 0;
  font-size: 1.3rem;
  color: ${Color.rose()};
`;
