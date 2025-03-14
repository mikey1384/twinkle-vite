import getPiece from './piece';

export function initializeChessBoard({
  initialState,
  loading,
  myId
}: {
  initialState?: any;
  loading: boolean;
  myId: number;
}) {
  if (loading) return [];
  let myColor = 'white';
  const blackPieces = [
    { type: 'rook', color: 'black', isPiece: true },
    { type: 'knight', color: 'black', isPiece: true },
    { type: 'bishop', color: 'black', isPiece: true },
    { type: 'queen', color: 'black', isPiece: true },
    { type: 'king', color: 'black', isPiece: true },
    { type: 'bishop', color: 'black', isPiece: true },
    { type: 'knight', color: 'black', isPiece: true },
    { type: 'rook', color: 'black', isPiece: true },
    { type: 'pawn', color: 'black', isPiece: true },
    { type: 'pawn', color: 'black', isPiece: true },
    { type: 'pawn', color: 'black', isPiece: true },
    { type: 'pawn', color: 'black', isPiece: true },
    { type: 'pawn', color: 'black', isPiece: true },
    { type: 'pawn', color: 'black', isPiece: true },
    { type: 'pawn', color: 'black', isPiece: true },
    { type: 'pawn', color: 'black', isPiece: true }
  ];
  const whitePieces = [
    { type: 'pawn', color: 'white', isPiece: true },
    { type: 'pawn', color: 'white', isPiece: true },
    { type: 'pawn', color: 'white', isPiece: true },
    { type: 'pawn', color: 'white', isPiece: true },
    { type: 'pawn', color: 'white', isPiece: true },
    { type: 'pawn', color: 'white', isPiece: true },
    { type: 'pawn', color: 'white', isPiece: true },
    { type: 'pawn', color: 'white', isPiece: true },
    { type: 'rook', color: 'white', isPiece: true },
    { type: 'knight', color: 'white', isPiece: true },
    { type: 'bishop', color: 'white', isPiece: true },
    { type: 'queen', color: 'white', isPiece: true },
    { type: 'king', color: 'white', isPiece: true },
    { type: 'bishop', color: 'white', isPiece: true },
    { type: 'knight', color: 'white', isPiece: true },
    { type: 'rook', color: 'white', isPiece: true }
  ];
  let resultBoard;
  const defaultBoard = [...blackPieces, ...Array(32).fill({}), ...whitePieces];
  if (initialState) {
    const {
      board: rawBoard,
      playerColors,
      move
    }: {
      board: any;
      playerColors: any;
      move: any;
    } = { ...initialState };
    let board = rawBoard;
    if (typeof move?.srcIndex === 'number') {
      board[myColor === 'black' ? 63 - move.srcIndex : move.srcIndex] =
        move.piece;
    }
    myColor = playerColors[myId];
    if (myColor === 'black') {
      board = board.slice().reverse();
    }
    resultBoard = board;
  }
  return resultBoard || defaultBoard;
}

