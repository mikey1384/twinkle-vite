import { useMemo } from 'react';
import PropTypes from 'prop-types';
import Marble from './Marble';
import { Color, mobileMaxWidth } from '~/constants/css';
import { useKeyContext } from '~/contexts';
import { addCommasToNumber } from '~/helpers/stringHelpers';
import { scoreTable, perfectScoreBonus } from '../constants';
import { css } from '@emotion/css';

const xpFontSize = '1.7rem';
const mobileXpFontSize = '1.5rem';

TodayResult.propTypes = {
  results: PropTypes.array.isRequired
};

export default function TodayResult({ results }) {
  const {
    xpNumber: { color: xpNumberColor }
  } = useKeyContext((v) => v.theme);
  const perfectScore = scoreTable.S * 10 * perfectScoreBonus;
  const todaysScore = useMemo(() => {
    let totalScore = 0;
    for (let result of results) {
      if (!result?.length) continue;
      const sum = result.reduce((acc, cur) => acc + scoreTable[cur], 0);
      if (sum === scoreTable.S * 10) {
        totalScore += perfectScore;
        continue;
      }
      totalScore += sum;
    }
    return totalScore;
  }, [perfectScore, results]);
  const firstRow = useMemo(() => {
    const row = (results[0] || []).map((letterGrade, index) => (
      <Marble
        key={index}
        style={{ marginLeft: index === 0 ? 0 : '0.1rem' }}
        letterGrade={letterGrade}
      />
    ));
    if (row.length === 0) {
      return Array(10)
        .fill()
        .map((_, index) => (
          <Marble
            key={index}
            style={{ marginLeft: index === 0 ? 0 : '0.1rem' }}
          />
        ));
    }
    return row;
  }, [results]);
  const secondRow = useMemo(() => {
    const row = (results[1] || []).map((letterGrade, index) => (
      <Marble
        key={index}
        style={{ marginLeft: index === 0 ? 0 : '0.1rem' }}
        letterGrade={letterGrade}
      />
    ));
    if (row.length === 0) {
      return Array(10)
        .fill()
        .map((_, index) => (
          <Marble
            key={index}
            style={{ marginLeft: index === 0 ? 0 : '0.1rem' }}
          />
        ));
    }
    return row;
  }, [results]);
  const thirdRow = useMemo(() => {
    const row = (results[2] || []).map((letterGrade, index) => (
      <Marble
        key={index}
        style={{ marginLeft: index === 0 ? 0 : '0.1rem' }}
        letterGrade={letterGrade}
      />
    ));
    if (row.length === 0) {
      return Array(10)
        .fill()
        .map((_, index) => (
          <Marble
            key={index}
            style={{ marginLeft: index === 0 ? 0 : '0.1rem' }}
          />
        ));
    }
    return row;
  }, [results]);
  const fourthRow = useMemo(() => {
    const row = (results[3] || []).map((letterGrade, index) => (
      <Marble
        key={index}
        style={{ marginLeft: index === 0 ? 0 : '0.1rem' }}
        letterGrade={letterGrade}
      />
    ));
    if (row.length === 0) {
      return Array(10)
        .fill()
        .map((_, index) => (
          <Marble
            key={index}
            style={{ marginLeft: index === 0 ? 0 : '0.1rem' }}
          />
        ));
    }
    return row;
  }, [results]);
  const fifthRow = useMemo(() => {
    const row = (results[4] || []).map((letterGrade, index) => (
      <Marble
        key={index}
        style={{ marginLeft: index === 0 ? 0 : '0.1rem' }}
        letterGrade={letterGrade}
      />
    ));
    if (row.length === 0) {
      return Array(10)
        .fill()
        .map((_, index) => (
          <Marble
            key={index}
            style={{ marginLeft: index === 0 ? 0 : '0.1rem' }}
          />
        ));
    }
    return row;
  }, [results]);

  return (
    <div style={{ marginBottom: '3rem' }}>
      <p
        style={{
          fontWeight: 'bold',
          fontSize: '1.7rem'
        }}
      >{`Today's Results`}</p>
      <div
        className={css`
          margin-top: 1rem;
          margin-bottom: 1.7rem;
          font-weight: bold;
          font-size: ${xpFontSize};
          @media (max-width: ${mobileMaxWidth}) {
            font-size: ${mobileXpFontSize};
          }
        `}
      >
        <span style={{ color: Color[xpNumberColor]() }}>
          {addCommasToNumber(todaysScore)}
        </span>{' '}
        <span style={{ color: Color.gold() }}>XP</span>
      </div>
      <div>{firstRow}</div>
      <div style={{ marginTop: '3px' }}>{secondRow}</div>
      <div style={{ marginTop: '3px' }}>{thirdRow}</div>
      <div style={{ marginTop: '3px' }}>{fourthRow}</div>
      <div style={{ marginTop: '3px' }}>{fifthRow}</div>
    </div>
  );
}
