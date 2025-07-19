import React, { useEffect, useMemo, useRef, useState } from 'react';
import UsernameText from '~/components/Texts/UsernameText';
import ButtonGroup from '~/components/Buttons/ButtonGroup';
import moment from 'moment';
import { Color } from '~/constants/css';
import { useKeyContext } from '~/contexts';
import { isSupermod } from '~/helpers';
import { useMyLevel } from '~/helpers/hooks';

const marginHeight = 1;
const subjectTitleHeight = 24;

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
  const [marginBottom, setMarginBottom] = useState(`${marginHeight}rem`);
  const [selectButtonDisabled, setSelectButtonDisabled] = useState(false);
  const SubjectTitleRef: React.RefObject<any> = useRef(null);
  const level = useKeyContext((v) => v.myState.level);
  const { canDelete } = useMyLevel();

  useEffect(() => {
    const numLines = SubjectTitleRef.current.clientHeight / subjectTitleHeight;
    setMarginBottom(`${numLines * marginHeight}rem`);
  }, []);

  const displayedTime = useMemo(
    () => moment.unix(timeStamp).format('lll'),
    [timeStamp]
  );

  const buttons = useMemo(() => {
    const result = [];
    if (
      (currentSubjectId !== id && isSupermod(level) && canDelete) ||
      userIsOwner
    ) {
      result.push({
        color: 'rose',
        opacity: 0.5,
        onClick: onDeleteSubject,
        label: 'Remove'
      });
    }
    if (currentSubjectId !== id) {
      result.push({
        color: 'green',
        opacity: 0.5,
        onClick: handleSelectSubject,
        disabled: selectButtonDisabled,
        label: 'Select'
      });
    }
    return result;

    function handleSelectSubject() {
      setSelectButtonDisabled(true);
      onSelectSubject();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [level, canDelete, currentSubjectId, id]);

  return (
    <div
      style={{
        minHeight: '50px',
        height: 'auto',
        width: '100%'
      }}
    >
      <ButtonGroup
        style={{ position: 'absolute', right: '1.5rem' }}
        buttons={buttons}
      />
      <div
        style={{
          width: '100%',
          whiteSpace: 'pre-wrap',
          overflowWrap: 'break-word',
          wordBreak: 'break-word'
        }}
      >
        <div ref={SubjectTitleRef} style={{ marginBottom }}>
          {currentSubjectId === id && (
            <b
              style={{
                fontSize: '1.5rem',
                color: Color[displayedThemeColor]()
              }}
            >
              Current:{' '}
            </b>
          )}
          <span
            style={{
              fontSize: '1.5rem',
              fontWeight: 'bold'
            }}
            dangerouslySetInnerHTML={{ __html: content }}
          />
          <div>
            <UsernameText
              color={Color.darkerGray()}
              user={{
                id: userId,
                username: username
              }}
            />{' '}
            <small>{displayedTime}</small>
          </div>
        </div>
      </div>
    </div>
  );
}
