const {
  assert,
  test,
  compile,
  driver,
  css,
  nodes,
  deferred
} = require('./helpers/chatDialogHarness.cjs');

function fixture() {
  const parent = driver();
  const feeds = driver();
  const pendingNews = deferred();
  const leaf = () => null;
  const CollectButton = () => null;
  const RewardItem = () => null;
  const MyRank = () => null;
  const key = { myState: { userId: 7, twinkleXP: 7269788, twinkleCoins: 100 } };
  const noti = {
    state: {
      notiObj: { 7: { notifications: [], rewards: [] } },
      notificationsLoaded: true,
      numNewNotis: 0,
      myAllTimeRank: 104,
      todayStats: { nextDayTimeStamp: 100 }
    },
    actions: {
      onLoadNotifications() {},
      onUpdateTodayStats() {},
      onHydrateTodayStats() {},
      onLoadRewards() {},
      onSetDailyRewardModalShown() {},
      onSetRewardsTimeoutExecuted() {},
      onSetDailyBonusModalShown() {},
      onCollectRewards() {},
      onLoadMoreNotifications() {},
      onLoadMoreRewards() {}
    }
  };
  const app = {
    requestHelpers: {
      getCurrentNextDayTimeStamp: async () => 100,
      fetchNotifications: () => pendingNews.promise,
      fetchTodayStats: async () => ({}),
      loadRewards: async () => noti.state.notiObj[7],
      loadMoreNotifications() {},
      loadMoreRewards() {},
      updateUserXP() {},
      collectRewardedCoins() {}
    },
    user: { actions: { onSetUserState() {} } }
  };
  const contexts = {
    useAppContext: (select) => select(app),
    useKeyContext: (select) => select(key),
    useNotiContext: (select) => select(noti),
    useViewContext: (select) => select({ state: { pageVisible: true } })
  };
  const MainFeeds = compile('src/components/Notification/MainFeeds/index.tsx', {
    react: feeds.hooks,
    '~/contexts': contexts,
    '@emotion/css': { css },
    '~/components/Banner': leaf,
    '~/components/Buttons/GradientButton': CollectButton,
    '~/components/Buttons/LoadMoreButton': leaf,
    './Rankings': leaf,
    './NotiItem': leaf,
    './SectionHeader': leaf,
    './RewardItem': RewardItem,
    '~/components/MyRank': MyRank,
    '~/components/ErrorBoundary': leaf,
    '~/theme/ScopedTheme': leaf,
    '~/constants/css': { Color: { darkerGray: () => '#333' } },
    '~/theme/card': { themedCardBase: '' },
    '~/theme/hooks/useThemedCardVars': {
      useThemedCardVars: () => ({ cardVars: {}, themeName: 'default' })
    },
    '~/constants/defaultValues': { REWARD_VALUE: 200 },
    '~/helpers/stringHelpers': { addCommasToNumber: String },
    '~/theme/hooks/useRoleColor': {
      useRoleColor: () => ({ colorKey: 'green' })
    },
    '~/helpers/hooks/useEnsureRankingsLoaded': () => ({ loading: false }),
    '~/constants/siteBrand': { SITE_NAME: 'Twinkle' }
  }).default;
  const Notification = compile(
    'src/components/Notification/index.tsx',
    {
      react: parent.hooks,
      '~/contexts': contexts,
      './MainFeeds': MainFeeds,
      './TodayStats': leaf,
      '~/components/ErrorBoundary': leaf,
      '~/components/FilterBar': leaf,
      '~/components/Loading': leaf,
      './Styles': { container: '', notiFilterBar: '' },
      '~/constants/state': {
        scrollPositions: {},
        isRewardCollected: { current: false }
      },
      '~/helpers': {
        isMobile: () => true,
        toValidNextDayTimeStamp: Number,
        buildTodayStatsFromResponse: (value) => value,
        buildTodayStatsForNextDay: () => ({})
      }
    },
    { navigator: {}, setTimeout: () => 1, clearTimeout() {} }
  ).default;

  function render() {
    const panel = parent.render(() => Notification({ location: 'home' }));
    const feed = nodes(panel, (node) => node.type === MainFeeds)[0];
    return { panel, feed, contents: feeds.render(() => MainFeeds(feed.props)) };
  }

  return {
    render,
    setXP(xp) {
      key.myState.twinkleXP = xp;
    },
    setRewards(twinkles, coins = 0) {
      // Another mounted panel/socket has finished loading canonical rewards
      // while this mobile panel's News request is still pending.
      noti.state.notiObj[7] = {
        ...noti.state.notiObj[7],
        totalRewardedTwinkles: twinkles,
        totalRewardedTwinkleCoins: coins,
        rewards: [{ id: 1, timeStamp: 1791450000, rewardAmount: 2 }]
      };
    },
    rewardsTab(panel) {
      return nodes(panel, (node) => node.type === 'nav' && node.props.children === 'Rewards')[0];
    },
    collectButtons: (contents) => nodes(contents, (node) => node.type === CollectButton),
    rewardItems: (contents) => nodes(contents, (node) => node.type === RewardItem),
    ranks: (contents) => nodes(contents, (node) => node.type === MyRank),
    dispose() {
      parent.dispose();
      feeds.dispose();
    }
  };
}

