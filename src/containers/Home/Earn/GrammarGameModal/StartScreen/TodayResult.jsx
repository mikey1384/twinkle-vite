import { useMemo } from 'react';
import PropTypes from 'prop-types';
import Marble from './Marble';

TodayResult.propTypes = {
  results: PropTypes.array.isRequired
};

export default function TodayResult({ results }) {
  const firstRow = useMemo(() => {
    const row = (results[0] || []).map((letterGrade, index) => (
      <Marble
        key={index}
        style={{ marginLeft: index === 0 ? 0 : '0.1rem' }}
        letterGrade={letterGrade}
      />
    ));
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
          marginBottom: '1.5rem',
          fontSize: '1.7rem'
        }}
      >{`Today's Results`}</p>
      <div>{firstRow}</div>
      <div style={{ marginTop: '3px' }}>{secondRow}</div>
      <div style={{ marginTop: '3px' }}>{thirdRow}</div>
      <div style={{ marginTop: '3px' }}>{fourthRow}</div>
      <div style={{ marginTop: '3px' }}>{fifthRow}</div>
    </div>
  );
}
