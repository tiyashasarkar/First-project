// The very first thing anyone sees: your actual handmade journal cover
// photo, lying on the screen. The photo itself is never redrawn or
// replaced. Looking closely at the actual photo, it isn't two equal
// covers — it's one large yellow-paper front cover (~70% of the width)
// and a narrower lace-wrapped spine strip (~30%) that the elastic and
// charms hang against. So the cover splits the same way: a big front
// flap (icons/cover/journal-cover-large.jpg) hinged on its left edge,
// which is the only thing that opens — turning to the side like a real
// book cover — while the spine strip (journal-cover-spine.jpg) stays put,
// because a spine never opens.
//
// Every "sticker" and "charm" below is a real crop of that same photo,
// traced to its own silhouette (a CSS clip-path polygon) instead of a
// plain rectangle, so hovering/dragging one shows its actual outline —
// no visible squares. Flat paper stickers (cherries, the mushroom stamp
// card, the washi tape, the headphones sticker) are glued to the front
// cover, so they ride along with it as it opens. The coin, pendant and
// shell are different: they're metal charms hanging loose from the
// elastic string by their own jump rings, so they live on a separate
// overlay layer and swing/jiggle independently — while the string they
// hang from stays completely still, exactly like a real elastic band
// only reacts when something tugs on what's attached to it, not by
// stretching itself. (The safety pin's little star charm and the lace
// bow are both pinned/tied directly to the cover fabric rather than
// hanging loose, so they stay part of the photo they're printed on.)
//
// Markup/positioning live here + css/cover.css; interaction physics
// (tilt, charm sway, sticker drag, the elastic gesture) live in
// ../journal-physics.js.
import { initTilt, initCharmProximity, wireCharmPulseCleanup, pulseCharms, makeDraggable, makeElasticOpenable, prefersReducedMotion } from "../journal-physics.js";

const IMG_FULL = "icons/cover/journal-cover.jpg";
const IMG_COVER = "icons/cover/journal-cover-large.jpg";
const IMG_SPINE = "icons/cover/journal-cover-spine.jpg";

// The source photo is 835x1208; the seam between the paper cover and the
// lace spine sits at x=585 (~70%). Sticker positions below are percentages
// of the COVER FLAP itself (585 wide), since that's what they're glued to
// and travel with when it opens. Each `clip` is a clip-path polygon traced
// to that sticker's real die-cut silhouette, not its bounding box.
const STICKERS = [
  {
    id: "cherries", src: "icons/cover/sticker-cherries.jpg",
    left: 12.31, top: 52.32, width: 28.38,
    clip: "84.0% 46.5%, 84.6% 53.4%, 79.7% 58.9%, 74.0% 62.7%, 70.8% 67.0%, 68.3% 72.0%, 62.7% 73.1%, 66.8% 93.2%, 61.1% 100.0%, 53.2% 100.0%, 45.3% 100.0%, 37.5% 100.0%, 30.0% 98.7%, 32.4% 74.7%, 25.4% 77.0%, 25.1% 68.9%, 32.7% 56.6%, 32.4% 53.8%, 32.6% 51.1%, 33.2% 48.7%, 33.0% 46.5%, 30.0% 43.8%, 7.2% 32.8%, 3.5% 22.9%, 7.3% 16.0%, 13.9% 11.7%, 18.8% 6.1%, 24.8% 2.0%, 31.7% 0.1%, 38.4% 0.0%, 45.3% 0.0%, 52.3% 0.0%, 59.6% 0.0%, 59.6% 15.5%, 62.5% 20.3%, 64.2% 25.6%, 68.4% 28.0%, 70.8% 32.2%, 75.2% 35.8%, 75.3% 41.3%",
  },
  {
    id: "mushroom", src: "icons/cover/sticker-mushroom.jpg",
    left: 18.12, top: 73.84, width: 38.63,
    clip: "4% 1%, 96% 1%, 99% 4%, 99% 96%, 96% 99%, 4% 99%, 1% 96%, 1% 4%",
  },
  {
    id: "tape", src: "icons/cover/sticker-tape.jpg",
    left: 33.85, top: 66.89, width: 24.62,
    clip: "72.2% 28.9%, 77.2% 33.5%, 74.5% 37.5%, 70.2% 40.2%, 66.4% 42.3%, 61.3% 42.5%, 58.5% 43.8%, 55.9% 45.3%, 53.0% 46.0%, 49.6% 43.5%, 47.2% 47.3%, 43.8% 49.5%, 39.6% 51.4%, 34.9% 52.1%, 31.5% 49.6%, 29.2% 46.2%, 14.8% 51.5%, 17.5% 43.5%, 21.4% 37.0%, 23.3% 32.6%, 24.3% 28.9%, 21.3% 25.0%, 22.2% 21.1%, 24.6% 17.8%, 27.7% 15.3%, 32.5% 14.8%, 35.4% 13.4%, 39.3% 14.0%, 41.3% 11.4%, 43.9% 9.2%, 47.2% 8.5%, 50.6% 8.4%, 54.0% 8.8%, 60.4% 4.0%, 67.5% 2.1%, 70.8% 6.3%, 71.5% 12.0%, 72.8% 16.4%, 74.5% 20.4%, 77.2% 24.4%",
  },
  {
    id: "headphones", src: "icons/cover/sticker-headphones.jpg",
    left: 73.85, top: 22.52, width: 22.22,
    clip: "96.1% 55.9%, 95.6% 63.4%, 93.9% 70.7%, 90.7% 77.4%, 91.4% 87.0%, 89.8% 97.0%, 82.0% 100.0%, 72.4% 100.0%, 64.4% 100.0%, 57.0% 100.0%, 50.0% 100.0%, 43.0% 100.0%, 35.6% 100.0%, 27.6% 100.0%, 18.0% 100.0%, 13.7% 93.3%, 9.3% 86.5%, 0.0% 83.4%, 6.1% 70.7%, 10.8% 62.4%, 15.8% 55.9%, 18.5% 50.8%, 18.4% 45.4%, 18.7% 39.5%, 20.8% 34.1%, 22.9% 28.0%, 9.0% 0.0%, 24.8% 5.0%, 31.6% 0.0%, 41.0% 0.0%, 50.0% 0.7%, 57.7% 5.6%, 65.1% 7.9%, 72.2% 11.0%, 79.8% 13.6%, 83.6% 21.3%, 88.8% 26.8%, 94.0% 32.8%, 96.1% 40.5%, 96.9% 48.3%",
  },
];

