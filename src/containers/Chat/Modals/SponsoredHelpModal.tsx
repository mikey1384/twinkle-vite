import React, { useState } from 'react';
import { css, cx } from '@emotion/css';
import Modal from '~/components/Modal';
import Button from '~/components/Button';
import Icon from '~/components/Icon';
import { useAppContext } from '~/contexts';
import { Color, mobileMaxWidth } from '~/constants/css';
import {
  OPEN_WAND_DEFAULT_SPONSOR_CAP,
  OPEN_WAND_MAX_SPONSOR_CAP,
  OPEN_WAND_PER_PERSON_PERCENT,
  OPEN_WAND_PRESETS,
  openWandEnergyLine,
  SPONSORED_HELP_MAX_OBJECTIVES,
  SPONSORED_HELP_OBJECTIVE_MAX,
  energyPercentLabel,
  type SponsoredHelpPreview
} from '~/helpers/sponsoredHelp';

export type SponsoredHelpTarget =
  | { channelId: number }
  | {
      parentType: string;
      parentId: number;
      rootCommentId?: number | null;
      targetCommentId?: number | null;
      subjectId?: number | null;
    };

const KIND_ICON: Record<string, string> = {
  lumine_build: 'code-branch',
  chat_session: 'comment',
  open_page: 'arrow-right',
  app_address: 'globe',
  not_possible: 'ban',
  not_right: 'exclamation-triangle'
};

