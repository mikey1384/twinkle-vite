import React, { useEffect, useState } from 'react';
import ChoiceListItem from './ChoiceListItem';
import EditChoiceListItem from './EditChoiceListItem';
import Textarea from '~/components/Texts/Textarea';
import Button from '~/components/Button';
import { borderRadius, innerBorderRadius, Color } from '~/constants/css';
import Banner from '~/components/Banner';
import Icon from '~/components/Icon';
import { css } from '@emotion/css';
import localize from '~/constants/localize';

const Styles = {
  content: css`
    display: flex;
    width: 100%;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 1rem;
  `,
  choiceList: css`
    display: flex;
    flex-direction: column;
    width: 100%;
    > nav {
      display: flex;
      width: 100%;
      border: 1px solid var(--ui-border);
      margin-bottom: -1px;
      > main {
        position: relative;
        padding: 0.5rem;
        display: flex;
        align-items: center;
        width: CALC(100% - 4.3rem);
        > section {
          padding: 0.5rem;
          width: 100%;
          line-height: 1.5;
          display: flex;
        }
      }
      > aside {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 4.5rem;
        background: ${Color.darkerBorderGray()};
      }
      &:first-of-type {
        border-top-left-radius: ${borderRadius};
        border-top-right-radius: ${borderRadius};
        > aside {
          border-top-right-radius: ${innerBorderRadius};
        }
      }
      &:last-child {
        border-bottom-left-radius: ${borderRadius};
        border-bottom-right-radius: ${borderRadius};
        > aside {
          border-bottom-right-radius: ${innerBorderRadius};
        }
      }
    }
  `
};

const questionTitleLabel = localize('questionTitle');
const choiceALabel = localize('choiceA');
const choiceBLabel = localize('choiceB');
const choiceCLabel = localize('choiceC');
const choiceDLabel = localize('choiceD');
const choiceELabel = localize('choiceE');
const cancelLabel = localize('cancel');
const doneLabel = localize('done');
const enterQuestionLabel = localize('enterQuestion');
const editQuestionLabel = localize('editQuestion');
const removeLabel = localize('remove');
const undoLabel = localize('undo');

export default function QuestionBlock({
  correctChoice,
  choiceIds,
  choicesObj: initialChoices,
  deleted,
  errorMessage,
  hideErrorMsg,
  questionId,
  innerRef,
  onEditDone,
  onSelectChoice,
  onRearrange,
  onEdit,
  onEditCancel,
  onEditStart,
  onRemove,
  onUndoRemove,
  questionIndex,
  title
}: {
  choiceIds: number[];
  choicesObj: { [key: number]: string };
  correctChoice: number;
  deleted: boolean;
  errorMessage: string;
  questionId: number;
  innerRef: React.RefObject<any>;
  onEditDone: (arg0: any) => any;
  onSelectChoice: (arg0: any) => any;
  onRearrange: (arg0: any) => any;
  onEdit: boolean;
  onEditCancel: (v: number) => any;
  onEditStart: (v: number) => any;
  onRemove: (v: number) => any;
  hideErrorMsg: (v: number) => any;
  onUndoRemove: (v: number) => any;
  questionIndex: number;
  title: string;
}) {
  const [editedQuestionTitle, setEditedQuestionTitle] = useState('');
  const [choices, setChoices] = useState<Record<string, any>>({});

  useEffect(() => {
    setEditedQuestionTitle(title);
    setChoices(initialChoices);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialChoices]);

  const choicePlaceHolder = [
    choiceALabel,
    choiceBLabel,
    choiceCLabel,
    choiceDLabel,
    choiceELabel
  ];

  return (
    <div
      style={{
        marginTop: questionIndex === 0 ? 0 : '2rem'
      }}
    >
      <Banner
        color="red"
        innerRef={innerRef}
        style={{
          width: '100%',
          display: errorMessage ? 'block' : 'none',
          marginBottom: '1rem'
        }}
      >
        {errorMessage}
      </Banner>
      <div className={Styles.content}>
        <div style={{ width: onEdit ? '100%' : 'auto', position: 'relative' }}>
          {!onEdit ? (
            <h2
              style={{
                opacity: deleted ? 0.2 : 1,
                color: !title ? '#999' : ''
              }}
            >
              {title || questionTitleLabel}
            </h2>
          ) : (
            <Textarea
              autoFocus
              placeholder={`${enterQuestionLabel}...`}
              value={editedQuestionTitle}
              onChange={(event: any) => {
                hideErrorMsg(questionId);
                setEditedQuestionTitle(event.target.value);
              }}
            />
          )}
        </div>
        <div>
          {!onEdit && !deleted && (
            <Button color="pink" filled onClick={() => onRemove(questionId)}>
              {removeLabel}
            </Button>
          )}
          {deleted && (
            <Button
              variant="solid"
              tone="raised"
              color="darkerGray"
              onClick={() => onUndoRemove(questionId)}
            >
              {undoLabel}
            </Button>
          )}
        </div>
      </div>
      <div className={Styles.choiceList} style={{ opacity: deleted ? 0.2 : 1 }}>
        {choiceIds.map((choiceId, index) => {
          return onEdit ? (
            <EditChoiceListItem
              key={choiceId}
              choiceId={choiceId}
              checked={correctChoice === choiceId}
              onEdit={handleEditChoice}
              onSelect={() => onSelectChoice({ questionId, choiceId })}
              placeholder={choicePlaceHolder[index]}
              text={choices[choiceId]}
            />
          ) : (
            <ChoiceListItem
              key={choiceId}
              id={choiceId}
              questionIndex={questionIndex}
              onMove={({ sourceId, targetId }) =>
                onRearrange({ questionIndex, sourceId, targetId })
              }
              checked={correctChoice === choiceId}
              onSelect={() => onSelectChoice({ questionId, choiceId })}
              label={choices[choiceId]}
              placeholder={choicePlaceHolder[index]}
              checkDisabled={deleted}
            />
          );
        })}
      </div>
      <div
        style={{
          display: 'flex',
          justifyContent: 'center',
          marginTop: '1rem'
        }}
      >
        {!onEdit ? (
          <Button
            variant="ghost"
            onClick={() => onEditStart(questionId)}
            style={{ opacity: deleted ? 0.2 : 1, fontSize: '2rem' }}
            disabled={deleted && true}
          >
            <Icon icon="pencil-alt" />
            <span style={{ marginLeft: '1.2rem' }}>{editQuestionLabel}</span>
          </Button>
        ) : (
          <div style={{ display: 'flex' }}>
            <Button variant="ghost" onClick={() => handleEditCancel(questionId)}>
              {cancelLabel}
            </Button>
            <Button
              color="blue"
              style={{ marginLeft: '1rem' }}
              onClick={handleEditDone}
            >
              {doneLabel}
            </Button>
          </div>
        )}
      </div>
    </div>
  );

  function handleEditChoice({
    choiceId,
    text
  }: {
    choiceId: number;
    text: string;
  }) {
    hideErrorMsg(questionId);
    setChoices({
      ...choices,
      [choiceId]: text
    });
  }

  function handleEditCancel(questionIndex: number) {
    hideErrorMsg(questionId);
    setEditedQuestionTitle(title);
    onEditCancel(questionIndex);
  }

  function handleEditDone() {
    hideErrorMsg(questionId);
    onEditDone({ questionId, choices, choiceIds, editedQuestionTitle });
  }
}
