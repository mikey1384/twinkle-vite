import PropTypes from 'prop-types';
import PosBlock from './PosBlock';
import Button from '~/components/Button';
import { css } from '@emotion/css';
import { mobileMaxWidth } from '~/constants/css';

DictionaryTab.propTypes = {
  deletedDefIds: PropTypes.array.isRequired,
  definitionOrder: PropTypes.object.isRequired,
  onHide: PropTypes.func.isRequired,
  posObj: PropTypes.object.isRequired,
  posOrder: PropTypes.array.isRequired,
  word: PropTypes.string.isRequired
};

export default function DictionaryTab({
  deletedDefIds,
  definitionOrder,
  onHide,
  posObj,
  posOrder,
  word
}) {
  return (
    <>
      <main>
        <p
          className={css`
            font-weight: bold;
            font-size: 3rem;
            margin-bottom: 1.5rem;
            @media (max-width: ${mobileMaxWidth}) {
              font-size: 2rem;
            }
          `}
        >
          {word}
        </p>
        <div
          className={css`
            display: flex;
            flex-direction: column;
            width: 50%;
            @media (max-width: ${mobileMaxWidth}) {
              width: 100%;
            }
          `}
        >
          {posOrder.map((pos, index) => (
            <PosBlock
              key={pos}
              partOfSpeech={pos}
              contentObj={posObj[pos]}
              deletedDefIds={deletedDefIds}
              definitionIds={definitionOrder[pos]}
              style={{ marginTop: index > 0 ? '1.5rem' : 0 }}
            />
          ))}
        </div>
      </main>
      <footer>
        <Button transparent onClick={onHide}>
          Close
        </Button>
      </footer>
    </>
  );
}
