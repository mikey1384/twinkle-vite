export const TWINKLE_SDK_SCRIPT = String.raw`
<script>
var Twinkle;
(function() {
  'use strict';
  if (window.Twinkle) {
    Twinkle = window.Twinkle;
    return;
  }

  let SQL = null;
  let db = null;
  let isInitialized = false;
  let pendingRequests = new Map();
  let requestId = 0;
  let viewerInfo = null;
  let capabilitySnapshot = null;
  let runtimeExplorationPlan = null;
  var blankRenderProbeState = {
    scheduled: false,
    resolved: false,
    reported: false
  };
  var previewInteractionProbeState = {
    scheduled: false,
    completed: false,
    status: 'idle',
    targetLabel: '',
    steps: [],
    usedTargetLabels: Object.create(null),
    planStepIndex: 0
  };
  var previewHealthLastKey = '';
  var previewHealthMutationTimer = null;
  var previewHealthObserver = null;
  var keyboardScrollProbeState = {
    reported: false
  };
  var viewportModeState = {
    mode: 'document',
    styleInjected: false
  };
  var viewportFitState = {
    scheduled: false,
    candidate: null,
    scale: 1,
    baseWidth: 0,
    baseHeight: 0
  };
  var previewLayoutState = {
    reservedInsets: {
      top: 0,
      right: 0,
      bottom: 0,
      left: 0
    },
    listeners: [],
    current: null,
    lastKey: ''
  };
  var gameplayTelemetryState = {
    playfieldBounds: null,
    playerBounds: null,
    scheduled: false
  };

  function createMemoryStorage() {
    var values = Object.create(null);
    var storage = {
      getItem: function(key) {
        var normalizedKey = String(key);
        return Object.prototype.hasOwnProperty.call(values, normalizedKey)
          ? values[normalizedKey]
          : null;
      },
      setItem: function(key, value) {
        values[String(key)] = String(value);
      },
      removeItem: function(key) {
        delete values[String(key)];
      },
      clear: function() {
        values = Object.create(null);
      },
      key: function(index) {
        var keys = Object.keys(values);
        var normalizedIndex = Number(index);
        if (!Number.isFinite(normalizedIndex)) return null;
        var safeIndex = Math.max(0, Math.floor(normalizedIndex));
        return safeIndex < keys.length ? keys[safeIndex] : null;
      }
    };

    try {
      Object.defineProperty(storage, 'length', {
        configurable: true,
        enumerable: false,
        get: function() {
          return Object.keys(values).length;
        }
      });
    } catch (_) {}

    return storage;
  }

  function installStorageFallback(storageName) {
    var fallbackStorage = createMemoryStorage();

    var installed = false;
    try {
      Object.defineProperty(window, storageName, {
        configurable: true,
        enumerable: true,
        get: function() {
          return fallbackStorage;
        }
      });
      installed = true;
    } catch (_) {}

    if (!installed) {
      try {
        var windowProto = Object.getPrototypeOf(window);
        if (windowProto) {
          Object.defineProperty(windowProto, storageName, {
            configurable: true,
            enumerable: true,
            get: function() {
              return fallbackStorage;
            }
          });
          installed = true;
        }
      } catch (_) {}
    }

    if (!installed) {
      try {
        window[storageName] = fallbackStorage;
      } catch (_) {}
    }
  }

  function ensurePreviewStorageAccess(storageName) {
    try {
      var existingStorage = window[storageName];
      if (
        existingStorage &&
        typeof existingStorage.getItem === 'function' &&
        typeof existingStorage.setItem === 'function'
      ) {
        void existingStorage.length;
        return existingStorage;
      }
    } catch (_) {}
    installStorageFallback(storageName);
    try {
      return window[storageName];
    } catch (_) {
      return null;
    }
  }

  ensurePreviewStorageAccess('localStorage');
  ensurePreviewStorageAccess('sessionStorage');

  function getRequestId() {
    return 'twinkle_' + (++requestId) + '_' + Date.now();
  }

  function resolveRequestTimeoutMs(type, options) {
    const requestedTimeout = Number(options && options.timeoutMs);
    if (Number.isFinite(requestedTimeout) && requestedTimeout > 0) {
      return requestedTimeout;
    }
    return 30000;
  }

  function sendRequest(type, payload, options) {
    return new Promise((resolve, reject) => {
      const id = getRequestId();
      const timeoutMs = resolveRequestTimeoutMs(type, options);
      const timeout = setTimeout(() => {
        pendingRequests.delete(id);
        reject(new Error('Request timed out'));
      }, timeoutMs);

      pendingRequests.set(id, { resolve, reject, timeout });

      window.parent.postMessage({
        source: 'twinkle-build',
        id: id,
        type: type,
        payload: payload
      }, '*');
    });
  }

  function applyViewerInfo(info) {
    viewerInfo = info || null;
    if (!window.Twinkle || !window.Twinkle.viewer) return;
    const viewer = window.Twinkle.viewer;
    if (!info) {
      viewer.id = null;
      viewer.username = null;
      viewer.profilePicUrl = null;
      viewer.isLoggedIn = false;
      viewer.isOwner = false;
      viewer.isGuest = false;
      return;
    }
    viewer.id = info.id || null;
    viewer.username = info.username || null;
    viewer.profilePicUrl = info.profilePicUrl || null;
    viewer.isLoggedIn = Boolean(info.isLoggedIn);
    viewer.isOwner = Boolean(info.isOwner);
    viewer.isGuest = Boolean(info.isGuest);
  }

  function applyCapabilitySnapshot(snapshot) {
    capabilitySnapshot = snapshot || null;
    if (!window.Twinkle || !window.Twinkle.capabilities) return;
    window.Twinkle.capabilities.current = capabilitySnapshot;
  }

  function normalizeExplorationPlanStep(rawStep) {
    if (!rawStep || typeof rawStep !== 'object') return null;
    function normalizeExpectedSignals(rawExpectedSignals) {
      if (!rawExpectedSignals || typeof rawExpectedSignals !== 'object') {
        return null;
      }
      var routeChange =
        typeof rawExpectedSignals.routeChange === 'boolean'
          ? rawExpectedSignals.routeChange
          : null;
      var textIncludes = Array.isArray(rawExpectedSignals.textIncludes)
        ? rawExpectedSignals.textIncludes
            .map(function(text) {
              return trimObservationText(text, 80);
            })
            .filter(Boolean)
            .slice(0, 4)
        : [];
      var revealsLabels = Array.isArray(rawExpectedSignals.revealsLabels)
        ? rawExpectedSignals.revealsLabels
            .map(function(label) {
              return trimObservationText(label, 80);
            })
            .filter(Boolean)
            .slice(0, 4)
        : [];
      if (
        routeChange === null &&
        textIncludes.length === 0 &&
        revealsLabels.length === 0
      ) {
        return null;
      }
      return {
        routeChange: routeChange,
        textIncludes: textIncludes,
        revealsLabels: revealsLabels
      };
    }
    var kind =
      rawStep.kind === 'submit-form'
        ? 'submit-form'
        : rawStep.kind === 'click'
          ? 'click'
          : null;
    if (!kind) return null;
    var goal = trimObservationText(rawStep.goal, 220);
    var labelHints = Array.isArray(rawStep.labelHints)
      ? rawStep.labelHints
          .map(function(label) {
            return trimObservationText(label, 80);
          })
          .filter(Boolean)
          .slice(0, 4)
      : [];
    var inputHints = Array.isArray(rawStep.inputHints)
      ? rawStep.inputHints
          .map(function(hint) {
            return trimObservationText(hint, 80);
          })
          .filter(Boolean)
          .slice(0, 4)
      : [];
    var expectedSignals = normalizeExpectedSignals(rawStep.expectedSignals);
    if (!goal || labelHints.length === 0) return null;
    return {
      kind: kind,
      goal: goal,
      labelHints: labelHints,
      inputHints: inputHints,
      expectedSignals: expectedSignals
    };
  }

  function applyRuntimeExplorationPlan(plan) {
    var shouldRestartProbe =
      previewInteractionProbeState.scheduled ||
      previewInteractionProbeState.completed ||
      previewInteractionProbeState.steps.length > 0;
    var normalizedPlan =
      plan && typeof plan === 'object'
        ? {
            summary: trimObservationText(plan.summary, 240),
            generatedFrom:
              plan.generatedFrom === 'planner' ? 'planner' : 'heuristic',
            steps: Array.isArray(plan.steps)
              ? plan.steps
                  .map(normalizeExplorationPlanStep)
                  .filter(Boolean)
                  .slice(0, 3)
              : []
          }
        : null;
    runtimeExplorationPlan =
      normalizedPlan &&
      normalizedPlan.summary &&
      normalizedPlan.steps &&
      normalizedPlan.steps.length > 0
        ? normalizedPlan
        : null;
    syncViewportAppMode('');
    previewInteractionProbeState.planStepIndex = 0;
    if (shouldRestartProbe && runtimeExplorationPlan) {
      restartPreviewInteractionProbe();
    }
  }

  var runtimeObservationKeys = Object.create(null);
  var runtimeObservationCount = 0;

  function trimObservationText(value, maxLength) {
    var text = String(value || '').trim();
    if (!text) return '';
    return text.length > maxLength ? text.slice(0, maxLength) : text;
  }

  function sanitizeObservationStack(value) {
    var text = String(value || '').replace(/\r/g, '');
    if (!text) return '';
    text = text.replace(
      /data:text\/javascript[^)\s]*/gi,
      '[inline-preview-module]'
    );
    text = text.replace(/blob:[^)\s]{80,}/gi, '[blob-url]');
    return text
      .split('\n')
      .map(function(line) {
        var normalized = String(line || '').replace(/\s+/g, ' ').trim();
        if (!normalized) return '';
        return normalized.length > 180
          ? normalized.slice(0, 180) + '...'
          : normalized;
      })
      .filter(Boolean)
      .slice(0, 6)
      .join('\n');
  }

  function normalizeGameplayRect(rawValue) {
    if (rawValue == null) return null;
    if (!rawValue || typeof rawValue !== 'object') return null;
    var x = Number(rawValue.x);
    var y = Number(rawValue.y);
    var width = Number(rawValue.width);
    var height = Number(rawValue.height);
    if (
      !Number.isFinite(x) ||
      !Number.isFinite(y) ||
      !Number.isFinite(width) ||
      !Number.isFinite(height) ||
      width <= 0 ||
      height <= 0
    ) {
      return null;
    }
    return {
      x: Math.round(x),
      y: Math.round(y),
      width: Math.round(width),
      height: Math.round(height)
    };
  }

  function buildGameplayTelemetrySnapshot() {
    var playfieldBounds = gameplayTelemetryState.playfieldBounds;
    var playerBounds = gameplayTelemetryState.playerBounds;
    if (!playfieldBounds && !playerBounds) return null;
    if (!playfieldBounds || !playerBounds) {
      return {
        playfieldBounds: playfieldBounds,
        playerBounds: playerBounds,
        overflowTop: 0,
        overflowRight: 0,
        overflowBottom: 0,
        overflowLeft: 0,
        status: 'incomplete',
        reportedAt: Date.now()
      };
    }
    var overflowTop = Math.max(0, playfieldBounds.y - playerBounds.y);
    var overflowLeft = Math.max(0, playfieldBounds.x - playerBounds.x);
    var overflowRight = Math.max(
      0,
      playerBounds.x +
        playerBounds.width -
        (playfieldBounds.x + playfieldBounds.width)
    );
    var overflowBottom = Math.max(
      0,
      playerBounds.y +
        playerBounds.height -
        (playfieldBounds.y + playfieldBounds.height)
    );
    return {
      playfieldBounds: playfieldBounds,
      playerBounds: playerBounds,
      overflowTop: Math.ceil(overflowTop),
      overflowRight: Math.ceil(overflowRight),
      overflowBottom: Math.ceil(overflowBottom),
      overflowLeft: Math.ceil(overflowLeft),
      status:
        overflowTop > 0 ||
        overflowRight > 0 ||
        overflowBottom > 0 ||
        overflowLeft > 0
          ? 'out-of-bounds'
          : 'ok',
      reportedAt: Date.now()
    };
  }

  function buildGameplayMismatchMessage(telemetry) {
    if (!telemetry) {
      return 'The reported player bounds moved outside the reported playfield bounds.';
    }
    if (telemetry.overflowBottom > 0) {
      return 'The reported player bounds extend below the reported playfield floor. Clamp gameplay to the declared playfield instead of the raw canvas edge.';
    }
    if (telemetry.overflowTop > 0) {
      return 'The reported player bounds extend above the reported playfield ceiling. Clamp gameplay to the declared playfield.';
    }
    if (telemetry.overflowLeft > 0 || telemetry.overflowRight > 0) {
      return 'The reported player bounds extend outside the reported playfield walls. Clamp gameplay to the declared playfield.';
    }
    return 'The reported player bounds moved outside the reported playfield bounds.';
  }

  function evaluateGameplayTelemetry() {
    var telemetry = buildGameplayTelemetrySnapshot();
    if (telemetry && telemetry.status === 'out-of-bounds') {
      reportRuntimeObservation('playfieldmismatch', {
        message: buildGameplayMismatchMessage(telemetry)
      });
    }
    reportPreviewHealthSnapshot(false);
    return telemetry;
  }

  function scheduleGameplayTelemetryEvaluation() {
    if (gameplayTelemetryState.scheduled) return;
    gameplayTelemetryState.scheduled = true;
    requestAnimationFrame(function() {
      gameplayTelemetryState.scheduled = false;
      evaluateGameplayTelemetry();
    });
  }

  function normalizePreviewInsetValue(value) {
    var numeric = Number(value);
    if (!Number.isFinite(numeric) || numeric <= 0) return 0;
    return Math.floor(numeric);
  }

  function clonePreviewInsets(insets) {
    var source = insets && typeof insets === 'object' ? insets : {};
    return {
      top: normalizePreviewInsetValue(source.top),
      right: normalizePreviewInsetValue(source.right),
      bottom: normalizePreviewInsetValue(source.bottom),
      left: normalizePreviewInsetValue(source.left)
    };
  }

  function previewInsetsEqual(a, b) {
    return (
      !!a &&
      !!b &&
      a.top === b.top &&
      a.right === b.right &&
      a.bottom === b.bottom &&
      a.left === b.left
    );
  }

  function getPreviewViewportSize() {
    return {
      width: Math.max(
        window.innerWidth || 0,
        document.documentElement ? document.documentElement.clientWidth || 0 : 0
      ),
      height: Math.max(
        window.innerHeight || 0,
        document.documentElement ? document.documentElement.clientHeight || 0 : 0
      )
    };
  }

  function buildPreviewLayoutSnapshot() {
    var viewport = getPreviewViewportSize();
    var stageWidth = viewport.width;
    var stageHeight = viewport.height;
    var safeInsets = clonePreviewInsets(previewLayoutState.reservedInsets);
    var maxVerticalInset = Math.max(0, stageHeight - 1);
    var maxHorizontalInset = Math.max(0, stageWidth - 1);
    if (safeInsets.top + safeInsets.bottom > maxVerticalInset) {
      var excessVertical =
        safeInsets.top + safeInsets.bottom - maxVerticalInset;
      if (safeInsets.bottom >= excessVertical) {
        safeInsets.bottom -= excessVertical;
      } else {
        safeInsets.top = Math.max(0, safeInsets.top - (excessVertical - safeInsets.bottom));
        safeInsets.bottom = 0;
      }
    }
    if (safeInsets.left + safeInsets.right > maxHorizontalInset) {
      var excessHorizontal =
        safeInsets.left + safeInsets.right - maxHorizontalInset;
      if (safeInsets.right >= excessHorizontal) {
        safeInsets.right -= excessHorizontal;
      } else {
        safeInsets.left = Math.max(
          0,
          safeInsets.left - (excessHorizontal - safeInsets.right)
        );
        safeInsets.right = 0;
      }
    }
    var playfieldWidth = Math.max(
      1,
      stageWidth - safeInsets.left - safeInsets.right
    );
    var playfieldHeight = Math.max(
      1,
      stageHeight - safeInsets.top - safeInsets.bottom
    );
    return {
      mode: viewportModeState.mode,
      viewport: viewport,
      stage: {
        width: stageWidth,
        height: stageHeight,
        scale:
          viewportModeState.mode === 'viewport-app' &&
          viewportFitState.scale > 0
            ? Number(viewportFitState.scale.toFixed(4))
            : 1
      },
      safeInsets: safeInsets,
      playfield: {
        x: safeInsets.left,
        y: safeInsets.top,
        width: playfieldWidth,
        height: playfieldHeight
      }
    };
  }

  function applyPreviewLayoutCssVariables(layout) {
    var documentElement = document.documentElement;
    if (!documentElement || !layout) return;
    documentElement.style.setProperty(
      '--twinkle-preview-viewport-width',
      String(layout.viewport.width) + 'px'
    );
    documentElement.style.setProperty(
      '--twinkle-preview-viewport-height',
      String(layout.viewport.height) + 'px'
    );
    documentElement.style.setProperty(
      '--twinkle-preview-stage-width',
      String(layout.stage.width) + 'px'
    );
    documentElement.style.setProperty(
      '--twinkle-preview-stage-height',
      String(layout.stage.height) + 'px'
    );
    documentElement.style.setProperty(
      '--twinkle-preview-stage-scale',
      String(layout.stage.scale)
    );
    documentElement.style.setProperty(
      '--twinkle-preview-safe-top',
      String(layout.safeInsets.top) + 'px'
    );
    documentElement.style.setProperty(
      '--twinkle-preview-safe-right',
      String(layout.safeInsets.right) + 'px'
    );
    documentElement.style.setProperty(
      '--twinkle-preview-safe-bottom',
      String(layout.safeInsets.bottom) + 'px'
    );
    documentElement.style.setProperty(
      '--twinkle-preview-safe-left',
      String(layout.safeInsets.left) + 'px'
    );
    documentElement.style.setProperty(
      '--twinkle-preview-playfield-x',
      String(layout.playfield.x) + 'px'
    );
    documentElement.style.setProperty(
      '--twinkle-preview-playfield-y',
      String(layout.playfield.y) + 'px'
    );
    documentElement.style.setProperty(
      '--twinkle-preview-playfield-width',
      String(layout.playfield.width) + 'px'
    );
    documentElement.style.setProperty(
      '--twinkle-preview-playfield-height',
      String(layout.playfield.height) + 'px'
    );
  }

  function publishPreviewLayout(force) {
    var layout = readPreviewLayout();
    var key = buildPreviewLayoutKey(layout);
    if (!force && key === previewLayoutState.lastKey) {
      return layout;
    }
    previewLayoutState.lastKey = key;
    var listeners = previewLayoutState.listeners.slice();
    for (var i = 0; i < listeners.length; i += 1) {
      try {
        listeners[i](layout);
      } catch (_) {}
    }
    try {
      window.dispatchEvent(
        new CustomEvent('twinkle:preview-layout', {
          detail: layout
        })
      );
    } catch (_) {}
    return layout;
  }

  function buildPreviewLayoutKey(layout) {
    return [
      layout.mode,
      layout.viewport.width,
      layout.viewport.height,
      layout.stage.width,
      layout.stage.height,
      layout.stage.scale,
      layout.safeInsets.top,
      layout.safeInsets.right,
      layout.safeInsets.bottom,
      layout.safeInsets.left,
      layout.playfield.x,
      layout.playfield.y,
      layout.playfield.width,
      layout.playfield.height
    ].join('|');
  }

  function readPreviewLayout() {
    var layout = buildPreviewLayoutSnapshot();
    previewLayoutState.current = layout;
    applyPreviewLayoutCssVariables(layout);
    if (window.Twinkle && window.Twinkle.preview) {
      window.Twinkle.preview.current = layout;
    }
    return layout;
  }

  function ensureViewportModeStyle() {
    if (viewportModeState.styleInjected) return;
    viewportModeState.styleInjected = true;
    var styleNode = document.createElement('style');
    styleNode.setAttribute('data-twinkle-preview-viewport-style', '1');
    styleNode.textContent =
      'html[data-twinkle-preview-mode="viewport-app"]{' +
      'height:100% !important;' +
      'min-height:100% !important;' +
      'max-height:100% !important;' +
      'width:100% !important;' +
      'overflow:hidden !important;' +
      'overscroll-behavior:none !important;' +
      '}' +
      'html[data-twinkle-preview-mode="viewport-app"] body{' +
      'margin:0 !important;' +
      'height:100% !important;' +
      'min-height:100% !important;' +
      'max-height:100% !important;' +
      'width:100% !important;' +
      'max-width:100% !important;' +
      'overflow:hidden !important;' +
      'overscroll-behavior:none !important;' +
      'display:flex !important;' +
      'align-items:center !important;' +
      'justify-content:center !important;' +
      '}' +
      'html[data-twinkle-preview-mode="viewport-app"] body > *{' +
      'max-width:100% !important;' +
      'max-height:100% !important;' +
      'box-sizing:border-box !important;' +
      '}' +
      'html[data-twinkle-preview-mode="viewport-app"] body > #root,' +
      'html[data-twinkle-preview-mode="viewport-app"] body > [id="app"],' +
      'html[data-twinkle-preview-mode="viewport-app"] body > main,' +
      'html[data-twinkle-preview-mode="viewport-app"] body > section,' +
      'html[data-twinkle-preview-mode="viewport-app"] body > article{' +
      'width:100% !important;' +
      'max-height:100% !important;' +
      'display:flex !important;' +
      'align-items:center !important;' +
      'justify-content:center !important;' +
      'overflow:hidden !important;' +
      '}' +
      'html[data-twinkle-preview-mode="viewport-app"] body > #root > *,' +
      'html[data-twinkle-preview-mode="viewport-app"] body > [id="app"] > *,' +
      'html[data-twinkle-preview-mode="viewport-app"] body > main > *,' +
      'html[data-twinkle-preview-mode="viewport-app"] body > section > *,' +
      'html[data-twinkle-preview-mode="viewport-app"] body > article > *{' +
      'max-width:100% !important;' +
      'max-height:100% !important;' +
      '}' +
      'html[data-twinkle-preview-mode="viewport-app"] canvas,' +
      'html[data-twinkle-preview-mode="viewport-app"] svg,' +
      'html[data-twinkle-preview-mode="viewport-app"] video,' +
      'html[data-twinkle-preview-mode="viewport-app"] img{' +
      'max-width:100% !important;' +
      'max-height:100% !important;' +
      '}' +
      'html[data-twinkle-preview-mode="viewport-app"] [data-twinkle-preview-fit="1"]{' +
      'transform-origin:center center !important;' +
      '}';
    (document.head || document.documentElement).appendChild(styleNode);
  }

  function getRuntimePlanText() {
    var planText = '';
    if (!runtimeExplorationPlan) return planText;
    planText += ' ' + String(runtimeExplorationPlan.summary || '');
    if (Array.isArray(runtimeExplorationPlan.steps)) {
      for (var i = 0; i < runtimeExplorationPlan.steps.length; i += 1) {
        var step = runtimeExplorationPlan.steps[i];
        if (!step) continue;
        planText += ' ' + String(step.goal || '');
        if (Array.isArray(step.labelHints)) {
          planText += ' ' + step.labelHints.join(' ');
        }
      }
    }
    return planText;
  }

  function shouldUseViewportAppMode(visibleText) {
    var body = document.body;
    if (body && body.querySelector('canvas')) {
      return true;
    }
    var haystack = (
      String(visibleText || '') +
      ' ' +
      String(document.title || '') +
      ' ' +
      getRuntimePlanText()
    ).toLowerCase();
    return /\\b(game|play|player|score|level|enemy|boss|jump|dodge|flappy|restart|game over|lives?)\\b/.test(
      haystack
    );
  }

  function applyViewportAppMode(enabled) {
    ensureViewportModeStyle();
    var documentElement = document.documentElement;
    if (!documentElement) return;
    var nextMode = enabled ? 'viewport-app' : 'document';
    if (viewportModeState.mode === nextMode) return;
    viewportModeState.mode = nextMode;
    if (enabled) {
      documentElement.setAttribute('data-twinkle-preview-mode', 'viewport-app');
    } else {
      documentElement.removeAttribute('data-twinkle-preview-mode');
    }
    scheduleViewportAppFit();
  }

  function syncViewportAppMode(visibleText) {
    applyViewportAppMode(shouldUseViewportAppMode(visibleText));
  }

  function clearViewportFitCandidate(candidate) {
    if (!candidate || !candidate.style) return;
    candidate.removeAttribute('data-twinkle-preview-fit');
    candidate.style.transform = '';
    candidate.style.transformOrigin = '';
  }

  function getViewportAppFitCandidate() {
    var body = document.body;
    if (!body) return null;
    var canvases = body.querySelectorAll('canvas');
    for (var i = 0; i < canvases.length; i += 1) {
      var canvas = canvases[i];
      if (!isVisibleUiElement(canvas)) continue;
      var parent = canvas.parentElement;
      if (
        parent &&
        parent !== body &&
        parent !== document.documentElement &&
        parent.id !== 'root' &&
        parent.getAttribute('id') !== 'app'
      ) {
        return parent;
      }
      return canvas;
    }
    var fallbackSelectors = [
      'body > #root > *',
      'body > [id="app"] > *',
      'body > main > *',
      'body > section > *',
      'body > article > *'
    ];
    for (var j = 0; j < fallbackSelectors.length; j += 1) {
      var candidate = body.querySelector(fallbackSelectors[j]);
      if (candidate && isVisibleUiElement(candidate)) {
        return candidate;
      }
    }
    return null;
  }

  function fitViewportAppCandidate() {
    if (viewportModeState.mode !== 'viewport-app') {
      if (viewportFitState.candidate) {
        clearViewportFitCandidate(viewportFitState.candidate);
        viewportFitState.candidate = null;
        viewportFitState.scale = 1;
        viewportFitState.baseWidth = 0;
        viewportFitState.baseHeight = 0;
      }
      publishPreviewLayout(false);
      return;
    }
    var candidate = getViewportAppFitCandidate();
    if (viewportFitState.candidate && viewportFitState.candidate !== candidate) {
      clearViewportFitCandidate(viewportFitState.candidate);
      viewportFitState.candidate = null;
      viewportFitState.scale = 1;
      viewportFitState.baseWidth = 0;
      viewportFitState.baseHeight = 0;
    }
    if (!candidate) {
      publishPreviewLayout(false);
      return;
    }
    var rect = candidate.getBoundingClientRect();
    var baseWidth = Math.max(
      candidate.offsetWidth || 0,
      candidate.clientWidth || 0,
      candidate.scrollWidth || 0,
      rect && rect.width ? Math.round(rect.width) : 0
    );
    var baseHeight = Math.max(
      candidate.offsetHeight || 0,
      candidate.clientHeight || 0,
      candidate.scrollHeight || 0,
      rect && rect.height ? Math.round(rect.height) : 0
    );
    var viewportWidth = Math.max(window.innerWidth || 0, document.documentElement ? document.documentElement.clientWidth || 0 : 0);
    var viewportHeight = Math.max(window.innerHeight || 0, document.documentElement ? document.documentElement.clientHeight || 0 : 0);
    if (baseWidth <= 0 || baseHeight <= 0 || viewportWidth <= 0 || viewportHeight <= 0) {
      return;
    }
    var padding = 12;
    var scale = Math.min(
      1,
      Math.max(0.1, (viewportWidth - padding * 2) / baseWidth),
      Math.max(0.1, (viewportHeight - padding * 2) / baseHeight)
    );
    viewportFitState.candidate = candidate;
    viewportFitState.scale = scale;
    viewportFitState.baseWidth = baseWidth;
    viewportFitState.baseHeight = baseHeight;
    if (scale >= 0.995) {
      clearViewportFitCandidate(candidate);
      viewportFitState.candidate = null;
      viewportFitState.scale = 1;
      viewportFitState.baseWidth = 0;
      viewportFitState.baseHeight = 0;
      publishPreviewLayout(false);
      return;
    }
    candidate.setAttribute('data-twinkle-preview-fit', '1');
    candidate.style.transformOrigin = 'center center';
    candidate.style.transform = 'scale(' + scale.toFixed(4) + ')';
    publishPreviewLayout(false);
  }

  function scheduleViewportAppFit() {
    if (viewportFitState.scheduled) return;
    viewportFitState.scheduled = true;
    requestAnimationFrame(function() {
      viewportFitState.scheduled = false;
      fitViewportAppCandidate();
    });
  }

  function rememberRuntimeObservationKey(key) {
    if (!key) return false;
    if (runtimeObservationKeys[key]) return true;
    runtimeObservationKeys[key] = true;
    runtimeObservationCount += 1;
    if (runtimeObservationCount > 40) {
      runtimeObservationKeys = Object.create(null);
      runtimeObservationCount = 0;
    }
    return false;
  }

  function reportRuntimeObservation(kind, details) {
    try {
      var message = trimObservationText(details && details.message, 400);
      if (!message) return;
      var filename = trimObservationText(details && details.filename, 240);
      var stack = trimObservationText(
        sanitizeObservationStack(details && details.stack),
        1200
      );
      var lineNumber = Number(details && details.lineNumber);
      var columnNumber = Number(details && details.columnNumber);
      var key = [
        kind || 'error',
        message,
        filename,
        Number.isFinite(lineNumber) ? lineNumber : '',
        Number.isFinite(columnNumber) ? columnNumber : ''
      ].join('|');
      if (rememberRuntimeObservationKey(key)) return;
      window.parent.postMessage({
        source: 'twinkle-build',
        type: 'runtime-observation',
        payload: {
          kind:
            kind === 'unhandledrejection'
              ? 'unhandledrejection'
              : kind === 'blankrender'
                ? 'blankrender'
                : kind === 'sdkblocked'
                  ? 'sdkblocked'
                  : kind === 'keyboardscroll'
                    ? 'keyboardscroll'
                    : kind === 'playfieldmismatch'
                      ? 'playfieldmismatch'
                  : kind === 'interactionnoop'
                    ? 'interactionnoop'
                  : 'error',
          message: message,
          stack: stack || null,
          filename: filename || null,
          lineNumber:
            Number.isFinite(lineNumber) && lineNumber > 0 ? lineNumber : null,
          columnNumber:
            Number.isFinite(columnNumber) && columnNumber > 0 ? columnNumber : null,
          createdAt: Date.now()
        }
      }, '*');
    } catch (_) {}
  }

  function collectSafeInteractionTargetLabels(limit, excludeUsed) {
    var labels = [];
    var seen = Object.create(null);
    var candidates = document.querySelectorAll(
      'button,[role="button"],input[type="button"],a[href]'
    );
    for (var i = 0; i < candidates.length; i += 1) {
      var candidate = candidates[i];
      if (!isSafeInteractionTarget(candidate)) continue;
      var label = getPreviewInteractionTargetLabel(candidate);
      var normalizedLabel = String(label || '').trim().toLowerCase();
      if (!normalizedLabel || seen[normalizedLabel]) continue;
      if (
        excludeUsed &&
        previewInteractionProbeState.usedTargetLabels[normalizedLabel]
      ) {
        continue;
      }
      seen[normalizedLabel] = true;
      labels.push(label);
      if (labels.length >= (limit || 6)) break;
    }
    return labels;
  }

  function collectPreviewUiState() {
    var body = document.body;
    var documentElement = document.documentElement;
    var text = trimObservationText(
      body && body.innerText ? String(body.innerText).replace(/\s+/g, ' ') : '',
      180
    );
    syncViewportAppMode(text);
    fitViewportAppCandidate();
    var headingCount = body
      ? body.querySelectorAll('h1,h2,h3,[role="heading"]').length
      : 0;
    var buttonCount = body
      ? body.querySelectorAll('button,[role="button"],input[type="button"],input[type="submit"],a[href]').length
      : 0;
    var formCount = body ? body.querySelectorAll('form').length : 0;
    var meaningfulRender =
      text.length >= 24 ||
      headingCount > 0 ||
      buttonCount > 0 ||
      formCount > 0 ||
      hasMeaningfulRender();
    var viewportHeight = Math.max(
      window.innerHeight || 0,
      documentElement ? documentElement.clientHeight || 0 : 0
    );
    var viewportWidth = Math.max(
      window.innerWidth || 0,
      documentElement ? documentElement.clientWidth || 0 : 0
    );
    var contentHeight = Math.max(
      body ? body.scrollHeight || 0 : 0,
      body ? body.offsetHeight || 0 : 0,
      documentElement ? documentElement.scrollHeight || 0 : 0,
      documentElement ? documentElement.offsetHeight || 0 : 0
    );
    var contentWidth = Math.max(
      body ? body.scrollWidth || 0 : 0,
      body ? body.offsetWidth || 0 : 0,
      documentElement ? documentElement.scrollWidth || 0 : 0,
      documentElement ? documentElement.offsetWidth || 0 : 0
    );
    var documentOverflowY =
      viewportHeight > 0 ? Math.max(0, contentHeight - viewportHeight) : 0;
    var documentOverflowX =
      viewportWidth > 0 ? Math.max(0, contentWidth - viewportWidth) : 0;
    var maxElementBottom = 0;
    var maxElementRight = 0;
    var measuredElements = 0;
    var overflowCandidates = body
      ? body.querySelectorAll(
          'main,section,article,form,table,canvas,svg,img,video,button,input,textarea,select,a[href],[role="button"],body > *'
        )
      : [];
    for (var i = 0; i < overflowCandidates.length; i += 1) {
      var candidate = overflowCandidates[i];
      if (!isVisibleUiElement(candidate)) continue;
      var candidateRect = candidate.getBoundingClientRect();
      if (!candidateRect) continue;
      maxElementBottom = Math.max(maxElementBottom, candidateRect.bottom || 0);
      maxElementRight = Math.max(maxElementRight, candidateRect.right || 0);
      measuredElements += 1;
      if (measuredElements >= 120) break;
    }
    var elementOverflowY =
      viewportHeight > 0 ? Math.max(0, Math.ceil(maxElementBottom - viewportHeight)) : 0;
    var elementOverflowX =
      viewportWidth > 0 ? Math.max(0, Math.ceil(maxElementRight - viewportWidth)) : 0;
    var gameLike = shouldUseViewportAppMode(text);
    var safeInteractionLabels = collectSafeInteractionTargetLabels(8, false);
    return {
      text: text,
      headingCount: headingCount,
      buttonCount: buttonCount,
      formCount: formCount,
      meaningfulRender: meaningfulRender,
      viewportWidth: viewportWidth,
      viewportHeight: viewportHeight,
      contentHeight: contentHeight,
      contentWidth: contentWidth,
      documentOverflowY: documentOverflowY,
      documentOverflowX: documentOverflowX,
      elementOverflowY: elementOverflowY,
      elementOverflowX: elementOverflowX,
      gameLike: gameLike,
      safeInteractionLabels: safeInteractionLabels
    };
  }

  function buildPreviewHealthKey(state) {
    return JSON.stringify({
      meaningfulRender: state.meaningfulRender,
      text: state.text,
      headingCount: state.headingCount,
      buttonCount: state.buttonCount,
      formCount: state.formCount,
      documentOverflowY: state.documentOverflowY,
      documentOverflowX: state.documentOverflowX,
      elementOverflowY: state.elementOverflowY,
      elementOverflowX: state.elementOverflowX,
      gameLike: state.gameLike,
      safeInteractionLabels: state.safeInteractionLabels
    });
  }

  function reportPreviewHealthSnapshot(force) {
    try {
      var nextState = collectPreviewUiState();
      var nextKey = buildPreviewHealthKey(nextState);
      if (!force && nextKey === previewHealthLastKey) return;
      previewHealthLastKey = nextKey;
      window.parent.postMessage({
        source: 'twinkle-build',
        type: 'preview-health',
        payload: {
          text: nextState.text,
          headingCount: nextState.headingCount,
          buttonCount: nextState.buttonCount,
          formCount: nextState.formCount,
          meaningfulRender: nextState.meaningfulRender,
          viewportWidth: nextState.viewportWidth,
          viewportHeight: nextState.viewportHeight,
          contentHeight: nextState.contentHeight,
          contentWidth: nextState.contentWidth,
          documentOverflowY: nextState.documentOverflowY,
          documentOverflowX: nextState.documentOverflowX,
          elementOverflowY: nextState.elementOverflowY,
          elementOverflowX: nextState.elementOverflowX,
          gameLike: nextState.gameLike,
          safeInteractionLabels: nextState.safeInteractionLabels,
          updatedAt: Date.now()
        }
      }, '*');
    } catch (_) {}
  }

  function schedulePreviewHealthSnapshot() {
    if (previewHealthMutationTimer) return;
    previewHealthMutationTimer = setTimeout(function() {
      previewHealthMutationTimer = null;
      reportPreviewHealthSnapshot(false);
    }, 120);
  }

  function isSafeInteractionTarget(node) {
    if (!node || typeof node.matches !== 'function') return false;
    if (node.matches('input,textarea,select,[contenteditable="true"]')) {
      return false;
    }
    return isVisibleUiElement(node);
  }

  function isVisibleUiElement(node) {
    if (!node || typeof node.getBoundingClientRect !== 'function') {
      return false;
    }
    var style = window.getComputedStyle(node);
    if (
      !style ||
      style.display === 'none' ||
      style.visibility === 'hidden' ||
      Number(style.opacity || '1') <= 0.02
    ) {
      return false;
    }
    var rect = node.getBoundingClientRect();
    if (!rect) return false;
    return rect.width >= 8 && rect.height >= 8;
  }

  function normalizeExplorationHint(value) {
    return String(value || '')
      .trim()
      .toLowerCase()
      .replace(/\\s+/g, ' ');
  }

  function getPreviewInteractionTargetLabel(element) {
    if (!element) return '';
    var label =
      element.getAttribute('aria-label') ||
      element.getAttribute('title') ||
      element.getAttribute('placeholder') ||
      element.innerText ||
      element.textContent ||
      '';
    return trimObservationText(String(label || '').replace(/\\s+/g, ' '), 80);
  }

  function rememberPreviewInteractionTargetLabel(label) {
    var normalizedLabel = String(label || '')
      .trim()
      .toLowerCase();
    if (!normalizedLabel) return;
    previewInteractionProbeState.usedTargetLabels[normalizedLabel] = true;
  }

  function doesLabelMatchHints(label, hints) {
    var normalizedLabel = normalizeExplorationHint(label);
    if (!normalizedLabel) return false;
    for (var i = 0; i < hints.length; i += 1) {
      var normalizedHint = normalizeExplorationHint(hints[i]);
      if (!normalizedHint) continue;
      if (
        normalizedLabel.indexOf(normalizedHint) !== -1 ||
        normalizedHint.indexOf(normalizedLabel) !== -1
      ) {
        return true;
      }
    }
    return false;
  }

  function getSafeInteractionCandidates() {
    var candidates = document.querySelectorAll(
      'button,[role="button"],input[type="button"],input[type="submit"],a[href],input:not([type="hidden"]),textarea,select,[contenteditable="true"]'
    );
    return Array.prototype.filter.call(candidates, isVisibleUiElement);
  }

  function clickPreviewInteractionTarget(target, label) {
    try {
      target.focus();
    } catch (_) {}
    try {
      target.click();
      rememberPreviewInteractionTargetLabel(label);
      previewInteractionProbeState.targetLabel = label;
      return true;
    } catch (_) {
      return false;
    }
  }

  function buildFormPlanTarget() {
    var forms = document.querySelectorAll('form');
    for (var i = 0; i < forms.length; i += 1) {
      var form = forms[i];
      if (!isVisibleUiElement(form)) continue;
      var submit =
        form.querySelector('button[type="submit"],input[type="submit"],button:not([type])') ||
        null;
      if (!submit || !isVisibleUiElement(submit)) continue;
      var formLabel =
        form.getAttribute('aria-label') ||
        form.getAttribute('title') ||
        getPreviewInteractionTargetLabel(submit);
      var inputs = Array.prototype.filter.call(
        form.querySelectorAll('input,textarea,select'),
        function(input) {
          if (!isVisibleUiElement(input)) return false;
          var tagName = String(input.tagName || '').toLowerCase();
          if (tagName === 'input') {
            var type = String(input.getAttribute('type') || 'text').toLowerCase();
            if (
              type === 'submit' ||
              type === 'button' ||
              type === 'reset' ||
              type === 'hidden'
            ) {
              return false;
            }
          }
          return true;
        }
      );
      if (inputs.length === 0) continue;
      var inputLabels = inputs
        .map(function(input) {
          return trimObservationText(
            input.getAttribute('aria-label'),
            80
          ) || trimObservationText(
            input.getAttribute('placeholder'),
            80
          ) || trimObservationText(
            input.getAttribute('name'),
            80
          ) || trimObservationText(
            input.getAttribute('id'),
            80
          );
        })
        .filter(Boolean);
      return {
        form: form,
        submit: submit,
        label: formLabel || getPreviewInteractionTargetLabel(submit),
        inputLabels: inputLabels
      };
    }
    return null;
  }

  function fillPreviewFormInput(input) {
    try {
      var tagName = String(input.tagName || '').toLowerCase();
      if (tagName === 'textarea') {
        input.value = 'Hello from Twinkle';
        input.dispatchEvent(new Event('input', { bubbles: true }));
        input.dispatchEvent(new Event('change', { bubbles: true }));
        return true;
      }
      if (tagName === 'select') {
        if (input.options && input.options.length > 1) {
          input.selectedIndex = 1;
          input.dispatchEvent(new Event('change', { bubbles: true }));
          return true;
        }
        return false;
      }
      var type = String(input.getAttribute('type') || 'text').toLowerCase();
      if (type === 'checkbox' || type === 'radio') {
        input.checked = true;
        input.dispatchEvent(new Event('change', { bubbles: true }));
        return true;
      }
      if (
        /email/.test(type) ||
        /email/.test(
          String(
            input.getAttribute('name') ||
              input.getAttribute('placeholder') ||
              ''
          ).toLowerCase()
        )
      ) {
        input.value = 'hello@twinkle.app';
      } else if (
        /name|title|label|task|item|goal|prompt|message|note|text|description/.test(
          String(
            input.getAttribute('name') ||
              input.getAttribute('placeholder') ||
              ''
          ).toLowerCase()
        )
      ) {
        input.value = 'Hello from Twinkle';
      } else if (type === 'number') {
        input.value = '1';
      } else {
        input.value = 'Hello from Twinkle';
      }
      input.dispatchEvent(new Event('input', { bubbles: true }));
      input.dispatchEvent(new Event('change', { bubbles: true }));
      return true;
    } catch (_) {
      return false;
    }
  }

  function buildPlannedFormTarget(planStep) {
    var forms = document.querySelectorAll('form');
    for (var i = 0; i < forms.length; i += 1) {
      var form = forms[i];
      if (!isVisibleUiElement(form)) continue;
      var submit =
        form.querySelector('button[type="submit"],input[type="submit"],button:not([type])') ||
        null;
      if (!submit || !isVisibleUiElement(submit)) continue;
      var formLabel =
        form.getAttribute('aria-label') ||
        form.getAttribute('title') ||
        getPreviewInteractionTargetLabel(submit);
      var submitLabel = getPreviewInteractionTargetLabel(submit);
      if (
        !doesLabelMatchHints(formLabel, planStep.labelHints) &&
        !doesLabelMatchHints(submitLabel, planStep.labelHints)
      ) {
        continue;
      }
      var inputs = Array.prototype.filter.call(
        form.querySelectorAll('input,textarea,select'),
        function(input) {
          if (!isVisibleUiElement(input)) return false;
          var tagName = String(input.tagName || '').toLowerCase();
          if (tagName === 'input') {
            var type = String(input.getAttribute('type') || 'text').toLowerCase();
            if (
              type === 'submit' ||
              type === 'button' ||
              type === 'reset' ||
              type === 'hidden'
            ) {
              return false;
            }
          }
          return true;
        }
      );
      if (inputs.length === 0) continue;
      return {
        form: form,
        submit: submit,
        label: formLabel || submitLabel,
        inputLabels: planStep.inputHints || []
      };
    }
    return null;
  }

  function runSubmitFormProbe(planStep) {
    var formTarget = planStep ? buildPlannedFormTarget(planStep) : buildFormPlanTarget();
    if (!formTarget) {
      return false;
    }
    var inputs = Array.prototype.filter.call(
      formTarget.form.querySelectorAll('input,textarea,select'),
      function(input) {
        if (!isVisibleUiElement(input)) return false;
        var tagName = String(input.tagName || '').toLowerCase();
        if (tagName === 'input') {
          var type = String(input.getAttribute('type') || 'text').toLowerCase();
          if (
            type === 'submit' ||
            type === 'button' ||
            type === 'reset' ||
            type === 'hidden'
          ) {
            return false;
          }
        }
        return true;
      }
    );
    var filledAny = false;
    for (var i = 0; i < inputs.length; i += 1) {
      filledAny = fillPreviewFormInput(inputs[i]) || filledAny;
    }
    if (!filledAny) return false;
    var targetLabel =
      formTarget.label || getPreviewInteractionTargetLabel(formTarget.submit);
    if (clickPreviewInteractionTarget(formTarget.submit, targetLabel)) {
      previewInteractionProbeState.steps.push({
        kind: 'submit-form',
        label: targetLabel
      });
      return true;
    }
    return false;
  }

  function getNextClickTarget(planStep) {
    var candidates = getSafeInteractionCandidates();
    for (var i = 0; i < candidates.length; i += 1) {
      var candidate = candidates[i];
      var label = getPreviewInteractionTargetLabel(candidate).toLowerCase();
      if (!label) continue;
      if (
        previewInteractionProbeState.usedTargetLabels[label] ||
        /close|dismiss|cancel|delete|remove|sign out|logout/.test(label)
      ) {
        continue;
      }
      if (planStep && !doesLabelMatchHints(label, planStep.labelHints)) {
        continue;
      }
      return candidate;
    }
    return null;
  }

  function runClickProbe(planStep) {
    var target = getNextClickTarget(planStep);
    if (!target) return false;
    var label = getPreviewInteractionTargetLabel(target);
    if (!label) return false;
    if (clickPreviewInteractionTarget(target, label)) {
      previewInteractionProbeState.steps.push({
        kind: 'click',
        label: label
      });
      return true;
    }
    return false;
  }

  function checkExpectedSignals(expectedSignals) {
    if (!expectedSignals) return true;
    var passed = false;
    if (expectedSignals.routeChange) {
      try {
        passed = passed || window.location.href !== window.location.origin + window.location.pathname;
      } catch (_) {}
    }
    var bodyText = String(document.body && document.body.innerText || '').toLowerCase();
    for (var i = 0; i < (expectedSignals.textIncludes || []).length; i += 1) {
      var text = String(expectedSignals.textIncludes[i] || '').toLowerCase();
      if (text && bodyText.indexOf(text) !== -1) {
        passed = true;
        break;
      }
    }
    if (!passed) {
      var labels = collectSafeInteractionTargetLabels(10, false).map(function(label) {
        return String(label || '').toLowerCase();
      });
      for (var j = 0; j < (expectedSignals.revealsLabels || []).length; j += 1) {
        var labelHint = String(expectedSignals.revealsLabels[j] || '').toLowerCase();
        if (!labelHint) continue;
        for (var k = 0; k < labels.length; k += 1) {
          if (labels[k].indexOf(labelHint) !== -1 || labelHint.indexOf(labels[k]) !== -1) {
            passed = true;
            break;
          }
        }
        if (passed) break;
      }
    }
    return passed;
  }

  function probeNextPlannedInteraction() {
    if (!runtimeExplorationPlan || !Array.isArray(runtimeExplorationPlan.steps)) {
      return false;
    }
    if (
      previewInteractionProbeState.planStepIndex < 0 ||
      previewInteractionProbeState.planStepIndex >= runtimeExplorationPlan.steps.length
    ) {
      return false;
    }
    var planStep = runtimeExplorationPlan.steps[previewInteractionProbeState.planStepIndex];
    if (!planStep) return false;
    var didInteract = false;
    if (planStep.kind === 'submit-form') {
      didInteract = runSubmitFormProbe(planStep);
    } else {
      didInteract = runClickProbe(planStep);
    }
    if (!didInteract) {
      return false;
    }
    var nextLabel =
      previewInteractionProbeState.steps[previewInteractionProbeState.steps.length - 1]
        ?.label || '';
    previewInteractionProbeState.targetLabel = nextLabel;
    previewInteractionProbeState.planStepIndex += 1;
    if (planStep.expectedSignals && !checkExpectedSignals(planStep.expectedSignals)) {
      reportRuntimeObservation('interactionnoop', {
        message:
          'Preview interaction did not reveal the expected UI changes after "' +
          trimObservationText(planStep.goal, 120) +
          '".'
      });
    }
    return true;
  }

  function performPreviewInteractionProbe() {
    if (previewInteractionProbeState.completed) return;
    if (runtimeExplorationPlan && probeNextPlannedInteraction()) {
      if (previewInteractionProbeState.planStepIndex >= runtimeExplorationPlan.steps.length) {
        previewInteractionProbeState.completed = true;
      }
      return;
    }
    var didSubmit = runSubmitFormProbe(null);
    if (!didSubmit) {
      runClickProbe(null);
    }
    previewInteractionProbeState.completed = true;
  }

  function schedulePreviewInteractionProbe() {
    if (previewInteractionProbeState.scheduled) return;
    previewInteractionProbeState.scheduled = true;
    setTimeout(function() {
      previewInteractionProbeState.scheduled = false;
      performPreviewInteractionProbe();
    }, 450);
  }

  function restartPreviewInteractionProbe() {
    previewInteractionProbeState.completed = false;
    previewInteractionProbeState.targetLabel = '';
    previewInteractionProbeState.steps = [];
    previewInteractionProbeState.usedTargetLabels = Object.create(null);
    previewInteractionProbeState.planStepIndex = 0;
    schedulePreviewInteractionProbe();
  }

  function hasMeaningfulRender() {
    var body = document.body;
    if (!body) return false;
    var visibleElements = body.querySelectorAll(
      'button,input,textarea,select,canvas,svg,video,img,main,section,article,table,form,[role="button"],[role="heading"]'
    );
    for (var i = 0; i < visibleElements.length; i += 1) {
      if (isVisibleUiElement(visibleElements[i])) {
        return true;
      }
    }
    return false;
  }

  function scheduleBlankRenderProbe() {
    if (blankRenderProbeState.scheduled || blankRenderProbeState.reported) return;
    blankRenderProbeState.scheduled = true;
    setTimeout(function() {
      blankRenderProbeState.scheduled = false;
      if (blankRenderProbeState.reported) return;
      if (hasMeaningfulRender()) {
        blankRenderProbeState.resolved = true;
        reportPreviewHealthSnapshot(false);
        return;
      }
      blankRenderProbeState.reported = true;
      reportRuntimeObservation('blankrender', {
        message: 'The preview booted but the UI stayed blank or nearly blank.'
      });
      reportPreviewHealthSnapshot(true);
    }, 1200);
  }

  function installPreviewHealthObserver() {
    if (previewHealthObserver || typeof MutationObserver !== 'function') return;
    previewHealthObserver = new MutationObserver(function() {
      schedulePreviewHealthSnapshot();
    });
    try {
      previewHealthObserver.observe(document.documentElement, {
        subtree: true,
        childList: true,
        characterData: true,
        attributes: true
      });
    } catch (_) {
      previewHealthObserver = null;
    }
  }

  function shouldBlockNavigationKey(eventTarget) {
    if (!eventTarget || typeof eventTarget !== 'object') return false;
    var tagName = String(eventTarget.tagName || '').toLowerCase();
    if (tagName === 'input' || tagName === 'textarea' || tagName === 'select') {
      return false;
    }
    if (eventTarget.isContentEditable) return false;
    return true;
  }

  function installKeyboardScrollGuard() {
    window.addEventListener(
      'keydown',
      function(event) {
        var key = String(event.key || '');
        if (
          key !== 'ArrowUp' &&
          key !== 'ArrowDown' &&
          key !== 'ArrowLeft' &&
          key !== 'ArrowRight' &&
          key !== ' '
        ) {
          return;
        }
        if (!shouldBlockNavigationKey(event.target)) {
          return;
        }
        if (
          document.documentElement &&
          (document.documentElement.scrollHeight > document.documentElement.clientHeight ||
            document.documentElement.scrollWidth > document.documentElement.clientWidth)
        ) {
          if (!keyboardScrollProbeState.reported) {
            keyboardScrollProbeState.reported = true;
            reportRuntimeObservation('keyboardscroll', {
              message:
                'Keyboard controls can still scroll the preview page. Prevent default browser scroll for game controls outside editable fields.'
            });
          }
        }
        event.preventDefault();
      },
      { passive: false }
    );
  }

  window.addEventListener('message', (event) => {
    if (event.source !== window.parent) return;
    const { source, id, payload, error } = event.data || {};
    if (source !== 'twinkle-parent' || !pendingRequests.has(id)) return;

    const { resolve, reject, timeout } = pendingRequests.get(id);
    clearTimeout(timeout);
    pendingRequests.delete(id);

    if (error) reject(new Error(error));
    else resolve(payload);
  });

  window.addEventListener('error', function(event) {
    try {
      reportRuntimeObservation('error', {
        message: event.message,
        filename: event.filename,
        stack:
          event.error && typeof event.error.stack === 'string'
            ? event.error.stack
            : '',
        lineNumber: event.lineno,
        columnNumber: event.colno
      });
    } catch (_) {}
  });

  window.addEventListener('unhandledrejection', function(event) {
    try {
      var reason = event.reason;
      var message =
        reason && typeof reason === 'object' && reason.message
          ? reason.message
          : String(reason || 'Unhandled promise rejection');
      reportRuntimeObservation('unhandledrejection', {
        message: message,
        stack:
          reason && typeof reason === 'object' && typeof reason.stack === 'string'
            ? reason.stack
            : ''
      });
    } catch (_) {}
  });

  document.addEventListener('DOMContentLoaded', function() {
    installPreviewHealthObserver();
    installKeyboardScrollGuard();
    publishPreviewLayout(true);
    scheduleViewportAppFit();
    reportPreviewHealthSnapshot(true);
    scheduleBlankRenderProbe();
    schedulePreviewInteractionProbe();
  });

  window.addEventListener('load', function() {
    publishPreviewLayout(true);
    scheduleViewportAppFit();
    reportPreviewHealthSnapshot(true);
    scheduleBlankRenderProbe();
    schedulePreviewInteractionProbe();
  });

  window.addEventListener('resize', function() {
    publishPreviewLayout(true);
    scheduleViewportAppFit();
    schedulePreviewHealthSnapshot();
  });

  function loadSqlJs() {
    if (SQL) return Promise.resolve(SQL);
    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = 'https://cdnjs.cloudflare.com/ajax/libs/sql.js/1.10.3/sql-wasm.js';
      script.onload = async () => {
        try {
          SQL = await window.initSqlJs({
            locateFile: file =>
              'https://cdnjs.cloudflare.com/ajax/libs/sql.js/1.10.3/' + file
          });
          resolve(SQL);
        } catch (err) {
          reject(err);
        }
      };
      script.onerror = () => reject(new Error('Failed to load sql.js'));
      document.head.appendChild(script);
    });
  }

  Twinkle = (window.Twinkle = {
    db: {
      async open() {
        if (db) return db;
        await loadSqlJs();
        try {
          const response = await sendRequest('db:load', {});
          if (response && response.data) {
            const binary = atob(response.data);
            const bytes = new Uint8Array(binary.length);
            for (let i = 0; i < binary.length; i++) {
              bytes[i] = binary.charCodeAt(i);
            }
            db = new SQL.Database(bytes);
          } else {
            db = new SQL.Database();
          }
          isInitialized = true;
          return db;
        } catch (err) {
          console.warn('Failed to load database, creating new one:', err);
          db = new SQL.Database();
          isInitialized = true;
          return db;
        }
      },

      async save() {
        if (!db) throw new Error('Database not opened. Call Twinkle.db.open() first.');
        const data = db.export();
        let binary = '';
        for (let i = 0; i < data.length; i++) {
          binary += String.fromCharCode(data[i]);
        }
        const base64 = btoa(binary);
        return await sendRequest('db:save', { data: base64 });
      },

      exec(sql, params) {
        if (!db) throw new Error('Database not opened. Call Twinkle.db.open() first.');
        return db.exec(sql, params);
      },

      run(sql, params) {
        if (!db) throw new Error('Database not opened. Call Twinkle.db.open() first.');
        db.run(sql, params);
      },

      query(sql, params) {
        if (!db) throw new Error('Database not opened. Call Twinkle.db.open() first.');
        const stmt = db.prepare(sql);
        if (params) stmt.bind(params);
        const results = [];
        while (stmt.step()) {
          results.push(stmt.getAsObject());
        }
        stmt.free();
        return results;
      },

      getDb() { return db; },
      isOpen() { return isInitialized && db !== null; },
      close() {
        if (db) { db.close(); db = null; isInitialized = false; }
      }
    },

    ai: {
      _prompts: null,

      async listPrompts() {
        if (this._prompts) return this._prompts;
        const response = await sendRequest('ai:list-prompts', {});
        this._prompts = response.prompts || [];
        return this._prompts;
      },

      async chat({ promptId, message, history }) {
        if (!promptId) throw new Error('promptId is required');
        if (!message) throw new Error('message is required');

        const response = await sendRequest('ai:chat', {
          promptId: promptId,
          message: message,
          history: history || []
        });

        return {
          text: response.response,
          prompt: response.prompt
        };
      }
    },

    capabilities: {
      current: null,

      async get() {
        if (capabilitySnapshot) return capabilitySnapshot;
        const response = await sendRequest('capabilities:get', {});
        applyCapabilitySnapshot(response?.capabilities);
        return capabilitySnapshot;
      },

      async can(actionName) {
        if (!actionName) throw new Error('actionName is required');
        const snapshot = await this.get();
        const normalizedActionName = String(actionName || '').trim();
        return Boolean(
          snapshot?.lumine?.actionDetails?.some(
            (detail) =>
              detail?.name === normalizedActionName && detail?.allowed === true
          )
        );
      },

      async listActions() {
        const snapshot = await this.get();
        return {
          available: Array.isArray(snapshot?.lumine?.availableActions)
            ? snapshot.lumine.availableActions
            : [],
          blocked: Array.isArray(snapshot?.lumine?.blockedActions)
            ? snapshot.lumine.blockedActions
            : [],
          details: Array.isArray(snapshot?.lumine?.actionDetails)
            ? snapshot.lumine.actionDetails
            : []
        };
      },

      async refresh() {
        capabilitySnapshot = null;
        return await this.get();
      }
    },

    viewer: {
      id: null,
      username: null,
      profilePicUrl: null,
      isLoggedIn: false,
      isOwner: false,
      isGuest: false,

      async get() {
        if (viewerInfo) return viewerInfo;
        const response = await sendRequest('viewer:get', {});
        applyViewerInfo(response?.viewer);
        return viewerInfo;
      },

      async refresh() {
        viewerInfo = null;
        return await this.get();
      }
    },

    preview: {
      current: null,

      getLayout() {
        return readPreviewLayout();
      },

      getGameplayTelemetry() {
        return buildGameplayTelemetrySnapshot();
      },

      wrapResult(result) {
        var promise = Promise.resolve(result);
        if (result && typeof result === 'object') {
          try {
            if (typeof result.then !== 'function') {
              Object.defineProperty(result, 'then', {
                configurable: true,
                enumerable: false,
                value: function(onFulfilled, onRejected) {
                  return promise.then(onFulfilled, onRejected);
                }
              });
            }
            if (typeof result.catch !== 'function') {
              Object.defineProperty(result, 'catch', {
                configurable: true,
                enumerable: false,
                value: function(onRejected) {
                  return promise.catch(onRejected);
                }
              });
            }
            if (typeof result.finally !== 'function') {
              Object.defineProperty(result, 'finally', {
                configurable: true,
                enumerable: false,
                value: function(onFinally) {
                  return promise.finally(onFinally);
                }
              });
            }
          } catch (_) {}
          return result;
        }
        return promise;
      },

      reserveInsets(insets) {
        var currentInsets = clonePreviewInsets(previewLayoutState.reservedInsets);
        var nextInsets = {
          top:
            insets && Object.prototype.hasOwnProperty.call(insets, 'top')
              ? normalizePreviewInsetValue(insets.top)
              : currentInsets.top,
          right:
            insets && Object.prototype.hasOwnProperty.call(insets, 'right')
              ? normalizePreviewInsetValue(insets.right)
              : currentInsets.right,
          bottom:
            insets && Object.prototype.hasOwnProperty.call(insets, 'bottom')
              ? normalizePreviewInsetValue(insets.bottom)
              : currentInsets.bottom,
          left:
            insets && Object.prototype.hasOwnProperty.call(insets, 'left')
              ? normalizePreviewInsetValue(insets.left)
              : currentInsets.left
        };
        if (previewInsetsEqual(currentInsets, nextInsets)) {
          return this.wrapResult(readPreviewLayout());
        }
        previewLayoutState.reservedInsets = nextInsets;
        return this.wrapResult(publishPreviewLayout(true));
      },

      setPlayfield(bounds) {
        gameplayTelemetryState.playfieldBounds = normalizeGameplayRect(bounds);
        scheduleGameplayTelemetryEvaluation();
        return this.wrapResult(buildGameplayTelemetrySnapshot());
      },

      reportGameplayState(state) {
        if (state == null) {
          gameplayTelemetryState.playerBounds = null;
          scheduleGameplayTelemetryEvaluation();
          return this.wrapResult(buildGameplayTelemetrySnapshot());
        }
        if (typeof state !== 'object') {
          throw new Error('state object is required');
        }
        if (Object.prototype.hasOwnProperty.call(state, 'playfieldBounds')) {
          gameplayTelemetryState.playfieldBounds = normalizeGameplayRect(
            state.playfieldBounds
          );
        }
        if (Object.prototype.hasOwnProperty.call(state, 'playerBounds')) {
          gameplayTelemetryState.playerBounds = normalizeGameplayRect(
            state.playerBounds
          );
        }
        scheduleGameplayTelemetryEvaluation();
        return this.wrapResult(buildGameplayTelemetrySnapshot());
      },

      clearReservedInsets() {
        var clearedInsets = {
          top: 0,
          right: 0,
          bottom: 0,
          left: 0
        };
        if (previewInsetsEqual(previewLayoutState.reservedInsets, clearedInsets)) {
          return this.wrapResult(readPreviewLayout());
        }
        previewLayoutState.reservedInsets = clearedInsets;
        return this.wrapResult(publishPreviewLayout(true));
      },

      clearGameplayState() {
        gameplayTelemetryState.playfieldBounds = null;
        gameplayTelemetryState.playerBounds = null;
        scheduleGameplayTelemetryEvaluation();
        return this.wrapResult(buildGameplayTelemetrySnapshot());
      },

      subscribe(listener, options) {
        if (typeof listener !== 'function') {
          throw new Error('listener is required');
        }
        previewLayoutState.listeners.push(listener);
        var shouldEmitImmediately =
          !options || options.immediate !== false;
        if (shouldEmitImmediately) {
          try {
            listener(readPreviewLayout());
          } catch (_) {}
        }
        return function unsubscribe() {
          previewLayoutState.listeners = previewLayoutState.listeners.filter(
            function(candidate) {
              return candidate !== listener;
            }
          );
        };
      }
    },

    viewerDb: {
      async query(sql, params) {
        if (!sql) throw new Error('SQL is required');
        return await sendRequest('viewer-db:query', { sql: sql, params: params });
      },

      async exec(sql, params) {
        if (!sql) throw new Error('SQL is required');
        return await sendRequest('viewer-db:exec', { sql: sql, params: params });
      }
    },

    users: {
      async getUser(userId) {
        if (!userId) throw new Error('userId is required');
        const result = await sendRequest('api:get-user', { userId: userId });
        if (result?.user) return result.user;
        if (result && typeof result === 'object') return result;
        return null;
      },

      async getUsers({ search, userIds, cursor, limit } = {}) {
        return await sendRequest('api:get-users', {
          search: search,
          userIds: userIds,
          cursor: cursor,
          limit: limit
        });
      }
    },

    reflections: {
      async getDailyReflections({ userIds, lastId, cursor, limit } = {}) {
        return await sendRequest('api:get-daily-reflections', {
          userIds: userIds,
          lastId: lastId,
          cursor: cursor,
          limit: limit
        });
      },

      async getDailyReflectionsByUser(userId, { lastId, cursor, limit } = {}) {
        if (!userId) throw new Error('userId is required');
        return await sendRequest('api:get-daily-reflections', {
          userIds: [userId],
          lastId: lastId,
          cursor: cursor,
          limit: limit
        });
      }
    },

    subjects: {
      async getMySubjects(opts) {
        var options = opts || {};
        return await sendRequest('content:my-subjects', {
          limit: options.limit,
          cursor: options.cursor
        });
      },

      async getSubject(subjectId) {
        if (!subjectId) throw new Error('subjectId is required');
        return await sendRequest('content:subject', { subjectId: subjectId });
      },

      async getSubjectComments(subjectId, opts) {
        if (!subjectId) throw new Error('subjectId is required');
        var options = opts || {};
        return await sendRequest('content:subject-comments', {
          subjectId: subjectId,
          limit: options.limit,
          cursor: options.cursor
        });
      }
    },

    profileComments: {
      async getProfileComments(opts) {
        var options = opts || {};
        return await sendRequest('content:profile-comments', {
          profileUserId: options.profileUserId,
          limit: options.limit,
          offset: options.offset,
          sortBy: options.sortBy,
          includeReplies: options.includeReplies,
          range: options.range,
          since: options.since,
          until: options.until
        });
      },

      async getProfileCommentIds(opts) {
        var options = opts || {};
        return await sendRequest('content:profile-comment-ids', {
          profileUserId: options.profileUserId,
          limit: options.limit,
          offset: options.offset,
          sortBy: options.sortBy,
          includeReplies: options.includeReplies,
          range: options.range,
          since: options.since,
          until: options.until
        });
      },

      async getCommentsByIds(idsOrOpts) {
        var options = Array.isArray(idsOrOpts)
          ? { ids: idsOrOpts }
          : idsOrOpts || {};
        if (!Array.isArray(options.ids)) {
          throw new Error('ids array is required');
        }
        return await sendRequest('content:profile-comments-by-ids', {
          ids: options.ids
        });
      },

      async getProfileCommentCounts(idsOrOpts) {
        var options = Array.isArray(idsOrOpts)
          ? { ids: idsOrOpts }
          : idsOrOpts || {};
        if (!Array.isArray(options.ids)) {
          throw new Error('ids array is required');
        }
        return await sendRequest('content:profile-comment-counts', {
          ids: options.ids
        });
      }
    },

    sharedDb: {
      async getTopics() {
        return await sendRequest('shared-db:get-topics', {});
      },

      async createTopic(name) {
        if (!name) throw new Error('name is required');
        return await sendRequest('shared-db:create-topic', { name: name });
      },

      async getEntries(topicName, opts) {
        if (!topicName) throw new Error('topicName is required');
        var options = opts || {};
        return await sendRequest('shared-db:get-entries', {
          topicName: topicName,
          limit: options.limit,
          cursor: options.cursor
        });
      },

      async addEntry(topicName, data) {
        if (!topicName) throw new Error('topicName is required');
        if (!data) throw new Error('data is required');
        return await sendRequest('shared-db:add-entry', {
          topicName: topicName,
          data: data
        });
      },

      async updateEntry(entryId, data) {
        if (!entryId) throw new Error('entryId is required');
        if (!data) throw new Error('data is required');
        return await sendRequest('shared-db:update-entry', {
          entryId: entryId,
          data: data
        });
      },

      async deleteEntry(entryId) {
        if (!entryId) throw new Error('entryId is required');
        return await sendRequest('shared-db:delete-entry', {
          entryId: entryId
        });
      }
    },

    privateDb: {
      async get(key) {
        if (!key) throw new Error('key is required');
        return await sendRequest('private-db:get', { key: key });
      },

      async list(opts) {
        var options = opts || {};
        return await sendRequest('private-db:list', {
          prefix: options.prefix,
          limit: options.limit,
          cursor: options.cursor
        });
      },

      async set(key, value) {
        if (!key) throw new Error('key is required');
        return await sendRequest('private-db:set', {
          key: key,
          value: value
        });
      },

      async remove(key) {
        if (!key) throw new Error('key is required');
        return await sendRequest('private-db:remove', { key: key });
      }
    },

    reminders: {
      async list(opts) {
        var options = opts || {};
        return await sendRequest('reminders:list', {
          includeDisabled: options.includeDisabled,
          limit: options.limit
        });
      },

      async create(reminder) {
        if (!reminder || typeof reminder !== 'object' || Array.isArray(reminder)) {
          throw new Error('reminder is required');
        }
        return await sendRequest('reminders:create', {
          title: reminder.title,
          body: reminder.body,
          targetPath: reminder.targetPath,
          payload: reminder.payload,
          schedule: reminder.schedule,
          isEnabled: reminder.isEnabled
        });
      },

      async update(reminderId, patch) {
        if (!reminderId) throw new Error('reminderId is required');
        var nextPatch = patch || {};
        return await sendRequest('reminders:update', {
          reminderId: reminderId,
          title: nextPatch.title,
          body: nextPatch.body,
          targetPath: nextPatch.targetPath,
          payload: nextPatch.payload,
          schedule: nextPatch.schedule,
          isEnabled: nextPatch.isEnabled
        });
      },

      async remove(reminderId) {
        if (!reminderId) throw new Error('reminderId is required');
        return await sendRequest('reminders:remove', {
          reminderId: reminderId
        });
      },

      async getDue(opts) {
        var options = opts || {};
        return await sendRequest('reminders:get-due', {
          now: options.now,
          autoAcknowledge: options.autoAcknowledge,
          limit: options.limit
        });
      }
    },

    build: { id: null, title: null, username: null },
    _init(info) {
      this.build.id = info.id;
      this.build.title = info.title;
      this.build.username = info.username;
      applyViewerInfo(info.viewer);
      applyCapabilitySnapshot(info.capabilities);
      applyRuntimeExplorationPlan(info.explorationPlan);
      publishPreviewLayout(true);
    }
  });

  sendRequest('init', {}).then(info => {
    if (info) window.Twinkle._init(info);
  }).catch(() => {});

  console.log('Twinkle SDK loaded');
})();
</script>
`;
