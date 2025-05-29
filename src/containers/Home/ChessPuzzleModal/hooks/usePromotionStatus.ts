import { useEffect, useState, useCallback } from 'react';
import { useAppContext } from '~/contexts';

export function usePromotionStatus() {
  const getPromo = useAppContext((v) => v.requestHelpers.checkChessPromotion);
  const [promotionData, setPromotionData] = useState<{
    needsPromotion: boolean;
    targetRating?: number;
    promotionType?: 'standard' | 'boss';
    token?: string;
    expiresAt?: number;
    cooldownSeconds?: number;
  }>({ needsPromotion: false });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>();

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getPromo();

      // Calculate cooldown if promotion is not needed but user might be on cooldown
      let cooldownSeconds = 0;
      if (!data.needsPromotion && data.cooldownUntil) {
        cooldownSeconds = Math.max(
          0,
          Math.floor(
            (new Date(data.cooldownUntil).getTime() - Date.now()) / 1000
          )
        );
      }

      setPromotionData({
        ...data,
        cooldownSeconds: cooldownSeconds > 0 ? cooldownSeconds : undefined
      });
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [getPromo]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { ...promotionData, loading, error, refresh };
}
