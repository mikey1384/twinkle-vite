import { css } from '@emotion/css';
import React from 'react';
import { Color, mobileMaxWidth } from '~/constants/css';
import WordLog from './WordLog';
import { useChatContext } from '~/contexts';
import WordMasterStrikeMeter from '../../WordMasterStrikeMeter';

interface BackdropProps {
  breakStatus?: any;
  breakLoading?: boolean;
  onOpenBreaks?: () => void;
}

export default function Backdrop({
  breakStatus,
  breakLoading,
  onOpenBreaks
}: BackdropProps) {
  const wordLogs = useChatContext((v) => v.state.wordLogs);
  return (
    <div className={wrapperCls}>
      <div className={logPaneCls}>
        {wordLogs.map((entry: any) => (
          <WordLog key={entry.id} entry={entry} />
        ))}
      </div>
      <div className={strikePaneCls}>
        <WordMasterStrikeMeter
          breakStatus={breakStatus}
          loading={breakLoading}
          onOpenBreaks={onOpenBreaks}
          variant="panel"
        />
      </div>
    </div>
  );
}

const wrapperCls = css`
  position: absolute;
  inset: 0;
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
  background: ${Color.black()};
  color: #fff;
  z-index: 0;
  overflow: hidden;
`;

const logPaneCls = css`
  display: flex;
  flex-direction: column;
  overflow-y: auto;
  padding: 1rem 0;
  min-width: 0;

  @media (max-width: ${mobileMaxWidth}) {
    padding: 0.8rem 0;
  }
`;

const strikePaneCls = css`
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0.8rem 1rem;
  border-left: 1px solid ${Color.white(0.12)};
  min-width: 0;

  @media (max-width: ${mobileMaxWidth}) {
    padding: 0.6rem 0.5rem;
  }
`;
