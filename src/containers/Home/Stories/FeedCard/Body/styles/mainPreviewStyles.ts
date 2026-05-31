import { Color } from '~/constants/css';

export const mainPreviewStyles = `
  .home-feed-card__secret-preview {
    display: flex;
    align-items: center;
    justify-content: center;
    min-height: 100%;
    padding: 1rem;
  }
  .home-feed-card__text-preview,
  .home-feed-card__subject-main {
    box-sizing: border-box;
    display: grid;
    grid-template-columns: minmax(0, 1fr);
    gap: 0.8rem;
    height: 100%;
    padding: 1rem;
  }
  .home-feed-card__text-preview--with-attachment,
  .home-feed-card__subject-main--with-attachment {
    grid-template-columns: minmax(0, 1fr) minmax(10rem, 32%);
  }
  .home-feed-card__text-preview--with-media-attachment {
    grid-template-columns: minmax(0, 1fr);
    grid-template-rows: auto minmax(0, 1fr);
    align-content: stretch;
    row-gap: 2rem;
  }
  .home-feed-card__text-copy,
  .home-feed-card__subject-copy {
    min-width: 0;
    color: ${Color.darkerGray()};
    font-size: var(--home-feed-content-font-size);
    line-height: 1.36;
  }
  .home-feed-card__subject-copy {
    display: flex;
    height: 100%;
    min-height: 0;
    flex-direction: column;
    gap: 0.85rem;
  }
  .home-feed-card__subject-copy--locked-secret
    .home-feed-card__subject-secret-answer--locked {
    margin-top: auto;
    margin-bottom: auto;
  }
  .home-feed-card__subject-copy > h3,
  .home-feed-card__subject-copy > .home-feed-card__compact-effort,
  .home-feed-card__subject-secret-answer {
    flex: 0 0 auto;
  }
  .home-feed-card__subject-description {
    flex: 0 1 auto;
    font-family: inherit;
    font-size: inherit;
    min-height: 0;
  }
  .home-feed-card__subject-description
    + .home-feed-card__subject-secret-answer:not(.home-feed-card__subject-secret-answer--locked) {
    margin-top: 0.15rem;
  }
  .home-feed-card__text-copy {
    align-self: start;
  }
  .home-feed-card__panel-preview--text-compact .home-feed-card__text-copy {
    align-self: center;
  }
    .home-feed-card__rich-embed-preview {
      box-sizing: border-box;
      display: flex;
      align-items: center;
      justify-content: center;
      height: 100%;
      min-width: 0;
      padding: 0.7rem;
      background: #fff;
    }
    .home-feed-card__rich-embed-preview--image-only {
      padding: 0.25rem;
    }
    .home-feed-card__rich-embed-preview--with-text {
      display: grid;
      grid-template-columns: minmax(0, 1fr) minmax(11rem, 34%);
      gap: 0.85rem;
      justify-content: stretch;
    }
    .home-feed-card__rich-embed-copy {
      display: flex;
      min-width: 0;
      flex-direction: column;
      gap: 0.55rem;
      color: ${Color.darkerGray()};
      font-size: var(--home-feed-content-font-size);
      line-height: 1.36;
    }
    .home-feed-card__rich-embed-image {
      width: 100%;
      height: 100%;
      min-height: 0;
      max-height: 100%;
      object-fit: contain;
      overflow: hidden;
      border-radius: 0.7rem;
      background: #fff;
      container-type: inline-size;
    }
    .home-feed-card__rich-embed-video {
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .home-feed-card__rich-embed-internal {
      display: flex;
      min-width: 0;
    }
    .home-feed-card__rich-embed-internal > * {
      width: 100%;
    }
    .home-feed-card__rich-embed-image.home-feed-card__rich-embed-internal--build {
      align-items: stretch;
      justify-content: stretch;
      border: 0;
      background: transparent;
    }
    .home-feed-card__rich-embed-image.home-feed-card__rich-embed-internal--build
      > * {
      height: 100%;
    }
    .home-feed-card__rich-embed-image.home-feed-card__rich-embed-internal--ai-card {
      align-items: center;
      justify-content: center;
      height: 100%;
      padding: 0.3rem;
    }
    .home-feed-card__rich-embed-image.home-feed-card__rich-embed-internal--ai-card
      .compact-ai-card-preview {
      width: 100%;
      height: 100%;
      max-height: 100%;
    }
    .home-feed-card__rich-embed-preview--with-text
      .home-feed-card__rich-embed-image.home-feed-card__rich-embed-internal--ai-card
      .compact-ai-card-preview,
    .home-feed-card__panel-preview--size-rich-embed-compact
      .home-feed-card__rich-embed-image.home-feed-card__rich-embed-internal--ai-card
      .compact-ai-card-preview {
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 0;
      padding: 0;
      border: 0;
      background: transparent;
    }
    .home-feed-card__rich-embed-preview--with-text
      .home-feed-card__rich-embed-image.home-feed-card__rich-embed-internal--ai-card
      .compact-ai-card-preview__details,
    .home-feed-card__rich-embed-preview--with-text
      .home-feed-card__rich-embed-image.home-feed-card__rich-embed-internal--ai-card
      .compact-ai-card-preview__market,
    .home-feed-card__panel-preview--size-rich-embed-compact
      .home-feed-card__rich-embed-image.home-feed-card__rich-embed-internal--ai-card
      .compact-ai-card-preview__details,
    .home-feed-card__panel-preview--size-rich-embed-compact
      .home-feed-card__rich-embed-image.home-feed-card__rich-embed-internal--ai-card
      .compact-ai-card-preview__market {
      display: none;
    }
    .home-feed-card__rich-embed-preview--with-text
      .home-feed-card__rich-embed-image.home-feed-card__rich-embed-internal--ai-card
      .compact-ai-card-preview__card-stage,
    .home-feed-card__panel-preview--size-rich-embed-compact
      .home-feed-card__rich-embed-image.home-feed-card__rich-embed-internal--ai-card
      .compact-ai-card-preview__card-stage {
      width: 100%;
      height: 100%;
      min-width: 0;
      align-self: center;
    }
    .home-feed-card__rich-embed-preview--with-text
      .home-feed-card__rich-embed-image.home-feed-card__rich-embed-internal--ai-card
      .compact-ai-card-preview__card-stage
      .compact-ai-card-thumb--static,
    .home-feed-card__panel-preview--size-rich-embed-compact
      .home-feed-card__rich-embed-image.home-feed-card__rich-embed-internal--ai-card
      .compact-ai-card-preview__card-stage
      .compact-ai-card-thumb--static {
      width: clamp(7.6rem, 76%, 12rem) !important;
      height: auto !important;
      aspect-ratio: 4.7 / 6.45;
      max-width: 100%;
      max-height: 100%;
      cursor: pointer;
    }
    .home-feed-card__rich-embed-video > div {
      width: 100%;
      min-width: 100%;
      max-height: 100%;
    }
    .home-feed-card__rich-embed-preview--with-text
      .home-feed-card__rich-embed-image {
      border: 1px solid ${Color.borderGray()};
      background: ${Color.whiteGray()};
    }
    .home-feed-card__rich-embed-preview--with-text
      .home-feed-card__rich-embed-image.home-feed-card__rich-embed-internal--subject {
      border: 0;
      background: transparent;
    }
    .home-feed-card__embed-fallback {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 0.55rem;
      padding: 1rem;
      color: ${Color.darkGray()};
      font-size: 1.1rem;
      font-weight: 800;
      line-height: 1.2;
      text-align: center;
    }
    .home-feed-card__embed-fallback svg {
      font-size: 1.8rem;
    }
  .home-feed-card__subject-preview {
    box-sizing: border-box;
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
    height: 100%;
    padding: 0.8rem;
  }
  .home-feed-card__subject-preview--minimal {
    justify-content: flex-start;
    gap: 0.7rem;
    padding: 0.3rem 0.35rem 0.8rem;
    border-left: 0;
    background: #fff;
  }
  .home-feed-card__subject-main {
    padding: 0;
    flex: 1 1 auto;
    min-height: 0;
  }
  .home-feed-card__subject-preview--with-root {
    padding: 0.95rem;
  }
  .home-feed-card__subject-preview--with-root .home-feed-card__subject-main {
    align-content: start;
  }
  .home-feed-card__subject-preview--with-root .home-feed-card__subject-copy {
    gap: 0.75rem;
  }
  .home-feed-card__subject-preview--with-root .home-feed-card__subject-description {
    color: inherit;
  }
  .home-feed-card__subject-preview--root-compact {
    padding: 0.35rem 0.4rem 0.45rem;
  }
  .home-feed-card__subject-preview--root-compact .home-feed-card__subject-main {
    padding: 0;
  }
  .home-feed-card__subject-preview--root-compact .home-feed-card__subject-copy {
    gap: 0.72rem;
  }
  .home-feed-card__subject-preview--root-compact .home-feed-card__compact-effort {
    min-height: 2.6rem;
    padding: 0.38rem 0.72rem;
    border-radius: 0.68rem;
  }
  .home-feed-card__subject-preview--root-compact .home-feed-card__compact-effort-label,
  .home-feed-card__subject-preview--root-compact .home-feed-card__compact-effort-xp {
    font-size: 1.02rem;
  }
  .home-feed-card__subject-preview--root-compact .home-feed-card__compact-effort-stars {
    font-size: 1.08rem;
  }
  .home-feed-card__subject-preview--root-compact h3 {
    font-size: max(2.064rem, 20.64px);
    line-height: 1.12;
  }
  .home-feed-card__subject-preview--root-compact .home-feed-card__subject-description {
    font-family: inherit;
    font-size: inherit;
  }
  .home-feed-card__subject-secret-answer {
    box-sizing: border-box;
    display: grid;
    grid-template-columns: minmax(0, 1fr);
    align-items: center;
    gap: 0.62rem;
    min-height: 5.4rem;
    overflow: hidden;
    padding: 0.85rem 1rem;
    border: 1px solid ${Color.gold(0.3)};
    border-radius: 0.68rem;
    background: ${Color.ivory()};
    color: ${Color.darkerGray()};
    font-size: max(1.8rem, 18px);
    font-weight: 500;
    line-height: 1.3;
  }
  .home-feed-card__subject-secret-answer--has-attachment {
    grid-template-columns: 6.2rem minmax(0, 1fr);
  }
  .home-feed-card__subject-secret-answer--attachment-only {
    display: flex;
    min-height: 14.8rem;
    align-items: center;
    justify-content: center;
    padding: 0.35rem 1rem;
  }
  .home-feed-card__subject-main--with-attachment
    .home-feed-card__subject-secret-answer--attachment-only {
    min-height: 12.6rem;
    padding: 0.25rem 0.85rem;
  }
  .home-feed-card__subject-secret-answer--locked {
    display: flex;
    align-items: center;
    justify-content: center;
    min-height: 4.9rem;
    border-color: transparent;
    background: transparent;
    color: ${Color.darkerGray()};
    text-align: center;
  }
  .home-feed-card__subject-secret-attachment {
    width: 6.2rem;
    height: 5.4rem;
    min-width: 0;
    overflow: hidden;
    border-radius: 0.55rem;
    background: #fff;
  }
  .home-feed-card__subject-secret-answer--attachment-only
    .home-feed-card__subject-secret-attachment {
    width: min(100%, 32rem);
    height: 14rem;
  }
  .home-feed-card__subject-main--with-attachment
    .home-feed-card__subject-secret-answer--attachment-only
    .home-feed-card__subject-secret-attachment {
    width: min(100%, 24rem);
    height: 11.8rem;
  }
  .home-feed-card__subject-secret-attachment > * {
    width: 100%;
    height: 100%;
  }
  .home-feed-card__subject-secret-answer--attachment-only
    .home-feed-card__subject-secret-attachment img {
    width: 100%;
    height: 100%;
    object-fit: contain;
  }
  .home-feed-card__subject-secret-text,
  .home-feed-card__subject-secret-text p {
    min-width: 0;
    color: ${Color.darkerGray()};
    font-size: max(1.8rem, 18px);
    font-weight: 500;
    line-height: 1.3;
  }
  .home-feed-card__subject-secret-text p + p {
    margin-top: 0.25em;
  }
  .home-feed-card__subject-preview--with-embed {
    padding: 0.95rem;
  }
  .home-feed-card__subject-main--with-embed {
    display: flex;
    flex-direction: column;
    gap: 0.85rem;
  }
  .home-feed-card__subject-main--with-embed.home-feed-card__subject-main--with-attachment {
    grid-template-columns: minmax(0, 1fr);
  }
  .home-feed-card__subject-preview--with-embed .home-feed-card__subject-copy {
    flex: 0 0 auto;
    height: auto;
    gap: 0.62rem;
  }
  .home-feed-card__subject-preview--with-embed .home-feed-card__compact-effort {
    min-height: 2.7rem;
    padding: 0.42rem 0.78rem;
  }
  .home-feed-card__subject-preview--with-embed .home-feed-card__compact-effort-label,
  .home-feed-card__subject-preview--with-embed .home-feed-card__compact-effort-xp {
    font-size: 1.02rem;
  }
  .home-feed-card__subject-preview--with-embed .home-feed-card__compact-effort-stars {
    font-size: 1.08rem;
  }
  .home-feed-card__subject-preview--with-embed h3 {
    font-size: max(1.85rem, 18.5px);
    line-height: 1.14;
  }
  .home-feed-card__subject-preview--with-embed .home-feed-card__subject-description {
    color: ${Color.darkGray()};
    font-size: max(1.45rem, 14.5px);
    font-weight: 700;
    line-height: 1.26;
  }
  .home-feed-card__subject-embed-preview {
    display: flex;
    flex: 1 1 auto;
    min-height: 0;
    overflow: hidden;
    border: 1px solid ${Color.borderGray()};
    border-radius: 0.9rem;
    background: #fff;
  }
  .home-feed-card__subject-embed-preview.home-feed-card__rich-embed-internal--build {
    flex: 0 0 max(18rem, 180px);
    height: max(18rem, 180px);
    max-height: max(18rem, 180px);
    margin-block: auto;
    border: 0;
    background: transparent;
  }
  .home-feed-card__subject-embed-preview:has(
      .compact-main-content-embed--ai-story-card:not(
          .compact-main-content-embed--ai-story-has-image
        )
    ) {
    flex: 0 0 auto;
    align-self: start;
  }
  .home-feed-card__subject-embed-preview > * {
    box-sizing: border-box;
    width: 100%;
    height: 100%;
    min-height: 0;
  }
  .home-feed-card__subject-embed-preview > button {
    border: 0;
    border-radius: 0.9rem;
  }
  .home-feed-card__subject-embed-preview
    .compact-main-content-embed--ai-story-card:not(
      .compact-main-content-embed--ai-story-has-image
    ) {
    height: auto;
    min-height: 0;
    max-height: none;
  }
  .home-feed-card__subject-embed-preview .compact-main-content-embed__copy {
    gap: 0.36rem;
  }
  .home-feed-card__subject-embed-preview .compact-main-content-embed__label,
  .home-feed-card__subject-embed-preview .compact-main-content-embed__attachment {
    font-size: 1rem;
  }
  .home-feed-card__subject-embed-preview strong {
    font-size: max(1.45rem, 14.5px);
  }
  .home-feed-card__subject-embed-preview p {
    font-size: max(1.12rem, 11.2px);
  }
  .home-feed-card__subject-embed-preview .compact-main-content-embed__media {
    height: 100%;
    min-height: 0;
    max-height: none;
    object-fit: cover;
  }
  img.home-feed-card__subject-embed-preview {
    width: 100%;
    height: 100%;
    padding: 0.35rem;
    object-fit: contain;
  }
  .home-feed-card__subject-embed-preview.home-feed-card__rich-embed-video > div {
    width: 100%;
    min-width: 100%;
    height: 100%;
  }
  .home-feed-card__subject-preview--minimal .home-feed-card__subject-main {
    flex: 0 0 auto;
    align-items: flex-start;
  }
  .home-feed-card__subject-preview--minimal .home-feed-card__subject-copy {
    display: flex;
    min-height: 0;
    flex-direction: column;
    justify-content: flex-start;
    gap: 0.85rem;
    width: 100%;
  }
  .home-feed-card__subject-preview--minimal h3 {
    font-size: max(1.95rem, 19.5px);
    line-height: 1.15;
  }
  .home-feed-card__reward-bar {
    font-size: 1.15rem;
    flex-shrink: 0;
  }
  .home-feed-card__compact-effort {
    display: flex;
    align-items: center;
    justify-content: space-between;
    align-self: stretch;
    gap: 0.75rem;
    max-width: 100%;
    min-height: 2.9rem;
    padding: 0.48rem 0.82rem;
    border: 0;
    border-radius: 0.78rem;
    background: var(--effort-color);
    color: #fff;
    line-height: 1;
    box-shadow: 0 0.08rem 0 rgba(17, 24, 39, 0.08);
  }
  .home-feed-card__compact-effort-left {
    display: inline-flex;
    min-width: 0;
    align-items: center;
    gap: 0.42rem;
  }
  .home-feed-card__compact-effort-label,
  .home-feed-card__compact-effort-xp {
    font-size: 1.08rem;
    font-weight: 850;
    white-space: nowrap;
  }
  .home-feed-card__compact-effort-label {
    color: #fff;
  }
  .home-feed-card__compact-effort-stars {
    display: flex;
    min-width: 0;
    align-items: center;
    gap: 0.18rem;
    overflow: hidden;
    color: var(--effort-star-color, #ffd700);
    font-size: 1.2rem;
  }
  .home-feed-card__compact-effort-xp {
    min-width: 0;
    overflow: hidden;
    color: #fff;
    text-align: right;
    text-overflow: ellipsis;
  }
  .home-feed-card__attachment-only-preview {
    display: flex;
    height: 100%;
    padding: 0.75rem;
  }
  .home-feed-card__attachment-only-preview--media {
    align-items: center;
    justify-content: center;
    padding: 1rem;
  }
  .home-feed-card__attachment-preview {
    min-width: 0;
    width: 100%;
    height: 100%;
    overflow: hidden;
    border: 1px solid ${Color.borderGray()};
    border-radius: 0.75rem;
    background: ${Color.whiteGray()};
  }
  .home-feed-card__attachment-preview--subject-image {
    border: 0;
    background: transparent;
    box-shadow: none;
  }
  .home-feed-card__attachment-preview > div {
    height: 100%;
  }
  .home-feed-card__attachment-preview img {
    width: 100%;
    height: 100%;
    max-height: none;
    object-fit: cover;
  }
  .home-feed-card__attachment-preview--comment-image,
  .home-feed-card__attachment-preview--comment-video {
    align-self: center;
    aspect-ratio: 16 / 9;
    height: auto;
    max-height: 100%;
    border-color: ${Color.black(0.18)};
    background: #111827;
  }
  .home-feed-card__text-preview--with-media-attachment
    .home-feed-card__attachment-preview--comment-image,
  .home-feed-card__text-preview--with-media-attachment
    .home-feed-card__attachment-preview--comment-video {
    align-self: start;
  }
  .home-feed-card__attachment-preview--comment-image img,
  .home-feed-card__attachment-preview--comment-video img,
  .home-feed-card__attachment-preview--comment-video video {
    object-fit: contain;
  }
  .home-feed-card__attachment-card {
    display: grid;
    grid-template-columns: auto minmax(0, 1fr) auto;
    align-items: center;
    gap: 0.75rem;
    width: 100%;
    height: 100%;
    min-width: 0;
    padding: 0.75rem 0.9rem;
    border: 1px solid ${Color.logoBlue(0.16)};
    border-radius: 0.85rem;
    background: #fff;
    color: ${Color.darkerGray()};
  }
  .home-feed-card__attachment-card-icon {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 3.8rem;
    height: 3.8rem;
    border-radius: 1rem;
    background: ${Color.logoBlue(0.12)};
    color: ${Color.logoBlue()};
    font-size: 1.75rem;
  }
  .home-feed-card__attachment-card-copy {
    display: flex;
    min-width: 0;
    flex-direction: column;
    gap: 0.16rem;
    line-height: 1.18;
  }
  .home-feed-card__attachment-card-copy span,
  .home-feed-card__attachment-card-copy small {
    color: ${Color.darkGray()};
    font-size: 1rem;
    font-weight: 800;
  }
  .home-feed-card__attachment-card-copy strong {
    min-width: 0;
    overflow: hidden;
    color: ${Color.black()};
    font-size: 1.16rem;
    font-weight: 850;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .home-feed-card__attachment-card-extension {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-width: 3.2rem;
    min-height: 2rem;
    padding: 0.32rem 0.56rem;
    border-radius: 999px;
    background: ${Color.black(0.06)};
    color: ${Color.darkGray()};
    font-size: 1rem;
    font-weight: 900;
    line-height: 1;
  }
  .home-feed-card__reflection-preview,
  .home-feed-card__shared-topic-preview {
    box-sizing: border-box;
    gap: 0.75rem;
    height: 100%;
    min-height: 0;
    padding: 1rem;
    color: ${Color.darkerGray()};
    font-size: var(--home-feed-content-font-size);
    line-height: 1.36;
  }
  .home-feed-card__reflection-preview {
    display: grid;
    grid-template-rows: auto minmax(0, auto);
    align-content: start;
  }
  .home-feed-card__reflection-preview--with-footer {
    grid-template-rows: auto minmax(0, 1fr) auto;
  }
  .home-feed-card__reflection-preview > .home-feed-card__question-box {
    grid-row: 1;
  }
  .home-feed-card__reflection-preview > .home-feed-card__reflection-answer {
    grid-row: 2;
  }
  .home-feed-card__reflection-preview > .home-feed-card__reflection-footer {
    grid-row: 3;
  }
  .home-feed-card__shared-topic-preview {
    display: flex;
    flex-direction: column;
  }
  .home-feed-card__question-box,
  .home-feed-card__system-prompt-box {
    box-sizing: border-box;
    display: flex;
    flex-direction: column;
    gap: 0.35rem;
    min-height: 0;
    padding: 0.85rem;
    border: 1px solid ${Color.borderGray()};
    border-radius: 0.8rem;
    background: ${Color.wellGray()};
    color: ${Color.darkerGray()};
    font-size: var(--home-feed-question-font-size);
    line-height: 1.32;
    overflow: hidden;
  }
  .home-feed-card__question-box {
    flex-shrink: 0;
  }
  .home-feed-card__system-prompt-box {
    flex: 1 1 auto;
  }
  .home-feed-card__question-box > div,
  .home-feed-card__system-prompt-box > div {
    --rich-text-preview-ellipsis-bg: ${Color.wellGray()};
    min-height: 0;
  }
  .home-feed-card__question-box span {
    overflow: hidden;
    display: -webkit-box;
    -webkit-box-orient: vertical;
    -webkit-line-clamp: 2;
    text-overflow: ellipsis;
  }
  .home-feed-card__reflection-answer {
    align-self: start;
    min-height: 0;
    color: ${Color.black()};
    font-size: var(--home-feed-content-font-size);
    line-height: 1.36;
  }
  .home-feed-card__reflection-footer {
    display: flex;
    align-items: center;
    align-self: end;
    flex-wrap: nowrap;
    gap: 0.5rem;
    margin-top: 0.15rem;
    min-height: 2.35rem;
    overflow: hidden;
  }
  .home-feed-card__masterpiece-chip,
  .home-feed-card__reward-chip,
  .home-feed-card__build-status {
    display: inline-flex;
    align-items: center;
    gap: 0.4rem;
    min-height: 2rem;
    padding: 0.35rem 0.65rem;
    border-radius: 999px;
    font-size: 1.1rem;
    font-weight: 800;
    line-height: 1;
    white-space: nowrap;
  }
  .home-feed-card__masterpiece-chip {
    border: 1px solid ${Color.gold()};
    background: ${Color.gold(0.14)};
    color: ${Color.gold()};
  }
  .home-feed-card__refined-chip {
    display: inline-flex;
    align-items: center;
    gap: 0.3rem;
    min-height: 1.35rem;
    padding: 0;
    border: 0;
    border-radius: 0;
    background: transparent;
    color: ${Color.darkerGray()};
    font-size: 1.2rem;
    font-weight: 800;
    line-height: 1.15;
    white-space: nowrap;
  }
  .home-feed-card__refined-chip span:last-child {
    font-style: italic;
  }
  .home-feed-card__refined-sparkle {
    color: ${Color.logoBlue()};
    font-size: 1.1rem;
    line-height: 1;
  }
  .home-feed-card__daily-goals-preview {
    box-sizing: border-box;
    display: grid;
    grid-template-columns: minmax(0, 1fr);
    gap: 1rem;
    height: 100%;
    padding: 1rem;
    align-items: center;
  }
  .home-feed-card__daily-goals-preview.has-media {
    grid-template-columns: 8.8rem minmax(0, 1fr);
  }
  .home-feed-card__daily-goals-card {
    display: flex;
    justify-content: center;
    min-width: 0;
    transform: scale(0.86);
    transform-origin: center;
  }
  .home-feed-card__daily-goals-copy {
    display: flex;
    min-width: 0;
    flex-direction: column;
    gap: 0.55rem;
  }
  .home-feed-card__reward-chips,
  .home-feed-card__choice-list,
  .home-feed-card__build-status-row,
  .home-feed-card__build-actions {
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    gap: 0.45rem;
    min-width: 0;
  }
  .home-feed-card__reward-chip {
    background: ${Color.black(0.05)};
    color: ${Color.darkGray()};
  }
  .home-feed-card__reward-chip.multiplier {
    border: 1px solid var(--reward-multiplier-border, transparent);
    background: var(--reward-multiplier-bg, ${Color.black(0.05)});
    color: var(--reward-multiplier-color, ${Color.darkGray()});
    box-shadow: var(--reward-multiplier-shadow, none);
  }
  .home-feed-card__reward-chip.multiplier svg {
    color: currentColor;
    font-size: 1rem;
  }
  .home-feed-card__reward-chip.multiplier--base {
    --reward-multiplier-bg: ${Color.black(0.05)};
    --reward-multiplier-color: ${Color.darkGray()};
  }
  .home-feed-card__reward-chip.multiplier--active {
    --reward-multiplier-bg: ${Color.logoBlue(0.12)};
    --reward-multiplier-border: ${Color.logoBlue(0.2)};
    --reward-multiplier-color: ${Color.logoBlue()};
  }
  .home-feed-card__reward-chip.multiplier--strong {
    --reward-multiplier-bg: ${Color.logoGreen(0.14)};
    --reward-multiplier-border: ${Color.logoGreen(0.3)};
    --reward-multiplier-color: ${Color.green()};
  }
  .home-feed-card__reward-chip.multiplier--major {
    --reward-multiplier-bg: ${Color.gold(0.17)};
    --reward-multiplier-border: ${Color.gold(0.38)};
    --reward-multiplier-color: ${Color.orange()};
    --reward-multiplier-shadow: 0 0.08rem 0.32rem ${Color.gold(0.2)};
  }
  .home-feed-card__reward-chip.multiplier--epic {
    --reward-multiplier-bg: ${Color.pink(0.13)};
    --reward-multiplier-border: ${Color.strongPink(0.28)};
    --reward-multiplier-color: ${Color.rose()};
    --reward-multiplier-shadow: 0 0.08rem 0.42rem ${Color.pink(0.17)};
    min-height: 2.12rem;
    padding-inline: 0.72rem;
    font-size: 1.14rem;
  }
  .home-feed-card__reward-chip.multiplier--legendary {
    --reward-multiplier-bg: linear-gradient(
      135deg,
      ${Color.black()},
      rgba(98, 73, 18, 1)
    );
    --reward-multiplier-border: ${Color.gold(0.55)};
    --reward-multiplier-color: ${Color.brightGold()};
    --reward-multiplier-shadow: 0 0.1rem 0.55rem ${Color.gold(0.22)};
    min-height: 2.18rem;
    padding-inline: 0.78rem;
    font-size: 1.18rem;
  }
  .home-feed-card__reward-chip.xp {
    gap: 0.24rem;
    border: 1px solid ${Color.logoGreen(0.18)};
    background: ${Color.logoGreen(0.09)};
  }
  .home-feed-card__reward-chip-xp-number {
    color: ${Color.logoGreen()};
  }
  .home-feed-card__reward-chip-xp-label {
    color: ${Color.gold()};
  }
  .home-feed-card__reward-chip.coins {
    background: ${Color.brownOrange(0.13)};
    color: ${Color.brownOrange()};
  }
  .home-feed-card__bonus-question {
    color: ${Color.darkerGray()};
    font-size: var(--home-feed-question-font-size);
    line-height: 1.35;
    overflow: hidden;
    display: -webkit-box;
    -webkit-box-orient: vertical;
    -webkit-line-clamp: 2;
  }
  .home-feed-card__choice-list span {
    max-width: 46%;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    padding: 0.4rem 0.6rem;
    border: 1px solid ${Color.borderGray()};
    border-radius: 0.6rem;
    background: ${Color.whiteGray()};
    color: ${Color.darkGray()};
    font-size: var(--home-feed-compact-content-font-size);
    font-weight: 700;
  }
  .home-feed-card__build-preview {
    box-sizing: border-box;
    height: 100%;
    padding: 0.85rem 1rem;
    border-left: 0.45rem solid var(--home-feed-build-accent, ${Color.logoBlue()});
    background: #fff;
  }
  .home-feed-card__url-copy p,
  .home-feed-card__video-copy p {
    color: ${Color.darkGray()};
    font-size: var(--home-feed-content-font-size);
    line-height: 1.34;
    overflow: hidden;
    display: -webkit-box;
    -webkit-box-orient: vertical;
    -webkit-line-clamp: 2;
  }
    .home-feed-card__pass-preview {
      box-sizing: border-box;
      width: 100%;
      height: 100%;
      padding: 0.45rem 1.1rem 1.35rem;
      border: 0;
      border-radius: 0;
      background: #fff;
      overflow: hidden;
    }
    .home-feed-card__mission-preview,
    .home-feed-card__achievement-preview {
      display: grid;
      grid-template-columns: 8rem minmax(0, 1fr);
      align-items: center;
      gap: 1rem;
      box-shadow: none;
    }
    .home-feed-card__mission-icon,
    .home-feed-card__achievement-badge {
      display: flex;
      align-items: center;
      justify-content: center;
      min-width: 0;
    }
    .home-feed-card__mission-icon {
      width: 6.4rem;
      height: 6.4rem;
      justify-self: center;
      border-radius: 0.75rem;
      background: rgba(250, 193, 50, 0.2);
      color: ${Color.gold()};
      font-size: 2.6rem;
      box-shadow: inset 0 0 0 1px rgba(250, 193, 50, 0.28);
    }
    .home-feed-card__achievement-badge > div {
      padding: 0;
    }
    .home-feed-card__mission-copy,
    .home-feed-card__achievement-copy {
      display: flex;
      min-width: 0;
      flex-direction: column;
      gap: 0.45rem;
    }
    .home-feed-card__mission-status {
      color: ${Color.gold()};
      font-size: 1.12rem;
      font-weight: 900;
      letter-spacing: 0.04em;
      text-transform: uppercase;
    }
    .home-feed-card__achievement-copy h3 span {
      margin-left: 0.45rem;
      color: ${Color.darkGray()};
      font-size: 1.35rem;
      font-weight: 700;
    }
    .home-feed-card__achievement-copy p,
    .home-feed-card__mission-copy p {
      color: ${Color.darkGray()};
      font-size: var(--home-feed-content-font-size);
      line-height: 1.34;
      overflow: hidden;
      display: -webkit-box;
      -webkit-box-orient: vertical;
      -webkit-line-clamp: 2;
    }
    .home-feed-card__mission-reward-row {
      display: flex;
      align-items: center;
      flex-wrap: wrap;
      gap: 0.45rem;
      margin-top: 0.1rem;
      min-width: 0;
    }
    .home-feed-card__mission-reward {
      display: inline-flex;
      align-items: center;
      gap: 0.35rem;
      min-height: 2rem;
      padding: 0.34rem 0.65rem;
      border-radius: 999px;
      font-size: 1.1rem;
      font-weight: 800;
      line-height: 1;
      white-space: nowrap;
    }
    .home-feed-card__mission-reward.xp {
      background: ${Color.gold(0.16)};
      color: ${Color.gold()};
    }
    .home-feed-card__mission-reward.coins {
      background: ${Color.brownOrange(0.14)};
      color: ${Color.brownOrange()};
    }
    .home-feed-card__mission-reward svg {
      font-size: 1rem;
    }
    .home-feed-card__mission-copy h3,
    .home-feed-card__achievement-copy h3 {
      color: ${Color.black()};
    }
  .home-feed-card__ai-story-preview {
    --home-feed-ai-story-color: ${Color.logoBlue()};
    --home-feed-ai-story-color-soft: ${Color.logoBlue(0.2)};
    --home-feed-ai-story-color-muted: ${Color.logoBlue(0.72)};
    box-sizing: border-box;
    display: grid;
    grid-template-rows: auto minmax(0, 1fr);
    gap: 0.85rem;
    height: 100%;
    min-height: 0;
    padding: 1rem 1.15rem;
    border: 1px solid var(--home-feed-ai-story-color-soft);
    border-radius: inherit;
    background: #fff;
    color: ${Color.darkerGray()};
    font-size: var(--home-feed-content-font-size);
    line-height: 1.4;
    overflow: hidden;
  }
  .home-feed-card__ai-story-topline {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 0.5rem;
    min-height: 2.4rem;
    color: ${Color.darkGray()};
    font-size: 1.15rem;
    font-weight: 800;
    line-height: 1.25;
  }
  .home-feed-card__ai-story-topline span {
    display: inline-flex;
    align-items: center;
    gap: 0.4rem;
  }
  .home-feed-card__ai-story-topline span:first-child {
    overflow: visible;
    padding-block: 0.08rem;
    line-height: 1.35;
  }
  .home-feed-card__ai-story-preview--listening
    .home-feed-card__ai-story-topline
    span:first-child {
    color: var(--home-feed-ai-story-color);
  }
  .home-feed-card__ai-story-topline .level {
    padding: 0.34rem 0.65rem;
    border-radius: 999px;
    background: var(--home-feed-ai-story-color);
    color: #fff;
  }
  .home-feed-card__ai-story-main {
    display: grid;
    grid-template-columns: minmax(0, 1fr);
    gap: 0.85rem;
    min-height: 0;
    overflow: hidden;
  }
  .home-feed-card__ai-story-preview--has-image .home-feed-card__ai-story-main {
    grid-template-columns: minmax(0, 1fr) minmax(10rem, 36%);
    align-items: stretch;
  }
  .home-feed-card__ai-story-copy {
    display: grid;
    grid-template-rows: auto minmax(0, 1fr);
    gap: 0.75rem;
    min-width: 0;
    min-height: 0;
    overflow: hidden;
  }
  .home-feed-card__ai-story-preview h3 {
    display: -webkit-box;
    margin: 0;
    max-height: max(5.06rem, 50.6px);
    overflow: hidden;
    color: ${Color.black()};
    font-size: max(1.78rem, 17.8px);
    font-weight: 900;
    line-height: 1.42;
    text-overflow: ellipsis;
    -webkit-box-orient: vertical;
    -webkit-line-clamp: 2;
  }
  .home-feed-card__ai-story-story {
    display: -webkit-box;
    margin: 0;
    max-height: max(9.56rem, 95.6px);
    min-height: 0;
    overflow: hidden;
    color: ${Color.darkGray()};
    font-size: max(1.66rem, 16.6px);
    font-weight: 500;
    line-height: 1.44;
    text-overflow: ellipsis;
    white-space: normal;
    -webkit-box-orient: vertical;
    -webkit-line-clamp: 4;
  }
  .home-feed-card__ai-story-preview--long-title .home-feed-card__ai-story-story {
    max-height: max(7.17rem, 71.7px);
    -webkit-line-clamp: 3;
  }
  .home-feed-card__ai-story-preview--has-image .home-feed-card__ai-story-story {
    max-height: max(7.17rem, 71.7px);
    -webkit-line-clamp: 3;
  }
  .home-feed-card__ai-story-image-frame {
    min-width: 0;
    min-height: 0;
    overflow: hidden;
    border: 1px solid var(--home-feed-ai-story-color-soft);
    border-radius: 0.8rem;
    background: ${Color.whiteGray()};
    box-shadow: inset 0 0 0 1px ${Color.white(0.72)};
  }
  .home-feed-card__ai-story-image {
    display: block;
    width: 100%;
    height: 100%;
    min-height: 0;
    object-fit: cover;
  }
  .home-feed-card__ai-story-listening-body {
    display: grid;
    min-height: 0;
    place-items: center;
    overflow: hidden;
  }
  .home-feed-card__ai-story-preview--listening .home-feed-card__ai-story-main {
    align-content: center;
    gap: 1rem;
    text-align: center;
  }
  .home-feed-card__ai-story-preview--listening
    .home-feed-card__ai-story-copy {
    align-content: center;
    gap: 1rem;
  }
  .home-feed-card__ai-story-preview--listening.home-feed-card__ai-story-preview--has-image
    .home-feed-card__ai-story-main {
    align-content: stretch;
    text-align: left;
  }
  .home-feed-card__ai-story-preview--listening h3 {
    color: ${Color.darkGray()};
    font-size: max(1.75rem, 17.5px);
    line-height: 1.34;
    text-transform: none;
  }
  .home-feed-card__audio-wave {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.28rem;
    min-height: 3.7rem;
    width: 100%;
    min-width: 0;
    margin: 0;
    padding: 0.7rem;
    border: 1px solid var(--home-feed-ai-story-color-soft);
    border-radius: 0.8rem;
    background: #fff;
  }
  .home-feed-card__audio-wave span {
    width: 0.35rem;
    height: 1rem;
    border-radius: 999px;
    background: var(--home-feed-ai-story-color-muted);
  }
  .home-feed-card__audio-wave span:nth-child(2n) {
    height: 1.7rem;
  }
  .home-feed-card__audio-wave span:nth-child(3n) {
    height: 2.45rem;
    background: var(--home-feed-ai-story-color);
  }
  .home-feed-card__audio-wave span:nth-child(5n) {
    height: 1.35rem;
  }
  .home-feed-card__audio-wave--small {
    min-height: 2.6rem;
    justify-content: flex-start;
    padding: 0.45rem 0.55rem;
  }
  .home-feed-card__audio-wave--small span {
    width: 0.28rem;
  }
  .home-feed-card__video-attachment {
    position: relative;
    width: 100%;
    height: 100%;
    min-height: 0;
    overflow: hidden;
    border-radius: 0.72rem;
    background: #111827;
  }
  .home-feed-card__video-attachment img,
  .home-feed-card__video-attachment video {
    display: block;
    width: 100%;
    height: 100%;
    object-fit: contain;
    background: #111827;
    pointer-events: none;
  }
  .home-feed-card__video-attachment-play {
    position: absolute;
    top: 50%;
    left: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 3.35rem;
    height: 3.35rem;
    border: 2px solid rgba(255, 255, 255, 0.86);
    border-radius: 999px;
    background: rgba(17, 24, 39, 0.58);
    color: #fff;
    font-size: 1.25rem;
    pointer-events: none;
    transform: translate(-50%, -50%);
  }
  .home-feed-card__video-attachment-title {
    position: absolute;
    box-sizing: border-box;
    bottom: 0.55rem;
    left: 0.55rem;
    width: fit-content;
    max-width: calc(100% - 1.1rem);
    overflow: hidden;
    padding: 0.34rem 0.52rem;
    border-radius: 0.55rem;
    background: rgba(17, 24, 39, 0.74);
    color: #fff;
    font-size: 1.02rem;
    font-weight: 850;
    line-height: 1.15;
    pointer-events: none;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .home-feed-card__url-preview,
  .home-feed-card__video-preview {
    box-sizing: border-box;
    display: grid;
    gap: 1rem;
    height: 100%;
    padding: 1rem;
    align-items: stretch;
  }
  .home-feed-card__url-preview {
    grid-template-columns: minmax(0, 1fr) minmax(12rem, 34%);
  }
  .home-feed-card__video-preview {
    grid-template-columns: minmax(12rem, 46%) minmax(0, 1fr);
  }
  .home-feed-card__url-copy,
  .home-feed-card__video-copy {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    min-width: 0;
    justify-content: center;
  }
  .home-feed-card__url-copy span {
    color: ${Color.logoBlue()};
    font-size: 1.1rem;
    font-weight: 800;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .home-feed-card__url-thumb,
  .home-feed-card__video-thumb {
    min-width: 0;
    height: 100%;
    overflow: hidden;
    border: 1px solid var(--ui-border);
    border-radius: 0.8rem;
    background: ${Color.whiteGray()};
  }
  .home-feed-card__url-thumb img,
  .home-feed-card__video-thumb img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
`;
