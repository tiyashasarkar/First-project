// The very first thing anyone sees: your actual handmade journal cover
// photo, lying on the screen. The photo itself is never redrawn or
// replaced. The front cover is split into its own left/right crops of
// that SAME photo (icons/cover/journal-cover-left.jpg /
// journal-cover-right.jpg) so it can swing open like a real double cover
// — left panel opens to the left, right panel opens to the right, hinged
// at their own outer edges — revealing a baby-yellow felt inside page.
// Charms, the elastic, and a handful of stickers are separate crops of
// the same photo layered in exact registration on top of where they
// already sit, so at rest the page is indistinguishable from the plain
// photo, and only moves when actually touched.
//
// Opening is driven by the elastic string: drag it upward past a small
// threshold and it releases, the charms jiggle, a brief pause settles
// that motion, then both cover flaps swing open together — slow enough
// to see every stage — handing off to whatever screen comes next.
//
// Markup/positioning live here + css/cover.css; interaction physics
// (tilt, charm sway, sticker drag, the elastic gesture) live in
// ../journal-physics.js.
import { initTilt, initCharmProximity, wireCharmPulseCleanup, pulseCharms, makeDraggable, makeElasticOpenable, prefersReducedMotion } from "../journal-physics.js";

const IMG_FULL = "icons/cover/journal-cover.jpg";
const IMG_LEFT = "icons/cover/journal-cover-left.jpg";
const IMG_RIGHT = "icons/cover/journal-cover-right.jpg";

// The source photo is 835x1208, split at x=417 into a 417-wide left flap
// and a 418-wide right flap. Every position below is a pixel-accurate
// crop from that photo, converted to a percentage of whichever flap (or
// the full stage, for charms/elastic) it belongs to, so it re-aligns
// perfectly at any screen size. Two stickers (the heart doodle and the
// flowers postcard) straddle the split almost exactly down the middle,
// so they stay as part of the flap artwork rather than separate
// draggable pieces — everything else sits cleanly on one side.
const LEFT_STICKERS = [
  { id: "cherries", src: "icons/cover/sticker-cherries.jpg", left: 17.27, top: 52.32, width: 39.81 },
  { id: "mushroom", src: "icons/cover/sticker-mushroom.jpg", left: 25.42, top: 73.84, width: 54.20 },
  { id: "tape", src: "icons/cover/sticker-tape.jpg", left: 47.48, top: 66.89, width: 34.53 },
];

const RIGHT_STICKERS = [
  { id: "headphones", src: "icons/cover/sticker-headphones.jpg", left: 3.59, top: 22.52, width: 31.10 },
  { id: "star", src: "icons/cover/sticker-star.jpg", left: 13.16, top: 6.29, width: 16.27 },
  { id: "bow", src: "icons/cover/sticker-bow.jpg", left: 23.44, top: 10.60, width: 55.74 },
];

// Charms + elastic sit on a full-stage overlay above both flaps (not
// inside either one) since they hang from the string, not glued to the
// paper — they fly off during the elastic-release stage, before the
// flaps themselves ever move.
const CHARMS = [
  { id: "coin", src: "icons/cover/charm-coin.jpg", left: 29.70, top: 43.71, width: 11.26 },
  { id: "pendant", src: "icons/cover/charm-pendant.jpg", left: 43.47, top: 43.71, width: 16.05 },
  { id: "shell", src: "icons/cover/charm-shell.jpg", left: 60.24, top: 44.12, width: 8.98 },
];

const ELASTIC = { left: 0, top: 42.72, width: 100, height: 2.81, src: "icons/cover/elastic-band.jpg" };

function stickerHtml(p) {
  return `<div class="jc-sticker" id="jc-piece-${p.id}" style="left:${p.left}%;top:${p.top}%;width:${p.width}%;"><div class="jc-sticker-inner"><img src="${p.src}" alt="" draggable="false" /></div></div>`;
}

