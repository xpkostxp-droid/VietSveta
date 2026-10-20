/** Refresh a Home Screen installation when a new GitHub Pages build is available. */
export function startAutoUpdate(currentVersion: string, navigate = (url: string) => window.location.replace(url)) {
  let checking = false;
  let pendingVersion = '';
  let navigating = false;
  const versionUrl = new URL('version.json', document.baseURI);
  const storageKey = `vietSveta.updateAttempt:${versionUrl.pathname}`;

  function applyUpdate() {
    if (!pendingVersion || navigating || document.visibilityState === 'hidden') return;
    // Keep a running exercise or audio intact. Retry after the activity ends.
    if (document.querySelector('.screen-training:not(.screen-summary)')) return;
    if (Array.from(document.querySelectorAll('audio, video')).some(media => {
      const player = media as HTMLMediaElement;
      return !player.paused && !player.ended;
    })) return;
    if (window.speechSynthesis?.speaking) return;

    try {
      const previous = JSON.parse(sessionStorage.getItem(storageKey) || 'null');
      if (previous?.version === pendingVersion && Date.now() - previous.time < 300_000) return;
      sessionStorage.setItem(storageKey, JSON.stringify({ version: pendingVersion, time: Date.now() }));
    } catch { /* Updating still works if storage is unavailable. */ }
    navigating = true;
    const url = new URL(window.location.href);
    // A new document URL bypasses Safari's cached HTML while keeping the icon.
    url.searchParams.set('_v', pendingVersion);
    navigate(url.href);
  }

  async function check() {
    if (checking || navigating || document.visibilityState === 'hidden' || navigator.onLine === false) return;
    checking = true;
    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), 10_000);
    try {
      const url = new URL(versionUrl);
      url.searchParams.set('check', String(Date.now()));
      const response = await fetch(url, { cache: 'no-store', signal: controller.signal });
      if (!response.ok) return;
      const data: unknown = await response.json();
      const version = (data as { version?: unknown } | null)?.version;
      if (typeof version !== 'string' || !/^[a-zA-Z0-9._-]{1,100}$/.test(version)) return;
      pendingVersion = version === currentVersion ? '' : version;
      applyUpdate();
    } catch { /* No connection: keep the currently loaded lesson usable. */ }
    finally { window.clearTimeout(timeout); checking = false; }
  }

  const checkVisible = () => { if (document.visibilityState !== 'hidden') void check(); };
  window.addEventListener('pageshow', checkVisible);
  window.addEventListener('focus', checkVisible);
  window.addEventListener('online', checkVisible);
  document.addEventListener('visibilitychange', checkVisible);
  const checkTimer = window.setInterval(() => void check(), 60_000);
  const retryTimer = window.setInterval(applyUpdate, 2_000);
  void check();
  return () => {
    navigating = true;
    window.clearInterval(checkTimer);
    window.clearInterval(retryTimer);
    window.removeEventListener('pageshow', checkVisible);
    window.removeEventListener('focus', checkVisible);
    window.removeEventListener('online', checkVisible);
    document.removeEventListener('visibilitychange', checkVisible);
  };
}
