import React, { useMemo } from 'react';
import {
  limitBrs,
  processMentionLink,
  processedStringWithURL
} from '~/helpers/stringHelpers';

export default function Bio({
  firstRow,
  secondRow,
  thirdRow,
  small,
  style
}: {
  firstRow: string;
  secondRow: string;
  thirdRow: string;
  small?: boolean;
  style?: React.CSSProperties;
}) {
  const processedFirstRow = useMemo(
    () => processMentionLink(limitBrs(processedStringWithURL(firstRow))),
    [firstRow]
  );
  const processedSecondRow = useMemo(
    () => processMentionLink(limitBrs(processedStringWithURL(secondRow))),
    [secondRow]
  );
  const processedThirdRow = useMemo(
    () => processMentionLink(limitBrs(processedStringWithURL(thirdRow))),
    [thirdRow]
  );

  return (
    <ul
      style={{
        display: 'flex',
        marginTop: '2rem',
        flexDirection: 'column',
        justifyContent: 'center',
        whiteSpace: 'pre-wrap',
        overflowWrap: 'break-word',
        wordBreak: 'break-word',
        paddingLeft: '2rem',
        lineHeight: 1.6,
        listStyleType: 'disc',
        fontSize: small ? '1.5rem' : '1.7rem',
        ...style
      }}
    >
      {firstRow && <li>{processedFirstRow}</li>}
      {secondRow && <li>{processedSecondRow}</li>}
      {thirdRow && <li>{processedThirdRow}</li>}
    </ul>
  );
}
