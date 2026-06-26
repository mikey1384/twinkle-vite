import React from 'react';
import Icon from '~/components/Icon';
import { Color, borderRadius } from '~/constants/css';
import { css, cx } from '@emotion/css';

export default function UnpublishedBuildContent({
  bare,
  style
}: {
  bare?: boolean;
  style?: React.CSSProperties;
}) {
  return (
    <div
      style={style}
      className={cx(unpublishedBuildClass, bare && 'bare')}
    >
      <span className="unpublished-build__icon" aria-hidden>
        <Icon icon="eye-slash" />
      </span>
      <div className="unpublished-build__copy">
        <strong className="unpublished-build__title">
          This app is no longer published
        </strong>
        <span className="unpublished-build__subtitle">
          Its creator unpublished this Lumine app, so it can&rsquo;t be opened
          right now.
        </span>
      </div>
    </div>
  );
}

const unpublishedBuildClass = css`
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.7rem;
  width: 100%;
  height: 100%;
  min-height: 10.5rem;
  padding: 1.5rem;
  border: 1px solid ${Color.borderGray()};
  border-radius: ${borderRadius};
  background: ${Color.wellGray()};
  color: ${Color.darkGray()};
  text-align: center;

  .unpublished-build__icon {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 3.2rem;
    height: 3.2rem;
    border-radius: 999px;
    background: ${Color.borderGray(0.45)};
    color: ${Color.gray()};
    font-size: 1.5rem;
  }
  .unpublished-build__copy {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
  }
  .unpublished-build__title {
    color: ${Color.darkerGray()};
    font-size: 1.4rem;
    font-weight: 800;
    line-height: 1.2;
  }
  .unpublished-build__subtitle {
    max-width: 28rem;
    color: ${Color.gray()};
    font-size: 1.1rem;
    line-height: 1.35;
    display: -webkit-box;
    overflow: hidden;
    -webkit-box-orient: vertical;
    -webkit-line-clamp: 3;
  }

  &.bare {
    min-height: 0;
    padding: 1rem;
    border: 0;
    border-radius: 0;
    background: transparent;
    gap: 0.5rem;

    .unpublished-build__icon {
      width: 2.6rem;
      height: 2.6rem;
      font-size: 1.25rem;
    }
    .unpublished-build__subtitle {
      -webkit-line-clamp: 2;
    }
  }
`;