// Charms hang loose from the elastic string by their own jump rings — a
// full-stage overlay above both the cover flap and the spine, positioned
// as a percentage of the whole photo (835x1208). They swing/jiggle on
// their own; the string itself never moves.
const CHARMS = [
  {
    id: "coin", src: "icons/cover/charm-coin.jpg",
    left: 29.46, top: 44.37, width: 10.54,
    clip: "100.0% 48.2%, 100.0% 52.3%, 100.0% 56.5%, 100.0% 61.1%, 98.1% 64.3%, 93.1% 66.4%, 87.6% 67.3%, 83.9% 69.7%, 79.6% 71.7%, 74.6% 71.5%, 69.9% 72.3%, 65.0% 72.6%, 60.0% 72.2%, 55.1% 71.1%, 50.3% 69.5%, 46.3% 66.8%, 41.3% 64.6%, 37.7% 61.1%, 34.3% 57.3%, 30.2% 53.2%, 29.0% 48.2%, 33.6% 43.7%, 37.5% 40.0%, 42.0% 37.0%, 49.0% 36.3%, 51.6% 33.8%, 56.3% 33.5%, 60.0% 33.0%, 63.6% 32.9%, 66.9% 32.9%, 69.9% 32.7%, 75.7% 19.7%, 82.2% 18.7%, 87.9% 20.5%, 98.0% 17.9%, 100.0% 23.2%, 100.0% 30.0%, 100.0% 35.3%, 97.8% 41.1%, 100.0% 44.2%",
  },
  {
    id: "pendant", src: "icons/cover/charm-pendant.jpg",
    left: 39.52, top: 43.54, width: 11.98,
    clip: "38% 3%, 62% 3%, 80% 12%, 90% 28%, 93% 45%, 100% 58%, 96% 72%, 85% 78%, 78% 88%, 65% 98%, 52% 88%, 40% 98%, 25% 90%, 16% 80%, 4% 68%, 10% 52%, 7% 32%, 18% 15%",
  },
  {
    id: "shell", src: "icons/cover/charm-shell.jpg",
    left: 53.05, top: 43.38, width: 6.47,
    clip: "100.0% 73.2%, 100.0% 76.0%, 100.0% 79.2%, 100.0% 82.4%, 100.0% 86.3%, 100.0% 91.2%, 100.0% 97.5%, 95.4% 100.0%, 83.9% 100.0%, 73.5% 100.0%, 63.6% 99.1%, 55.6% 96.3%, 49.2% 93.5%, 42.9% 91.8%, 36.9% 90.0%, 30.6% 88.3%, 26.8% 85.4%, 22.0% 82.9%, 18.2% 79.9%, 14.2% 76.8%, 14.7% 73.2%, 16.4% 69.8%, 16.1% 66.1%, 24.0% 63.9%, 29.5% 61.8%, 25.1% 55.6%, 27.7% 50.6%, 33.4% 46.0%, 44.1% 45.6%, 56.2% 51.6%, 63.6% 48.8%, 70.8% 52.6%, 80.8% 49.0%, 88.3% 51.0%, 98.9% 51.0%, 100.0% 55.2%, 100.0% 60.0%, 100.0% 63.9%, 100.0% 67.2%, 100.0% 70.2%",
  },
];

