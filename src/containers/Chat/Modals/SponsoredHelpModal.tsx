import React, { useState } from 'react';
import { css, cx } from '@emotion/css';
import Modal from '~/components/Modal';
import Button from '~/components/Button';
import Icon from '~/components/Icon';
import { useAppContext } from '~/contexts';
import { Color, mobileMaxWidth } from '~/constants/css';

// "Have Zero/Ciel do this": the sender writes what they want done for the
// other person, picks Zero or Ciel, and gives some of their own AI Energy
// (twinkle-api helpers/sponsoredHelp/service.ts). The server decides what is
// possible; this only collects the request.
export default function SponsoredHelpModal({
  channelId,
  partnerUsername,
  percents = [5, 10, 25],
  taskMaxLength = 1000,
  onHide,
  onSent
}: {
  channelId: number;
  partnerUsername: string;
  percents?: number[];
  taskMaxLength?: number;
  onHide: () => void;
  onSent?: (result: any) => void;
}) {
  const sendSponsoredHelp = useAppContext((v) => v.requestHelpers.sendSponsoredHelp);
  const [task, setTask] = useState('');
  const [persona, setPersona] = useState<'zero' | 'ciel'>('zero');
  const [percent, setPercent] = useState(percents.includes(10) ? 10 : percents[0]);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const personaName = persona === 'ciel' ? 'Ciel' : 'Zero';
  const canSend = task.trim().length >= 3 && !sending;

  return (
    <Modal
      modalKey="SponsoredHelpModal"
      isOpen
      onClose={onHide}
      title={`Have ${personaName} help ${partnerUsername}`}
      size="md"
      footer={
        <>
          <Button variant="ghost" onClick={onHide} style={{ marginRight: '0.7rem' }}>
            Cancel
          </Button>
          <Button
            color={persona === 'ciel' ? 'pink' : 'logoBlue'}
            loading={sending}
            disabled={!canSend}
            onClick={handleSend}
          >
            <Icon icon="wand-magic-sparkles" style={{ marginRight: '0.7rem' }} />
            Send the button
          </Button>
        </>
      }
    >
      <div className={bodyClass}>
        <label className={labelClass} htmlFor="sponsored-help-task">
          What should {personaName} do for {partnerUsername}?
        </label>
        <textarea
          id="sponsored-help-task"
          className={taskClass}
          value={task}
          maxLength={taskMaxLength}
          placeholder={`For example: Start a Lumine project called "krillion" and give Lumine this idea: …`}
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
          {partnerUsername} gets a button. When they press it, {personaName} shows them exactly
          what it will do and waits for their OK. Only what {personaName} actually uses comes out
          of your Energy, and whatever is left stays yours. The button lasts 7 days.
        </p>
        {error ? <p className={errorClass}>{error}</p> : null}
      </div>
    </Modal>
  );

  async function handleSend() {
    if (!canSend) return;
    setSending(true);
    setError('');
    try {
      const result = await sendSponsoredHelp({ channelId, task: task.trim(), persona, percent });
      onSent?.(result);
      onHide();
    } catch (sendError: any) {
      setError(sendError?.message || 'Something went wrong. Please try again.');
    } finally {
      setSending(false);
    }
  }
}

const bodyClass = css`
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 1.4rem;
`;

const labelClass = css`
  font-size: 1.45rem;
  font-weight: 600;
  color: ${Color.darkerGray()};
  display: inline-flex;
  align-items: center;
`;

const taskClass = css`
  width: 100%;
  min-height: 11rem;
  font-size: 1.5rem;
  line-height: 1.5;
  padding: 1rem;
  border-radius: 1rem;
  border: 1px solid ${Color.borderGray()};
  font-family: inherit;
  resize: vertical;
  &:focus {
    outline: none;
    border-color: ${Color.logoBlue()};
    box-shadow: 0 0 0 3px ${Color.logoBlue(0.15)};
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

const errorClass = css`
  margin: 0;
  font-size: 1.35rem;
  color: ${Color.rose()};
`;
