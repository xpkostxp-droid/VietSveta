import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { startAutoUpdate } from './autoUpdate';

describe('automatic site updates', () => {
  let stop: (() => void) | undefined;
  const navigate = vi.fn();
  const fetchVersion = vi.fn();
  const settle = async () => { await Promise.resolve(); await Promise.resolve(); await Promise.resolve(); };
  beforeEach(() => {
    vi.useFakeTimers();
    vi.stubGlobal('fetch', fetchVersion);
    vi.spyOn(document, 'visibilityState', 'get').mockReturnValue('visible');
    vi.spyOn(navigator, 'onLine', 'get').mockReturnValue(true);
    sessionStorage.clear();
    document.body.innerHTML = '';
    fetchVersion.mockReset(); navigate.mockReset();
    fetchVersion.mockResolvedValue({ ok: true, json: async () => ({ version: 'build-new' }) });
  });
  afterEach(() => { stop?.(); vi.restoreAllMocks(); vi.unstubAllGlobals(); vi.useRealTimers(); });
  it('loads a changed version using a fresh document URL and an uncached version request', async () => {
    stop = startAutoUpdate('build-old', navigate); await settle();
    expect(navigate).toHaveBeenCalledTimes(1);
    expect(new URL(navigate.mock.calls[0][0]).searchParams.get('_v')).toBe('build-new');
    expect(fetchVersion.mock.calls[0][1].cache).toBe('no-store');
  });
  it('does not reload the current build', async () => {
    stop = startAutoUpdate('build-new', navigate); await settle();
    expect(navigate).not.toHaveBeenCalled();
  });
  it('defers an update until an exercise is finished', async () => {
    document.body.innerHTML = '<div class="screen-training"></div>';
    stop = startAutoUpdate('old', navigate); await settle();
    expect(navigate).not.toHaveBeenCalled();
    document.querySelector('div')!.classList.add('screen-summary');
    vi.advanceTimersByTime(2000);
    expect(navigate).toHaveBeenCalledTimes(1);
  });
  it('defers while audio plays and updates when paused', async () => {
    document.body.innerHTML = '<audio></audio>';
    const paused = vi.spyOn(document.querySelector('audio')!, 'paused', 'get').mockReturnValue(false);
    stop = startAutoUpdate('old', navigate); await settle();
    expect(navigate).not.toHaveBeenCalled();
    paused.mockReturnValue(true); vi.advanceTimersByTime(2000);
    expect(navigate).toHaveBeenCalledTimes(1);
  });
  it('keeps the page usable offline and checks when the connection returns', async () => {
    const online = vi.spyOn(navigator, 'onLine', 'get').mockReturnValue(false);
    stop = startAutoUpdate('old', navigate); await settle();
    expect(fetchVersion).not.toHaveBeenCalled();
    online.mockReturnValue(true); window.dispatchEvent(new Event('online')); await settle();
    expect(navigate).toHaveBeenCalledTimes(1);
  });
  it('ignores failed or invalid version responses', async () => {
    fetchVersion.mockRejectedValueOnce(new Error('offline'));
    stop = startAutoUpdate('old', navigate); await settle();
    fetchVersion.mockResolvedValue({ ok: true, json: async () => ({ version: '<html>' }) });
    window.dispatchEvent(new Event('focus')); await settle();
    expect(navigate).not.toHaveBeenCalled();
  });
  it('prevents refresh loops if an edge still serves the previous build', async () => {
    stop = startAutoUpdate('old', navigate); await settle(); stop();
    stop = startAutoUpdate('old', navigate); await settle();
    expect(navigate).toHaveBeenCalledTimes(1);
  });
});
