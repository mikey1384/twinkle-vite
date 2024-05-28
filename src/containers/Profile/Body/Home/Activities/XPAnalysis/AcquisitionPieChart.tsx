import React from 'react';
import PropTypes from 'prop-types';
import { Cell, Legend, Pie, PieChart, ResponsiveContainer } from 'recharts';
import { Color, mobileMaxWidth } from '~/constants/css';
import { css } from '@emotion/css';
import { addCommasToNumber } from '~/helpers/stringHelpers';
import { isMobile } from '~/helpers';
import localize from '~/constants/localize';

const deviceIsMobile = isMobile(navigator);
const xpAcquisitionLabel = localize('xpAcquisition');
const colors: Record<string, string> = {
  posting: Color.logoBlue(),
  watching: Color.passionFruit(),
  vocabulary: Color.orange(),
  missions: Color.green(),
  grammar: Color.purple(),
  cards: Color.magenta(),
  ['ai story']: Color.gold(),
  ['daily bonus']: Color.skyBlue()
};

AcquisitionPieChart.propTypes = {
  data: PropTypes.array.isRequired
};

export default function AcquisitionPieChart({ data }: { data: any[] }) {
  return (
    <div
      style={{
        width: 'CALC(50% - 2rem)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center'
      }}
    >
      <p
        className={css`
          font-weight: bold;
          font-size: 2rem;
          @media (max-width: ${mobileMaxWidth}) {
            font-size: 1.7rem;
          }
        `}
      >
        {xpAcquisitionLabel}
      </p>
      <div
        style={{
          marginTop: '2rem',
          width: '100%',
          height: '25rem',
          display: 'flex',
          justifyContent: 'center'
        }}
      >
        <ResponsiveContainer width="99%" height="99%">
          <PieChart>
            <Legend
              content={({ payload }) => {
                return (
                  <div
                    style={{
                      width: '100%',
                      justifyContent: 'center',
                      display: 'flex'
                    }}
                  >
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'center',
                        flexWrap: 'wrap',
                        width: '100%'
                      }}
                    >
                      {payload?.reverse().map((entry, index) => (
                        <div
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            marginRight: '1rem',
                            marginBottom: '0.5rem'
                          }}
                          key={`item-${index}`}
                        >
                          <div
                            style={{
                              width: '12px',
                              height: '12px',
                              backgroundColor: entry.color
                            }}
                          />
                          <span style={{ marginLeft: '0.5rem' }}>
                            {entry.value}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              }}
            />
            <Pie
              data={data}
              dataKey="value"
              nameKey="name"
              label={handlePieLabelFormatting}
              cx="50%"
              cy="50%"
              outerRadius={deviceIsMobile ? 40 : 73}
              fill="#8884d8"
              paddingAngle={deviceIsMobile ? 10 : 5}
              isAnimationActive={false}
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={colors[entry.name]} />
              ))}
            </Pie>
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );

  function handlePieLabelFormatting({
    payload
  }: {
    payload: { value: number };
  }) {
    if (payload.value > 1_000_000) {
      return Math.round(payload.value / 100_000) / 10 + 'M';
    }
    return addCommasToNumber(payload.value);
  }
}
