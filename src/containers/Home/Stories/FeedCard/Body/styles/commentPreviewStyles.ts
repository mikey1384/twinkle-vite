import { Color, mobileMaxWidth } from '~/constants/css';

export const commentPreviewStyles = `
  .home-feed-card__comment-preview {
    position: relative;
    display: grid;
    grid-template-columns: auto minmax(0, 1fr) auto;
    align-items: center;
    flex: 0 0 7.4rem;
    gap: 0.95rem;
    width: 100%;
    height: 7.4rem;
    min-height: 7.4rem;
    padding: 0.9rem 1.05rem;
    border: 1px solid color-mix(in srgb, var(--home-feed-comment-accent, ${Color.logoBlue()}) 42%, #ffffff);
    border-radius: 1.15rem;
    background: linear-gradient(180deg, #fff 0%, ${Color.whiteGray(0.28)} 100%);
    box-shadow: 0 0.18rem 0 rgba(15, 23, 42, 0.06);
    color: ${Color.darkerGray()};
    cursor: pointer;
    text-align: left;
    transition:
      border-color 0.16s ease,
      box-shadow 0.16s ease;
  }
  .home-feed-card__comment-preview--has-media {
    grid-template-columns: auto minmax(0, 1fr) minmax(5.6rem, 7.2rem) auto;
  }
  .home-feed-card__comment-preview:hover {
    background: #fff;
    border-color: color-mix(in srgb, var(--home-feed-comment-accent, ${Color.logoBlue()}) 62%, #ffffff);
    box-shadow: 0 0.22rem 0 rgba(15, 23, 42, 0.07);
  }
  .home-feed-card__comment-preview:focus-visible {
    outline: 2px solid var(--home-feed-comment-accent, ${Color.logoBlue()});
    outline-offset: 2px;
  }
  .home-feed-card__comment-preview-avatar {
    display: flex;
    width: 4.35rem;
    min-width: 4.35rem;
    height: 4.35rem;
    overflow: hidden;
    border: 2px solid #fff;
    border-radius: 999px;
    box-shadow: 0 0 0 1px color-mix(in srgb, var(--home-feed-comment-accent, ${Color.logoBlue()}) 55%, #ffffff);
  }
  .home-feed-card__comment-preview-body {
    display: flex;
    min-width: 0;
    flex-direction: column;
    gap: 0.25rem;
  }
  .home-feed-card__comment-preview-meta {
    display: flex;
    min-width: 0;
    align-items: baseline;
    gap: 0.45rem;
    color: ${Color.gray()};
    font-size: 1.25rem;
    font-weight: 800;
    line-height: 1.1;
    white-space: nowrap;
  }
  .home-feed-card__comment-preview-meta b {
    min-width: 0;
    max-width: 55%;
    overflow: hidden;
    color: var(--home-feed-comment-accent, ${Color.logoBlue()});
    font-weight: 900;
    text-overflow: ellipsis;
  }
  .home-feed-card__comment-preview-text {
    min-width: 0;
    overflow: hidden;
    color: ${Color.darkerGray()};
    display: -webkit-box;
    font-size: 1.65rem;
    font-weight: 850;
    line-height: 1.14;
    -webkit-box-orient: vertical;
    -webkit-line-clamp: 2;
  }
  .home-feed-card__comment-preview-text--message {
    font-weight: 500;
  }
  .home-feed-card__comment-preview-media {
    position: relative;
    display: flex;
    align-items: center;
    justify-content: center;
    justify-self: end;
    width: 6.6rem;
    height: 5.15rem;
    min-width: 0;
    overflow: hidden;
    border: 1px solid color-mix(in srgb, var(--home-feed-comment-accent, ${Color.logoBlue()}) 30%, #ffffff);
    border-radius: 0.8rem;
    background: #fff;
    pointer-events: none;
  }
  .home-feed-card__comment-preview-media--image img,
  .home-feed-card__comment-preview-media--build img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
  .home-feed-card__comment-preview-media--ai-card {
    align-items: center;
    background: color-mix(in srgb, var(--home-feed-comment-accent, ${Color.logoBlue()}) 7%, #ffffff);
  }
  .home-feed-card__comment-preview-media--ai-card-collection {
    background: color-mix(in srgb, var(--home-feed-comment-accent, ${Color.logoBlue()}) 8%, #ffffff);
    color: var(--home-feed-comment-accent, ${Color.logoBlue()});
  }
  .home-feed-card__comment-preview-media--ai-card-collection svg {
    color: inherit;
    font-size: 2.25rem;
  }
  .home-feed-card__comment-preview-media--ai-card > div {
    width: 4.1rem;
    height: 5.15rem;
    transform: scale(0.84);
    transform-origin: center;
  }
  .home-feed-card__comment-preview-media--build {
    background: color-mix(in srgb, ${Color.logoBlue()} 7%, #ffffff);
    color: ${Color.logoBlue()};
  }
  .home-feed-card__comment-preview-media--subject {
    width: 7.2rem;
    border: 0;
    background: transparent;
  }
  .home-feed-card__comment-preview-media--file {
    gap: 0.35rem;
    background: color-mix(in srgb, var(--home-feed-comment-accent, ${Color.logoBlue()}) 8%, #ffffff);
    color: var(--home-feed-comment-accent, ${Color.logoBlue()});
  }
  .home-feed-card__comment-preview-media-icon {
    color: inherit;
    font-size: 1.9rem;
  }
  .home-feed-card__comment-preview-media small {
    max-width: 3rem;
    overflow: hidden;
    color: ${Color.darkGray()};
    font-size: 1rem;
    font-weight: 900;
    line-height: 1;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .home-feed-card__comment-preview-media-play {
    position: absolute;
    inset: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    color: #fff;
    background: rgba(0, 0, 0, 0.18);
  }
  .home-feed-card__comment-preview-media-play svg {
    color: #fff;
    font-size: 1.35rem;
  }
  .home-feed-card__comment-preview-icon {
    flex-shrink: 0;
    color: var(--home-feed-comment-accent, ${Color.logoBlue()});
    font-size: 1.65rem;
  }
  @media (max-width: ${mobileMaxWidth}) {
    .home-feed-card__comment-preview {
      flex-basis: var(--home-feed-card-mobile-comment-preview-height);
      height: var(--home-feed-card-mobile-comment-preview-height);
      min-height: var(--home-feed-card-mobile-comment-preview-height);
      gap: 0.8rem;
      padding: 0.8rem 0.9rem;
    }
    .home-feed-card__comment-preview--has-media {
      grid-template-columns: auto minmax(0, 1fr) minmax(5rem, 5.8rem) auto;
    }
    .home-feed-card__comment-preview-avatar {
      width: 3.85rem;
      min-width: 3.85rem;
      height: 3.85rem;
    }
    .home-feed-card__comment-preview-meta {
      font-size: 1.5rem;
    }
    .home-feed-card__comment-preview-text {
      font-size: 1.9rem;
    }
    .home-feed-card__comment-preview-media {
      width: 5.35rem;
      height: 4.75rem;
    }
    .home-feed-card__comment-preview-media--subject {
      width: 5.8rem;
    }
    .home-feed-card__comment-preview-media--ai-card > div {
      width: 3.75rem;
      height: 4.75rem;
      transform: scale(0.78);
    }
    .home-feed-card__comment-preview-media--ai-card-collection svg {
      font-size: 2rem;
    }
    .home-feed-card__comment-preview-media-icon {
      font-size: 1.7rem;
    }
    .home-feed-card__comment-preview-media small {
      max-width: 2.5rem;
      font-size: 1rem;
    }
  }
`;
