import { css } from '@emotion/css';
import { Color, mobileMaxWidth } from '~/constants/css';

export const loadingCls = css`
  min-height: 20rem;
`;

export const bodyCls = css`
  width: 100%;
  padding: 0 1.5rem 1.75rem;
`;

export const sectionNavCls = css`
  display: flex;
  flex-wrap: wrap;
  gap: 0.65rem;
  padding: 1rem 0 1.1rem;
`;

export const headerWrapCls = css`
  display: flex;
  align-items: center;
  gap: 0.9rem;
  min-width: 0;
`;

export const headerIconCls = css`
  width: 2.6rem;
  height: 2.6rem;
  border-radius: 12px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  font-size: 1.1rem;
`;

export const headerTextWrapCls = css`
  min-width: 0;
`;

export const headerTitleCls = css`
  font-size: 1.55rem;
  font-weight: 700;
  color: ${Color.black()};
  line-height: 1.2;
`;

export const headerSubtitleCls = css`
  margin-top: 0.2rem;
  font-size: 1.1rem;
  color: ${Color.darkGray()};
  line-height: 1.4;
`;

export const sectionStackCls = css`
  display: flex;
  flex-direction: column;
  gap: 1.35rem;
`;

export const overviewPageCls = css`
  display: flex;
  flex-direction: column;
  gap: 1.35rem;
`;

export const heroCardCls = css`
  background: rgba(255, 255, 255, 0.96);
  border: 1px solid var(--ui-border);
  border-radius: 18px;
  padding: 1.35rem 1.45rem;
`;

export const heroEyebrowCls = css`
  font-size: 0.92rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.08em;
`;

export const heroTitleCls = css`
  margin-top: 0.5rem;
  font-size: 1.65rem;
  font-weight: 700;
  color: ${Color.black()};
  line-height: 1.2;
`;

export const heroDescriptionCls = css`
  margin: 0.8rem 0 0;
  font-size: 1.1rem;
  line-height: 1.65;
  color: ${Color.darkerGray()};
`;

export const batteryMeterCls = css`
  margin-top: 1.1rem;
  padding: 1rem;
  border: 1px solid var(--ui-border);
  border-radius: 16px;
  background: rgba(255, 255, 255, 0.92);
`;

export const batteryMeterTopRowCls = css`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.8rem;
  flex-wrap: wrap;
`;

export const batteryMeterTitleCls = css`
  font-size: 1rem;
  font-weight: 700;
  color: ${Color.black()};
  line-height: 1.3;
`;

export const batteryMeterModeCls = css`
  padding: 0.35rem 0.7rem;
  border-radius: 999px;
  font-size: 0.88rem;
  font-weight: 700;
  line-height: 1;
  white-space: nowrap;
`;

export const batterySegmentsCls = css`
  margin-top: 0.9rem;
  display: grid;
  grid-template-columns: repeat(5, minmax(0, 1fr));
  gap: 0.45rem;
`;

export const batterySegmentCls = css`
  position: relative;
  overflow: hidden;
  min-width: 0;
  height: 1rem;
  border-radius: 999px;
  border: 1px solid var(--ui-border);
  background: rgba(148, 163, 184, 0.12);
`;

export const batterySegmentFillCls = css`
  position: absolute;
  inset: 0 auto 0 0;
  border-radius: inherit;
`;

export const batteryMeterMetaCls = css`
  margin-top: 0.75rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.8rem;
  flex-wrap: wrap;
`;

export const batteryMeterMetaItemCls = css`
  font-size: 0.98rem;
  line-height: 1.45;
  color: ${Color.darkGray()};
`;

export const batteryChargeActionCls = css`
  margin-top: 1rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.45rem;
`;

export const batteryChargeMetaCls = css`
  font-size: 0.95rem;
  line-height: 1.45;
  color: ${Color.darkGray()};
  text-align: center;
`;

export const batteryChargeErrorCls = css`
  font-size: 0.95rem;
  line-height: 1.45;
  color: ${Color.rose()};
  text-align: center;
`;

export const metricGridCls = css`
  margin-top: 1rem;
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 0.85rem;

  @media (max-width: ${mobileMaxWidth}) {
    grid-template-columns: 1fr;
  }
`;

export const overviewMetricGridCls = css`
  margin-top: 1rem;
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0.85rem;

  @media (max-width: ${mobileMaxWidth}) {
    grid-template-columns: 1fr;
  }
`;

export const metricTileCls = css`
  border: 1px solid var(--ui-border);
  border-radius: 14px;
  background: rgba(255, 255, 255, 0.94);
  padding: 0.95rem 1rem;
  min-height: 5.7rem;
`;

export const metricTileLabelRowCls = css`
  display: flex;
  align-items: center;
  gap: 0.45rem;
  font-size: 0.98rem;
  color: ${Color.darkGray()};
  line-height: 1.35;
`;

export const metricTileIconCls = css`
  display: inline-flex;
  align-items: center;
  justify-content: center;
`;

export const metricTileValueCls = css`
  margin-top: 0.55rem;
  font-size: 1.35rem;
  font-weight: 700;
  line-height: 1.25;
  color: ${Color.black()};
  word-break: break-word;
`;

export const overviewGridCls = css`
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 1rem;

  & > * {
    flex: 1 1 30rem;
    max-width: 32rem;
  }

  @media (max-width: ${mobileMaxWidth}) {
    & > * {
      flex-basis: 100%;
      max-width: 100%;
    }
  }
`;

