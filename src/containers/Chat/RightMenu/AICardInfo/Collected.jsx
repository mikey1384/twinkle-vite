import { useEffect } from 'react';
import { useAppContext } from '~/contexts';

export default function Collected() {
  const loadMyAICardCollections = useAppContext(
    (v) => v.requestHelpers.loadMyAICardCollections
  );

  useEffect(() => {
    init();
    async function init() {
      const { myCards, myCardsLoadMoreShown } = await loadMyAICardCollections();
      console.log('myCards', myCards, myCardsLoadMoreShown);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div style={{ width: '100%' }}>
      <div
        style={{
          textAlign: 'center',
          padding: '1.5rem 0',
          fontSize: '1.7rem'
        }}
      >
        <b>My Collections</b>
      </div>
    </div>
  );
}
