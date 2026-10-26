// Background music shared by every page, muted by default. The footer icon
// turns it on, and that choice lasts until the tab is closed. The position is
// saved so the track picks up where it left off after a reload.
(() => {
  const KEY = 'bg-music';
  const src = new URL('audio/misty-mountains.mp3', document.currentScript.src).href;

  let state = {};
  try { state = JSON.parse(localStorage.getItem(KEY)) || {}; } catch {}
  // Every new visit starts muted; unmuting holds for the rest of the visit.
  try { state.muted = sessionStorage.getItem(KEY + '-muted') !== '0'; } catch { state.muted = true; }

  const audio = new Audio(src);
  audio.loop = true;
  // Skip downloading the track until someone turns it on.
  audio.preload = state.muted ? 'none' : 'auto';
  audio.volume = 0.4;

  const save = () => {
    if (!isNaN(audio.duration)) {
      state.time = audio.currentTime;
      state.savedAt = Date.now();
    }
    const { muted, ...position } = state;
    try { localStorage.setItem(KEY, JSON.stringify(position)); } catch {}
    try { sessionStorage.setItem(KEY + '-muted', muted ? '1' : '0'); } catch {}
  };

  // Carry on from the saved spot. A quick reload also adds the seconds that
  // passed while the next page loaded, so the song doesn't jump back.
  audio.addEventListener('loadedmetadata', () => {
    if (typeof state.time !== 'number') return;
    const away = (Date.now() - (state.savedAt || 0)) / 1000;
    const gap = !state.muted && away > 0 && away < 10 ? away : 0;
    audio.currentTime = (state.time + gap) % audio.duration;
  }, { once: true });

  const buttons = () => document.querySelectorAll('.footer-music');
  const render = () => {
    const playing = !audio.paused;
    buttons().forEach((b) => {
      b.setAttribute('aria-pressed', String(playing));
      b.setAttribute('aria-label', playing ? 'mute music' : 'play music');
    });
  };

  const unlockEvents = ['pointerdown', 'keydown', 'touchstart'];
  const stopWaiting = () => unlockEvents.forEach((e) => removeEventListener(e, unlock, true));
  const unlock = (event) => {
    // A click on the toggle itself is handled by the toggle.
    if (event.target.closest && event.target.closest('.footer-music')) return;
    stopWaiting();
    if (!state.muted) play();
  };
  const play = () => audio.play().then(stopWaiting).catch(() => {
    unlockEvents.forEach((e) => addEventListener(e, unlock, true));
  });

  const toggle = () => {
    if (audio.paused) {
      state.muted = false;
      stopWaiting();
      play();
    } else {
      state.muted = true;
      audio.pause();
    }
    save();
  };

  // Delegated, so toggles in footers swapped in by nav.js work too.
  document.addEventListener('click', (e) => {
    if (e.target.closest('.footer-music')) toggle();
  });
  document.addEventListener('page:load', render);
  audio.addEventListener('play', render);
  audio.addEventListener('pause', render);

  let lastSave = 0;
  audio.addEventListener('timeupdate', () => {
    if (Date.now() - lastSave > 1000) { lastSave = Date.now(); save(); }
  });
  addEventListener('pagehide', save);
  document.addEventListener('visibilitychange', () => { if (document.hidden) save(); });

  render();
  if (!state.muted) play();
})();