// The magic wand (twinkle-api helpers/sponsoredHelp/cards.ts): the sender
// writes 1 to 3 short things for Zero/Ciel to do for the other person,
// picks Zero or Ciel and some of their own AI Energy, then reads
// Zero/Ciel's plan for every objective and the total estimate before
// sending. In a one-on-one chat it becomes a message; by a comment box it
// becomes a comment addressed to the person being replied to. The server
// decides what is possible; this only collects the request and shows the
// preview it wrote.
//
// Open mode (twinkle-api helpers/sponsoredHelp/openCards.ts; the Subject
// composer's attach menu): a card for anyone who reads the post, inserted
// into the text being written. One compact sheet: what Zero/Ciel helps with
// (a pick, preselected, or typed), Zero or Ciel, how many people to
// sponsor (first come, first served; 0 allowed: after them, or with 0,
// people use their own AI Energy), the honest worst case, Insert.
export default function SponsoredHelpModal({
  target,
  recipientUsername,
  percents = [5, 10, 25],
  maxObjectives = SPONSORED_HELP_MAX_OBJECTIVES,
  objectiveMaxLength = SPONSORED_HELP_OBJECTIVE_MAX,
  cardsSupported = true,
  open = false,
  openDefaultSponsorCap = OPEN_WAND_DEFAULT_SPONSOR_CAP,
  openMaxSponsorCap = OPEN_WAND_MAX_SPONSOR_CAP,
  openPerPersonPercent = OPEN_WAND_PER_PERSON_PERCENT,
  onInserted,
  onHide,
  onSent
}: {
  target?: SponsoredHelpTarget | null;
  // an open wand card (see above) instead of an addressed one
  open?: boolean;
  openDefaultSponsorCap?: number;
  openMaxSponsorCap?: number;
  openPerPersonPercent?: number;
  // the open card was made: put its embed into the text
  onInserted?: (openCardId: number) => void;
  recipientUsername: string;
  percents?: number[];
  maxObjectives?: number;
  objectiveMaxLength?: number;
  // false: an API from before wand cards (one task, DMs only)
  cardsSupported?: boolean;
  onHide: () => void;
  onSent?: (result: any) => void;
}) {
  const previewSponsoredHelp = useAppContext((v) => v.requestHelpers.previewSponsoredHelp);
  const sendSponsoredHelpCard = useAppContext((v) => v.requestHelpers.sendSponsoredHelpCard);
  const sendSponsoredHelp = useAppContext((v) => v.requestHelpers.sendSponsoredHelp);
  const createOpenWandCard = useAppContext((v) => v.requestHelpers.createOpenWandCard);
  const [task, setTask] = useState(OPEN_WAND_PRESETS[0]);
  // one key per sheet: a retried Insert (double tap, slow network) returns
  // the same card instead of making a second one
  const [clientKey] = useState(
    () => `ow-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`
  );
  const [sponsorCap, setSponsorCap] = useState(Math.max(0, Math.min(openDefaultSponsorCap, openMaxSponsorCap)));
  const [objectives, setObjectives] = useState<string[]>(['']);
  const [persona, setPersona] = useState<'zero' | 'ciel'>('zero');
  const [percent, setPercent] = useState(percents.includes(10) ? 10 : percents[0]);
  const [preview, setPreview] = useState<SponsoredHelpPreview | null>(null);
  const [working, setWorking] = useState('');
  const [error, setError] = useState('');
  const personaName = persona === 'ciel' ? 'Ciel' : 'Zero';
  const isComment = !target || !('channelId' in target);
  const isOpen = open || !target;
  const canInsert = task.trim().length >= 3 && !working;
  const filled = objectives.map((text) => text.trim()).filter(Boolean);
  const canCheck =
    filled.length > 0 && filled.every((text) => text.length >= 3) && !working;
  const who = recipientUsername || preview?.recipientUsername || 'them';
  const max = cardsSupported ? Math.max(1, Math.min(maxObjectives, SPONSORED_HELP_MAX_OBJECTIVES)) : 1;

  return (
    <Modal
      modalKey="SponsoredHelpModal"
      isOpen
      onClose={onHide}
      title={isOpen ? 'Add a wand card' : preview ? `${personaName}’s plan for ${who}` : `Have ${personaName} help ${who}`}
      size="md"
      footer={
        isOpen ? (
          <>
            <Button variant="ghost" onClick={onHide} style={{ marginRight: '0.7rem' }}>
              Cancel
            </Button>
            <Button
              color={persona === 'ciel' ? 'pink' : 'logoBlue'}
              loading={working === 'insert'}
              disabled={!canInsert}
              onClick={handleInsert}
            >
              <Icon icon="wand-magic-sparkles" style={{ marginRight: '0.7rem' }} />
              Insert card
            </Button>
          </>
        ) : preview ? (
          <>
            <Button variant="ghost" onClick={() => setPreview(null)} style={{ marginRight: '0.7rem' }}>
              <Icon icon="arrow-left" style={{ marginRight: '0.5rem' }} />
              Edit
            </Button>
            <Button
              color={persona === 'ciel' ? 'pink' : 'logoBlue'}
              loading={working === 'send'}
              disabled={!preview.canSend || !!working}
              onClick={handleSend}
            >
              <Icon icon="wand-magic-sparkles" style={{ marginRight: '0.7rem' }} />
              {isComment ? 'Post the card' : 'Send the card'}
            </Button>
          </>
        ) : (
          <>
            <Button variant="ghost" onClick={onHide} style={{ marginRight: '0.7rem' }}>
              Cancel
            </Button>
            <Button
              color={persona === 'ciel' ? 'pink' : 'logoBlue'}
              loading={working === 'check'}
              disabled={!canCheck}
              onClick={cardsSupported ? handleCheck : handleLegacySend}
            >
              <Icon icon="wand-magic-sparkles" style={{ marginRight: '0.7rem' }} />
              {cardsSupported ? 'Check the plan' : 'Send the button'}
            </Button>
          </>
        )
      }
    >
      {isOpen ? renderOpenCompose() : preview ? renderPreview(preview) : renderCompose()}
    </Modal>
  );

  function renderOpenCompose() {
    const custom = !OPEN_WAND_PRESETS.includes(task);
    return (
      <div className={bodyClass} data-wand-open-compose>
        <span className={labelClass}>What should {personaName} help with?</span>
        <div className={presetGridClass} role="radiogroup" aria-label="Pick one">
          {OPEN_WAND_PRESETS.map((value) => (
            <button
              key={value}
              type="button"
              role="radio"
              aria-checked={task === value}
              className={cx(choiceClass, presetClass, task === value && (persona === 'ciel' ? cielOnClass : zeroOnClass))}
              onClick={() => setTask(value)}
            >
              {value}
            </button>
          ))}
        </div>
        <input
          className={cx(ownTaskClass, custom && task ? ownTaskOnClass : '')}
          aria-label="Or write your own"
          placeholder="Or write your own"
          value={custom ? task : ''}
          maxLength={objectiveMaxLength}
          onChange={(event) => setTask(event.target.value)}
        />
        <div className={rowClass}>
          <span className={labelClass}>Who helps</span>
          <div className={choiceRowClass} role="radiogroup" aria-label="Who helps">
            {(['zero', 'ciel'] as const).map((value) => (
              <button
                key={value}
                type="button"
                role="radio"
                aria-checked={persona === value}
                className={cx(choiceClass, persona === value && (value === 'ciel' ? cielOnClass : zeroOnClass))}
                onClick={() => setPersona(value)}
              >
                {value === 'ciel' ? 'Ciel' : 'Zero'}
              </button>
            ))}
          </div>
        </div>
        <div className={rowClass}>
          <span className={labelClass} id="wand-sponsor-label">
            Sponsor up to {sponsorCap} {sponsorCap === 1 ? 'person' : 'people'}
          </span>
          <div className={stepperClass} role="group" aria-labelledby="wand-sponsor-label">
            <button
              type="button"
              aria-label="Fewer"
              disabled={sponsorCap <= 0}
              onClick={() => setSponsorCap((value) => Math.max(0, value - 1))}
            >
              <Icon icon="minus" />
            </button>
            <span aria-live="polite">{sponsorCap}</span>
            <button
              type="button"
              aria-label="More"
              disabled={sponsorCap >= openMaxSponsorCap}
              onClick={() => setSponsorCap((value) => Math.min(openMaxSponsorCap, value + 1))}
            >
              <Icon icon="plus" />
            </button>
          </div>
        </div>
        <div className={estimateClass}>
          <Icon icon="bolt" />
          <div>
            <strong>{openWandEnergyLine(sponsorCap, openPerPersonPercent)}</strong>
            <span>
              {sponsorCap > 0
                ? `The first ${sponsorCap === 1 ? 'person' : `${sponsorCap} people`} who press it use your Energy (never more than ${openPerPersonPercent}% each), and only what ${personaName} uses comes out. After that, people can still use the card with their own AI Energy. Making the card uses a little too.`
                : `Everyone who uses it pays with their own AI Energy.`}{' '}
              Each person can use it once and sees a plan before anything happens.
            </span>
          </div>
        </div>
        {error ? <p className={errorClass}>{error}</p> : null}
      </div>
    );
  }

  async function handleInsert() {
    if (!canInsert) return;
    setWorking('insert');
    setError('');
    try {
      const result = await createOpenWandCard({ task: task.trim(), persona, sponsorCap, clientKey });
      if (result?.openCardId) {
        onInserted?.(Number(result.openCardId));
        onHide();
      }
    } catch (insertError: any) {
      setError(insertError?.message || 'Something went wrong. Please try again.');
    } finally {
      setWorking('');
    }
  }

  function renderCompose() {
    return (
      <div className={bodyClass} data-wand-compose>
        <span className={labelClass}>
          What should {personaName} do for {who}?
          {max > 1 ? <span className={hintClass}>Up to {max} things, one per line</span> : null}
        </span>
        <ol className={objectiveListClass}>
          {objectives.map((text, index) => (
            <li key={index}>
              <span className={numberClass}>{index + 1}</span>
              <input
                aria-label={`Thing ${index + 1}`}
                value={text}
                maxLength={objectiveMaxLength}
                autoFocus={index === objectives.length - 1}
                placeholder={
                  index === 0
                    ? 'For example: Make a game with Lumine'
                    : index === 1
                      ? 'For example: Quiz me on fractions'
                      : 'For example: Show me the Arena'
                }
                onChange={(event) =>
                  setObjectives((current) =>
                    current.map((value, i) => (i === index ? event.target.value : value))
                  )
                }
              />
              {objectives.length > 1 ? (
                <button
                  type="button"
                  className={removeClass}
                  aria-label={`Remove thing ${index + 1}`}
                  onClick={() => setObjectives((current) => current.filter((_, i) => i !== index))}
                >
                  <Icon icon="times" />
                </button>
              ) : null}
            </li>
          ))}
        </ol>
        {objectives.length < max ? (
          <button
            type="button"
            className={addClass}
            onClick={() => setObjectives((current) => [...current, ''])}
          >
            <Icon icon="plus" /> Add another
          </button>
        ) : null}
        <div className={rowClass}>
          <span className={labelClass}>Who helps</span>
          <div className={choiceRowClass} role="radiogroup" aria-label="Who helps">
            {(['zero', 'ciel'] as const).map((value) => (
              <button
                key={value}
                type="button"
                role="radio"
                aria-checked={persona === value}
                className={cx(choiceClass, persona === value && (value === 'ciel' ? cielOnClass : zeroOnClass))}
                onClick={() => setPersona(value)}
              >
                {value === 'ciel' ? 'Ciel' : 'Zero'}
              </button>
            ))}
          </div>
        </div>
        <div className={rowClass}>
          <span className={labelClass}>
            <Icon icon="bolt" style={{ marginRight: '0.5rem', color: Color.gold() }} />
            Your AI Energy to give
          </span>
          <div className={choiceRowClass} role="radiogroup" aria-label="AI Energy to give">
            {percents.map((value) => (
              <button
                key={value}
                type="button"
                role="radio"
                aria-checked={percent === value}
                className={cx(choiceClass, percent === value && energyOnClass)}
                onClick={() => setPercent(value)}
              >
                {value}%
              </button>
            ))}
          </div>
        </div>
        <p className={noteClass}>
          {isComment
            ? `The card goes on your comment for everyone to see; only ${who} can press it.`
            : `${who} gets a card.`}{' '}
          {personaName} shows them a plan and waits for their OK before doing anything. Only what{' '}
          {personaName} actually uses comes out of your Energy. The card lasts 7 days.
        </p>
        {error ? <p className={errorClass}>{error}</p> : null}
      </div>
    );
  }

  function renderPreview(current: SponsoredHelpPreview) {
    const over = !current.enough;
    return (
      <div className={bodyClass} data-wand-preview>
        <p className={summaryClass}>{current.summary}</p>
        <ol className={previewListClass}>
          {current.objectives.map((objective, index) => (
            <li key={index} data-kind={objective.kind}>
              <span className={numberClass}>{index + 1}</span>
              <div>
                <p className={previewTextClass}>{objective.text}</p>
                <p className={previewLineClass}>
                  <Icon icon={KIND_ICON[objective.kind] || 'arrow-right'} />
                  <span>{objective.line}</span>
                </p>
              </div>
            </li>
          ))}
        </ol>
        <div className={estimateClass} data-over={over || undefined}>
          <Icon icon="bolt" />
          <div>
            <strong>Uses {energyPercentLabel(current.estimatePercent)} of your AI Energy in all</strong>
            <span>
              You’re giving up to {Math.round(current.budgetPercent)}%, shared equally between the{' '}
              {current.objectives.length === 1 ? 'one thing' : `${current.objectives.length} things`}. What
              isn’t used stays yours.
            </span>
            {over ? (
              <span className={overClass}>
                That may not be enough for everything. Pick a bigger amount, or {personaName} does what fits.
              </span>
            ) : null}
          </div>
        </div>
        {!current.canSend ? (
          <p className={errorClass}>{personaName} can’t do one of these. Tap Edit to change or remove it.</p>
        ) : null}
        {error ? <p className={errorClass}>{error}</p> : null}
      </div>
    );
  }

  async function handleCheck() {
    if (!canCheck) return;
    setWorking('check');
    setError('');
    try {
      const result = await previewSponsoredHelp({ objectives: filled, persona, percent, target });
      setPreview(result);
    } catch (checkError: any) {
      setError(checkError?.message || 'Something went wrong. Please try again.');
    } finally {
      setWorking('');
    }
  }

  async function handleSend() {
    if (!preview || working) return;
    setWorking('send');
    setError('');
    try {
      const result = await sendSponsoredHelpCard(preview.previewId);
      onSent?.(result);
      onHide();
    } catch (sendError: any) {
      setError(sendError?.message || 'Something went wrong. Please try again.');
    } finally {
      setWorking('');
    }
  }

  async function handleLegacySend() {
    if (!canCheck || !target || !('channelId' in target)) return;
    setWorking('check');
    setError('');
    try {
      const result = await sendSponsoredHelp({
        channelId: target.channelId,
        task: filled[0],
        persona,
        percent
      });
      onSent?.(result);
      onHide();
    } catch (sendError: any) {
      setError(sendError?.message || 'Something went wrong. Please try again.');
    } finally {
      setWorking('');
    }
  }
}

