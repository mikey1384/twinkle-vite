import React, { useState } from 'react';
import Modal from '~/components/Modal';
import Button from '~/components/Button';
import Input from '~/components/Texts/Input';
import { Color } from '~/constants/css';
import { useRoleColor } from '~/theme/useRoleColor';
import { css } from '@emotion/css';
import { addEmoji, finalizeEmoji } from '~/helpers/stringHelpers';

const MAX_CHAR = 150;

export default function BioEditModal({
  onHide,
  onSubmit,
  ...props
}: {
  onHide: () => void;
  onSubmit: (arg: any) => void;
  firstLine?: string;
  secondLine?: string;
  thirdLine?: string;
}) {
  const { colorKey: doneColorKey } = useRoleColor('done', {
    fallback: 'blue'
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [firstLine, setFirstLine] = useState(props.firstLine || '');
  const [secondLine, setSecondLine] = useState(props.secondLine || '');
  const [thirdLine, setThirdLine] = useState(props.thirdLine || '');

  const footer = (
    <div>
      <Button
        variant="ghost"
        onClick={onHide}
        style={{ marginRight: '0.7rem' }}
      >
        Cancel
      </Button>
      <Button
        color={doneColorKey && doneColorKey in Color ? doneColorKey : 'blue'}
        loading={isSubmitting}
        onClick={() => {
          setIsSubmitting(true);
          onSubmit({
            firstLine: finalizeEmoji(firstLine),
            secondLine: finalizeEmoji(secondLine),
            thirdLine: finalizeEmoji(thirdLine)
          });
        }}
        disabled={
          firstLine.length > MAX_CHAR ||
          secondLine.length > MAX_CHAR ||
          thirdLine.length > MAX_CHAR
        }
      >
        Submit
      </Button>
    </div>
  );

  return (
    <Modal
      modalKey="BioEditModal"
      isOpen={true}
      onClose={onHide}
      title="Edit Your Bio"
      size="md"
      footer={footer}
      className={css`
        b {
          color: ${Color.green()};
        }
        label {
          font-weight: 600;
          color: ${Color.darkerGray()};
        }
        input {
          margin-top: 0.5rem;
        }
        small {
          font-size: 1.2rem;
          color: ${Color.darkGray()};
        }
      `}
    >
      <div
        className={css`
          width: 100%;
          display: grid;
          grid-template-columns: 1fr;
          gap: 1.2rem;
        `}
      >
        <div>
          <div
            className={css`
              margin-bottom: 0.4rem;
            `}
          >
            <div
              className={css`
                font-size: 1.5rem;
                font-weight: 600;
                color: ${Color.darkerGray()};
                line-height: 1.45;
              `}
            >
              {`Write anything you want about yourself.`}
            </div>
            <div
              className={css`
                font-size: 1.25rem;
                color: ${Color.gray()};
                line-height: 1.55;
                margin-top: 0.15rem;
              `}
            >
              {`If you can't think of anything to write, use the questions below as prompts — you don't have to answer them.`}
            </div>
          </div>
          <Input
            autoFocus
            value={firstLine}
            onChange={(text) => setFirstLine(addEmoji(text))}
            placeholder="Write anything you want about yourself"
          />
          <div
            className={css`
              display: flex;
              justify-content: flex-end;
            `}
          >
            <small style={{ color: firstLine.length > MAX_CHAR ? 'red' : '' }}>
              {`(${firstLine.length}/${MAX_CHAR} characters)`}
            </small>
          </div>
          <div
            className={css`
              margin-top: 0.6rem;
              background: ${Color.whiteGray()};
              border-left: 3px solid var(--ui-border);
              padding: 0.8rem 1rem;
              border-radius: 8px;
              color: ${Color.darkGray()};
              font-size: 1.35rem;
              line-height: 1.6;
            `}
          >
            <ul
              className={css`
                margin: 0;
                padding-left: 1.2rem;
                list-style-type: disc;
              `}
            >
              <li>{`If you're a Twinkle student: which class are you in?`}</li>
              <li>{`If you're not a Twinkle student: which English academy do you attend?`}</li>
              <li>{`What's your teacher's name?`}</li>
              <li>{`If you're not a student: what's your occupation?`}</li>
            </ul>
          </div>
        </div>
        <div>
          <Input
            value={secondLine}
            onChange={(text) => setSecondLine(addEmoji(text))}
            placeholder="Write anything you want about yourself"
          />
          <div
            className={css`
              display: flex;
              justify-content: flex-end;
            `}
          >
            <small style={{ color: secondLine.length > MAX_CHAR ? 'red' : '' }}>
              {`(${secondLine.length}/${MAX_CHAR} characters)`}
            </small>
          </div>
          <div
            className={css`
              margin-top: 0.6rem;
              background: ${Color.whiteGray()};
              border-left: 3px solid var(--ui-border);
              padding: 0.8rem 1rem;
              border-radius: 8px;
              color: ${Color.darkGray()};
              font-size: 1.35rem;
              line-height: 1.6;
            `}
          >
            <ul
              className={css`
                margin: 0;
                padding-left: 1.2rem;
                list-style-type: disc;
              `}
            >
              <li>{`What do you love doing?`}</li>
              <li>{`What do you usually do when you play with friends?`}</li>
              <li>{`If you could do anything all day, what would it be?`}</li>
              <li>{`Don't like these questions? Write anything you want (ideally your favorite activity).`}</li>
            </ul>
          </div>
        </div>
        <div>
          <Input
            value={thirdLine}
            onChange={(text) => setThirdLine(addEmoji(text))}
            placeholder="Write anything you want about yourself"
          />
          <div
            className={css`
              display: flex;
              justify-content: flex-end;
            `}
          >
            <small style={{ color: thirdLine.length > MAX_CHAR ? 'red' : '' }}>
              {`(${thirdLine.length}/${MAX_CHAR} characters)`}
            </small>
          </div>
          <div
            className={css`
              margin-top: 0.6rem;
              background: ${Color.whiteGray()};
              border-left: 3px solid var(--ui-border);
              padding: 0.8rem 1rem;
              border-radius: 8px;
              color: ${Color.darkGray()};
              font-size: 1.35rem;
              line-height: 1.6;
            `}
          >
            <ul
              className={css`
                margin: 0;
                padding-left: 1.2rem;
                list-style-type: disc;
              `}
            >
              <li>{`Which school do you attend? (e.g., Daechi Elementary School)`}</li>
              <li>{`What grade are you in?`}</li>
              <li>{`If you've finished school: what was the last school you attended?`}</li>
              <li>{`What's your favorite school subject?`}</li>
              <li>{`Or write anything you wish.`}</li>
            </ul>
          </div>
        </div>
      </div>
    </Modal>
  );
}
