import React, { useMemo } from 'react';
import PropTypes from 'prop-types';
import Icon from '~/components/Icon';
import Button from '~/components/Button';
import RichText from '~/components/Texts/RichText';
import { useKeyContext } from '~/contexts';
import { borderRadius, Color } from '~/constants/css';
import { addCommasToNumber } from '~/helpers/stringHelpers';

StatusMessage.propTypes = {
  failMessage: PropTypes.string,
  mission: PropTypes.object,
  missionComplete: PropTypes.bool,
  passMessage: PropTypes.string,
  status: PropTypes.string,
  onBackToStart: PropTypes.func
};

export default function StatusMessage({
  mission,
  missionComplete,
  status,
  passMessage,
  failMessage,
  onBackToStart
}: {
  mission: any;
  missionComplete: boolean;
  status: string;
  passMessage: string;
  failMessage: string;
  onBackToStart: () => any;
}) {
  const xpNumberColor = useKeyContext((v) => v.theme.xpNumber.color);

  const rewardDetails = useMemo(() => {
    return (
      (mission.repeatXpReward || mission.repeatCoinReward) && (
        <div
          style={{
            marginTop: '0.5rem',
            color: Color.black()
          }}
        >
          You were rewarded{' '}
          {mission.repeatXpReward ? (
            <span
              style={{
                color: Color[xpNumberColor](),
                fontWeight: 'bold'
              }}
            >
              {addCommasToNumber(mission.repeatXpReward)}{' '}
            </span>
          ) : null}
          {mission.repeatXpReward && mission.repeatCoinReward ? (
            <>
              <span style={{ color: Color.gold(), fontWeight: 'bold' }}>
                XP
              </span>{' '}
              and{' '}
            </>
          ) : null}
          {mission.repeatCoinReward ? (
            <>
              <Icon
                style={{ color: Color.brownOrange(), fontWeight: 'bold' }}
                icon={['far', 'badge-dollar']}
              />{' '}
              <span style={{ color: Color.brownOrange(), fontWeight: 'bold' }}>
                {mission.repeatCoinReward}
              </span>
            </>
          ) : null}
        </div>
      )
    );
  }, [mission.repeatCoinReward, mission.repeatXpReward, xpNumberColor]);

  return (
    <div
      style={{
        borderTop: `1px solid ${Color.borderGray()}`,
        borderBottom: `1px solid ${Color.borderGray()}`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: '2rem',
        marginLeft: '-1rem',
        marginRight: '-1rem',
        marginBottom: '-1rem',
        fontSize: '1.5rem',
        minHeight: '5rem',
        padding: '1.5rem 0'
      }}
    >
      {missionComplete ? (
        <div>
          <div
            style={{
              borderRadius,
              width: 'auto',
              boxShadow: `0 0 2px ${Color.brown()}`,
              padding: '0.5rem 2rem',
              fontWeight: 'bold',
              fontSize: '2rem',
              background: Color.brownOrange(),
              color: '#fff'
            }}
          >
            Mission Accomplished
          </div>
          <div
            style={{
              fontSize: '1.3rem',
              textAlign: 'center'
            }}
          >
            {rewardDetails}
          </div>
          <div
            style={{
              marginTop: '1.5rem',
              display: 'flex',
              justifyContent: 'center'
            }}
          >
            <Button onClick={onBackToStart} skeuomorphic color="logoBlue">
              Back to Start Screen
            </Button>
          </div>
        </div>
      ) : (
        <div style={{ marginLeft: '2rem' }}>
          <div
            style={{
              display: 'flex',
              width: '100%',
              justifyContent: 'center',
              alignItems: 'center'
            }}
          >
            <Icon
              size="2x"
              style={{
                color: status === 'pass' ? Color.green() : Color.rose()
              }}
              icon={status === 'pass' ? 'check' : 'times'}
            />
            <RichText
              style={{
                marginLeft: '1.5rem',
                fontSize: '1.7rem'
              }}
            >
              {status === 'pass' ? passMessage : failMessage}
            </RichText>
          </div>
          {status === 'fail' && (
            <div
              style={{
                marginTop: '1.5rem',
                display: 'flex',
                justifyContent: 'center'
              }}
            >
              <Button onClick={onBackToStart} skeuomorphic color="rose">
                Back to Start Screen
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