const bodyClass = css`
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 1.3rem;
`;

const labelClass = css`
  font-size: 1.45rem;
  font-weight: 700;
  color: ${Color.darkerGray()};
  display: inline-flex;
  align-items: baseline;
  flex-wrap: wrap;
  gap: 0.2rem 0.8rem;
`;

const hintClass = css`
  font-size: 1.2rem;
  font-weight: 500;
  color: ${Color.gray()};
`;

const objectiveListClass = css`
  list-style: none;
  margin: -0.3rem 0 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 0.7rem;
  li {
    display: flex;
    align-items: center;
    gap: 0.8rem;
  }
  input {
    flex: 1;
    min-width: 0;
    font-size: 1.5rem;
    padding: 0.9rem 1rem;
    border-radius: 1rem;
    border: 1px solid ${Color.borderGray()};
    font-family: inherit;
    &:focus {
      outline: none;
      border-color: ${Color.logoBlue()};
      box-shadow: 0 0 0 3px ${Color.logoBlue(0.15)};
    }
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
  background: ${Color.highlightGray()};
  color: ${Color.darkerGray()};
`;

const removeClass = css`
  flex-shrink: 0;
  width: 3rem;
  height: 3rem;
  border-radius: 50%;
  border: none;
  background: transparent;
  color: ${Color.gray()};
  cursor: pointer;
  font-size: 1.4rem;
  &:hover {
    background: ${Color.highlightGray()};
    color: ${Color.darkerGray()};
  }
`;

