import { useState } from 'react';
import { useAppContext } from '~/contexts/hooks';
import type {
  TimeAttackStartResponse,
  TimeAttackAttemptResponse
} from '~/types/chess';

export default function useTimeAttackPromotion() {
  const requestHelpers = useAppContext((v) => v.requestHelpers);
  const [runId, setRunId] = useState<number | null>(null);

  async function start(): Promise<{
    id: number;
    puzzle: TimeAttackStartResponse['puzzle'];
  }> {
    const { runId: id, puzzle } =
      await requestHelpers.startTimeAttackPromotion();
    setRunId(id);
    return { id, puzzle };
  }

  async function submit({
    solved
  }: {
    solved: boolean;
  }): Promise<TimeAttackAttemptResponse> {
    if (runId === null) {
      throw new Error('Promotion run not initialised. Call start() first.');
    }

    const response = await requestHelpers.submitTimeAttackAttempt({
      runId,
      solved
    });

    // update internal state when finished
    if (response.finished) {
      setRunId(null);
    }

    return response;
  }

  return { runId, start, submit };
}
