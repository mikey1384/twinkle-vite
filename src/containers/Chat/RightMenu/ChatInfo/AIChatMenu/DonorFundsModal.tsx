import React, { useState, useEffect, useRef } from 'react';
import Button from '~/components/Button';
import FilterBar from '~/components/FilterBar';
import Loading from '~/components/Loading';
import Modal from '~/components/Modal';
import DonorListItem from '~/components/DonorListItem';
import RoundList from '~/components/RoundList';
import Icon from '~/components/Icon';
import { css } from '@emotion/css';
import { Color } from '~/constants/css';
import { addCommasToNumber } from '~/helpers/stringHelpers';
import { useKeyContext, useAppContext } from '~/contexts';

interface DonorFundsModalProps {
  onHide: () => void;
}

interface FundStats {
  sponsoredMessagesToday: number;
  totalSpentToday: number;
  totalDonors: number;
  totalDonationsAllTime: number;
}

interface DonorLeaderboard {
  donors: Array<{
    id: number;
    username: string;
    realName: string;
    profileFirstRow: string;
    profileTheme: string;
    profilePicUrl: string;
    totalDonated: number;
    rank: number;
  }>;
  myDonationRank: number | null;
  myTotalDonated: number;
}

export default function DonorFundsModal({ onHide }: DonorFundsModalProps) {
  const myId = useKeyContext((v) => v.myState.userId);
  const loadCommunityFunds = useAppContext(
    (v) => v.requestHelpers.loadCommunityFunds
  );
  const loadCommunityFundStats = useAppContext(
    (v) => v.requestHelpers.loadCommunityFundStats
  );
  const loadDonorLeaderboard = useAppContext(
    (v) => v.requestHelpers.loadDonorLeaderboard
  );

  const [loading, setLoading] = useState(true);
  const [totalFunds, setTotalFunds] = useState(0);
  const [fundStats, setFundStats] = useState<FundStats>({
    sponsoredMessagesToday: 0,
    totalSpentToday: 0,
    totalDonors: 0,
    totalDonationsAllTime: 0
  });
  const [donorData, setDonorData] = useState<DonorLeaderboard>({
    donors: [],
    myDonationRank: null,
    myTotalDonated: 0
  });

  const [activeTab, setActiveTab] = useState('funds');
  const [userMenuShown, setUserMenuShown] = useState(false);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    init();
    async function init() {
      try {
        const [fundsResponse, statsResponse, donorResponse] = await Promise.all(
          [
            loadCommunityFunds(),
            loadCommunityFundStats(),
            loadDonorLeaderboard()
          ]
        );

        setTotalFunds(fundsResponse.totalFunds || 0);
        setFundStats(statsResponse);
        setDonorData(donorResponse);

        setLoading(false);
      } catch (error) {
        console.error('Failed to load community funds data:', error);
        setLoading(false);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Scroll to top when tab changes
  useEffect(() => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTop = 0;
    }
  }, [activeTab]);

  return (
    <Modal closeWhenClickedOutside={!userMenuShown} onHide={onHide}>
      <header
        className={css`
          display: flex;
          align-items: center;
          gap: 0.8rem;
        `}
      >
        <Icon icon="heart" style={{ color: Color.rose() }} />
        Community Sponsored Think Hard
      </header>
      <main style={{ padding: 0, marginTop: 0 }}>
        {loading ? (
          <Loading style={{ height: 'CALC(100vh - 30rem)' }} />
        ) : (
          <div
            style={{
              height: 'CALC(100vh - 30rem)',
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              flexDirection: 'column'
            }}
          >
            <FilterBar
              style={{
                width: '100%',
                height: '4.5rem',
                fontSize: '1.6rem',
                marginBottom: 0
              }}
            >
              <nav
                className={activeTab === 'funds' ? 'active' : ''}
                onClick={() => setActiveTab('funds')}
              >
                Available Funds
              </nav>
              <nav
                className={activeTab === 'donors' ? 'active' : ''}
                onClick={() => setActiveTab('donors')}
              >
                Top Donors
              </nav>
            </FilterBar>
            <div
              ref={scrollContainerRef}
              style={{
                height: '100%',
                overflow: 'scroll',
                width: '100%',
                paddingTop: '2rem',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center'
              }}
            >
              {activeTab === 'funds' ? (
                <div
                  className={css`
                    width: 100%;
                    max-width: 40rem;
                    padding: 0 2rem;
                  `}
                >
                  {/* Current Fund Balance */}
                  <div
                    className={css`
                      background: linear-gradient(
                        135deg,
                        ${Color.logoBlue()} 0%,
                        ${Color.rose()} 100%
                      );
                      border-radius: 1rem;
                      padding: 2rem;
                      text-align: center;
                      color: white;
                      margin-bottom: 2rem;
                      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
                    `}
                  >
                    <h2
                      className={css`
                        margin: 0 0 0.5rem 0;
                        font-size: 1.8rem;
                        font-weight: bold;
                      `}
                    >
                      Available Funds
                    </h2>
                    <div
                      className={css`
                        font-size: 3rem;
                        font-weight: bold;
                        margin: 1rem 0;
                      `}
                    >
                      {addCommasToNumber(totalFunds)}
                    </div>
                    <p
                      className={css`
                        margin: 0;
                        font-size: 1.3rem;
                        opacity: 0.9;
                      `}
                    >
                      Twinkle Coins available for sponsoring Think Hard mode
                    </p>
                  </div>

                  {/* Usage Statistics */}
                  <div
                    className={css`
                      background: #fff;
                      border: 1px solid ${Color.borderGray()};
                      border-radius: 1rem;
                      padding: 1.5rem;
                      margin-bottom: 2rem;
                    `}
                  >
                    <h3
                      className={css`
                        margin: 0 0 1.5rem 0;
                        font-size: 1.6rem;
                        font-weight: bold;
                        color: ${Color.black()};
                        display: flex;
                        align-items: center;
                        gap: 0.5rem;
                      `}
                    >
                      <Icon
                        icon="chart-line"
                        style={{ color: Color.orange() }}
                      />
                      Today's Usage
                    </h3>
                    <div
                      className={css`
                        display: grid;
                        grid-template-columns: 1fr 1fr;
                        gap: 1rem;
                      `}
                    >
                      <div
                        className={css`
                          text-align: center;
                        `}
                      >
                        <div
                          className={css`
                            font-size: 2rem;
                            font-weight: bold;
                            color: ${Color.logoBlue()};
                          `}
                        >
                          {fundStats.sponsoredMessagesToday}
                        </div>
                        <div
                          className={css`
                            font-size: 1.2rem;
                            color: ${Color.darkGray()};
                          `}
                        >
                          Messages Sponsored
                        </div>
                      </div>
                      <div
                        className={css`
                          text-align: center;
                        `}
                      >
                        <div
                          className={css`
                            font-size: 2rem;
                            font-weight: bold;
                            color: ${Color.rose()};
                          `}
                        >
                          {addCommasToNumber(fundStats.totalSpentToday)}
                        </div>
                        <div
                          className={css`
                            font-size: 1.2rem;
                            color: ${Color.darkGray()};
                          `}
                        >
                          Coins Spent
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Community Impact */}
                  <div
                    className={css`
                      background: #fff;
                      border: 1px solid ${Color.borderGray()};
                      border-radius: 1rem;
                      padding: 1.5rem;
                    `}
                  >
                    <h3
                      className={css`
                        margin: 0 0 1.5rem 0;
                        font-size: 1.6rem;
                        font-weight: bold;
                        color: ${Color.black()};
                        display: flex;
                        align-items: center;
                        gap: 0.5rem;
                      `}
                    >
                      <Icon icon="users" style={{ color: Color.green() }} />
                      Community Impact
                    </h3>
                    <div
                      className={css`
                        display: grid;
                        grid-template-columns: 1fr 1fr;
                        gap: 1rem;
                      `}
                    >
                      <div
                        className={css`
                          text-align: center;
                        `}
                      >
                        <div
                          className={css`
                            font-size: 2rem;
                            font-weight: bold;
                            color: ${Color.green()};
                          `}
                        >
                          {fundStats.totalDonors}
                        </div>
                        <div
                          className={css`
                            font-size: 1.2rem;
                            color: ${Color.darkGray()};
                          `}
                        >
                          Total Donors
                        </div>
                      </div>
                      <div
                        className={css`
                          text-align: center;
                        `}
                      >
                        <div
                          className={css`
                            font-size: 2rem;
                            font-weight: bold;
                            color: ${Color.orange()};
                          `}
                        >
                          {addCommasToNumber(fundStats.totalDonationsAllTime)}
                        </div>
                        <div
                          className={css`
                            font-size: 1.2rem;
                            color: ${Color.darkGray()};
                          `}
                        >
                          Total Donated
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <>
                  {/* User's Donation Status */}
                  {donorData.myTotalDonated > 0 && (
                    <div
                      className={css`
                        width: 35rem;
                        max-width: 100%;
                        margin-bottom: 2rem;
                        padding: 1.5rem;
                        background: linear-gradient(
                          135deg,
                          ${Color.logoBlue()} 0%,
                          ${Color.rose()} 100%
                        );
                        border-radius: 1rem;
                        color: white;
                        text-align: center;
                      `}
                    >
                      <h3
                        className={css`
                          margin: 0 0 1rem 0;
                          font-size: 1.4rem;
                          font-weight: bold;
                        `}
                      >
                        Your Contribution
                      </h3>
                      <div
                        className={css`
                          display: grid;
                          grid-template-columns: 1fr 1fr;
                          gap: 1rem;
                        `}
                      >
                        <div>
                          <div
                            className={css`
                              font-size: 1.8rem;
                              font-weight: bold;
                              margin-bottom: 0.3rem;
                            `}
                          >
                            #{donorData.myDonationRank || '--'}
                          </div>
                          <div
                            className={css`
                              font-size: 1.1rem;
                              opacity: 0.9;
                            `}
                          >
                            Your Rank
                          </div>
                        </div>
                        <div>
                          <div
                            className={css`
                              font-size: 1.8rem;
                              font-weight: bold;
                              margin-bottom: 0.3rem;
                            `}
                          >
                            {addCommasToNumber(donorData.myTotalDonated)}
                          </div>
                          <div
                            className={css`
                              font-size: 1.1rem;
                              opacity: 0.9;
                            `}
                          >
                            Coins Donated
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {donorData.donors.length > 0 ? (
                    <RoundList
                      style={{ marginTop: 0 }}
                      width="35rem"
                      mobileWidth="100%"
                    >
                      {donorData.donors.map((donor) => (
                        <DonorListItem
                          key={donor.id}
                          donor={donor}
                          myId={myId}
                          onUsermenuShownChange={setUserMenuShown}
                        />
                      ))}
                    </RoundList>
                  ) : (
                    <div
                      style={{
                        padding: '3rem',
                        textAlign: 'center',
                        color: '#999',
                        fontStyle: 'italic'
                      }}
                    >
                      No donations have been made yet.
                      <br />
                      Be the first to donate and support the community!
                    </div>
                  )}
                </>
              )}
              <div style={{ width: '100%', padding: '1rem' }} />
            </div>
          </div>
        )}
      </main>
      <footer>
        <Button transparent onClick={onHide}>
          Close
        </Button>
      </footer>
    </Modal>
  );
}
