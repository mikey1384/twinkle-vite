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
    <section
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
        width: '100%',
        fontSize: small ? '1.5rem' : '1.7rem',
        ...style
      }}
    >
      {firstRow && (
        <nav style={{ display: 'flex', alignItems: 'center', width: '100%' }}>
          <div
            style={{
              padding: '0 1.5rem',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center'
            }}
          >
            •
          </div>
          <RichText style={{ width: 'CALC(100% - 2rem)' }}>{firstRow}</RichText>
        </nav>
      )}
      {secondRow && (
        <nav style={{ display: 'flex', alignItems: 'center', width: '100%' }}>
          <div
            style={{
              padding: '0 1.5rem',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center'
            }}
          >
            •
          </div>
          <RichText style={{ width: 'CALC(100% - 2rem)' }}>
            {secondRow}
          </RichText>
        </nav>
      )}
      {thirdRow && (
        <nav style={{ display: 'flex', alignItems: 'center', width: '100%' }}>
          <div
            style={{
              padding: '0 1.5rem',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center'
            }}
          >
            •
          </div>
          <RichText style={{ width: 'CALC(100% - 2rem)' }}>{thirdRow}</RichText>
        </nav>
      )}
    </section>
  );
}
