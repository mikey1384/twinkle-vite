import React, { useMemo, useState } from 'react';
import UsernameText from '~/components/Texts/UsernameText';
import Button from '~/components/Button';
import moment from 'moment';
import DOMPurify from 'dompurify';
import { useKeyContext } from '~/contexts';
import { isSupermod } from '~/helpers';
import { useMyLevel } from '~/helpers/hooks';

import {
  chatTopicRowClass,
  chatTopicTitleClass,
  chatTopicMetadataClass,
  chatTopicActionsClass,
  chatTopicActionStyle,
  chatTopicThemeStyle
} from '../topicStyles';

export default function SubjectItem({
  currentSubjectId,
  displayedThemeColor,
  onDeleteSubject,
  onSelectSubject,
  id,
  content,
  userId,
  username,
  timeStamp,
  userIsOwner
}: {
  currentSubjectId: number;
  displayedThemeColor: string;
  onDeleteSubject: () => void;
  onSelectSubject: () => void;
  id: number;
  content: string;
  userId: number;
  username: string;
  timeStamp: number;
  userIsOwner?: boolean;
}) {
  const [selectButtonDisabled, setSelectButtonDisabled] = useState(false);
  const level = useKeyContext((v) => v.myState.level);
  const { canDelete } = useMyLevel();

  // Legacy titles can contain inline HTML. Preserve its formatting and links,
  // but do not let a title introduce media, controls or its own page styling.
  const sanitizedTitle = useMemo(
    () => DOMPurify.sanitize(content, {
      ALLOWED_TAGS: [
        'a', 'b', 'br', 'code', 'del', 'em', 'i', 's', 'small', 'span',
        'strong', 'sub', 'sup', 'u'
      ],
      ALLOWED_ATTR: ['href', 'title'],
      ALLOW_ARIA_ATTR: false,
      ALLOW_DATA_ATTR: false
    }),
    [content]
  );

  const displayedTime = useMemo(
    () => moment.unix(timeStamp).format('lll'),
    [timeStamp]
  );

  const buttons = useMemo(() => {
    const result: {
      color: string;
      opacity: number;
      onClick: () => void;
      variant: 'solid' | 'soft' | 'outline' | 'ghost';
      tone: 'flat' | 'raised';
      label: string;
      disabled?: boolean;
    }[] = [];
    if (
      (currentSubjectId !== id && isSupermod(level) && canDelete) ||
      userIsOwner
    ) {
      result.push({
        color: 'red',
        opacity: 0.5,
        onClick: onDeleteSubject,
        variant: 'ghost',
        tone: 'flat',
        label: 'Remove'
      });
    }
    if (currentSubjectId !== id) {
      result.push({
        color: 'darkerGray',
        opacity: 0.5,
        onClick: handleSelectSubject,
        disabled: selectButtonDisabled,
        variant: 'ghost',
        tone: 'flat',
        label: 'Select'
      });
    }
    return result;

    function handleSelectSubject() {
      setSelectButtonDisabled(true);
      onSelectSubject();
    }
  }, [
    level, canDelete, currentSubjectId, id, userIsOwner, onDeleteSubject,
    onSelectSubject, selectButtonDisabled
  ]);

  return (
    <article
      data-chat-topic-row="legacy"
      data-current={currentSubjectId === id}
      className={chatTopicRowClass}
      style={chatTopicThemeStyle(displayedThemeColor)}
    >
      <div
        style={{
          minWidth: 0,
          whiteSpace: 'pre-wrap',
          overflowWrap: 'break-word',
          wordBreak: 'break-word'
        }}
      >
        <div>
          {currentSubjectId === id && (
            <b
              style={{
                fontSize: '14px',
                color: '#334155'
              }}
            >
              Current:{' '}
            </b>
          )}
          <span
            className={chatTopicTitleClass}
            dangerouslySetInnerHTML={{ __html: sanitizedTitle }}
          />
          <div className={chatTopicMetadataClass}>
            <UsernameText
              color="#526176"
              textStyle={{ fontSize: '14px', fontWeight: 600 }}
              user={{
                id: userId,
                username: username
              }}
            />
            <small>{displayedTime}</small>
          </div>
        </div>
      </div>
      {buttons.length > 0 && (
        <div data-chat-topic-actions className={chatTopicActionsClass}>
          {buttons.map((button) => (
            <Button key={button.label} {...button} style={chatTopicActionStyle}>
              {button.label}
            </Button>
          ))}
        </div>
      )}
    </article>
  );
}
