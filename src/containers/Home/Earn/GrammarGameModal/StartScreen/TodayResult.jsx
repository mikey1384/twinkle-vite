import { useMemo } from 'react';
import PropTypes from 'prop-types';
import Marble from './Marble';

TodayResult.propTypes = {
  results: PropTypes.array.isRequired
};

export default function TodayResult({ results }) {
  const firstRow = useMemo(() => {
    console.log(results);
    return [<Marble key={1} letterGrade="S" />];
  }, [results]);
  const secondRow = useMemo(() => {
    return [<Marble key={1} letterGrade="A" />];
  }, [results]);
  const thirdRow = useMemo(() => {
    return [<Marble key={1} letterGrade="B" />];
  }, [results]);
  const fourthRow = useMemo(() => {
    return [<Marble key={1} letterGrade="C" />];
  }, [results]);
  const fifthRow = useMemo(() => {
    return [<Marble key={1} letterGrade="D" />];
  }, [results]);

  return (
    <div>
      <h2>{`Today's Results`}</h2>
      <div>{firstRow}</div>
      <div>{secondRow}</div>
      <div>{thirdRow}</div>
      <div>{fourthRow}</div>
      <div>{fifthRow}</div>
    </div>
  );
}
