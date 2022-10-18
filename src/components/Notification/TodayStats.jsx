import ErrorBoundary from '~/components/ErrorBoundary';
import { css } from '@emotion/css';
import { Color, borderRadius } from '~/constants/css';
import { useKeyContext, useNotiContext } from '~/contexts';
import { addCommasToNumber } from '~/helpers/stringHelpers';
import UsernameText from '~/components/Texts/UsernameText';
import Loading from '~/components/Loading';

export default function TodayStats() {
  const theme = useKeyContext((v) => v.theme);
  const {
    todayProgressText: {
      color: todayProgressTextColor,
      shadow: todayProgressTextShadowColor
    },
    xpNumber: { color: xpNumberColor }
  } = theme;
  const todayStats = useNotiContext((v) => v.state.todayStats);

  return (
    <ErrorBoundary componentPath="Notification/TodayStats">
      <div
        style={{ marginBottom: '1rem' }}
        className={css`
          padding: 1.5rem 0;
          text-align: center;
          border-radius: ${borderRadius};
          border: 1px solid ${Color.borderGray()};
          background: #fff;
        `}
      >
        {todayStats?.loaded ? (
          <div>
            <div
              style={{
                display: 'flex',
                flexDirection: 'column'
              }}
            >
              <b
                className={css`
                  text-shadow: 0.05rem 0.05rem ${Color.darkGold()};
                `}
                style={{ color: Color.gold(), fontSize: '1.7rem' }}
              >
                Grammarbles World Record
              </b>
              <div>
                <UsernameText
                  color={Color.logoBlue()}
                  style={{ fontSize: '1.7rem' }}
                  user={{
                    username: todayStats?.grammarbleChamp?.username,
                    id: todayStats?.grammarbleChamp?.userId
                  }}
                />
              </div>{' '}
              <b style={{ color: Color.green(), fontSize: '1.3rem' }}>
                {todayStats?.grammarbleChamp?.bestStreak} perfect games in a
                row!
              </b>
            </div>
            <div style={{ marginTop: '2rem' }}>
              <b
                className={css`
                  color: ${Color[todayProgressTextColor]()};
                  ${todayProgressTextShadowColor
                    ? `text-shadow: 0.05rem 0.05rem ${Color[
                        todayProgressTextShadowColor
                      ]()};`
                    : ''}
                `}
                style={{ fontSize: '1.7rem' }}
              >{`Today's Progress`}</b>
              <div style={{ marginTop: '0.3rem' }}>
                <p
                  style={{
                    fontWeight: 'bold',
                    color: Color[xpNumberColor]()
                  }}
                >
                  {todayStats.xpEarned > 0 ? '+' : ''}
                  {addCommasToNumber(todayStats.xpEarned)}{' '}
                  <b style={{ color: Color.gold() }}>XP</b>
                </p>
                <p style={{ fontWeight: 'bold', color: Color.brownOrange() }}>
                  {todayStats.coinsEarned > 0 ? '+' : ''}
                  {addCommasToNumber(todayStats.coinsEarned)} Coin
                  {todayStats.coinsEarned === 1 ? '' : 's'}
                </p>
              </div>
            </div>
          </div>
        ) : (
          <Loading />
        )}
      </div>
    </ErrorBoundary>
  );
}
