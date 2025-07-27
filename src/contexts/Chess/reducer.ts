import { initialChessState } from '.';

export default function ChessReducer(
  state: any,
  action: {
    type: string;
    [key: string]: any;
  }
) {
  switch (action.type) {
    case 'SET_CHESS_STATS': {
      return {
        ...state,
        stats: action.stats
      };
    }
    case 'UPDATE_CHESS_STATS': {
      return {
        ...state,
        stats: state.stats ? { ...state.stats, ...action.partial } : action.partial
      };
    }
    case 'SET_CHESS_LOADING': {
      return {
        ...state,
        loading: action.loading
      };
    }
    case 'SET_CHESS_ERROR': {
      return {
        ...state,
        error: action.error
      };
    }
    case 'RESET_CHESS_STATE': {
      return initialChessState;
    }
    default:
      return state;
  }
}