export function chessStateJSONToFen(chessStateJSON: any) {
  if (!chessStateJSON) return '';
  const board = chessStateJSON.board;
  let fenString = '';
  for (let i = 0; i < board.length; i += 8) {
    const rank = board.slice(i, i + 8);
    let rankString = '';
    let emptyCount = 0;
    for (let j = 0; j < rank.length; j++) {
      if (rank[j].isPiece) {
        if (emptyCount > 0) {
          rankString += emptyCount;
          emptyCount = 0;
        }
        rankString += getPieceSymbol(rank[j]);
      } else {
        emptyCount++;
      }
    }

    if (emptyCount > 0) {
      rankString += emptyCount;
    }
    fenString += rankString + '/';
  }

  fenString = fenString.slice(0, -1);
  const turn = chessStateJSON.playerColors[1] === 'white' ? 'w' : 'b';
  fenString += ' ' + turn + ' ';
  const castlingStatus = getCastlingStatus(chessStateJSON);
  fenString += castlingStatus + ' ';
  const enPassantTarget = chessStateJSON.enPassantTarget
    ? chessStateJSON.enPassantTarget
    : '-';
  fenString += enPassantTarget + ' ';
  const halfMove = chessStateJSON.move.number;
  fenString += halfMove + ' ';
  const fullMove = Math.ceil(halfMove / 2);
  fenString += fullMove;
  return fenString;

  function getPieceSymbol(piece: any) {
    let pieceSymbol = '';
    if (piece.color === 'white') {
      if (piece.type === 'knight') {
        pieceSymbol += 'N';
      } else {
        pieceSymbol += piece.type.charAt(0).toUpperCase();
      }
    } else {
      if (piece.type === 'knight') {
        pieceSymbol += 'n';
      } else {
        pieceSymbol += piece.type.charAt(0).toLowerCase();
      }
    }
    return pieceSymbol;
  }

  function getCastlingStatus(chessStateJSON: any) {
    const king = chessStateJSON.board.find(
      (p: { isPiece: boolean; type: string; color: string }) =>
        p.isPiece && p.type === 'king' && p.color === 'white'
    );
    const kingIndex = chessStateJSON.board.indexOf(king);
    let castlingStatus = 'KQkq';
    if (kingIndex !== 4) {
      castlingStatus = '-';
    } else {
      if (chessStateJSON.board[0].isPiece === false) {
        castlingStatus = castlingStatus.replace('Q', '');
      }
      if (chessStateJSON.board[7].isPiece === false) {
        castlingStatus = castlingStatus.replace('K', '');
      }
      if (chessStateJSON.board[56].isPiece === false) {
        castlingStatus = castlingStatus.replace('q', '');
      }
      if (chessStateJSON.board[63].isPiece === false) {
        castlingStatus = castlingStatus.replace('k', '');
      }
    }
    return castlingStatus;
  }
}

export function checkerPos({
  squares,
  kingIndex,
  myColor
}: {
  squares: { type: string; color: string }[];
  kingIndex: number;
  myColor: string;
}) {
  const result = [];
  for (let i = 0; i < squares.length; i++) {
    if (!squares[i].color || squares[i].color === squares[kingIndex].color) {
      continue;
    }
    const piece = getPiece({ piece: squares[i], myColor });
    if (piece) {
      if (
        piece.isMovePossible?.({
          src: i,
          dest: kingIndex,
          isDestEnemyOccupied: true,
          color: squares[i].color,
          myColor
        }) &&
        isMoveLegal({
          srcToDestPath: piece.getSrcToDestPath?.(i, kingIndex) || [],
          squares
        })
      ) {
        result.push(i);
      }
    }
  }
  return result;
}

export function getPieceIndex({
  color,
  squares,
  type
}: {
  color: string;
  squares: { type: string; color: string }[];
  type: string;
}) {
  let result = -1;
  for (let i = 0; i < squares.length; i++) {
    if (squares[i].type === type && squares[i].color === color) {
      result = i;
      break;
    }
  }
  return result;
}

export function getOpponentPlayerColor(color: string) {
  return color === 'white' ? 'black' : 'white';
}

export function getPlayerPieces({
  color,
  squares
}: {
  color: string;
  squares: { type: string; color: string }[];
}) {
  let kingIndex = -1;
  const playerPieces = squares.reduce((prev: any, curr: any, index: number) => {
    if (curr.color && curr.color === color) {
      if (curr.type === 'king') {
        kingIndex = index;
        return [{ piece: curr, index }].concat(prev);
      }
      return prev.concat({ piece: curr, index });
    }
    return prev;
  }, []);
  return { kingIndex, playerPieces };
}