for (const [label, twinkles, coins] of [['Twinkles', 5, 0], ['Coins', 0, 300]]) {
  test(`a glowing Rewards tab exposes collectible ${label} while News is still loading`, () => {
    const f = fixture();
    try {
      f.render();
      f.setRewards(twinkles, coins);
      const { panel, feed, contents } = f.render();
      assert.equal(feed.props.loadingNotifications, true);
      assert.equal(feed.props.activeTab, 'reward');
      assert.match(f.rewardsTab(panel).props.className, /super-alert/);
      assert.equal(f.rewardItems(contents).length, 1);
      assert.equal(f.ranks(contents).length, 1);
      assert.equal(f.collectButtons(contents).length, 1);
    } finally {
      f.dispose();
    }
  });
}

test('pending rewards remain visible but wait for a canonical XP balance', () => {
  const f = fixture();
  try {
    f.render();
    f.setRewards(5);
    f.setXP(undefined);
    const loading = f.render();
    assert.match(f.rewardsTab(loading.panel).props.className, /super-alert/);
    assert.equal(f.collectButtons(loading.contents).length, 1);
    assert.equal(f.collectButtons(loading.contents)[0].props.loading, true);
    f.setXP(7269788);
    assert.equal(f.collectButtons(f.render().contents)[0].props.loading, false);
  } finally {
    f.dispose();
  }
});

test('switching News and Rewards repeatedly does not hide uncollected rewards', () => {
  const f = fixture();
  try {
    f.render();
    f.setRewards(5);
    for (let i = 0; i < 3; i++) {
      const newsTab = nodes(f.render().panel, (node) => node.type === 'nav' && node.props.children === 'News')[0];
      newsTab.props.onClick();
      const news = f.render();
      assert.equal(f.collectButtons(news.contents).length, 0);
      f.rewardsTab(news.panel).props.onClick();
      const rewards = f.render();
      assert.equal(rewards.feed.props.loadingNotifications, true);
      assert.equal(f.collectButtons(rewards.contents).length, 1);
    }
  } finally {
    f.dispose();
  }
});

test('reward history with no uncollected rewards neither glows nor offers collection', () => {
  const f = fixture();
  try {
    f.render();
    f.setRewards(0);
    const first = f.render();
    f.rewardsTab(first.panel).props.onClick();
    const { panel, contents } = f.render();
    assert.doesNotMatch(f.rewardsTab(panel).props.className, /super-alert/);
    assert.equal(f.collectButtons(contents).length, 0);
    assert.equal(f.rewardItems(contents).length, 1);
  } finally {
    f.dispose();
  }
});
