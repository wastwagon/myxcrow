/**
 * WebViewGold chrome (web-only). Makes the native status bar transparent so the
 * page background paints behind the clock / signal. Safe in mobile Safari:
 * schemes are always sent via a hidden iframe; location.href is WKWebView-only.
 */
(function () {
  var DARK_HEX = '#1f1414';
  var DARK_RGB = '31,20,20';
  var GROUPED_HEX = '#f2f2f7';
  var GROUPED_RGB = '242,242,247';
  var AUTH_PATH = /^\/(login|register|forgot-password|reset-password)$/;
  var PUBLIC_LIGHT_PATH = /^\/(confirm-delivery|terms|privacy|support|404|500)$/;
  var CUSTOMER_PATH =
    /^\/(dashboard|escrows|wallet|disputes|profile|kyc|change-password|payments)(\/|$)/;

  function chromeForPath(path) {
    var p = path || '';
    if (p.length > 1 && p.charAt(p.length - 1) === '/') p = p.slice(0, -1);
    if (p === '/') {
      return { hex: DARK_HEX, rgb: DARK_RGB, text: 'white' };
    }
    return { hex: GROUPED_HEX, rgb: GROUPED_RGB, text: 'black' };
  }

  function ping(url) {
    try {
      var iframe = document.createElement('iframe');
      iframe.setAttribute('aria-hidden', 'true');
      iframe.setAttribute('tabindex', '-1');
      iframe.style.cssText =
        'display:none;width:0;height:0;border:0;position:absolute;left:-9999px';
      iframe.src = url;
      (document.body || document.documentElement).appendChild(iframe);
      setTimeout(function () {
        if (iframe.parentNode) iframe.parentNode.removeChild(iframe);
      }, 1000);
    } catch (e) {
      /* ignore */
    }
  }

  /**
   * Native WebViewGold: iOS WKWebView has no window.safari (Safari does).
   * Never treat CriOS / FxiOS / etc. as native — location.href would show
   * “cannot open page”. Always iframe-ping regardless of this result.
   */
  function isNativeWebView() {
    var ua = navigator.userAgent || '';
    var isIOS = /iPhone|iPad|iPod/i.test(ua);
    var isAndroid = /Android/i.test(ua);
    if (isIOS) {
      if (typeof window.safari !== 'undefined') return false;
      if (/CriOS|FxiOS|EdgiOS|OPiOS|DuckDuckGo|GSA\//i.test(ua)) return false;
      return true;
    }
    if (isAndroid) {
      return /; wv\)/i.test(ua);
    }
    return false;
  }

  function isIOS() {
    return /iPhone|iPad|iPod/i.test(navigator.userAgent || '');
  }

  function fallbackSatPx() {
    var h = (window.screen && window.screen.height) || 0;
    if (h >= 852) return 59;
    if (h >= 812) return 47;
    return 20;
  }

  function envSatPx() {
    var probe = document.createElement('div');
    probe.style.cssText =
      'position:absolute;visibility:hidden;pointer-events:none;' +
      'height:constant(safe-area-inset-top);height:env(safe-area-inset-top, 0px)';
    (document.body || document.documentElement).appendChild(probe);
    var px = probe.getBoundingClientRect().height || 0;
    if (probe.parentNode) probe.parentNode.removeChild(probe);
    return Math.round(px);
  }

  function isEdgeToEdge() {
    var screenH = (window.screen && window.screen.height) || 0;
    var innerH = window.innerHeight || 0;
    if (!screenH) return false;
    return Math.abs(innerH - screenH) <= 8;
  }

  var lastSat = null;

  function applySat() {
    var envPx = envSatPx();
    var sat = envPx;
    // Only invent a status-bar height when the webview already fills the screen.
    // If env is 0 and the webview is inset below the native bar, leave 0 so we
    // do not double the empty band.
    if (envPx === 0 && isIOS() && isEdgeToEdge()) {
      sat = fallbackSatPx();
    }
    if (lastSat === sat) return;
    lastSat = sat;
    document.documentElement.style.setProperty('--app-sat', sat + 'px');
  }

  function applyChrome(path) {
    var chrome = chromeForPath(path);
    var p = path || '';
    if (p.length > 1 && p.charAt(p.length - 1) === '/') p = p.slice(0, -1);
    var isCustomer =
      CUSTOMER_PATH.test(p) && !/^\/wallet\/admin/.test(p);
    var isAdminLight = /^\/admin(\/|$)/.test(p) || /^\/wallet\/admin/.test(p);
    var isPublicLight =
      AUTH_PATH.test(p) ||
      PUBLIC_LIGHT_PATH.test(p) ||
      /^\/partner\/checkout/.test(p) ||
      isAdminLight;
    document.documentElement.classList.toggle('customer-app', isCustomer);
    document.documentElement.classList.toggle('public-light', isPublicLight);
    document.documentElement.style.setProperty('--app-chrome-bg', chrome.hex);
    var theme = document.querySelector('meta[name="theme-color"]');
    if (theme) theme.setAttribute('content', chrome.hex);
    return chrome;
  }

  function runNativeSchemes(chrome, useLocationHref) {
    // Custom schemes are WebViewGold-only. In Safari/Chrome they become empty
    // iframe URLs, CSP blocks Framing '', and the messenger overlay can freeze the page.
    if (!isNativeWebView()) return;

    ping('hidebars://on');
    ping('statusbarcolor://' + chrome.rgb);
    ping('statusbartextcolor://' + chrome.text);

    if (!useLocationHref) return;

    // iOS WebViewGold often only honors one location.href scheme per page load.
    try {
      window.location.href = 'hidebars://on';
    } catch (e) {
      /* ignore */
    }
    setTimeout(function () {
      try {
        window.location.href = 'statusbarcolor://' + chrome.rgb;
      } catch (e) {
        /* ignore */
      }
    }, 350);
  }

  function init() {
    try {
      var chrome = applyChrome(location.pathname);
      applySat();
      runNativeSchemes(chrome, true);
    } catch (e) {
      /* never take down the page for chrome */
    }
  }

  window.__myxcrowApplyChrome = function (path) {
    try {
      var chrome = applyChrome(path || location.pathname);
      if (isNativeWebView()) {
        // SPA navigations: iframe only. Do not use location.href again.
        ping('statusbarcolor://' + chrome.rgb);
        ping('statusbartextcolor://' + chrome.text);
      }
      applySat();
    } catch (e) {
      /* never take down the page for chrome */
    }
  };

  init();

  function onViewportChange() {
    applySat();
  }

  if (window.visualViewport) {
    window.visualViewport.addEventListener('resize', onViewportChange);
  }
  window.addEventListener('resize', onViewportChange);
  setTimeout(applySat, 400);
  setTimeout(applySat, 1000);
})();
