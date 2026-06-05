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
  .home-feed-card__comment-preview--ai-energy {
    border-color: ${Color.borderGray()};
    background: #fff;
    box-shadow: none;
  }
  .home-feed-card__comment-preview:hover {
    background: #fff;
    border-color: color-mix(in srgb, var(--home-feed-comment-accent, ${Color.logoBlue()}) 62%, #ffffff);
    box-shadow: 0 0.22rem 0 rgba(15, 23, 42, 0.07);
  }
  .home-feed-card__comment-preview--ai-energy:hover {
    border-color: ${Color.borderGray()};
    box-shadow: none;
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
  .home-feed-card__comment-preview-ai-energy-banner {
    box-sizing: border-box;
    display: grid;
    grid-template-columns: 3.8rem minmax(0, 1fr);
    align-items: center;
    gap: 0.7rem;
    min-width: 0;
    width: 100%;
    padding: 0.48rem 0.68rem;
    border: 1px solid var(--ui-border, ${Color.borderGray()});
    border-radius: 0.8rem;
    background: var(--chat-bg, #fff);
  }
  .home-feed-card__comment-preview-ai-energy-battery {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 3.8rem;
    height: 3rem;
    border: 1px solid var(--ui-border, ${Color.borderGray()});
    border-radius: 0.58rem;
    background: #fff;
  }
  .home-feed-card__comment-preview-ai-energy-battery-shell {
    position: relative;
    display: grid;
    grid-template-columns: repeat(5, 1fr);
    gap: 0.16rem;
    width: 2.55rem;
    height: 1.35rem;
    padding: 0.18rem;
    border: 2px solid var(--theme-border, ${Color.darkerGray()});
    border-radius: 0.4rem;
  }
  .home-feed-card__comment-preview-ai-energy-battery-shell::after {
    position: absolute;
    top: 0.26rem;
    right: -0.42rem;
    width: 0.32rem;
    height: 0.65rem;
    border-radius: 0 0.24rem 0.24rem 0;
    background: var(--theme-border, ${Color.darkerGray()});
    content: '';
  }
  .home-feed-card__comment-preview-ai-energy-battery-segment {
    border-radius: 0.16rem;
    background: var(--chat-border, ${Color.borderGray()});
    opacity: 0.32;
  }
  .home-feed-card__comment-preview-ai-energy-copy {
    display: flex;
    min-width: 0;
    flex-direction: column;
    gap: 0.18rem;
  }
  .home-feed-card__comment-preview-ai-energy-meta {
    display: flex;
    min-width: 0;
    align-items: baseline;
    gap: 0.38rem;
    color: ${Color.gray()};
    font-size: 1.08rem;
    font-weight: 800;
    line-height: 1.08;
    white-space: nowrap;
  }
  .home-feed-card__comment-preview-ai-energy-meta b {
    min-width: 0;
    overflow: hidden;
    color: var(--home-feed-comment-accent, ${Color.logoBlue()});
    font-weight: 900;
    text-overflow: ellipsis;
  }
  .home-feed-card__comment-preview-ai-energy-title {
    min-width: 0;
    overflow: hidden;
    color: ${Color.darkerGray()};
    font-size: 1.28rem;
    font-weight: 850;
    line-height: 1.12;
    text-overflow: ellipsis;
    white-space: nowrap;
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
  .home-feed-card__comment-preview-media--image img {
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
    width: 7.2rem;
    background: color-mix(in srgb, var(--home-feed-comment-accent, ${Color.logoBlue()}) 7%, #ffffff);
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
    .home-feed-card__comment-preview-ai-energy-banner {
      grid-template-columns: 3.35rem minmax(0, 1fr);
      gap: 0.58rem;
      padding: 0.42rem 0.58rem;
    }
    .home-feed-card__comment-preview-ai-energy-battery {
      width: 3.35rem;
      height: 2.72rem;
    }
    .home-feed-card__comment-preview-ai-energy-battery-shell {
      width: 2.28rem;
      height: 1.22rem;
    }
    .home-feed-card__comment-preview-ai-energy-meta {
      font-size: 1rem;
    }
    .home-feed-card__comment-preview-ai-energy-title {
      font-size: 1.16rem;
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
