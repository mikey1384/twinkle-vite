// The AI card list (GET /chat/aiCard and the chat bootstrap) returns feed
// shells, and each Activity used to load its own feed after mounting. So every
// card on screen opened as a short loading placeholder and grew to its full
// height (500-900px for a summon) in a column pinned to the newest card: the
// Word Master drift class (10-25) and the /users jank (10-04). A page's feeds
// now load together, in parallel, before its cards show. A feed that fails
// here stays a shell, and its Activity keeps loading it as before.
export async function hydrateAICardFeedPage({
  cardFeeds,
  cardObj,
  loadFeed
}: {
  cardFeeds: any[];
  cardObj: Record<string, any>;
  loadFeed: (feedId: number) => Promise<any>;
}): Promise<{ cardFeeds: any[]; cardObj: Record<string, any> }> {
  const results = await Promise.allSettled(
    cardFeeds.map((feed) =>
      feed?.isLoaded || !feed?.id ? feed : loadFeed(feed.id)
    )
  );
  const nextCardObj = { ...cardObj };
  const nextCardFeeds = cardFeeds.map((feed, index) => {
    const result = results[index];
    if (feed?.isLoaded || result.status !== 'fulfilled' || !result.value) {
      return feed;
    }
    const loadedFeed = result.value;
    if (loadedFeed.card?.id) {
      nextCardObj[loadedFeed.card.id] = loadedFeed.card;
    }
    return { ...loadedFeed, isLoaded: true };
  });
  return { cardFeeds: nextCardFeeds, cardObj: nextCardObj };
}

// A reconnect bootstrap serves the page as shells again. Keep the feeds this
// member already has in full, so the cards on screen do not fall back to
// placeholders and regrow. Same-user only: START_CHAT_BOOTSTRAP resets chat
// state when the account changes.
export function keepLoadedAICardFeeds(
  cardFeeds: any[],
  currentFeedObj: Record<string, any>
) {
  const feedObj: Record<string, any> = {};
  for (const feed of cardFeeds) {
    const current = currentFeedObj?.[feed.id];
    feedObj[feed.id] = !feed.isLoaded && current?.isLoaded ? current : feed;
  }
  return feedObj;
}