export const entryCardCls = css`
  appearance: none;
  position: relative;
  width: 100%;
  border: 1px solid var(--ui-border);
  border-radius: 18px;
  background: rgba(255, 255, 255, 0.98);
  padding: 5rem 1.15rem 1.15rem;
  text-align: left;
  cursor: pointer;
  transition:
    transform 120ms ease,
    border-color 120ms ease;

  &:hover {
    transform: translateY(-2px);
  }
`;

export const entryCardIconCls = css`
  position: absolute;
  top: 1.15rem;
  left: 1.15rem;
  width: 2.5rem;
  height: 2.5rem;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1rem;
`;

export const entryCardStatusCls = css`
  position: absolute;
  top: 1.15rem;
  right: 1.15rem;
  padding: 0.3rem 0.55rem;
  border-radius: 999px;
  font-size: 0.82rem;
  font-weight: 700;
  line-height: 1;
  white-space: nowrap;
`;

export const entryCardTitleCls = css`
  font-size: 1.2rem;
  font-weight: 700;
  color: ${Color.black()};
  line-height: 1.25;
`;

export const entryCardValueCls = css`
  margin-top: 0.55rem;
  font-size: 1.1rem;
  line-height: 1.55;
  color: ${Color.darkerGray()};
`;

export const entryCardDetailCls = css`
  margin-top: 0.85rem;
  font-size: 0.98rem;
  line-height: 1.55;
  color: ${Color.darkGray()};
`;

export const surfaceCardCls = css`
  background: rgba(255, 255, 255, 0.96);
  border: 1px solid var(--ui-border);
  border-radius: 18px;
  padding: 1.2rem 1.3rem;
`;

export const surfaceTitleRowCls = css`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.8rem;
  flex-wrap: wrap;
`;

export const surfaceTitleCls = css`
  font-size: 1.22rem;
  font-weight: 700;
  color: ${Color.black()};
  line-height: 1.25;
`;

export const surfaceDescriptionCls = css`
  margin: 0.65rem 0 0;
  font-size: 1.05rem;
  line-height: 1.65;
  color: ${Color.darkerGray()};
`;

export const featureListCls = css`
  margin: 0.9rem 0 0;
  padding-left: 1.25rem;
  color: ${Color.darkerGray()};

  li {
    font-size: 1rem;
    line-height: 1.55;
  }

  li + li {
    margin-top: 0.6rem;
  }
`;

export const emptyStateCardCls = css`
  border: 1px dashed var(--ui-border);
  border-radius: 18px;
  background: rgba(255, 255, 255, 0.8);
  padding: 1.6rem 1.3rem;
  text-align: center;
`;

export const emptyStateIconCls = css`
  width: 3rem;
  height: 3rem;
  margin: 0 auto;
  border-radius: 14px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 1.1rem;
`;

export const emptyStateTitleCls = css`
  margin-top: 0.95rem;
  font-size: 1.2rem;
  font-weight: 700;
  color: ${Color.black()};
`;

export const emptyStateTextCls = css`
  max-width: 36rem;
  margin: 0.6rem auto 0;
  font-size: 1.02rem;
  line-height: 1.65;
  color: ${Color.darkGray()};
`;

export const secondaryGridCls = css`
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 1rem;

  @media (max-width: ${mobileMaxWidth}) {
    grid-template-columns: 1fr;
  }
`;

export const statusPillCls = css`
  padding: 0.35rem 0.7rem;
  border-radius: 999px;
  font-size: 0.88rem;
  font-weight: 700;
  line-height: 1;
  white-space: nowrap;
`;

export const requirementsListCls = css`
  margin-top: 1rem;
  display: flex;
  flex-direction: column;
  gap: 0.7rem;
`;

export const requirementRowCls = css`
  display: flex;
  align-items: center;
  gap: 0.7rem;
  border: 1px solid var(--ui-border);
  border-radius: 14px;
  padding: 0.8rem 0.9rem;
  font-size: 1.02rem;
  line-height: 1.45;
  color: ${Color.darkerGray()};
`;

export const requirementIconCls = css`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 1.2rem;
  flex-shrink: 0;
`;

export const finePrintCls = css`
  margin-top: 0.85rem;
  font-size: 0.98rem;
  line-height: 1.55;
  color: ${Color.darkGray()};
`;

export const emptyInlineStateCls = css`
  margin-top: 1rem;
  padding: 0.95rem 1rem;
  border-radius: 14px;
  border: 1px dashed var(--ui-border);
  background: rgba(255, 255, 255, 0.85);
  font-size: 1rem;
  color: ${Color.darkGray()};
`;

export const myContributionGridCls = css`
  margin-top: 1rem;
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0.85rem;
`;

export const myContributionCellCls = css`
  border-radius: 14px;
  border: 1px solid var(--ui-border);
  background: rgba(255, 255, 255, 0.92);
  padding: 1rem;
  min-height: 6rem;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  justify-content: center;
  gap: 0.5rem;
`;

export const myContributionValueCls = css`
  font-size: 1.45rem;
  font-weight: 700;
  line-height: 1.2;
`;

export const subtleLabelCls = css`
  font-size: 0.98rem;
  line-height: 1.45;
  color: ${Color.darkGray()};
`;

export const impactGridCls = css`
  margin-top: 1rem;
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0.85rem;

  @media (max-width: ${mobileMaxWidth}) {
    grid-template-columns: 1fr;
  }
`;
