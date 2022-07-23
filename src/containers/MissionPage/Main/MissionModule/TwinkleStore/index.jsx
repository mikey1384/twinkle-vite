import { useEffect, useMemo, useState } from 'react';
import PropTypes from 'prop-types';
import Loading from '~/components/Loading';
import NotEnoughKarmaInstructions from './NotEnoughKarmaInstructions';
import EnoughKarmaInstructions from './EnoughKarmaInstructions';
import FinalStep from './FinalStep';
import { karmaPointTable } from '~/constants/defaultValues';
import { useAppContext, useViewContext, useKeyContext } from '~/contexts';

TwinkleStore.propTypes = {
  mission: PropTypes.object
};

export default function TwinkleStore({ mission }) {
  const { canChangeUsername, userId, karmaPoints } = useKeyContext(
    (v) => v.myState
  );
  const loadKarmaPoints = useAppContext(
    (v) => v.requestHelpers.loadKarmaPoints
  );
  const loadMyData = useAppContext((v) => v.requestHelpers.loadMyData);
  const onSetUserState = useAppContext((v) => v.user.actions.onSetUserState);
  const pageVisible = useViewContext((v) => v.state.pageVisible);
  const [loadingKarma, setLoadingKarma] = useState(false);
  const requiredKarmaPoints = karmaPointTable.username;
  const unlockProgress = useMemo(() => {
    return Math.floor(Math.min((karmaPoints * 100) / requiredKarmaPoints, 100));
  }, [karmaPoints, requiredKarmaPoints]);

  useEffect(() => {
    if (userId) {
      init();
    }

    async function init() {
      setLoadingKarma(true);
      const data = await loadMyData();
      onSetUserState({ userId: data.userId, newState: data });
      const { karmaPoints: kp } = await loadKarmaPoints();
      onSetUserState({ userId, newState: { karmaPoints: kp } });
      setLoadingKarma(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId, pageVisible]);

  const hasEnoughKarmaPoints = useMemo(() => {
    return karmaPoints >= requiredKarmaPoints;
  }, [karmaPoints, requiredKarmaPoints]);

  return loadingKarma ? (
    <Loading />
  ) : canChangeUsername ? (
    <FinalStep mission={mission} userId={userId} />
  ) : (
    <div
      style={{
        width: '100%',
        display: 'flex',
        fontSize: '1.7rem',
        flexDirection: 'column',
        alignItems: 'center'
      }}
    >
      <div
        style={{
          marginTop: '2rem',
          display: 'flex',
          width: '100%',
          flexDirection: 'column',
          alignItems: 'center'
        }}
      >
        {hasEnoughKarmaPoints ? (
          <EnoughKarmaInstructions requiredKarmaPoints={requiredKarmaPoints} />
        ) : (
          <NotEnoughKarmaInstructions
            unlockProgress={unlockProgress}
            requiredKarmaPoints={requiredKarmaPoints}
            karmaPoints={karmaPoints}
          />
        )}
      </div>
    </div>
  );
}
