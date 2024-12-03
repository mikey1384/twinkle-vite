import React, { useMemo, useRef, useState } from 'react';
import PropTypes from 'prop-types';
import Link from '~/components/Link';
import FullTextReveal from '~/components/Texts/FullTextRevealFromOuterLayer';
import {
  Color,
  borderRadius,
  innerBorderRadius,
  mobileMaxWidth
} from '~/constants/css';
import { css } from '@emotion/css';
import { textIsOverflown } from '~/helpers';
import { returnMissionThumb } from '~/constants/defaultValues';

MissionItem.propTypes = {
  completed: PropTypes.bool,
  missionName: PropTypes.string,
  taskProgress: PropTypes.string,
  missionType: PropTypes.string,
  style: PropTypes.object
};

export default function MissionItem({
  completed,
  missionName,
  taskProgress,
  missionType,
  style
}: {
  completed: boolean;
  missionName: string;
  taskProgress: string;
  missionType: string;
  style: React.CSSProperties;
}) {
  const NameRef: React.RefObject<any> = useRef(null);
  const [nameContext, setNameContext] = useState(null);
  const missionThumb = useMemo(
    () => returnMissionThumb(missionType),
    [missionType]
  );
  return (
    <div
      style={style}
      className={css`
        border: 1px solid ${Color.borderGray()};
        border-radius: ${borderRadius};
        width: 15rem;
        height: 15rem;
        display: flex;
        flex-direction: column;
        @media (max-width: ${mobileMaxWidth}) {
          width: 12rem;
          height: 12rem;
        }
      `}
    >
      <Link
        className={css`
          position: relative;
          width: 100%;
          padding-bottom: 10rem;
          @media (max-width: ${mobileMaxWidth}) {
            padding-bottom: 8rem;
          }
        `}
        to={`/missions/${missionType}`}
      >
        <div>
          <img
            loading="lazy"
            fetchPriority="low"
            src={missionThumb}
            style={{
              borderTopLeftRadius: innerBorderRadius,
              borderTopRightRadius: innerBorderRadius,
              position: 'absolute',
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              objectPosition: 'center'
            }}
          />
        </div>
      </Link>
      <div
        style={{
          paddingLeft: '0.5rem',
          paddingRight: '0.5rem',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          width: '100%',
          height: '100%'
        }}
      >
        <Link
          innerRef={NameRef}
          onMouseOver={handleMouseOver}
          onMouseLeave={() => setNameContext(null)}
          to={`/missions/${missionType}`}
          style={{
            color: completed ? Color.green() : Color.black(),
            width: '100%',
            textAlign: 'center',
            fontSize: '1.2rem',
            fontWeight: 'bold',
            whiteSpace: 'nowrap',
            textOverflow: 'ellipsis',
            overflow: 'hidden'
          }}
        >
          {missionName}
        </Link>
        {nameContext && (
          <FullTextReveal
            textContext={nameContext}
            text={missionName}
            style={{ fontSize: '1.3rem' }}
          />
        )}
        {taskProgress && !completed ? (
          <div
            style={{
              textAlign: 'center',
              fontWeight: 'bold',
              color: Color.green()
            }}
          >
            {taskProgress} complete
          </div>
        ) : null}
      </div>
    </div>
  );

  function handleMouseOver() {
    if (textIsOverflown(NameRef.current)) {
      const parentElementDimensions =
        NameRef.current?.getBoundingClientRect?.() || {
          x: 0,
          y: 0,
          width: 0,
          height: 0
        };
      setNameContext(parentElementDimensions);
    }
  }
}
