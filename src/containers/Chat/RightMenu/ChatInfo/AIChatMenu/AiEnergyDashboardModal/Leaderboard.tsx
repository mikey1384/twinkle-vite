import React from 'react';
import { css } from '@emotion/css';
import DonorListItem from '~/components/DonorListItem';
import Icon from '~/components/Icon';
import RoundList from '~/components/RoundList';
import { Color } from '~/constants/css';
import { addCommasToNumber } from '~/helpers/stringHelpers';
import {
  emptyInlineStateCls,
  sectionStackCls,
  surfaceCardCls,
  surfaceTitleCls
} from './styles';
import type { DonorLeaderboard, FundStats } from './types';

interface Props {
  communityAccentColor: string;
  donorData: DonorLeaderboard;
  fundStats: FundStats;
  myId: number;
  setUserMenuShown: (shown: boolean) => void;
}

export default function Leaderboard({
  communityAccentColor,
  donorData,
  fundStats,
  myId,
  setUserMenuShown
}: Props) {
  return (
    <div className={`${sectionStackCls} ${leaderboardPageCls}`}>
      <div className={donorCountWrapCls}>
        <div
          className={donorCountCardCls}
          style={{
            borderColor: Color.rose(0.2)
          }}
        >
          <div className={donorCountHeaderCls}>
            <span
              className={donorCountIconCls}
              style={{
                color: communityAccentColor
              }}
            >
              <Icon icon="users" />
            </span>
            <span className={donorCountTitleCls}>Donors</span>
          </div>
          <div
            className={donorCountValueCls}
            style={{
              color: communityAccentColor
            }}
          >
            {addCommasToNumber(fundStats.totalDonors || 0)}
          </div>
          <div className={donorCountLabelCls}>Total contributors</div>
        </div>
      </div>

      <section className={surfaceCardCls}>
        <div className={surfaceTitleCls}>Donor leaderboard</div>
        {donorData.donors.length > 0 ? (
          <RoundList style={{ marginTop: '1rem' }}>
            {donorData.donors.map((donor) => (
              <DonorListItem
                key={donor.id}
                myId={myId}
                donor={donor}
                onUsermenuShownChange={setUserMenuShown}
              />
            ))}
          </RoundList>
        ) : (
          <div className={emptyInlineStateCls}>
            No donor leaderboard data right now.
          </div>
        )}
      </section>
    </div>
  );
}

const donorCountWrapCls = css`
  display: flex;
  justify-content: center;
`;

const leaderboardPageCls = css`
  padding-bottom: 1.1rem;
`;

const donorCountCardCls = css`
  width: min(13rem, 100%);
  border: 1px solid var(--ui-border);
  border-radius: 18px;
  background: rgba(255, 255, 255, 0.96);
  padding: 1.25rem 1rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
`;

const donorCountHeaderCls = css`
  display: flex;
  align-items: center;
  gap: 0.55rem;
  justify-content: center;
`;

const donorCountIconCls = css`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 1.55rem;
`;

const donorCountTitleCls = css`
  font-size: 1.15rem;
  font-weight: 700;
  color: ${Color.black()};
  line-height: 1.2;
`;

const donorCountValueCls = css`
  margin-top: 0.45rem;
  font-size: 1.9rem;
  font-weight: 700;
  line-height: 1.1;
`;

const donorCountLabelCls = css`
  margin-top: 0.35rem;
  font-size: 0.98rem;
  line-height: 1.45;
  color: ${Color.darkGray()};
`;