export function highlightPossiblePathsFromSrc({
  squares,
  src,
  enPassantTarget,
  myColor
}: {
  squares: { type: string; color: string; isPiece: boolean }[];
  src: number;
  enPassantTarget: number;
  myColor: string;
}) {
  const actualSquares = squares.map((square) => (square.isPiece ? square : {}));
  return actualSquares.map((square: any, index) =>
    index === src ||
    isPossibleAndLegal({
      src,
      dest: index,
      squares: actualSquares,
      enPassantTarget,
      myColor
    })
      ? {
          ...square,
          state: ['check', 'checkmate'].includes(square.state)
            ? square.state
            : 'highlighted'
        }
      : {
          ...square,
          state: ['check', 'checkmate'].includes(square.state)
            ? square.state
            : ''
        }
  );
}

export function isGameOver({
  squares,
  enPassantTarget,
  myColor
}: {
  squares: { type: string; color: string; isPiece: boolean }[];
  enPassantTarget: number;
  myColor: string;
}) {
  const opponentColor = getOpponentPlayerColor(myColor);
  const squaresFromOpponentsPointOfView = squares.map(
    (square, index) => squares[squares.length - 1 - index]
  );
  const { kingIndex, playerPieces } = getPlayerPieces({
    color: opponentColor,
    squares: squaresFromOpponentsPointOfView
  });
  const whitePieces = squaresFromOpponentsPointOfView
    .map((square, index) => ({ ...square, index }))
    .filter((square) => square.color === 'white' && !!square.isPiece);
  const remainingWhitePiece = whitePieces.filter(
    (piece) => piece.type !== 'king'
  )[0];
  const blackPieces = squaresFromOpponentsPointOfView
    .map((square, index) => ({ ...square, index }))
    .filter((square) => square.color === 'black' && !!square.isPiece);
  const remainingBlackPiece = blackPieces.filter(
    (piece) => piece.type !== 'king'
  )[0];
  if (whitePieces.length === 1 && blackPieces.length === 1) return 'Draw';
  if (whitePieces.length === 2 && blackPieces.length === 1) {
    if (
      remainingWhitePiece?.type === 'bishop' ||
      remainingWhitePiece?.type === 'knight'
    ) {
      return 'Draw';
    }
  }
  if (blackPieces.length === 2 && whitePieces.length === 1) {
    if (
      remainingBlackPiece?.type === 'bishop' ||
      remainingBlackPiece?.type === 'knight'
    ) {
      return 'Draw';
    }
  }

  if (blackPieces.length === 2 && whitePieces.length === 2) {
    if (
      remainingWhitePiece?.type === 'bishop' &&
      remainingBlackPiece?.type === 'bishop'
    ) {
      const { index: whiteBishopIndex } = remainingWhitePiece;
      const { index: blackBishopIndex } = remainingBlackPiece;

      const whiteBishopRow = Math.floor(whiteBishopIndex / 8);
      const whiteBishopRowIsEven = whiteBishopRow % 2 === 0;
      const whiteBishopColumn = whiteBishopIndex % 8;
      const whiteBishopColumnIsEven = whiteBishopColumn % 2 === 0;
      const blackBishopRow = Math.floor(blackBishopIndex / 8);
      const blackBishopRowIsEven = blackBishopRow % 2 === 0;
      const blackBishopColumn = blackBishopIndex % 8;
      const blackBishopColumnIsEven = blackBishopColumn % 2 === 0;

      const whiteBishopIsOnShadedSquare =
        whiteBishopRowIsEven === whiteBishopColumnIsEven;
      const blackBishopIsOnShadedSquare =
        blackBishopRowIsEven === blackBishopColumnIsEven;

      if (whiteBishopIsOnShadedSquare === blackBishopIsOnShadedSquare) {
        return 'Draw';
      }
    }
  }

  let isChecked = false;
  const nextDest = [
    kingIndex - 1,
    kingIndex + 1,
    kingIndex - 7,
    kingIndex - 8,
    kingIndex - 9,
    kingIndex + 7,
    kingIndex + 8,
    kingIndex + 9
  ];
  let checkers: any[] = [];
  const kingPiece: any = squaresFromOpponentsPointOfView[kingIndex];
  if (kingPiece.state === 'check') {
    isChecked = true;
    checkers = checkerPos({
      squares: squaresFromOpponentsPointOfView,
      kingIndex,
      myColor: opponentColor
    });
  }
  const possibleNextDest = nextDest.filter(
    (dest) =>
      dest >= 0 &&
      dest <= 63 &&
      isPossibleAndLegal({
        src: kingIndex,
        dest,
        squares: squaresFromOpponentsPointOfView,
        enPassantTarget,
        myColor: opponentColor
      })
  );
  if (possibleNextDest.length === 0 && kingPiece.state !== 'check') {
    return false;
  }
  let kingCanMove = false;
  for (const dest of possibleNextDest) {
    const newSquares = returnBoardAfterMove({
      src: kingIndex,
      dest,
      squares: squaresFromOpponentsPointOfView
    });
    const potentialKingSlayers = kingWillBeCapturedBy({
      kingIndex: dest,
      squares: newSquares,
      myColor: opponentColor
    });
    if (potentialKingSlayers.length === 0) {
      kingCanMove = true;
    }
  }
  if (kingCanMove) return false;
  if (isChecked) {
    if (checkers.length === 1) {
      for (const piece of playerPieces) {
        if (
          piece.piece.type !== 'king' &&
          isPossibleAndLegal({
            src: piece.index,
            dest: checkers[0],
            squares: squaresFromOpponentsPointOfView,
            enPassantTarget,
            myColor: opponentColor
          })
        ) {
          const newSquares = returnBoardAfterMove({
            src: piece.index,
            dest: checkers[0],
            squares: squaresFromOpponentsPointOfView
          });
          const potentialKingSlayers = kingWillBeCapturedBy({
            kingIndex,
            squares: newSquares,
            myColor: opponentColor
          });
          if (potentialKingSlayers.length === 0) {
            return false;
          }
        } else if (piece.piece.type === 'pawn' && enPassantTarget) {
          const pieceRow = Math.floor(piece.index / 8);
          const pieceColumn = piece.index % 8;
          const targetRow = Math.floor(enPassantTarget / 8);
          const targetColumn = enPassantTarget % 8;
          if (
            pieceRow === targetRow &&
            (pieceColumn === targetColumn - 1 ||
              pieceColumn === targetColumn + 1)
          ) {
            const newSquares = returnBoardAfterMove({
              src: piece.index,
              dest: (targetRow - 1) * 8 + targetColumn,
              enPassantTarget,
              squares: squaresFromOpponentsPointOfView
            });
            const potentialKingSlayers = kingWillBeCapturedBy({
              kingIndex,
              squares: newSquares,
              myColor: opponentColor
            });
            if (potentialKingSlayers.length === 0) {
              return false;
            }
          }
        }
      }
    }
    const allBlockPoints = [];
    for (const checker of checkers) {
      const trajectory =
        getPiece({
          piece: squaresFromOpponentsPointOfView[checker],
          myColor: opponentColor
        })?.getSrcToDestPath?.(checker, kingIndex) || [];
      if (trajectory.length === 0) return 'Checkmate';
      const blockPoints: any[] = [];
      for (const square of trajectory) {
        for (const piece of playerPieces) {
          if (
            piece.piece.type !== 'king' &&
            isPossibleAndLegal({
              src: piece.index,
              dest: square,
              squares: squaresFromOpponentsPointOfView,
              enPassantTarget,
              myColor: opponentColor
            })
          ) {
            const newSquares = returnBoardAfterMove({
              src: piece.index,
              dest: square,
              squares: squaresFromOpponentsPointOfView
            });
            const potentialKingSlayers = kingWillBeCapturedBy({
              kingIndex,
              squares: newSquares,
              myColor: opponentColor
            });
            if (potentialKingSlayers.length === 0) {
              if (checkers.length === 1) return false;
              if (!blockPoints.includes(square)) blockPoints.push(square);
            }
          }
        }
      }
      if (blockPoints.length === 0) return 'Checkmate';
      allBlockPoints.push(blockPoints);
    }
    if (allBlockPoints.length === 1) return false;
    for (let i = 0; i < allBlockPoints[0].length; i++) {
      let blockable = true;
      for (let j = 0; j < allBlockPoints.length; j++) {
        if (!allBlockPoints[j].includes(allBlockPoints[0][i])) {
          blockable = false;
          break;
        }
      }
      if (blockable) return false;
    }
    return 'Checkmate';
  } else {
    for (let i = 0; i < squaresFromOpponentsPointOfView.length; i++) {
      for (const piece of playerPieces) {
        if (
          isPossibleAndLegal({
            src: piece.index,
            dest: i,
            squares: squaresFromOpponentsPointOfView,
            enPassantTarget,
            myColor: opponentColor
          })
        ) {
          const newSquares = returnBoardAfterMove({
            src: piece.index,
            dest: i,
            squares: squaresFromOpponentsPointOfView
          });
          if (
            kingWillBeCapturedBy({
              kingIndex: piece.piece.type === 'king' ? i : kingIndex,
              squares: newSquares,
              myColor: opponentColor
            }).length === 0
          ) {
            return false;
          }
        }
      }
    }
  }
  return 'Stalemate';
}

