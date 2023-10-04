import React, { useEffect, useState } from 'react';
import Loading from '~/components/Loading';
import AchievementItem from '~/components/AchievementItem';
import { useAppContext } from '~/contexts';
import { Content, User } from '~/types';

export default function AchievementStatus({ target }: { target: User }) {
  const loadAchievementsByUserId = useAppContext(
    (v) => v.requestHelpers.loadAchievementsByUserId
  );
  const [achievements, setAchievements] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function init() {
      setLoading(true);
      const data = await loadAchievementsByUserId(target.id);
      setAchievements(data);
      setLoading(false);
    }

    init();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return loading ? (
    <Loading />
  ) : (
    <div style={{ display: 'flex', flexWrap: 'wrap' }}>
      {achievements.map((achievement: Content) => (
        <div style={{ flex: '0 0 50%' }} key={achievement.id}>
          <AchievementItem isSmall achievement={achievement} />
        </div>
      ))}
    </div>
  );
}
