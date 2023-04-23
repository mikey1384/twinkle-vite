import React, { useMemo } from 'react';
import { css } from '@emotion/css';
import { mobileMaxWidth } from '~/constants/css';

export default function PosBlock({
  contentObj,
  definitionIds,
  deletedDefIds,
  partOfSpeech,
  style
}: {
  contentObj: any;
  definitionIds: number[];
  deletedDefIds: number[];
  partOfSpeech: string;
  style?: React.CSSProperties;
}) {
  const filteredDefinitionIds = useMemo(
    () => definitionIds.filter((id) => !deletedDefIds.includes(id)),
    [definitionIds, deletedDefIds]
  );
  return filteredDefinitionIds.length > 0 ? (
    <div style={style}>
      <p
        className={css`
          font-size: 2.5rem;
          font-weight: bold;
          margin-bottom: 0.5rem;
          @media (max-width: ${mobileMaxWidth}) {
            font-size: 1.7rem;
          }
        `}
      >
        {partOfSpeech}
      </p>
      {filteredDefinitionIds.map((definitionId, index) => (
        <div
          key={definitionId}
          className={css`
            font-size: 1.7rem;
            line-height: 2;
            @media (max-width: ${mobileMaxWidth}) {
              font-size: 1.5rem;
            }
          `}
        >
          {index + 1}. {contentObj[definitionId].title}
        </div>
      ))}
    </div>
  ) : null;
}
