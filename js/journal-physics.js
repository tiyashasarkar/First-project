// Small, dependency-free interaction helpers shared by the journal cover
// landing screen: cursor-driven tilt, charm sway/jiggle, and draggable
// "peel up" stickers. Pure CSS classes + Pointer Events — no physics
// engine, no build step. Kept separate from cover.js so the cover's markup
// and its interaction logic can be read/changed independently.

export function prefersReducedMotion() {
  return window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

// Subtle cursor-driven 3D tilt on the whole journal — mouse only (touch
// devices don't have a hovering cursor to react to), and skipped entirely
// under reduced motion.
export function initTilt(stage, target, { max = 5 } = {}) {
  if (prefersReducedMotion()) return;
  let raf = null;
  stage.addEventListener("pointermove", (e) => {
    if (e.pointerType !== "mouse") return;
    const rect = stage.getBoundingClientRect();
    const px = (e.clientX - rect.left) / rect.width - 0.5;
    const py = (e.clientY - rect.top) / rect.height - 0.5;
    if (raf) cancelAnimationFrame(raf);
    raf = requestAnimationFrame(() => {
      target.style.setProperty("--tilt-x", (-py * max).toFixed(2) + "deg");
      target.style.setProperty("--tilt-y", (px * max).toFixed(2) + "deg");
    });
  });
  stage.addEventListener("pointerleave", () => {
    target.style.setProperty("--tilt-x", "0deg");
    target.style.setProperty("--tilt-y", "0deg");
  });
}

// Idle sway lives entirely in CSS keyframes (see cover.css); this just
// triggers a bigger, one-off jiggle — e.g. when the elastic is released or
// the cursor brushes past — by swapping in a second animation briefly.
export function pulseCharms(root) {
  const charms = root.querySelectorAll(".jc-charm");
  charms.forEach((charm, i) => {
    setTimeout(() => {
      charm.classList.remove("pulse");
      void charm.offsetWidth; // restart the animation if it's already mid-pulse
      charm.classList.add("pulse");
    }, i * 60);
  });
}

export function initCharmProximity(triggerEl, root) {
  if (prefersReducedMotion()) return;
  let last = 0;
  triggerEl.addEventListener("pointerenter", () => {
    const now = Date.now();
    if (now - last < 900) return;
    last = now;
    pulseCharms(root);
  });
}

export function wireCharmPulseCleanup(root) {
  root.querySelectorAll(".jc-charm").forEach((charm) => {
    charm.addEventListener("animationend", (e) => {
      if (e.animationName === "charmPulse") charm.classList.remove("pulse");
    });
  });
}

// Makes the elastic string itself the "open" gesture: drag it upward and,
// past a small threshold, it releases and the caller's onOpen fires. Released
// early (before the threshold), it springs back to rest. Tracks vertical
// movement only, with a little resistance so it feels like real tension
// rather than a free-floating drag.
export function makeElasticOpenable(elasticEl, { threshold = 44, onDragStart, onDragProgress, onOpen } = {}) {
  elasticEl.style.touchAction = "none";
  let dragging = false, startY = 0, pointerId = null, triggered = false;

  function setDrag(px) {
    elasticEl.style.setProperty("--elastic-drag", px.toFixed(1) + "px");
  }

  function onDown(e) {
    if (triggered || dragging) return;
    dragging = true;
    pointerId = e.pointerId;
    elasticEl.setPointerCapture(pointerId);
    startY = e.clientY;
    elasticEl.classList.add("dragging");
    if (onDragStart) onDragStart();
  }

  function onMove(e) {
    if (!dragging || e.pointerId !== pointerId) return;
    // Only upward movement stretches the string; a little resistance
    // (sqrt curve) keeps it from feeling like it's flying off too easily.
    const raw = Math.max(0, startY - e.clientY);
    const dist = Math.sqrt(raw) * 5.5;
    setDrag(-Math.min(dist, threshold * 1.4));
    if (onDragProgress) onDragProgress(Math.min(1, dist / threshold));
    if (dist >= threshold && !triggered) {
      triggered = true;
      dragging = false;
      try { elasticEl.releasePointerCapture(pointerId); } catch {}
      elasticEl.classList.remove("dragging");
      if (onOpen) onOpen();
    }
  }

  function onUp(e) {
    if (!dragging || e.pointerId !== pointerId) return;
    dragging = false;
    elasticEl.classList.remove("dragging");
    setDrag(0);
    if (onDragProgress) onDragProgress(0);
  }

  elasticEl.addEventListener("pointerdown", onDown);
  elasticEl.addEventListener("pointermove", onMove);
  elasticEl.addEventListener("pointerup", onUp);
  elasticEl.addEventListener("pointercancel", onUp);
}

// Makes an element pick-up-and-draggable with a paper "peel" feel: it
// tracks the pointer with a slight smoothing lag (a short CSS transition
// left running during the drag itself), lifts with rotation + scale, and
// springs back to its resting spot on release.
export function makeDraggable(el) {
  el.style.touchAction = "none";
  let startX = 0, startY = 0, dragging = false, pointerId = null;

  function onDown(e) {
    if (dragging) return;
    dragging = true;
    pointerId = e.pointerId;
    el.setPointerCapture(pointerId);
    startX = e.clientX;
    startY = e.clientY;
    el.classList.add("dragging");
  }

  function onMove(e) {
    if (!dragging || e.pointerId !== pointerId) return;
    const dx = e.clientX - startX;
    const dy = e.clientY - startY;
    const rot = Math.max(-16, Math.min(16, dx / 5));
    el.style.setProperty("--drag-x", dx.toFixed(1) + "px");
    el.style.setProperty("--drag-y", dy.toFixed(1) + "px");
    el.style.setProperty("--drag-rot", rot.toFixed(1) + "deg");
  }

  function onUp(e) {
    if (!dragging || e.pointerId !== pointerId) return;
    dragging = false;
    el.classList.remove("dragging");
    el.classList.add("settling");
    el.style.setProperty("--drag-x", "0px");
    el.style.setProperty("--drag-y", "0px");
    el.style.setProperty("--drag-rot", "0deg");
    setTimeout(() => el.classList.remove("settling"), 550);
  }

  el.addEventListener("pointerdown", onDown);
  el.addEventListener("pointermove", onMove);
  el.addEventListener("pointerup", onUp);
  el.addEventListener("pointercancel", onUp);
}
