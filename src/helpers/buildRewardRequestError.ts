import axios from 'axios';

// Twinkle.rewards runtime errors keep the server's code and HTTP status (like
// Twinkle.cardCraft's), so Build apps can tell build_reward_budget_reached
// (409: today's XP/Coin limit is full) or build_reward_too_fast from a real
// failure. The host bridge forwards error.code and error.status to the app.
export function toBuildRewardRequestError(error: unknown) {
  const data = axios.isAxiosError(error) ? error.response?.data : null;
  const result = new Error(
    data?.error ||
      (axios.isAxiosError(error)
        ? error.message
        : 'Could not complete reward request.')
  ) as Error & { code?: string; status?: number };
  if (typeof data?.code === 'string' && data.code) result.code = data.code;
  if (axios.isAxiosError(error) && error.response?.status) {
    result.status = error.response.status;
  }
  return result;
}
