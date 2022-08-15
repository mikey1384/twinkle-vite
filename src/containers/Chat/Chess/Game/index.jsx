import PropTypes from 'prop-types';
import Loading from '~/components/Loading';
import Board from './Board';
import { css } from '@emotion/css';
import { mobileMaxWidth } from '~/constants/css';

Game.propTypes = {
  interactable: PropTypes.bool,
  loading: PropTypes.bool,
  onClick: PropTypes.func.isRequired,
  squares: PropTypes.array.isRequired,
  myColor: PropTypes.string.isRequired,
  onCastling: PropTypes.func.isRequired,
  spoilerOff: PropTypes.bool,
  opponentName: PropTypes.string,
  onBoardClick: PropTypes.func,
  onSpoilerClick: PropTypes.func
};

export default function Game({
  interactable,
  loading,
  onClick,
  squares,
  myColor,
  onBoardClick,
  onCastling,
  onSpoilerClick,
  opponentName,
  spoilerOff
}) {
  return (
    <div
      className={css`
        width: CALC(360px + 2rem);
        height: CALC(360px + 2.5rem);
        position: relative;
        @media (max-width: ${mobileMaxWidth}) {
          width: CALC(50vw + 2rem);
          height: CALC(50vw + 2.5rem);
        }
      `}
    >
      {loading ? (
        <Loading />
      ) : squares.length > 0 ? (
        <Board
          interactable={interactable}
          myColor={myColor}
          onBoardClick={onBoardClick}
          onCastling={onCastling}
          onClick={onClick}
          onSpoilerClick={onSpoilerClick}
          opponentName={opponentName}
          spoilerOff={spoilerOff}
          squares={squares}
        />
      ) : null}
    </div>
  );
}
