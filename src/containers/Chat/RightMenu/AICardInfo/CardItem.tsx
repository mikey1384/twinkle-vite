import React, { useMemo, useState } from 'react';
import UsernameText from '~/components/Texts/UsernameText';
import Icon from '~/components/Icon';
import { Color, mobileMaxWidth } from '~/constants/css';
import { css } from '@emotion/css';
import { useKeyContext } from '~/contexts';
import { useNavigate } from 'react-router-dom';
import { cardLevelHash } from '~/constants/defaultValues';
import { addCommasToNumber } from '~/helpers/stringHelpers';
import SanitizedHTML from 'react-sanitized-html';
import ErrorBoundary from '~/components/ErrorBoundary';
import CardThumb from '~/components/CardThumb';

export default function CardItem({
  isNew,
  card,
  isOverflown,
  isLast,
  onClick,
  offerObj
}: {
  isNew?: boolean;
  card: any;
  isOverflown: boolean;
  isLast: boolean;
  onClick?: () => void;
  offerObj?: any;
}) {
  const [userMenuShown, setUserMenuShown] = useState(false);
  const {
    userLink: { color: userLinkColor },
    chatUnread: { color: chatUnreadColor }
  } = useKeyContext((v) => v.theme);
  const navigate = useNavigate();
  const userId = useKeyContext((v) => v.myState.userId);
  const cardDetailObj = useMemo(
    () => cardLevelHash[card?.level],
    [card?.level]
  );
  const promptText = useMemo(() => {
    if (card.word) {
      const prompt = card.prompt;
      const word = card.word;
      const wordIndex = prompt.toLowerCase().indexOf(word.toLowerCase());
      const isCapitalized =
        prompt[wordIndex] !== prompt[wordIndex].toLowerCase();
      const wordToDisplay = isCapitalized
        ? word[0].toUpperCase() + word.slice(1)
        : word;
      const promptToDisplay =
        prompt.slice(0, wordIndex) +
        `<b style="color:${Color[
          cardDetailObj?.color
        ]()}">${wordToDisplay}</b>` +
        prompt.slice(wordIndex + word.length);
      return promptToDisplay;
    }
    return card.prompt;
  }, [card.prompt, card.word, cardDetailObj?.color]);
  return (
    <ErrorBoundary componentPath="Chat/RightMenu/AICardInfo/CardItem">
      <div
        className={`unselectable ${css`
          &:hover {
            background: ${Color.wellGray()};
          }
        `}`}
        style={{
          padding: '0 0.5rem',
          cursor: 'pointer',
          height: '10rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'flex-start',
          borderBottom:
            isOverflown && isLast ? 'none' : `1px solid ${Color.borderGray()}`
        }}
        onClick={() => (userMenuShown ? null : handleClick())}
        key={card.id}
      >
        <CardThumb card={card} />
        <div
          style={{
            flexGrow: 1,
            marginLeft: '1rem',
            height: '100%',
            width: '17vw',
            display: 'flex',
            alignItems: 'center'
          }}
        >
          <div
            style={{
              position: 'relative',
              width: isNew ? 'CALC(100% - 1.5rem)' : '100%',
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              alignItems: 'center'
            }}
            className={css`
              font-size: 1.3rem;
              @media (max-width: ${mobileMaxWidth}) {
                font-size: 1.2rem;
              }
            `}
          >
            {offerObj && (
              <div
                style={{
                  fontSize: '1.2rem',
                  lineHeight: 1.7,
                  textAlign: 'center'
                }}
              >
                <b>Card #{card.id}</b>
                {offerObj.user.id === userId ? '' : ' received'}
                <p>
                  {offerObj.user.id === userId ? 'offered ' : ''}
                  <Icon
                    style={{ color: Color.brownOrange() }}
                    icon={['far', 'badge-dollar']}
                  />
                  <b
                    style={{ marginLeft: '0.2rem', color: Color.darkerGray() }}
                  >
                    {addCommasToNumber(offerObj.price)}
                  </b>
                  {offerObj.user.id === userId ? '' : ' offer'}
                </p>
                {offerObj.user.id !== userId && (
                  <div>
                    from{' '}
                    <UsernameText
                      onMenuShownChange={(shown) => setUserMenuShown(shown)}
                      color={Color[userLinkColor]()}
                      user={{
                        username: offerObj.user.username,
                        id: offerObj.user.id
                      }}
                    />
                  </div>
                )}
              </div>
            )}
            {!offerObj && <b>#{card.id}</b>}
            {(!offerObj || offerObj.user.id === userId) && (
              <SanitizedHTML
                allowedAttributes={{ '*': ['style'] }}
                html={`<div style="font-size: 1.2rem; display: -webkit-box; align-items: center; justify-content: center; overflow-wrap: break-word; word-break: break-word; overflow: hidden; -webkit-box-orient: vertical; font-family: 'Roboto Mono', monospace; -webkit-line-clamp: 1;">${promptText}</div>`}
              />
            )}
            {!offerObj &&
              (card.isListed ? (
                <div
                  className={css`
                    margin-top: 0.5rem;
                    font-size: 1.2rem;
                    @media (max-width: ${mobileMaxWidth}) {
                      font-size: 1.1rem;
                    }
                  `}
                >
                  <Icon
                    style={{ color: Color.brownOrange() }}
                    icon={['far', 'badge-dollar']}
                  />
                  <b
                    style={{ marginLeft: '0.2rem', color: Color.darkerGray() }}
                  >
                    {addCommasToNumber(card.askPrice)}
                  </b>
                </div>
              ) : (
                <b
                  style={{
                    marginTop: '1rem',
                    fontSize: '1.1rem',
                    fontFamily: 'helvetica, sans-serif',
                    color: Color.darkerGray()
                  }}
                >
                  {card.style}
                </b>
              ))}
          </div>
          {isNew && (
            <div
              style={{
                background: Color[chatUnreadColor]?.(),
                display: 'flex',
                color: '#fff',
                fontWeight: 'bold',
                minWidth: '1.3rem',
                height: '1.3rem',
                borderRadius: '50%',
                lineHeight: 1,
                justifyContent: 'center',
                alignItems: 'center'
              }}
            />
          )}
        </div>
      </div>
    </ErrorBoundary>
  );

  function handleClick() {
    navigate(`./?cardId=${card.id}`);
    onClick?.();
  }
}
