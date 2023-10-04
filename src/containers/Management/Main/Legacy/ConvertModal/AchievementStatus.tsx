import React, { useEffect, useState } from 'react';
import Loading from '~/components/Loading';
import { useAppContext } from '~/contexts';
import { User } from '~/types';

export default function AchievementStatus({ target }: { target: User }) {
  const loadAchievementsByUserId = useAppContext(
    (v) => v.requestHelpers.loadAchievementsByUserId
  );
  const [achievements, setAchievements] = useState([]);
  const [loading, setLoading] = useState(false);
  useEffect(() => {
    init();
    async function init() {
      setLoading(true);
      const data = await loadAchievementsByUserId(target.id);
      setAchievements(data);
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return loading ? (
    <Loading />
  ) : (
    <div>
      <div>{achievements.map((achievement: any) => achievement.id)}</div>
    </div>
  );
}
