import React, { useEffect, useMemo, useState } from 'react';
import PropTypes from 'prop-types';
import CardThumb from '~/components/CardThumb';
import Loading from '~/components/Loading';
import { useAppContext } from '~/contexts';
import { Card } from '~/types';
import { borderRadius, mobileMaxWidth } from '~/constants/css';
import { css } from '@emotion/css';

CardItem.propTypes = {
  card: PropTypes.object.isRequired,
  onClick: PropTypes.func.isRequired
};
export default function CardItem({
  card,
  onClick
}: {
  card: Card;
  onClick: () => void;
}) {
  const loadAICard = useAppContext((v) => v.requestHelpers.loadAICard);
  const [loading, setLoading] = useState(false);
  const [cardState, setCardState] = useState(card || {});
  useEffect(() => {
    if (!cardState.word) {
      initCard();
    }
    async function initCard() {
      setLoading(true);
      try {
        const { card: loadedCard } = await loadAICard(card.id);
        setCardState(loadedCard);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [card, cardState.word]);

  const finalCard = useMemo(
    () => ({
      ...card,
      ...cardState
    }),
    [card, cardState]
  );
  return (
    <div
      style={{
        position: 'relative',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'column',
        padding: '1rem',
        borderRadius
      }}
      className={css`
        margin: 0.3%;
        width: 16%;
        @media (max-width: ${mobileMaxWidth}) {
          margin: 1%;
          width: 30%;
        }
      `}
    >
      {loading ? (
        <Loading />
      ) : (
        <CardThumb detailed onClick={onClick} card={finalCard} />
      )}
    </div>
  );
}