export function isMoveLegal({
  srcToDestPath,
  squares
}: {
  srcToDestPath: number[];
  squares: any[];
}) {
  for (let i = 0; i < srcToDestPath.length; i++) {
    if (squares[srcToDestPath[i]].isPiece) {
      return false;
    }
  }
  return true;
}

export function isPossibleAndLegal({
  src,
  dest,
  myColor,
  squares,
  enPassantTarget
}: {
  src: number;
  dest: number;
  myColor: string;
  squares: any[];
  enPassantTarget?: number;
}) {
  if (squares[dest].color === squares[src].color) {
    return false;
  }
  return (
    getPiece({ piece: squares[src], myColor })?.isMovePossible?.({
      color: squares[src].color,
      src,
      dest,
      isDestEnemyOccupied: !!squares[dest].color,
      enPassantTarget,
      myColor
    }) &&
    isMoveLegal({
      srcToDestPath:
        getPiece({
          piece: squares[src],
          myColor
        }).getSrcToDestPath?.(src, dest) || [],
      squares
    })
  );
}

export function kingWillBeCapturedBy({
  kingIndex,
  squares,
  myColor
}: {
  kingIndex: number;
  squares: any[];
  myColor: string;
}) {
  const checkerPositions = checkerPos({
    squares,
    kingIndex,
    myColor
  });
  return checkerPositions;
}

