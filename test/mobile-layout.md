# Popup, stat chart and notification regression checks

```sh
node --import tsx --test --test-concurrency=1 test/buildAppNotificationSummary.test.ts test/mobileLayout.browser.test.js
```

The browser test follows the repository's existing esbuild/Playwright fixture
pattern. It runs Chromium and WebKit serially at 320, 360, 390, 768 and 1280px,
checks text fragments against their own controls, and exercises the real actions
with synthetic account services. It makes no production writes and closes its
browsers. Set `PLAYWRIGHT_MODULE` to an installed Playwright module outside Mikey's
Mac. `MOBILE_LAYOUT_ARTIFACTS` optionally saves screenshots and findings to a
persistent workspace folder.

Do not use a blanket repeated-words rule: member
quotes and app names can legitimately repeat words. The exact-title helper only
suppresses redundant context in the unquoted summary lead; it does not classify
the meaning of arbitrary prose.

These are focused regression checks, not a site-wide overflow gate. Intentional
scrolling containers and clipping need component-specific expectations.