const addClass = css`
  align-self: flex-start;
  margin: -0.4rem 0 0 3.4rem;
  border: 1px dashed ${Color.borderGray()};
  background: transparent;
  border-radius: 999px;
  padding: 0.5rem 1.2rem;
  font-size: 1.3rem;
  font-weight: 700;
  color: ${Color.darkerGray()};
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  &:hover {
    border-color: ${Color.logoBlue()};
    color: ${Color.logoBlue()};
  }
`;

const presetGridClass = css`
  display: flex;
  flex-wrap: wrap;
  gap: 0.6rem;
  margin-top: -0.4rem;
`;

const presetClass = css`
  text-align: left;
  line-height: 1.35;
  @media (max-width: ${mobileMaxWidth}) {
    width: 100%;
  }
`;

const ownTaskClass = css`
  width: 100%;
  font-size: 1.5rem;
  padding: 0.9rem 1rem;
  border-radius: 1rem;
  border: 1px solid ${Color.borderGray()};
  font-family: inherit;
  &:focus {
    outline: none;
    border-color: ${Color.logoBlue()};
    box-shadow: 0 0 0 3px ${Color.logoBlue(0.15)};
  }
`;

const ownTaskOnClass = css`
  border-color: ${Color.logoBlue()};
`;

const stepperClass = css`
  display: inline-flex;
  align-items: center;
  border: 1px solid ${Color.borderGray()};
  border-radius: 999px;
  overflow: hidden;
  background: #fff;
  button {
    width: 4rem;
    height: 3.6rem;
    border: none;
    background: transparent;
    font-size: 1.3rem;
    color: ${Color.darkerGray()};
    cursor: pointer;
    &:hover:not(:disabled) {
      background: ${Color.highlightGray()};
    }
    &:disabled {
      color: ${Color.lightGray()};
      cursor: default;
    }
  }
  span {
    min-width: 4rem;
    text-align: center;
    font-size: 1.6rem;
    font-weight: 800;
    color: ${Color.black()};
  }
`;

