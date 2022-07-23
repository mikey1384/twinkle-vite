import { useContext, useMemo, useRef, useState } from 'react';
import PropTypes from 'prop-types';
import DropdownButton from '~/components/Buttons/DropdownButton';
import Icon from '~/components/Icon';
import localize from '~/constants/localize';
import LocalContext from '../Context';
import { css } from '@emotion/css';
import { Color, mobileMaxWidth } from '~/constants/css';
import { useWordleLabels } from '~/helpers/hooks';
import { isMobile } from '~/helpers';
import moment from 'moment';

const deviceIsMobile = isMobile(navigator);
const replyLabel = localize('reply2');

WordleResult.propTypes = {
  channelId: PropTypes.number,
  messageId: PropTypes.number,
  myId: PropTypes.number,
  userId: PropTypes.number,
  username: PropTypes.string,
  onReplyClick: PropTypes.func.isRequired,
  timeStamp: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  wordleResult: PropTypes.object.isRequired
};

export default function WordleResult({
  channelId,
  messageId,
  username,
  userId,
  myId,
  onReplyClick,
  wordleResult,
  timeStamp
}) {
  const [dropdownShown, setDropdownShown] = useState(false);
  const {
    actions: { onSetReplyTarget }
  } = useContext(LocalContext);
  const DropdownButtonRef = useRef(null);
  const { numGuesses } = wordleResult;

  const {
    guessLabel,
    bonusLabel,
    resultLabel,
    guessLabelColor,
    solutionLabel
  } = useWordleLabels({
    ...wordleResult,
    username,
    userId,
    myId
  });

  const displayedTimeStamp = useMemo(
    () => moment.unix(timeStamp).format('lll'),
    [timeStamp]
  );

  return (
    <div
      className={css`
        .menu-button {
          display: ${dropdownShown ? 'block' : 'none'};
        }
        &:hover {
          .menu-button {
            display: block;
          }
        }
        .reward-amount-label {
          font-size: ${numGuesses <= 2 ? '2rem' : ''};
          @media (max-width: ${mobileMaxWidth}) {
            font-size: ${numGuesses <= 2 ? '1.5rem' : ''};
          }
        }
        @media (max-width: ${mobileMaxWidth}) {
          .menu-button {
            display: block;
          }
        }
      `}
      style={{
        width: '100%',
        background: Color.darkBlueGray(),
        color: '#fff',
        marginBottom: '1.5rem',
        position: 'relative'
      }}
    >
      <div
        style={{
          position: 'absolute',
          top: '-0.5rem',
          right: '1rem'
        }}
      >
        <DropdownButton
          skeuomorphic
          buttonStyle={{
            fontSize: '1rem',
            lineHeight: 1
          }}
          className="menu-button"
          innerRef={DropdownButtonRef}
          color="darkerGray"
          icon={deviceIsMobile ? 'chevron-down' : 'ellipsis-h'}
          opacity={0.8}
          menuProps={[
            {
              label: (
                <>
                  <Icon icon="reply" />
                  <span style={{ marginLeft: '1rem' }}>{replyLabel}</span>
                </>
              ),
              onClick: () => {
                onSetReplyTarget({
                  channelId,
                  target: {
                    id: messageId,
                    wordleResult,
                    timeStamp,
                    userId,
                    username
                  }
                });
                onReplyClick();
              }
            }
          ]}
          onDropdownShown={setDropdownShown}
        />
      </div>
      <div
        className={css`
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
          width: 100%;
          padding: 2rem 1rem;
          font-size: 1.6rem;
          @media (max-width: ${mobileMaxWidth}) {
            font-size: 1.3rem;
          }
        `}
      >
        {guessLabel && (
          <p
            style={{
              marginBottom: '0.5rem',
              color: guessLabelColor,
              fontWeight: 'bold'
            }}
            className={css`
              font-size: ${numGuesses === 1
                ? '3rem'
                : numGuesses === 2
                ? '2.5rem'
                : numGuesses === 3
                ? '2.2rem'
                : '2rem'};
              @media (max-width: ${mobileMaxWidth}) {
                font-size: ${numGuesses === 1
                  ? '2.3rem'
                  : numGuesses === 2
                  ? '2rem'
                  : numGuesses === 3
                  ? '1.7rem'
                  : '1.5rem'};
              }
            `}
          >
            {guessLabel}
          </p>
        )}
        <div style={{ textAlign: 'center' }}>{resultLabel}</div>
        <p style={{ marginTop: '0.5rem' }}>{solutionLabel}</p>
        {bonusLabel && (
          <p
            style={{
              marginTop: '0.5rem',
              fontWeight: 'bold',
              color: Color.brownOrange()
            }}
          >
            {bonusLabel}
          </p>
        )}
      </div>
      <div
        style={{
          position: 'absolute',
          bottom: '5px',
          right: '8px'
        }}
        className={css`
          font-size: 1rem;
          @media (max-width: ${mobileMaxWidth}) {
            font-size: 0.8rem;
          }
        `}
      >
        {displayedTimeStamp}
      </div>
    </div>
  );
}
