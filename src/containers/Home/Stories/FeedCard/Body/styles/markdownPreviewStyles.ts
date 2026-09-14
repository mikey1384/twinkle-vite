import { compactMarkdownPreviewStyles } from '~/components/Texts/RichText/previewTypography';
import { mobileMaxWidth } from '~/constants/css';
import { HOME_FEED_MARKDOWN_FONT_REM } from '../../helpers/typography';

// Only feed-owned Markdown gets this preset. Embedded components have their
// own typography, and full-post RichText lives outside the feed body scope.
const markdownRoots =
  ':is(.home-feed-card__markdown-preview, .home-feed-card__target-subject-description)';
const outsideEmbeds = ':where(:not(.rich-text-embedded-component *))';

export const markdownPreviewStyles = `
  --home-feed-markdown-font-size: max(${HOME_FEED_MARKDOWN_FONT_REM.desktop}rem, ${HOME_FEED_MARKDOWN_FONT_REM.desktop * 10}px);
  @media (max-width: ${mobileMaxWidth}) {
    --home-feed-markdown-font-size: max(${HOME_FEED_MARKDOWN_FONT_REM.mobile}rem, ${HOME_FEED_MARKDOWN_FONT_REM.mobile * 10}px);
  }
  /* Beat older template-specific prose rules without changing the font inherited
     by an adjacent subject title, attachment or other embedded card. */
  && .home-feed-card__markdown-preview:not(.home-feed-card__markdown-preview--secondary):not(.home-feed-card__subject-secret-text) {
    font-size: var(--home-feed-markdown-font-size);
  }
  ${compactMarkdownPreviewStyles(`&& ${markdownRoots}`, outsideEmbeds)}
`;
