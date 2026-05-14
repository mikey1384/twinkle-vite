export const skeletonPreviewStyles = `
    .home-feed-card__skeleton {
      border-radius: 0.8rem;
      background: #f2f4f7;
  }
  .home-feed-card__skeleton.title {
    height: 2rem;
    width: 62%;
  }
  .home-feed-card__skeleton.panel {
    height: max(20rem, 200px);
    width: 100%;
  }
  @keyframes homeFeedCardBodySkeleton {
    0% {
      background-position: 0% 50%;
    }
    100% {
      background-position: -200% 50%;
    }
  }
`;
