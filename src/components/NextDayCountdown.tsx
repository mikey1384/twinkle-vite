import React from 'react';
import Countdown from 'react-countdown';
import { useNotiContext } from '~/contexts';

export default function NextDayCountdown({
  label,
  inline = false,
  nextDayTimeStamp: nextDayTimeStampProp,
  timeDifference: timeDifferenceProp,
  onComplete,
  className,
  labelClassName,
  timerClassName,
  style
}: {
  label?: string;
  inline?: boolean;
  nextDayTimeStamp?: number | null;
  timeDifference?: number;
  onComplete?: () => void;
  className?: string;
  labelClassName?: string;
  timerClassName?: string;
  style?: React.CSSProperties;
}) {
  const nextDayTimeStampFromContext = useNotiContext(
    (v) => v.state.todayStats.nextDayTimeStamp
  );
  const timeDifferenceFromContext = useNotiContext(
    (v) => v.state.todayStats.timeDifference
  );

  const nextDayTimeStamp =
    nextDayTimeStampProp ?? nextDayTimeStampFromContext;
  const timeDifference = timeDifferenceProp ?? timeDifferenceFromContext ?? 0;

  if (!nextDayTimeStamp) return null;

  function now() {
    return Date.now() + timeDifference;
  }

  function renderCountdown({
    hours,
    minutes,
    seconds
  }: {
    hours: number;
    minutes: number;
    seconds: number;
  }) {
    return (
      <span>
        {String(hours).padStart(2, '0')}:
        {String(minutes).padStart(2, '0')}:
        {String(seconds).padStart(2, '0')}
      </span>
    );
  }

  const countdownElement = (
    <Countdown
      key={nextDayTimeStamp}
      date={nextDayTimeStamp}
      now={now}
      daysInHours={true}
      onComplete={onComplete}
      renderer={renderCountdown}
      className={timerClassName}
    />
  );

  if (inline) {
    return (
      <span className={className} style={style}>
        {label ? <span className={labelClassName}>{label} </span> : null}
        {countdownElement}
      </span>
    );
  }

  return (
    <div className={className} style={style}>
      {label ? <div className={labelClassName}>{label}</div> : null}
      {countdownElement}
    </div>
  );
}

