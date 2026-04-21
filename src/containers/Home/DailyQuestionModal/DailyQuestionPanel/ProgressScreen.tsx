import React from 'react';
import Loading from '~/components/Loading';
import ProgressBar from '~/components/ProgressBar';
import { centeredContainerCls, innerContainerCls } from './styles';

export default function ProgressScreen({
  text,
  progress
}: {
  text: string;
  progress: number;
}) {
  return (
    <div className={centeredContainerCls}>
      <div className={innerContainerCls}>
        <Loading text={text} />
        <div style={{ width: '60%', marginTop: 0 }}>
          <ProgressBar progress={progress} />
        </div>
      </div>
    </div>
  );
}
