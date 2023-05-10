import React from 'react';
import RichText from '~/components/Texts/RichText';

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
      {firstRow && (
        <li>
          <RichText>{firstRow}</RichText>
        </li>
      )}
      {secondRow && (
        <li>
          <RichText>{secondRow}</RichText>
        </li>
      )}
      {thirdRow && (
        <li>
          <RichText>{thirdRow}</RichText>
        </li>
      )}
    </ul>
  );
}
