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
  let chatSubscriptionListeners = new Map();
  var blankRenderProbeState = {
    scheduled: false,
    resolved: false,
    reported: false
  };
  var previewHealthLastKey = '';
  var previewHealthMutationTimer = null;
  var previewHealthObserver = null;
  var keyboardScrollProbeState = {
    reported: false
  };
  var viewportModeState = {
    mode: 'document',
    styleInjected: false,
    autoFitOptOut: false
  };
  var viewportFitState = {
    scheduled: false,
    candidate: null,
    waitingForCandidate: false,
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
  var hostVisibilityState = {
    visible: true,
    rafIdCounter: 0,
    queuedCallbacks: new Map(),
    scheduledCallbacks: new Map(),
    scheduledHandles: new Map(),
    pausedMediaElements: [],
    trackedMediaElements: [],
    hiddenCallbacks: new Map(),
    hiddenCallbackIdsByCallback: new Map()
  };
  var HOST_VISIBILITY_HIDDEN_RAF_LIMIT = 48;
  var nativeRequestAnimationFrame =
    typeof window.requestAnimationFrame === 'function'
      ? window.requestAnimationFrame.bind(window)
      : null;
  var nativeCancelAnimationFrame =
    typeof window.cancelAnimationFrame === 'function'
      ? window.cancelAnimationFrame.bind(window)
      : null;
  var nativeMediaPlay =
    window.HTMLMediaElement &&
    window.HTMLMediaElement.prototype &&
    typeof window.HTMLMediaElement.prototype.play === 'function'
      ? window.HTMLMediaElement.prototype.play
      : null;
  var nativeMediaPause =
    window.HTMLMediaElement &&
    window.HTMLMediaElement.prototype &&
    typeof window.HTMLMediaElement.prototype.pause === 'function'
      ? window.HTMLMediaElement.prototype.pause
      : null;

  function trackMediaElementForHostVisibility(mediaElement) {
    if (!mediaElement) return;
    for (var i = 0; i < hostVisibilityState.trackedMediaElements.length; i += 1) {
      if (hostVisibilityState.trackedMediaElements[i] === mediaElement) {
        return;
      }
    }
    hostVisibilityState.trackedMediaElements.push(mediaElement);
  }

  function untrackMediaElementForHostVisibility(mediaElement) {
    if (!mediaElement || hostVisibilityState.trackedMediaElements.length === 0) {
      return;
    }
    hostVisibilityState.trackedMediaElements =
      hostVisibilityState.trackedMediaElements.filter(function(candidate) {
        return candidate !== mediaElement;
      });
  }

  function pruneTrackedMediaElementsForHostVisibility() {
    if (hostVisibilityState.trackedMediaElements.length === 0) return;
    hostVisibilityState.trackedMediaElements =
      hostVisibilityState.trackedMediaElements.filter(function(mediaElement) {
        return !!mediaElement && !mediaElement.ended;
      });
  }

  function createHostVisibilityDeferredPlayError(message) {
    try {
      return new Error(message || 'Playback was cancelled while hidden');
    } catch (_) {
      return {
        message: String(message || 'Playback was cancelled while hidden')
      };
    }
  }

  function getPausedMediaEntryForHostVisibility(mediaElement) {
    if (!mediaElement || hostVisibilityState.pausedMediaElements.length === 0) {
      return null;
    }
    for (var i = 0; i < hostVisibilityState.pausedMediaElements.length; i += 1) {
      if (hostVisibilityState.pausedMediaElements[i].element === mediaElement) {
        return hostVisibilityState.pausedMediaElements[i];
      }
    }
    return null;
  }

  function clearPausedMediaEntryPlayPromiseForHostVisibility(pausedEntry) {
    if (!pausedEntry) return;
    pausedEntry.pendingPlayPromise = null;
    pausedEntry.resolvePendingPlay = null;
    pausedEntry.rejectPendingPlay = null;
  }

  function resolvePausedMediaEntryPlayPromiseForHostVisibility(pausedEntry) {
    if (!pausedEntry || typeof pausedEntry.resolvePendingPlay !== 'function') {
      clearPausedMediaEntryPlayPromiseForHostVisibility(pausedEntry);
      return;
    }
    var resolvePendingPlay = pausedEntry.resolvePendingPlay;
    clearPausedMediaEntryPlayPromiseForHostVisibility(pausedEntry);
    try {
      resolvePendingPlay();
    } catch (_) {}
  }

  function rejectPausedMediaEntryPlayPromiseForHostVisibility(
    pausedEntry,
    message
  ) {
    if (!pausedEntry || typeof pausedEntry.rejectPendingPlay !== 'function') {
      clearPausedMediaEntryPlayPromiseForHostVisibility(pausedEntry);
      return;
    }
    var rejectPendingPlay = pausedEntry.rejectPendingPlay;
    clearPausedMediaEntryPlayPromiseForHostVisibility(pausedEntry);
    try {
      rejectPendingPlay(createHostVisibilityDeferredPlayError(message));
    } catch (_) {}
  }

  function getOrCreatePausedMediaEntryPlayPromiseForHostVisibility(pausedEntry) {
    if (!pausedEntry || typeof Promise !== 'function') return null;
    if (pausedEntry.pendingPlayPromise) {
      return pausedEntry.pendingPlayPromise;
    }
    pausedEntry.pendingPlayPromise = new Promise(function(resolve, reject) {
      pausedEntry.resolvePendingPlay = resolve;
      pausedEntry.rejectPendingPlay = reject;
    });
    return pausedEntry.pendingPlayPromise;
  }

  function handlePausedMediaEntryResumePlayPromiseForHostVisibility(
    pausedEntry,
    playPromise
  ) {
    if (playPromise && typeof playPromise.then === 'function') {
      playPromise.then(
        function() {
          resolvePausedMediaEntryPlayPromiseForHostVisibility(pausedEntry);
        },
        function(error) {
          rejectPausedMediaEntryPlayPromiseForHostVisibility(
            pausedEntry,
            error && error.message
          );
        }
      );
      return;
    }
    resolvePausedMediaEntryPlayPromiseForHostVisibility(pausedEntry);
  }

  function addPausedMediaElementForHostVisibility(mediaElement, allowDetachedResume) {
    if (!mediaElement) return;
    trackMediaElementForHostVisibility(mediaElement);
    var existingEntry = getPausedMediaEntryForHostVisibility(mediaElement);
    if (existingEntry) {
      if (allowDetachedResume === true) {
        existingEntry.allowDetachedResume = true;
      }
      return existingEntry;
    }
    var pausedEntry = {
      element: mediaElement,
      allowDetachedResume: allowDetachedResume === true,
      pendingPlayPromise: null,
      resolvePendingPlay: null,
      rejectPendingPlay: null
    };
    hostVisibilityState.pausedMediaElements.push(pausedEntry);
    return pausedEntry;
  }

  function removePausedMediaElementForHostVisibility(mediaElement) {
    if (!mediaElement || hostVisibilityState.pausedMediaElements.length === 0) {
      return;
    }
    hostVisibilityState.pausedMediaElements =
      hostVisibilityState.pausedMediaElements.filter(function(candidate) {
        if (candidate.element === mediaElement) {
          rejectPausedMediaEntryPlayPromiseForHostVisibility(candidate);
          return false;
        }
        return candidate.element !== mediaElement;
      });
  }

  function hasPausedMediaElementForHostVisibility(mediaElement) {
    return !!getPausedMediaEntryForHostVisibility(mediaElement);
  }

  function pushUniqueMediaElementForHostVisibility(mediaElements, mediaElement) {
    if (!mediaElement) return;
    for (var i = 0; i < mediaElements.length; i += 1) {
      if (mediaElements[i] === mediaElement) return;
    }
    mediaElements.push(mediaElement);
  }

  function getKnownMediaElementsForHostVisibility() {
    pruneTrackedMediaElementsForHostVisibility();
    var mediaElements = [];
    var connectedMediaElements = document.querySelectorAll('audio,video');
    for (var i = 0; i < connectedMediaElements.length; i += 1) {
      pushUniqueMediaElementForHostVisibility(
        mediaElements,
        connectedMediaElements[i]
      );
    }
    for (var j = 0; j < hostVisibilityState.trackedMediaElements.length; j += 1) {
      pushUniqueMediaElementForHostVisibility(
        mediaElements,
        hostVisibilityState.trackedMediaElements[j]
      );
    }
    return mediaElements;
  }

  function trimHiddenHostVisibilityAnimationFrames() {
    while (hostVisibilityState.hiddenCallbacks.size > HOST_VISIBILITY_HIDDEN_RAF_LIMIT) {
      var oldestHiddenEntry = hostVisibilityState.hiddenCallbacks.entries().next();
      if (!oldestHiddenEntry || oldestHiddenEntry.done) break;
      clearHiddenHostVisibilityAnimationFrame(oldestHiddenEntry.value[0]);
    }
  }

  function rememberHiddenHostVisibilityAnimationFrame(id, callback) {
    if (typeof callback !== 'function') return;
    var normalizedId = Number(id);
    var existingId = hostVisibilityState.hiddenCallbackIdsByCallback.get(callback);
    if (Number(existingId) > 0) {
      hostVisibilityState.hiddenCallbacks.delete(existingId);
    }
    hostVisibilityState.hiddenCallbacks.set(normalizedId, callback);
    hostVisibilityState.hiddenCallbackIdsByCallback.set(callback, normalizedId);
    trimHiddenHostVisibilityAnimationFrames();
  }

  function clearHiddenHostVisibilityAnimationFrame(id) {
    var normalizedId = Number(id);
    var hiddenCallback = hostVisibilityState.hiddenCallbacks.get(normalizedId);
    hostVisibilityState.hiddenCallbacks.delete(normalizedId);
    if (
      hiddenCallback &&
      Number(hostVisibilityState.hiddenCallbackIdsByCallback.get(hiddenCallback)) ===
        normalizedId
    ) {
      hostVisibilityState.hiddenCallbackIdsByCallback.delete(hiddenCallback);
    }
  }

  function cancelScheduledHostVisibilityAnimationFrame(id) {
    if (!hostVisibilityState.scheduledHandles.has(id)) return;
    var scheduledHandle = hostVisibilityState.scheduledHandles.get(id);
    hostVisibilityState.scheduledHandles.delete(id);
    if (!scheduledHandle) return;
    if (scheduledHandle.kind === 'raf' && nativeCancelAnimationFrame) {
      nativeCancelAnimationFrame(scheduledHandle.handle);
      return;
    }
    clearTimeout(scheduledHandle.handle);
  }

  function scheduleHostVisibilityAnimationFrame(id, callback) {
    if (typeof callback !== 'function') return;
    hostVisibilityState.scheduledCallbacks.set(id, callback);
    if (nativeRequestAnimationFrame) {
      var nativeHandle = nativeRequestAnimationFrame(function(timestamp) {
        hostVisibilityState.scheduledHandles.delete(id);
        var scheduledCallback = hostVisibilityState.scheduledCallbacks.get(id);
        hostVisibilityState.scheduledCallbacks.delete(id);
        if (typeof scheduledCallback !== 'function') return;
        if (!hostVisibilityState.visible) {
          hostVisibilityState.queuedCallbacks.set(id, scheduledCallback);
          return;
        }
        try {
          scheduledCallback(timestamp);
        } catch (error) {
          setTimeout(function() {
            throw error;
          }, 0);
        }
      });
      hostVisibilityState.scheduledHandles.set(id, {
        kind: 'raf',
        handle: nativeHandle
      });
      return;
    }
    var timeoutHandle = setTimeout(function() {
      hostVisibilityState.scheduledHandles.delete(id);
      var scheduledCallback = hostVisibilityState.scheduledCallbacks.get(id);
      hostVisibilityState.scheduledCallbacks.delete(id);
      if (typeof scheduledCallback !== 'function') return;
      if (!hostVisibilityState.visible) {
        hostVisibilityState.queuedCallbacks.set(id, scheduledCallback);
        return;
      }
      try {
        scheduledCallback(Date.now());
      } catch (error) {
        setTimeout(function() {
          throw error;
        }, 0);
      }
    }, 16);
    hostVisibilityState.scheduledHandles.set(id, {
      kind: 'timeout',
      handle: timeoutHandle
    });
  }

  function queueScheduledHostVisibilityAnimationFrames() {
    var scheduledEntries = Array.from(
      hostVisibilityState.scheduledCallbacks.entries()
    );
    for (var i = 0; i < scheduledEntries.length; i += 1) {
      var scheduledEntry = scheduledEntries[i];
      var id = scheduledEntry[0];
      var callback = scheduledEntry[1];
      cancelScheduledHostVisibilityAnimationFrame(id);
      if (typeof callback === 'function') {
        hostVisibilityState.queuedCallbacks.set(id, callback);
      }
    }
    hostVisibilityState.scheduledCallbacks.clear();
  }

  function flushQueuedHostVisibilityAnimationFrames() {
    if (!hostVisibilityState.visible) return;
    var queuedEntries = Array.from(hostVisibilityState.queuedCallbacks.entries());
    hostVisibilityState.queuedCallbacks.clear();
    for (var i = 0; i < queuedEntries.length; i += 1) {
      scheduleHostVisibilityAnimationFrame(
        queuedEntries[i][0],
        queuedEntries[i][1]
      );
    }
    var hiddenEntries = Array.from(hostVisibilityState.hiddenCallbacks.entries());
    hostVisibilityState.hiddenCallbacks.clear();
    hostVisibilityState.hiddenCallbackIdsByCallback.clear();
    for (var j = 0; j < hiddenEntries.length; j += 1) {
      scheduleHostVisibilityAnimationFrame(
        hiddenEntries[j][0],
        hiddenEntries[j][1]
      );
    }
  }

  function pauseActiveMediaElementsForHostVisibility() {
    hostVisibilityState.pausedMediaElements = [];
    var mediaElements = getKnownMediaElementsForHostVisibility();
    for (var i = 0; i < mediaElements.length; i += 1) {
      var mediaElement = mediaElements[i];
      if (
        !mediaElement ||
        typeof mediaElement.pause !== 'function' ||
        mediaElement.paused ||
        mediaElement.ended
      ) {
        continue;
      }
      try {
        if (nativeMediaPause) {
          nativeMediaPause.call(mediaElement);
        } else {
          mediaElement.pause();
        }
        addPausedMediaElementForHostVisibility(
          mediaElement,
          mediaElement.isConnected !== true
        );
      } catch (_) {}
    }
  }

  function resumePausedMediaElementsForHostVisibility() {
    var pausedMediaElements = hostVisibilityState.pausedMediaElements.slice();
    hostVisibilityState.pausedMediaElements = [];
    for (var i = 0; i < pausedMediaElements.length; i += 1) {
      var pausedEntry = pausedMediaElements[i];
      var mediaElement = pausedEntry && pausedEntry.element;
      if (!mediaElement || mediaElement.ended) {
        rejectPausedMediaEntryPlayPromiseForHostVisibility(
          pausedEntry,
          'Playback ended before the preview became visible'
        );
        continue;
      }
      if (!pausedEntry.allowDetachedResume && !mediaElement.isConnected) {
        rejectPausedMediaEntryPlayPromiseForHostVisibility(
          pausedEntry,
          'Playback could not resume because the media element was removed'
        );
        continue;
      }
      try {
        var playPromise = nativeMediaPlay
          ? nativeMediaPlay.call(mediaElement)
          : mediaElement.play();
        handlePausedMediaEntryResumePlayPromiseForHostVisibility(
          pausedEntry,
          playPromise
        );
      } catch (error) {
        rejectPausedMediaEntryPlayPromiseForHostVisibility(
          pausedEntry,
          error && error.message
        );
      }
    }
  }

  function applyHostVisibility(visible) {
    var nextVisible = visible !== false;
    if (hostVisibilityState.visible === nextVisible) return false;
    hostVisibilityState.visible = nextVisible;
    var documentElement = document.documentElement;
    if (documentElement) {
      if (nextVisible) {
        documentElement.removeAttribute('data-twinkle-host-hidden');
      } else {
        documentElement.setAttribute('data-twinkle-host-hidden', '1');
      }
    }
    if (nextVisible) {
      resumePausedMediaElementsForHostVisibility();
      flushQueuedHostVisibilityAnimationFrames();
      publishPreviewLayout(false);
      scheduleViewportAppFit();
      schedulePreviewHealthSnapshot();
      scheduleBlankRenderProbe();
    } else {
      queueScheduledHostVisibilityAnimationFrames();
      pauseActiveMediaElementsForHostVisibility();
    }
    try {
      window.dispatchEvent(
        new CustomEvent('twinkle:host-visibility', {
          detail: { visible: nextVisible }
        })
      );
    } catch (_) {}
    return true;
  }

  function installHostVisibilityAnimationFrameInterceptor() {
    window.requestAnimationFrame = function(callback) {
      if (typeof callback !== 'function') {
        return nativeRequestAnimationFrame
          ? nativeRequestAnimationFrame(callback)
          : setTimeout(callback, 16);
      }
      var id = ++hostVisibilityState.rafIdCounter;
      if (!hostVisibilityState.visible) {
        rememberHiddenHostVisibilityAnimationFrame(id, callback);
        return id;
      }
      scheduleHostVisibilityAnimationFrame(id, callback);
      return id;
    };

    window.cancelAnimationFrame = function(id) {
      var normalizedId = Number(id);
      clearHiddenHostVisibilityAnimationFrame(normalizedId);
      hostVisibilityState.queuedCallbacks.delete(normalizedId);
      hostVisibilityState.scheduledCallbacks.delete(normalizedId);
      cancelScheduledHostVisibilityAnimationFrame(normalizedId);
    };
  }

  function installHostVisibilityMediaInterceptor() {
    if (
      !window.HTMLMediaElement ||
      !window.HTMLMediaElement.prototype ||
      typeof nativeMediaPlay !== 'function'
    ) {
      return;
    }
    try {
      window.HTMLMediaElement.prototype.play = function() {
        trackMediaElementForHostVisibility(this);
        if (hostVisibilityState.visible) {
          removePausedMediaElementForHostVisibility(this);
          return nativeMediaPlay.call(this);
        }
        var pausedEntry = addPausedMediaElementForHostVisibility(
          this,
          this.isConnected !== true
        );
        if (nativeMediaPause) {
          try {
            nativeMediaPause.call(this);
          } catch (error) {
            removePausedMediaElementForHostVisibility(this);
            if (typeof Promise === 'function') {
              return Promise.reject(error);
            }
            throw error;
          }
        }
        var pendingPlayPromise =
          getOrCreatePausedMediaEntryPlayPromiseForHostVisibility(pausedEntry);
        return typeof pendingPlayPromise !== 'undefined'
          ? pendingPlayPromise
          : typeof Promise === 'function'
            ? Promise.resolve()
            : undefined;
      };
    } catch (_) {}
    if (typeof nativeMediaPause === 'function') {
      try {
        window.HTMLMediaElement.prototype.pause = function() {
          removePausedMediaElementForHostVisibility(this);
          return nativeMediaPause.call(this);
        };
      } catch (_) {}
    }
    document.addEventListener(
      'play',
      function(event) {
        var mediaElement = event.target;
        trackMediaElementForHostVisibility(mediaElement);
        if (
          hostVisibilityState.visible ||
          !mediaElement ||
          typeof mediaElement.pause !== 'function'
        ) {
          return;
        }
        addPausedMediaElementForHostVisibility(
          mediaElement,
          mediaElement.isConnected !== true
        );
        try {
          if (nativeMediaPause) {
            nativeMediaPause.call(mediaElement);
          } else {
            mediaElement.pause();
          }
        } catch (_) {}
      },
      true
    );
    document.addEventListener(
      'pause',
      function(event) {
        if (
          !hostVisibilityState.visible &&
          hasPausedMediaElementForHostVisibility(event.target)
        ) {
          return;
        }
        removePausedMediaElementForHostVisibility(event.target);
      },
      true
    );
    document.addEventListener(
      'ended',
      function(event) {
        removePausedMediaElementForHostVisibility(event.target);
        untrackMediaElementForHostVisibility(event.target);
      },
      true
    );
  }

  installHostVisibilityAnimationFrameInterceptor();
  installHostVisibilityMediaInterceptor();

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

  function getParentMessageTargetOrigin() {
    try {
      var referrer = String(document.referrer || '').trim();
      if (referrer) {
        return new URL(referrer).origin;
      }
    } catch (_) {}
    return '*';
  }

  function getPreviewBridgeNonce() {
    try {
      var windowName = String(window.name || '').trim();
      var prefix = 'twinkle-build-preview:';
      if (windowName.indexOf(prefix) === 0) {
        return windowName.slice(prefix.length);
      }
    } catch (_) {}
    return '';
  }

  var parentMessageTargetOrigin = getParentMessageTargetOrigin();
  var previewBridgeNonce = getPreviewBridgeNonce();

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
        previewNonce: previewBridgeNonce,
        type: type,
        payload: payload
      }, parentMessageTargetOrigin);
    });
  }

  function normalizeChatRoomKey(roomKey) {
    var normalized = String(roomKey || '').trim();
    if (!normalized) throw new Error('roomKey is required');
    return normalized;
  }

  function getChatListenerSet(roomKey) {
    var listeners = chatSubscriptionListeners.get(roomKey);
    if (!listeners) {
      listeners = new Set();
      chatSubscriptionListeners.set(roomKey, listeners);
    }
    return listeners;
  }

  function dispatchChatEvent(payload) {
    var roomKey = String(payload && payload.roomKey ? payload.roomKey : '').trim();
    if (!roomKey) return;
    var listeners = chatSubscriptionListeners.get(roomKey);
    if (!listeners || listeners.size === 0) return;
    Array.from(listeners).forEach(function(listener) {
      try {
        listener(payload);
      } catch (error) {
        setTimeout(function() {
          throw error;
        }, 0);
      }
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
    var documentElement = document.documentElement;
    var body = document.body;
    var stableWidth = Math.max(
      window.innerWidth || 0,
      documentElement ? documentElement.clientWidth || 0 : 0,
      body ? body.clientWidth || 0 : 0
    );
    var stableHeight = Math.max(
      window.innerHeight || 0,
      documentElement ? documentElement.clientHeight || 0 : 0,
      body ? body.clientHeight || 0 : 0
    );
    if (stableWidth > 0 && stableHeight > 0) {
      return {
        width: Math.max(1, Math.round(stableWidth)),
        height: Math.max(1, Math.round(stableHeight))
      };
    }
    var visualViewport = window.visualViewport;
    var visualViewportWidth =
      visualViewport && Number.isFinite(Number(visualViewport.width))
        ? Math.max(1, Math.round(Number(visualViewport.width)))
        : 0;
    var visualViewportHeight =
      visualViewport && Number.isFinite(Number(visualViewport.height))
        ? Math.max(1, Math.round(Number(visualViewport.height)))
        : 0;
    if (visualViewportWidth > 0 && visualViewportHeight > 0) {
      return {
        width: visualViewportWidth,
        height: visualViewportHeight
      };
    }
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

  function previewFitSupportsScaleProperty() {
    try {
      if (window.CSS && typeof window.CSS.supports === 'function') {
        return !!window.CSS.supports('scale', '1');
      }
    } catch (_) {}
    var documentElement = document.documentElement;
    return !!(
      documentElement &&
      documentElement.style &&
      'scale' in documentElement.style
    );
  }

  function buildPreviewFitTransformValue(baseTransform, scaleValue) {
    var normalizedBaseTransform = String(baseTransform || '').trim();
    if (normalizedBaseTransform && normalizedBaseTransform !== 'none') {
      return normalizedBaseTransform + ' scale(' + scaleValue + ')';
    }
    return 'scale(' + scaleValue + ')';
  }

  function shouldApplyViewportFit(scale, candidateHadViewportFit) {
    if (!Number.isFinite(scale) || scale <= 0) return false;
    return candidateHadViewportFit ? scale < 0.999 : scale < 0.995;
  }

  function viewportFitScaleMatches(candidate, scaleValue) {
    if (!candidate || !candidate.style) return false;
    var currentScaleValue = String(
      candidate.style.getPropertyValue('scale') || ''
    ).trim();
    if (!currentScaleValue) return false;
    var currentScale = Number(currentScaleValue);
    var targetScale = Number(scaleValue);
    if (Number.isFinite(currentScale) && Number.isFinite(targetScale)) {
      return Math.abs(currentScale - targetScale) < 0.0005;
    }
    return currentScaleValue === scaleValue;
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
      'html[data-twinkle-preview-mode="viewport-app"] [data-twinkle-preview-fit="1"]{' +
      'transform-origin:center center !important;' +
      '}' +
      'html[data-twinkle-preview-mode="viewport-app"] canvas,' +
      'html[data-twinkle-preview-mode="viewport-app"] svg,' +
      'html[data-twinkle-preview-mode="viewport-app"] video,' +
      'html[data-twinkle-preview-mode="viewport-app"] img{' +
      'max-width:100% !important;' +
      'max-height:100% !important;' +
      '}';
    (document.head || document.documentElement).appendChild(styleNode);
  }

  function shouldUseViewportAppMode(visibleText) {
    if (viewportModeState.autoFitOptOut) {
      return false;
    }
    var body = document.body;
    if (body && body.querySelector('canvas')) {
      return true;
    }
    var haystack = (
      String(visibleText || '') +
      ' ' +
      String(document.title || '')
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

  function disableAutomaticViewportAppMode() {
    if (viewportModeState.autoFitOptOut) {
      return;
    }
    viewportModeState.autoFitOptOut = true;
    if (viewportModeState.mode === 'viewport-app') {
      applyViewportAppMode(false);
      return;
    }
    publishPreviewLayout(true);
  }

  function clearViewportFitCandidate(candidate) {
    if (!candidate || !candidate.style) return;
    var hadViewportFit = candidate.hasAttribute('data-twinkle-preview-fit');
    var hadInlineScaleSnapshot = candidate.hasAttribute(
      'data-twinkle-preview-fit-inline-scale'
    );
    var hadInlineTransformSnapshot = candidate.hasAttribute(
      'data-twinkle-preview-fit-inline-transform'
    );
    if (!hadViewportFit && !hadInlineScaleSnapshot && !hadInlineTransformSnapshot) {
      return;
    }
    var previousInlineScale = hadInlineScaleSnapshot
      ? candidate.getAttribute('data-twinkle-preview-fit-inline-scale') || ''
      : '';
    var previousInlineTransform = hadInlineTransformSnapshot
      ? candidate.getAttribute('data-twinkle-preview-fit-inline-transform') || ''
      : '';
    candidate.removeAttribute('data-twinkle-preview-fit');
    candidate.removeAttribute('data-twinkle-preview-fit-inline-scale');
    candidate.removeAttribute('data-twinkle-preview-fit-inline-transform');
    if (hadInlineScaleSnapshot) {
      if (previousInlineScale && previousInlineScale.length > 0) {
        candidate.style.setProperty('scale', previousInlineScale);
      } else {
        candidate.style.removeProperty('scale');
      }
    }
    if (hadInlineTransformSnapshot) {
      if (previousInlineTransform && previousInlineTransform.length > 0) {
        candidate.style.setProperty('transform', previousInlineTransform);
      } else {
        candidate.style.removeProperty('transform');
      }
    }
  }

  function computedStyleHasMeaningfulScale(computedStyle) {
    if (!computedStyle) return false;
    var scaleValue = String(computedStyle.scale || '').trim();
    if (
      scaleValue &&
      scaleValue !== 'none' &&
      scaleValue
        .split(/\s+/)
        .filter(Boolean)
        .some(function(part) {
          var numericValue = Number(part);
          return (
            !Number.isFinite(numericValue) ||
            Math.abs(numericValue - 1) > 0.001
          );
        })
    ) {
      return true;
    }
    var transformValue = String(computedStyle.transform || '').trim();
    if (!transformValue || transformValue === 'none') return false;
    var matrix3dMatch = transformValue.match(/^matrix3d\(([^)]+)\)$/i);
    if (matrix3dMatch) {
      var matrix3dParts = matrix3dMatch[1]
        .split(',')
        .map(function(part) {
          return Number(String(part).trim());
        });
      if (matrix3dParts.length === 16 && matrix3dParts.every(Number.isFinite)) {
        var scale3dX = Math.sqrt(
          matrix3dParts[0] * matrix3dParts[0] +
            matrix3dParts[1] * matrix3dParts[1] +
            matrix3dParts[2] * matrix3dParts[2]
        );
        var scale3dY = Math.sqrt(
          matrix3dParts[4] * matrix3dParts[4] +
            matrix3dParts[5] * matrix3dParts[5] +
            matrix3dParts[6] * matrix3dParts[6]
        );
        var scale3dZ = Math.sqrt(
          matrix3dParts[8] * matrix3dParts[8] +
            matrix3dParts[9] * matrix3dParts[9] +
            matrix3dParts[10] * matrix3dParts[10]
        );
        return (
          Math.abs(scale3dX - 1) > 0.001 ||
          Math.abs(scale3dY - 1) > 0.001 ||
          Math.abs(scale3dZ - 1) > 0.001
        );
      }
      return false;
    }
    var matrixMatch = transformValue.match(/^matrix\(([^)]+)\)$/i);
    if (matrixMatch) {
      var matrixParts = matrixMatch[1]
        .split(',')
        .map(function(part) {
          return Number(String(part).trim());
        });
      if (matrixParts.length === 6 && matrixParts.every(Number.isFinite)) {
        var scaleX = Math.sqrt(
          matrixParts[0] * matrixParts[0] + matrixParts[1] * matrixParts[1]
        );
        var scaleY = Math.sqrt(
          matrixParts[2] * matrixParts[2] + matrixParts[3] * matrixParts[3]
        );
        return Math.abs(scaleX - 1) > 0.001 || Math.abs(scaleY - 1) > 0.001;
      }
      return false;
    }
    return /scale(?:3d|x|y|z)?\(/i.test(transformValue);
  }

  function getViewportFitBaseTransform(candidate) {
    if (!candidate || !candidate.style) return '';
    var previousInlineTransform = candidate.hasAttribute(
      'data-twinkle-preview-fit-inline-transform'
    )
      ? candidate.getAttribute('data-twinkle-preview-fit-inline-transform') || ''
      : candidate.style.getPropertyValue('transform');
    if (previousInlineTransform) {
      return previousInlineTransform;
    }
    var hadViewportFit = candidate.hasAttribute('data-twinkle-preview-fit');
    var fitTransform = hadViewportFit
      ? candidate.style.getPropertyValue('transform')
      : '';
    if (hadViewportFit) {
      candidate.removeAttribute('data-twinkle-preview-fit');
      candidate.style.removeProperty('transform');
    }
    var computedTransform = '';
    try {
      computedTransform = String(
        window.getComputedStyle(candidate).transform || ''
      ).trim();
    } catch (_) {}
    if (hadViewportFit) {
      candidate.setAttribute('data-twinkle-preview-fit', '1');
      if (fitTransform) {
        candidate.style.setProperty('transform', fitTransform);
      } else {
        candidate.style.removeProperty('transform');
      }
    }
    if (!computedTransform || computedTransform === 'none') {
      return '';
    }
    return computedTransform;
  }

  function candidateHasAuthoredScale(candidate) {
    if (
      !candidate ||
      typeof window.getComputedStyle !== 'function' ||
      !candidate.style
    ) {
      return false;
    }
    var hadViewportFit = candidate.hasAttribute('data-twinkle-preview-fit');
    var fitScale = hadViewportFit
      ? candidate.style.getPropertyValue('scale')
      : '';
    var previousInlineScale = hadViewportFit
      ? candidate.getAttribute('data-twinkle-preview-fit-inline-scale') || ''
      : '';
    var hadInlineTransformSnapshot = hadViewportFit
      ? candidate.hasAttribute('data-twinkle-preview-fit-inline-transform')
      : false;
    var fitTransform = hadViewportFit
      ? candidate.style.getPropertyValue('transform')
      : '';
    var previousInlineTransform =
      hadViewportFit && hadInlineTransformSnapshot
        ? candidate.getAttribute('data-twinkle-preview-fit-inline-transform') || ''
        : '';
    if (hadViewportFit) {
      if (previousInlineScale) {
        candidate.style.setProperty('scale', previousInlineScale);
      } else {
        candidate.style.removeProperty('scale');
      }
      if (hadInlineTransformSnapshot) {
        if (previousInlineTransform) {
          candidate.style.setProperty('transform', previousInlineTransform);
        } else {
          candidate.style.removeProperty('transform');
        }
      }
      candidate.removeAttribute('data-twinkle-preview-fit');
    }
    var computedStyle = null;
    try {
      computedStyle = window.getComputedStyle(candidate);
    } catch (_) {}
    if (hadViewportFit) {
      candidate.setAttribute('data-twinkle-preview-fit', '1');
      if (fitScale) {
        candidate.style.setProperty('scale', fitScale);
      } else {
        candidate.style.removeProperty('scale');
      }
      if (hadInlineTransformSnapshot) {
        if (fitTransform) {
          candidate.style.setProperty('transform', fitTransform);
        } else {
          candidate.style.removeProperty('transform');
        }
      }
    }
    if (!computedStyle) return false;
    return computedStyleHasMeaningfulScale(computedStyle);
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
        viewportFitState.waitingForCandidate = false;
        viewportFitState.scale = 1;
        viewportFitState.baseWidth = 0;
        viewportFitState.baseHeight = 0;
      }
      viewportFitState.waitingForCandidate = false;
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
      viewportFitState.waitingForCandidate = true;
      publishPreviewLayout(false);
      return;
    }
    if (candidateHasAuthoredScale(candidate)) {
      clearViewportFitCandidate(candidate);
      viewportFitState.candidate = null;
      viewportFitState.waitingForCandidate = false;
      viewportFitState.scale = 1;
      viewportFitState.baseWidth = 0;
      viewportFitState.baseHeight = 0;
      publishPreviewLayout(false);
      return;
    }
    var rect = candidate.getBoundingClientRect();
    var appliedScale =
      viewportFitState.candidate === candidate && viewportFitState.scale > 0
        ? viewportFitState.scale
        : 1;
    var rectBaseWidth =
      rect && rect.width ? Math.round((rect.width || 0) / appliedScale) : 0;
    var rectBaseHeight =
      rect && rect.height ? Math.round((rect.height || 0) / appliedScale) : 0;
    var baseWidth = Math.max(
      candidate.offsetWidth || 0,
      candidate.clientWidth || 0,
      candidate.scrollWidth || 0,
      rectBaseWidth
    );
    var baseHeight = Math.max(
      candidate.offsetHeight || 0,
      candidate.clientHeight || 0,
      candidate.scrollHeight || 0,
      rectBaseHeight
    );
    var viewport = getPreviewViewportSize();
    var viewportWidth = viewport.width;
    var viewportHeight = viewport.height;
    if (baseWidth <= 0 || baseHeight <= 0 || viewportWidth <= 0 || viewportHeight <= 0) {
      viewportFitState.waitingForCandidate = true;
      return;
    }
    var padding = 12;
    var maxScale = 1;
    var scale = Math.min(
      Math.max(0.1, (viewportWidth - padding * 2) / baseWidth),
      Math.max(0.1, (viewportHeight - padding * 2) / baseHeight)
    );
    if (maxScale > 0) {
      scale = Math.min(maxScale, scale);
    }
    var candidateHadViewportFit = candidate.hasAttribute(
      'data-twinkle-preview-fit'
    );
    viewportFitState.candidate = candidate;
    viewportFitState.scale = scale;
    viewportFitState.baseWidth = baseWidth;
    viewportFitState.baseHeight = baseHeight;
    if (!shouldApplyViewportFit(scale, candidateHadViewportFit)) {
      clearViewportFitCandidate(candidate);
      viewportFitState.candidate = null;
      viewportFitState.waitingForCandidate = false;
      viewportFitState.scale = 1;
      viewportFitState.baseWidth = 0;
      viewportFitState.baseHeight = 0;
      publishPreviewLayout(false);
      return;
    }
    if (!candidateHadViewportFit) {
      candidate.setAttribute('data-twinkle-preview-fit', '1');
    }
    if (
      !candidate.hasAttribute('data-twinkle-preview-fit-inline-scale')
    ) {
      candidate.setAttribute(
        'data-twinkle-preview-fit-inline-scale',
        candidate.style.getPropertyValue('scale')
      );
    }
    var fitScaleValue = scale.toFixed(4);
    if (previewFitSupportsScaleProperty()) {
      if (!viewportFitScaleMatches(candidate, fitScaleValue)) {
        candidate.style.setProperty('scale', fitScaleValue);
      }
    } else {
      if (
        !candidate.hasAttribute('data-twinkle-preview-fit-inline-transform')
      ) {
        candidate.setAttribute(
          'data-twinkle-preview-fit-inline-transform',
          candidate.style.getPropertyValue('transform')
        );
      }
      var nextFitTransformValue = buildPreviewFitTransformValue(
        getViewportFitBaseTransform(candidate),
        fitScaleValue
      );
      if (
        String(candidate.style.getPropertyValue('transform') || '').trim() !==
        nextFitTransformValue
      ) {
        candidate.style.setProperty('transform', nextFitTransformValue);
      }
    }
    viewportFitState.waitingForCandidate = false;
    publishPreviewLayout(false);
  }

  function scheduleViewportAppFit() {
    if (!hostVisibilityState.visible) return;
    if (viewportFitState.scheduled) return;
    viewportFitState.scheduled = true;
    requestAnimationFrame(function() {
      viewportFitState.scheduled = false;
      fitViewportAppCandidate();
    });
  }

  function isTopLevelViewportFitMutationTarget(target) {
    var body = document.body;
    if (!target || !body) return false;
    return (
      target === document.documentElement ||
      target === body ||
      target.parentNode === body
    );
  }

  function shouldScheduleViewportFitFromMutations(mutations) {
    if (viewportModeState.mode !== 'viewport-app') return false;
    var currentCandidate = viewportFitState.candidate;
    if (currentCandidate && !currentCandidate.isConnected) {
      return true;
    }
    for (var i = 0; i < mutations.length; i += 1) {
      var mutation = mutations[i];
      if (!mutation || mutation.type !== 'childList') continue;
      if (viewportFitState.waitingForCandidate) {
        if (isTopLevelViewportFitMutationTarget(mutation.target)) {
          return true;
        }
        continue;
      }
      if (
        currentCandidate &&
        currentCandidate.parentNode &&
        mutation.target === currentCandidate.parentNode
      ) {
        return true;
      }
    }
    return false;
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
      if (!hostVisibilityState.visible) return;
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
        previewNonce: previewBridgeNonce,
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
      }, parentMessageTargetOrigin);
    } catch (_) {}
  }

  function collectPreviewUiState() {
    var body = document.body;
    var documentElement = document.documentElement;
    var text = trimObservationText(
      body && body.innerText ? String(body.innerText).replace(/\s+/g, ' ') : '',
      180
    );
    syncViewportAppMode(text);
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
    var viewport = getPreviewViewportSize();
    var viewportHeight = viewport.height;
    var viewportWidth = viewport.width;
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
      gameLike: gameLike
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
      gameLike: state.gameLike
    });
  }

  function reportPreviewHealthSnapshot(force) {
    try {
      if (!hostVisibilityState.visible) return;
      var nextState = collectPreviewUiState();
      var nextKey = buildPreviewHealthKey(nextState);
      if (!force && nextKey === previewHealthLastKey) return;
      previewHealthLastKey = nextKey;
      window.parent.postMessage({
        source: 'twinkle-build',
        previewNonce: previewBridgeNonce,
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
          updatedAt: Date.now()
        }
      }, parentMessageTargetOrigin);
    } catch (_) {}
  }

  function schedulePreviewHealthSnapshot() {
    if (!hostVisibilityState.visible) return;
    if (previewHealthMutationTimer) return;
    previewHealthMutationTimer = setTimeout(function() {
      previewHealthMutationTimer = null;
      reportPreviewHealthSnapshot(false);
    }, 120);
  }

  function scheduleForcedPreviewHealthSnapshot() {
    if (!hostVisibilityState.visible) return;
    requestAnimationFrame(function() {
      // Let the queued viewport-fit pass settle first so overflow checks
      // reflect the fitted game canvas instead of the pre-fit layout.
      reportPreviewHealthSnapshot(true);
    });
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
    if (!hostVisibilityState.visible) return;
    if (blankRenderProbeState.scheduled || blankRenderProbeState.reported) return;
    blankRenderProbeState.scheduled = true;
    setTimeout(function() {
      blankRenderProbeState.scheduled = false;
      if (!hostVisibilityState.visible) return;
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
    previewHealthObserver = new MutationObserver(function(mutations) {
      if (shouldScheduleViewportFitFromMutations(mutations || [])) {
        scheduleViewportAppFit();
      }
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
    if (
      parentMessageTargetOrigin !== '*' &&
      event.origin !== parentMessageTargetOrigin
    ) {
      return;
    }
    const { source, id, type, payload, error, previewNonce } = event.data || {};
    if (source !== 'twinkle-parent') return;
    if (previewBridgeNonce && previewNonce !== previewBridgeNonce) return;
    if (type === 'host-visibility:update') {
      applyHostVisibility(!payload || payload.visible !== false);
      return;
    }
    if (type === 'chat:event') {
      dispatchChatEvent(payload);
      return;
    }
    if (!pendingRequests.has(id)) return;

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
    scheduleForcedPreviewHealthSnapshot();
    scheduleBlankRenderProbe();
  });

  window.addEventListener('load', function() {
    publishPreviewLayout(true);
    scheduleViewportAppFit();
    scheduleForcedPreviewHealthSnapshot();
    scheduleBlankRenderProbe();
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
        disableAutomaticViewportAppMode();
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
        disableAutomaticViewportAppMode();
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
        disableAutomaticViewportAppMode();
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
        disableAutomaticViewportAppMode();
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

    chat: {
      async listRooms() {
        return await sendRequest('chat:list-rooms', {});
      },

      async createRoom(roomOrOptions) {
        var options =
          typeof roomOrOptions === 'string'
            ? { roomKey: roomOrOptions }
            : roomOrOptions || {};
        var roomKey = normalizeChatRoomKey(options.roomKey || options.key);
        return await sendRequest('chat:create-room', {
          roomKey: roomKey,
          name: options.name
        });
      },

      async listMessages(roomKey, opts) {
        var normalizedRoomKey = normalizeChatRoomKey(roomKey);
        var options = opts || {};
        return await sendRequest('chat:list-messages', {
          roomKey: normalizedRoomKey,
          cursor: options.cursor,
          limit: options.limit
        });
      },

      async sendMessage(roomKey, messageOrOptions, opts) {
        var normalizedRoomKey = normalizeChatRoomKey(roomKey);
        var options =
          typeof messageOrOptions === 'string'
            ? Object.assign({}, opts || {}, { text: messageOrOptions })
            : messageOrOptions || {};
        var rawText =
          options.text != null
            ? options.text
            : options.message != null
              ? options.message
              : options.content;
        var text = String(rawText || '').trim();
        if (!text) throw new Error('text is required');
        return await sendRequest('chat:send-message', {
          roomKey: normalizedRoomKey,
          roomName: options.roomName,
          text: text,
          metadata: options.metadata,
          clientMessageId: options.clientMessageId || getRequestId()
        });
      },

      async deleteMessage(messageId) {
        if (!messageId) throw new Error('messageId is required');
        return await sendRequest('chat:delete-message', {
          messageId: messageId
        });
      },

      subscribe(roomKey, listener) {
        var normalizedRoomKey = normalizeChatRoomKey(roomKey);
        if (typeof listener !== 'function') {
          throw new Error('listener is required');
        }
        var listeners = getChatListenerSet(normalizedRoomKey);
        listeners.add(listener);
        sendRequest('chat:subscribe', {
          roomKey: normalizedRoomKey
        }).catch(function(error) {
          console.warn('Twinkle.chat.subscribe failed:', error);
        });
        return function unsubscribe() {
          var currentListeners =
            chatSubscriptionListeners.get(normalizedRoomKey);
          if (!currentListeners) return;
          currentListeners.delete(listener);
          if (currentListeners.size > 0) return;
          chatSubscriptionListeners.delete(normalizedRoomKey);
          sendRequest('chat:unsubscribe', {
            roomKey: normalizedRoomKey
          }).catch(function(error) {
            console.warn('Twinkle.chat.unsubscribe failed:', error);
          });
        };
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
