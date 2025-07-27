import { Dispatch } from '~/types';
import { ChessStats } from '~/types/chess';

export default function ChessActions(dispatch: Dispatch) {
  return {
    onSetChessStats(stats: ChessStats | null) {
      return dispatch({
        type: 'SET_CHESS_STATS',
        stats
      });
    },
    onUpdateChessStats(partial: Partial<ChessStats>) {
      return dispatch({
        type: 'UPDATE_CHESS_STATS',
        partial
      });
    },
    onSetChessLoading(loading: boolean) {
      return dispatch({
        type: 'SET_CHESS_LOADING',
        loading
      });
    },
    onSetChessError(error: string | null) {
      return dispatch({
        type: 'SET_CHESS_ERROR',
        error
      });
    }
  };
}