export function renderCover(container, onOpened) {
  const reduced = prefersReducedMotion();
  let opened = false;

  const leftHtml = LEFT_STICKERS.map(stickerHtml).join("");
  const rightHtml = RIGHT_STICKERS.map(stickerHtml).join("");
  const charmsHtml = CHARMS.map((c) => `<div class="jc-charm" id="jc-charm-${c.id}" style="left:${c.left}%;top:${c.top}%;width:${c.width}%;"><img src="${c.src}" alt="" draggable="false" /></div>`).join("");

  container.innerHTML = `
    <div class="cover-backdrop" style="background-image:url('${IMG_FULL}');"></div>
    <div class="cover-stage" id="cover-stage">
      <div class="cover-ambient-shadow"></div>
      <div class="journal-cover3d" id="journal-cover3d">
        <div class="jc-inner-page">
          <div class="jc-inside-hint">turning the page&hellip;</div>
        </div>
        <div class="jc-flap jc-flap-left" id="jc-flap-left" role="button" tabindex="0" aria-label="Open your journal" style="background-image:url('${IMG_LEFT}');">
          ${leftHtml}
        </div>
        <div class="jc-flap jc-flap-right" id="jc-flap-right" style="background-image:url('${IMG_RIGHT}');">
          ${rightHtml}
        </div>
        <div class="jc-overlay" id="jc-overlay">
          <div class="jc-elastic" id="jc-elastic" style="left:${ELASTIC.left}%;top:${ELASTIC.top}%;width:${ELASTIC.width}%;height:${ELASTIC.height}%;">
            <img class="jc-elastic-img" src="${ELASTIC.src}" alt="" draggable="false" />
          </div>
          ${charmsHtml}
          <div class="jc-open-hint" id="jc-open-hint">pull the string to open</div>
        </div>
      </div>
    </div>
  `;

  const stage = container.querySelector("#cover-stage");
  const book = container.querySelector("#journal-cover3d");
  const flapLeft = container.querySelector("#jc-flap-left");
  const flapRight = container.querySelector("#jc-flap-right");
  const overlay = container.querySelector("#jc-overlay");
  const elastic = container.querySelector("#jc-elastic");
  const hint = container.querySelector("#jc-open-hint");
  const bow = container.querySelector("#jc-piece-bow");

  initTilt(stage, book, { max: 4 });
  initCharmProximity(elastic, container);
  wireCharmPulseCleanup(container);
  container.querySelectorAll(".jc-sticker").forEach((el) => makeDraggable(el));

  function reactToElasticTouch() {
    pulseCharms(container);
    if (bow) {
      bow.classList.remove("wobble");
      void bow.offsetWidth;
      bow.classList.add("wobble");
    }
  }
  if (bow) {
    bow.addEventListener("animationend", (e) => {
      if (e.animationName === "bowWobble") bow.classList.remove("wobble");
    });
  }

  function finish(onOpenedCb) {
    let done = false;
    return () => {
      if (done) return;
      done = true;
      onOpenedCb();
    };
  }

  function openJournal() {
    if (opened) return;
    opened = true;
    container.classList.add("is-opening");
    const doFinish = finish(onOpened);

    if (reduced) {
      setTimeout(doFinish, 260);
      return;
    }

    // Stage 1: the elastic finishes releasing and the charms react.
    elastic.classList.add("releasing");
    reactToElasticTouch();
    overlay.classList.add("fading");

    // Stage 2: a short natural pause once things have settled, then both
    // cover flaps swing open together — slow and deliberate, not a snap.
    setTimeout(() => {
      flapLeft.classList.add("open");
      flapRight.classList.add("open");
    }, 1050);

    flapLeft.addEventListener("transitionend", function handler(e) {
      if (e.propertyName !== "transform") return;
      flapLeft.removeEventListener("transitionend", handler);
      doFinish();
    });
    // Safety net in case a transitionend event gets dropped (e.g. tab
    // backgrounded mid-animation) — never leave the app stuck on the cover.
    setTimeout(doFinish, 3400);
  }

  // Primary interaction: drag the elastic string upward to release it.
  makeElasticOpenable(elastic, {
    threshold: 44,
    onDragStart: () => {
      hint.classList.add("hidden");
      reactToElasticTouch();
    },
    onOpen: openJournal,
  });

  // Fallback: tapping either flap directly also opens it, so the
  // experience never feels like a hidden puzzle.
  function handleFlapClick(e) {
    if (e.target.closest(".jc-sticker.dragging, .jc-sticker.settling")) return;
    openJournal();
  }
  flapLeft.addEventListener("click", handleFlapClick);
  flapRight.addEventListener("click", handleFlapClick);
  flapLeft.addEventListener("keydown", (e) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      openJournal();
    }
  });
}
