import React, { useEffect, useMemo, useRef, useState } from 'react';
import PropTypes from 'prop-types';
import UsernameText from '~/components/Texts/UsernameText';
import ButtonGroup from '~/components/Buttons/ButtonGroup';
import { unix } from 'moment';
import { Color } from '~/constants/css';
import { useKeyContext } from '~/contexts';

const marginHeight = 1;
const subjectTitleHeight = 24;

SubjectItem.propTypes = {
  id: PropTypes.number,
  currentSubjectId: PropTypes.number,
  displayedThemeColor: PropTypes.string,
  content: PropTypes.string,
  userId: PropTypes.number,
  username: PropTypes.string,
  onDeleteSubject: PropTypes.func,
  onSelectSubject: PropTypes.func,
  timeStamp: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  userIsOwner: PropTypes.bool
};

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
}) {
  const [marginBottom, setMarginBottom] = useState(`${marginHeight}rem`);
  const [selectButtonDisabled, setSelectButtonDisabled] = useState(false);
  const SubjectTitleRef = useRef(null);
  const { authLevel, canDelete } = useKeyContext((v) => v.myState);

  useEffect(() => {
    const numLines = SubjectTitleRef.current.clientHeight / subjectTitleHeight;
    setMarginBottom(`${numLines * marginHeight}rem`);
  }, []);

  const displayedTime = useMemo(
    () => unix(timeStamp).format('lll'),
    [timeStamp]
  );

  const buttons = useMemo(() => {
    const result = [];
    if (
      (currentSubjectId !== id && authLevel > 3 && canDelete) ||
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
  }, [authLevel, canDelete, currentSubjectId, id]);

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
