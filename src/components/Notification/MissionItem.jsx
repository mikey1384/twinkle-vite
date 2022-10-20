import PropTypes from 'prop-types';
import Link from '~/components/Link';
import { Color, mobileMaxWidth } from '~/constants/css';
import RewardText from '~/components/Texts/RewardText';
import { css } from '@emotion/css';

MissionItem.propTypes = {
  missionName: PropTypes.string,
  missionType: PropTypes.string,
  xpReward: PropTypes.number,
  coinReward: PropTypes.number,
  style: PropTypes.object
};

export default function MissionItem({
  missionName,
  missionType,
  xpReward,
  coinReward,
  style
}) {
  return (
    <div
      style={style}
      className={css`
        display: flex;
        flex-direction: column;
        @media (max-width: ${mobileMaxWidth}) {
          width: 12rem;
          height: 12rem;
        }
      `}
    >
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          width: '100%',
          height: '100%'
        }}
      >
        <p
          style={{
            marginTop: '1.3rem',
            fontWeight: 'bold',
            color: Color.green()
          }}
        >
          Your next mission:
        </p>
        <Link
          to={`/missions/${missionType}`}
          style={{
            width: '100%',
            textAlign: 'center',
            marginTop: '0.5rem',
            fontSize: '1.6rem',
            fontWeight: 'bold',
            color: Color.logoBlue()
          }}
        >
          {missionName}
        </Link>
        <div>
          <RewardText
            labelClassName={css`
              color: ${Color.darkerGray()};
              font-size: 1.2rem;
            `}
            rewardClassName={css`
              font-size: 1.2rem;
            `}
            xpReward={xpReward}
            coinReward={coinReward}
          />
        </div>
      </div>
    </div>
  );
}
