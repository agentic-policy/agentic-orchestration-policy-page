(() => {
  'use strict';
  const section = document.querySelector('#task-coverage');
  if (!section) return;
  const rail = section.querySelector('.coverage-rail');
  const filter = section.querySelector('select');
  const driftToggle = section.querySelector('.coverage-drift-toggle');
  const originals = [...rail.children];
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  let visibleCards = [];
  let itemWidth = 0;
  let cycleWidth = 0;
  let settle;
  const players = new Map();
  let playbackFrame = 0;
  const driftSpeed = 18; // CSS pixels per second, independent of display refresh rate.
  let driftFrame = 0;
  let driftTimer = 0;
  let driftTime = 0;
  let driftPosition = 0;
  let resumeAfter = 0;
  let readerPaused = false;
  let hovering = false;
  const pointers = new Set();

  function canDrift() {
    const bounds = rail.getBoundingClientRect();
    const visibleHeight = Math.min(bounds.bottom, innerHeight) - Math.max(bounds.top, 0);
    const focused = document.activeElement;
    return !document.hidden && !reduced.matches && !readerPaused && !hovering &&
      !pointers.size && !document.fullscreenElement &&
      !(section.contains(focused) && focused !== driftToggle && focused.matches(':focus-visible')) &&
      visibleHeight > Math.min(120, bounds.height / 2);
  }

  function scheduleDrift() {
    clearTimeout(driftTimer);
    if (!canDrift() || performance.now() < resumeAfter) {
      cancelAnimationFrame(driftFrame);
      driftFrame = 0;
      driftTime = 0;
      if (canDrift() && performance.now() < resumeAfter) {
        driftTimer = setTimeout(scheduleDrift, resumeAfter - performance.now() + 20);
      }
      return;
    }
    if (!driftFrame) {
      driftPosition = rail.scrollLeft;
      driftFrame = requestAnimationFrame(drift);
    }
  }

  function drift(now) {
    if (!canDrift() || now < resumeAfter) {
      driftFrame = 0;
      scheduleDrift();
      return;
    }
    if (driftTime) {
      // Accumulate subpixels: rounding scrollLeft each frame would stall a slow drift.
      driftPosition += Math.min(now - driftTime, 64) * driftSpeed / 1000;
      rail.scrollLeft = driftPosition;
      centerCycle();
    }
    driftTime = now;
    driftFrame = requestAnimationFrame(drift);
  }

  function giveReaderControl() {
    resumeAfter = performance.now() + 4000;
    scheduleDrift();
  }

  function updateDriftToggle() {
    driftToggle.hidden = reduced.matches;
    driftToggle.dataset.paused = String(readerPaused);
    const label = readerPaused ? 'Resume gallery' : 'Pause gallery';
    driftToggle.setAttribute('aria-label', label);
    driftToggle.title = label;
  }

  function detach(player) {
    player.video.remove();
    player.link.hidden = false;
  }

  function suspend(player) {
    if (!player.visible) return;
    // Preserve an explicit pause when the reader returns to this case.
    if (!readerPaused) player.resume = !player.video.paused;
    player.visible = false;
    player.video.pause();
  }

  function copyCard(card) {
    const copy = card.cloneNode(true);
    copy.setAttribute('aria-hidden', 'true');
    copy.querySelector('a').tabIndex = -1;
    return copy;
  }

  function measure() {
    const children = rail.children;
    const origin = children[0].getBoundingClientRect().left;
    itemWidth = children[1].getBoundingClientRect().left - origin;
    cycleWidth = children[visibleCards.length].getBoundingClientRect().left - origin;
  }

  // Only the middle copy is in the keyboard and accessibility reading order.
  // Reposition by a whole cycle, so the same cards occupy the same pixels.
  function centerCycle() {
    if (!cycleWidth) return;
    const left = rail.scrollLeft;
    if (left < cycleWidth - 1 || left >= 2 * cycleWidth - 1) {
      const offset = ((left % cycleWidth) + cycleWidth) % cycleWidth;
      rail.scrollLeft = cycleWidth + offset;
      driftPosition += rail.scrollLeft - left;
      if (drag?.moved) drag.left += rail.scrollLeft - left;
    }
  }

  function render() {
    clearTimeout(settle);
    for (const player of players.values()) {
      suspend(player);
      detach(player);
    }
    visibleCards = originals.filter(card => !filter.value || card.dataset.category === filter.value);
    rail.replaceChildren(...visibleCards.map(copyCard), ...visibleCards, ...visibleCards.map(copyCard));
    measure();
    rail.scrollLeft = cycleWidth;
    driftPosition = rail.scrollLeft;
    queuePlayback();
  }

  function step(direction) {
    centerCycle();
    const target = (Math.round(rail.scrollLeft / itemWidth) + direction) * itemWidth;
    rail.scrollTo({ left:target, behavior:reduced.matches ? 'instant' : 'smooth' });
  }

  function mount(link, manual) {
    const card = link.closest('article');
    const key = card.dataset.setting;
    let player = players.get(key);
    if (!player) {
      const video = document.createElement('video');
      video.controls = true;
      video.playsInline = true;
      video.defaultMuted = true;
      video.muted = true;
      video.loop = true;
      video.preload = 'metadata';
      video.poster = link.querySelector('img').src;
      video.setAttribute('aria-label', link.getAttribute('aria-label').replace('Play ACAP rollout:', 'ACAP execution at 8×:'));
      video.src = link.href;
      player = { video, link, visible:false, manual:false, resume:true };
      players.set(key, player);
      video.addEventListener('error', () => {
        player.resume = false;
        detach(player);
        players.delete(key);
      }, { once:true });
    }
    const { video } = player;
    const moving = video.parentElement !== link.parentElement;
    if (player.visible && !moving && !manual) return;
    if (moving) {
      if (player.visible && !readerPaused) player.resume = !video.paused;
      detach(player);
      player.link = link;
      link.hidden = true;
      // Reuse the same media clock when the rail wraps to another copy.
      link.parentElement.append(video);
      video.tabIndex = card.hasAttribute('aria-hidden') ? -1 : 0;
    }
    player.visible = true;
    if (manual || (!readerPaused && player.resume)) video.play().catch(() => {}); // Native controls remain available.
    if (manual) {
      player.manual = true;
      video.focus({ preventScroll:true });
    }
  }

  function updatePlayback() {
    const showing = new Map();
    const bounds = rail.getBoundingClientRect();
    if (!document.hidden && bounds.top < innerHeight && bounds.bottom > 0 && itemWidth) {
      const first = Math.max(0, Math.floor(rail.scrollLeft / itemWidth) - 1);
      const last = Math.min(rail.children.length, first + Math.ceil(rail.clientWidth / itemWidth) + 3);
      for (let i = first; i < last; i++) {
        const card = rail.children[i];
        if (reduced.matches && !players.get(card.dataset.setting)?.manual) continue;
        const area = card.querySelector('.coverage-image').getBoundingClientRect();
        if (area.bottom > 0 && area.top < innerHeight &&
            area.right > Math.max(0,bounds.left) && area.left < Math.min(innerWidth,bounds.right)) {
          showing.set(card.dataset.setting, card.querySelector('.coverage-play'));
        }
      }
    }
    for (const [key,player] of players) {
      if (showing.has(key)) continue;
      suspend(player);
      if (reduced.matches && !player.manual && player.video.parentElement) detach(player);
    }
    for (const link of showing.values()) mount(link, false);
  }

  // Sample current bounds once per paint. A rapid scroll or a filter change
  // can replace a visible copy of a card before an observer reports it.
  function queuePlayback() {
    if (playbackFrame) return;
    playbackFrame = requestAnimationFrame(() => {
      playbackFrame = 0;
      updatePlayback();
      scheduleDrift();
    });
  }

  function queueCenter() {
    clearTimeout(settle);
    settle = setTimeout(() => { if (!drag?.moved) centerCycle(); }, 160);
  }

  let drag = null;
  let blockClick = false;
  rail.addEventListener('pointerdown', event => {
    blockClick = false;
    if (event.pointerType !== 'mouse' || event.button !== 0) return;
    const video = event.target.closest('video');
    if (video && (document.fullscreenElement || event.clientY > video.getBoundingClientRect().bottom - 48)) return;
    drag = { x:event.clientX, y:event.clientY, left:rail.scrollLeft, moved:false };
  });
  rail.addEventListener('dragstart', event => event.preventDefault());
  rail.addEventListener('pointermove', event => {
    if (!drag || event.buttons !== 1) return;
    const dx = event.clientX - drag.x;
    if (!drag.moved) {
      if (Math.abs(dx) < 6 || Math.abs(dx) < Math.abs(event.clientY-drag.y)) return;
      drag.moved = true;
      rail.setPointerCapture(event.pointerId);
    }
    rail.scrollLeft = drag.left - dx;
  });
  function endDrag() {
    if (drag?.moved) {
      blockClick = true;
      queueCenter();
    }
    drag = null;
  }
  rail.addEventListener('pointerup', endDrag);
  rail.addEventListener('pointercancel', endDrag);
  rail.addEventListener('click', event => {
    if (blockClick) { blockClick = false; event.preventDefault(); return; }
    const link = event.target.closest('.coverage-play');
    if (!link || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
    event.preventDefault();
    mount(link, true);
    queuePlayback();
  });
  rail.addEventListener('keydown', event => {
    if (event.target.closest('video')) {
      if (event.key === 'Escape' && !document.fullscreenElement) {
        const key = event.target.closest('article').dataset.setting;
        const player = players.get(key);
        suspend(player);
        player.manual = false;
        player.resume = false;
        detach(player);
        player.link.focus({ preventScroll:true });
      }
      return;
    }
    if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
      event.preventDefault();
      rail.focus({ preventScroll:true });
      step(event.key === 'ArrowLeft' ? -1 : 1);
    }
  });
  rail.addEventListener('scroll', () => {
    if (rail.scrollLeft < itemWidth || rail.scrollLeft + rail.clientWidth > rail.scrollWidth - itemWidth) centerCycle();
    queueCenter();
    queuePlayback();
  }, { passive:true });
  section.querySelectorAll('[data-shift]').forEach(button =>
    button.addEventListener('click', () => {
      giveReaderControl();
      step(Number(button.dataset.shift));
    }));
  filter.addEventListener('change', () => {
    giveReaderControl();
    render();
  });
  driftToggle.addEventListener('click', () => {
    readerPaused = !readerPaused;
    resumeAfter = 0;
    for (const player of players.values()) {
      if (!player.visible) continue;
      if (readerPaused) {
        player.resume = !player.video.paused;
        player.video.pause();
      } else if (player.resume) {
        player.video.play().catch(() => {});
      }
    }
    updateDriftToggle();
    queuePlayback();
    scheduleDrift();
  });
  rail.addEventListener('pointerenter', event => {
    if (event.pointerType === 'mouse') { hovering = true; scheduleDrift(); }
  });
  rail.addEventListener('pointerleave', event => {
    if (event.pointerType === 'mouse') { hovering = false; scheduleDrift(); }
  });
  section.addEventListener('pointerdown', event => {
    if (driftToggle.contains(event.target)) return;
    pointers.add(event.pointerId);
    giveReaderControl();
  }, { passive:true });
  function releasePointer(event) {
    if (pointers.delete(event.pointerId)) giveReaderControl();
  }
  window.addEventListener('pointerup', releasePointer, { passive:true });
  window.addEventListener('pointercancel', releasePointer, { passive:true });
  rail.addEventListener('wheel', giveReaderControl, { passive:true });
  // Native momentum scrolling keeps priority until it settles.
  rail.addEventListener('scroll', () => {
    if (performance.now() < resumeAfter) giveReaderControl();
  }, { passive:true });
  section.addEventListener('keydown', event => {
    if (!driftToggle.contains(event.target)) giveReaderControl();
  });
  section.addEventListener('focusin', scheduleDrift);
  section.addEventListener('focusout', () => requestAnimationFrame(scheduleDrift));
  updateDriftToggle();
  render();

  // Jump directly past the pinned method chapter when opening the gallery
  // from its section link, including a same-document hash navigation.
  function alignSectionLink() {
    if (location.hash === '#task-coverage') section.scrollIntoView({ behavior:'instant', block:'start' });
  }
  window.addEventListener('hashchange', alignSectionLink);
  if (location.hash === '#task-coverage') requestAnimationFrame(alignSectionLink);

  let lastWidth = rail.clientWidth;
  new ResizeObserver(() => {
    if (rail.clientWidth === lastWidth) return;
    lastWidth = rail.clientWidth;
    const index = Math.round(rail.scrollLeft / itemWidth) % visibleCards.length;
    measure();
    rail.scrollLeft = cycleWidth + index * itemWidth;
    driftPosition = rail.scrollLeft;
    queuePlayback();
  }).observe(rail);
  new IntersectionObserver(queuePlayback).observe(rail);
  window.addEventListener('scroll', queuePlayback, { passive:true });
  window.addEventListener('resize', queuePlayback);
  document.addEventListener('visibilitychange', queuePlayback);
  document.addEventListener('fullscreenchange', scheduleDrift);
  reduced.addEventListener('change', () => {
    updateDriftToggle();
    queuePlayback();
  });
})();
