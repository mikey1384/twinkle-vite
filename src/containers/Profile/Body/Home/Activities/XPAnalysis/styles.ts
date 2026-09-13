import { css } from '@emotion/css';

export const contentClass = css`
  --xp-ink: #243247;
  --xp-muted: #627187;
  --xp-line: var(--ui-border, #e2e8f0);
  --xp-accent: var(--section-panel-accent, #418ceb);
  --xp-tint: color-mix(in srgb, var(--xp-accent) 8%, #fff);
  --xp-focus: color-mix(in srgb, var(--xp-accent) 55%, #243247);
  color: var(--xp-ink);
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(min(100%, 30rem), 1fr));
  grid-auto-rows: 1fr;
  align-items: stretch;
  gap: 2rem;
  width: 100%;
  font-size: 1.4rem;
  line-height: 1.5;
  font-variant-numeric: tabular-nums;
`;

export const cardClass = css`
  min-width: 0;
  padding: 1.8rem;
  border: 1px solid var(--xp-line);
  border-radius: 14px;
  background: #fff;
  margin: 0;

  h3 {
    font-size: max(16px, 1.7rem);
    font-weight: 700;
    line-height: 1.4;
    margin: 0;
    color: var(--xp-ink);
  }
  p {
    margin: 0;
  }
  @media (max-width: 400px) {
    padding: 1.4rem;
  }
`;

export const headingClass = css`
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 0.6rem 1rem;
  margin-bottom: 1.8rem;
`;

export const captionClass = css`
  font-size: max(12px, 1.2rem);
  color: var(--xp-muted);
  line-height: 1.5;
`;
