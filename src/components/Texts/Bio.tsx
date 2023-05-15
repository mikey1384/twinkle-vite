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
        <nav
          style={{
            display: 'flex',
            alignItems: 'flex-start',
            width: '100%',
            paddingBottom: '1rem'
          }}
        >
          <div
            style={{
              padding: '0 1.5rem',
              fontSize: '2rem',
              display: 'flex',
              lineHeight: 1.5,
              justifyContent: 'flex-start',
              alignItems: 'flex-start'
            }}
          >
            •
          </div>
          <RichText isProfileComponent style={{ width: 'CALC(100% - 2rem)' }}>
            {firstRow}
          </RichText>
        </nav>
      )}
      {secondRow && (
        <nav
          style={{
            display: 'flex',
            alignItems: 'flex-start',
            width: '100%',
            paddingBottom: '1rem'
          }}
        >
          <div
            style={{
              padding: '0 1.5rem',
              fontSize: '2rem',
              display: 'flex',
              lineHeight: 1.5,
              justifyContent: 'flex-start',
              alignItems: 'flex-start'
            }}
          >
            •
          </div>
          <RichText isProfileComponent style={{ width: 'CALC(100% - 2rem)' }}>
            {secondRow}
          </RichText>
        </nav>
      )}
      {thirdRow && (
        <nav
          style={{
            display: 'flex',
            alignItems: 'flex-start',
            width: '100%',
            paddingBottom: '1rem'
          }}
        >
          <div
            style={{
              padding: '0 1.5rem',
              fontSize: '2rem',
              display: 'flex',
              lineHeight: 1.5,
              justifyContent: 'flex-start',
              alignItems: 'flex-start'
            }}
          >
            •
          </div>
          <RichText isProfileComponent style={{ width: 'CALC(100% - 2rem)' }}>
            {thirdRow}
          </RichText>
        </nav>
      )}
    </section>
  );
}