const ELASTIC = { left: 0, top: 43.87, width: 100, height: 2.81, src: "icons/cover/elastic-band.jpg" };

function stickerHtml(p) {
  return `<div class="jc-sticker" id="jc-piece-${p.id}" style="left:${p.left}%;top:${p.top}%;width:${p.width}%;"><div class="jc-sticker-inner" style="clip-path:polygon(${p.clip});"><img src="${p.src}" alt="" draggable="false" /></div></div>`;
}

function charmHtml(c) {
  return `<div class="jc-charm" id="jc-charm-${c.id}" style="left:${c.left}%;top:${c.top}%;width:${c.width}%;clip-path:polygon(${c.clip});"><img src="${c.src}" alt="" draggable="false" /></div>`;
}

export function renderCover(container, onOpened) {
  const reduced = prefersReducedMotion();
  let opened = false;

  const stickersHtml = STICKERS.map(stickerHtml).join("");
  const charmsHtml = CHARMS.map(charmHtml).join("");

  container.innerHTML = `
    <div class="cover-backdrop" style="background-image:url('${IMG_FULL}');"></div>
    <div class="cover-stage" id="cover-stage">
      <div class="cover-ambient-shadow"></div>
      <div class="journal-cover3d" id="journal-cover3d">
        <div class="jc-inner-page">
          <div class="jc-inside-hint">turning the page&hellip;</div>
        </div>
        <div class="jc-spine" id="jc-spine" style="background-image:url('${IMG_SPINE}');"></div>
        <div class="jc-flap jc-cover-flap" id="jc-cover-flap" role="button" tabindex="0" aria-label="Open your journal" style="background-image:url('${IMG_COVER}');">
          ${stickersHtml}
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
  const coverFlap = container.querySelector("#jc-cover-flap");
  const overlay = container.querySelector("#jc-overlay");
  const elastic = container.querySelector("#jc-elastic");
  const hint = container.querySelector("#jc-open-hint");

  initTilt(stage, book, { max: 4 });
  initCharmProximity(elastic, container);
  wireCharmPulseCleanup(container);
  container.querySelectorAll(".jc-sticker").forEach((el) => makeDraggable(el));

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

    // Stage 1: the charms jiggle loose and swing away — the string itself
    // never moves, only the metal hanging from it does.
    pulseCharms(container);
    overlay.classList.add("fading");

    // Stage 2: a short natural pause once the charms have settled, then
    // the front cover swings open on its own left-edge hinge — slow and
    // deliberate, not a snap — while the spine stays exactly where it is.
    setTimeout(() => {
      coverFlap.classList.add("open");
    }, 1050);

    coverFlap.addEventListener("transitionend", function handler(e) {
      if (e.propertyName !== "transform") return;
      coverFlap.removeEventListener("transitionend", handler);
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
      pulseCharms(container);
    },
    onOpen: openJournal,
  });

  // Fallback: tapping the cover directly also opens it, so the experience
  // never feels like a hidden puzzle.
  function handleFlapClick(e) {
    if (e.target.closest(".jc-sticker.dragging, .jc-sticker.settling")) return;
    openJournal();
  }
  coverFlap.addEventListener("click", handleFlapClick);
  coverFlap.addEventListener("keydown", (e) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      openJournal();
    }
  });
}
