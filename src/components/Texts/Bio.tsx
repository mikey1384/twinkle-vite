import React from 'react';
import RichText from '~/components/Texts/RichText';
import { css } from '@emotion/css';

export default function Bio({
  firstRow,
  secondRow,
  thirdRow,
  small,
  userId,
  style
}: {
  firstRow: string;
  secondRow: string;
  thirdRow: string;
  small?: boolean;
  userId: number;
  style?: React.CSSProperties;
}) {
  return (
    <section
      className={css`
        .dot {
          font-size: 2rem;
          font-family: 'Arial';
          padding: 0 1.5rem;
          display: flex;
          line-height: 1.4;
          justify-content: flex-start;
          align-items: flex-start;
        }
      `}
      style={{
        display: 'flex',
        marginTop: '2rem',
        flexDirection: 'column',
        justifyContent: 'center',
        whiteSpace: 'pre-wrap',
        overflowWrap: 'break-word',
        wordBreak: 'break-word',
        paddingLeft: '2rem',
        lineHeight: 1.5,
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
          <div className="dot">•</div>
          <RichText
            contentType="user"
            contentId={userId}
            section="bio1"
            isProfileComponent
            style={{ width: 'CALC(100% - 2rem)' }}
          >
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
          <div className="dot">•</div>
          <RichText
            contentType="user"
            contentId={userId}
            section="bio2"
            isProfileComponent
            style={{ width: 'CALC(100% - 2rem)' }}
          >
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
          <div className="dot">•</div>
          <RichText
            contentType="user"
            contentId={userId}
            section="bio3"
            isProfileComponent
            style={{ width: 'CALC(100% - 2rem)' }}
          >
            {thirdRow}
          </RichText>
        </nav>
      )}
    </section>
  );
}