const rowClass = css`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  flex-wrap: wrap;
  @media (max-width: ${mobileMaxWidth}) {
    flex-direction: column;
    align-items: flex-start;
  }
`;

const choiceRowClass = css`
  display: flex;
  gap: 0.6rem;
`;

const choiceClass = css`
  min-width: 6.4rem;
  padding: 0.7rem 1.4rem;
  border-radius: 999px;
  border: 1px solid ${Color.borderGray()};
  background: #fff;
  font-size: 1.4rem;
  font-weight: 600;
  color: ${Color.darkerGray()};
  cursor: pointer;
  transition: background 0.15s, border-color 0.15s, color 0.15s;
  &:hover {
    border-color: ${Color.darkGray()};
  }
`;

const zeroOnClass = css`
  background: ${Color.logoBlue(0.12)};
  border-color: ${Color.logoBlue()};
  color: ${Color.logoBlue()};
`;

const cielOnClass = css`
  background: ${Color.pink(0.12)};
  border-color: ${Color.pink()};
  color: ${Color.pink()};
`;

const energyOnClass = css`
  background: ${Color.gold(0.15)};
  border-color: ${Color.gold()};
  color: ${Color.darkerGray()};
`;

const noteClass = css`
  margin: 0;
  font-size: 1.3rem;
  line-height: 1.5;
  color: ${Color.gray()};
`;