export function returnBoardAfterMove({
  squares,
  src,
  dest,
  enPassantTarget = 0,
  kingEndDest,
  isCastling
}: {
  squares: any[];
  src: number;
  dest: number;
  enPassantTarget?: number;
  kingEndDest?: number;
  isCastling?: boolean;
}) {
  const srcColumn = src % 8;
  const destColumn = dest % 8;
  const destRow = Math.floor(dest / 8);
  const enPassantTargetRow = Math.floor(enPassantTarget / 8);
  const enPassantTargetColumn = enPassantTarget % 8;
  const attacking =
    Math.abs(srcColumn - destColumn) === 1 &&
    destColumn === enPassantTargetColumn &&
    destRow === enPassantTargetRow - 1;
  const enPassanting =
    enPassantTarget && attacking && squares[src].type === 'pawn';
  const newSquares = squares.map((square, index) => {
    if (index === dest) {
      return {
        ...squares[src],
        state: 'arrived'
      };
    }
    if (index === src) return {};
    if (enPassanting && index === enPassantTarget) return {};
    return {
      ...square,
      state: isCastling && index === kingEndDest ? 'arrived' : ''
    };
  });
  return newSquares;
}

export function getPositionId({
  index,
  myColor
}: {
  index: number;
  myColor: string;
}) {
  const letters = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
  if (myColor === 'black') letters.reverse();
  const row =
    myColor === 'black' ? Math.floor(index / 8) + 1 : 8 - Math.floor(index / 8);
  const column = letters[index % 8];
  return `${column + row}`;
}
