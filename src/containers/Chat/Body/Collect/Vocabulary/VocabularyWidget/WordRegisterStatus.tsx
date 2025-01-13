import React, { useMemo, useState } from 'react';
import { useChatContext } from '~/contexts';
import { Color, mobileMaxWidth } from '~/constants/css';
import { wordLevelHash, returnWordLevel } from '~/constants/defaultValues';
import { css } from '@emotion/css';
import { isMobile } from '~/helpers';
import Button from '~/components/Button';
import Icon from '~/components/Icon';
import WordModal from './WordModal';

const deviceIsMobile = isMobile(navigator);

export default function WordRegisterStatus() {
  const { frequency, content } =
    useChatContext((v) => v.state.wordRegisterStatus) || {};
  const [wordModalShown, setWordModalShown] = useState(false);

  const wordLevel = useMemo(() => {
    return returnWordLevel({
      frequency,
      word: content
    });
  }, [content, frequency]);

  const wordLabel = useMemo(
    () => (/\s/.test(content) ? 'term' : 'word'),
    [content]
  );

  return (
    <div
      style={{
        height: '16rem',
        display: 'flex',
        width: '100%',
        flexDirection: 'column'
      }}
    >
      <div
        className={css`
          padding: 1rem;
          font-size: 2rem;
          background: ${Color.darkerGray()};
          display: flex;
          align-items: center;
          height: 6rem;
          @media (max-width: ${mobileMaxWidth}) {
            font-size: 1.5rem;
          }
        `}
      >
        <div style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>
          <span style={{ color: '#fff' }}>You collected</span>{' '}
          <span
            style={{
              color: Color[wordLevelHash[wordLevel].color](),
              fontWeight: 'bold'
            }}
          >
            {content}
          </span>
        </div>
      </div>
      <div
        className={css`
          padding: 1rem;
          font-size: 2rem;
          color: #fff;
          background: ${Color.black()};
          display: flex;
          align-items: center;
          height: 6rem;
          @media (max-width: ${mobileMaxWidth}) {
            font-size: 1.5rem;
          }
        `}
      >
        <div>
          {!deviceIsMobile && (
            <>
              <b style={{ color: Color[wordLevelHash[wordLevel].color]() }}>
                {content}
              </b>{' '}
              {`is `}
              {wordLevel === 1 ? 'a' : 'an'}{' '}
            </>
          )}
          <>
            <b style={{ color: Color[wordLevelHash[wordLevel].color]() }}>
              {wordLevelHash[wordLevel].label}
            </b>{' '}
            {wordLabel}.
          </>{' '}
          {deviceIsMobile ? <span>Earned </span> : <span>You earned </span>}
          <b style={{ color: Color[wordLevelHash[wordLevel].color]() }}>
            {0} XP
          </b>{' '}
          <span>and</span>{' '}
          <b
            style={{
              marginLeft: '0.3rem'
            }}
          >
            <Icon
              icon={['far', 'badge-dollar']}
              style={{
                color: Color.brownOrange()
              }}
            />
            <span style={{ color: Color.brownOrange(), marginLeft: '0.3rem' }}>
              {0}
            </span>
          </b>
        </div>
      </div>
      <div
        style={{
          padding: '1rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: Color.targetGray()
        }}
      >
        <Button skeuomorphic onClick={() => setWordModalShown(true)}>
          <span style={{ marginLeft: '0.7rem' }}>{`View "${content}"`}</span>
        </Button>
      </div>
      {wordModalShown && (
        <WordModal word={content} onHide={() => setWordModalShown(false)} />
      )}
    </div>
  );
}