const summaryClass = css`
  margin: 0;
  font-size: 1.55rem;
  line-height: 1.55;
  color: ${Color.black()};
`;

const previewListClass = css`
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 0.7rem;
  li {
    display: flex;
    align-items: flex-start;
    gap: 0.9rem;
    padding: 0.9rem 1rem;
    border-radius: 1rem;
    background: ${Color.highlightGray()};
  }
  li[data-kind='not_right'],
  li[data-kind='not_possible'] {
    background: ${Color.rose(0.05)};
  }
  li > span {
    background: #fff;
  }
`;

const previewTextClass = css`
  margin: 0.15rem 0 0;
  font-size: 1.45rem;
  font-weight: 700;
  color: ${Color.black()};
  word-break: break-word;
`;

const previewLineClass = css`
  margin: 0.3rem 0 0;
  display: flex;
  gap: 0.6rem;
  align-items: flex-start;
  font-size: 1.35rem;
  line-height: 1.45;
  color: ${Color.darkerGray()};
  svg {
    margin-top: 0.3rem;
    color: ${Color.gray()};
  }
`;

const estimateClass = css`
  display: flex;
  gap: 0.9rem;
  align-items: flex-start;
  padding: 1rem 1.1rem;
  border-radius: 1rem;
  background: ${Color.gold(0.14)};
  border: 1px solid ${Color.gold(0.5)};
  > svg {
    margin-top: 0.3rem;
    color: rgb(190, 140, 0);
    font-size: 1.6rem;
  }
  div {
    display: flex;
    flex-direction: column;
    gap: 0.2rem;
  }
  strong {
    font-size: 1.45rem;
    color: ${Color.black()};
  }
  span {
    font-size: 1.3rem;
    line-height: 1.45;
    color: ${Color.darkerGray()};
  }
`;

const overClass = css`
  color: ${Color.rose()} !important;
  font-weight: 600;
`;

const errorClass = css`
  margin: 0;
  font-size: 1.35rem;
  color: ${Color.rose()};
`;
