// The very first thing anyone sees: your actual handmade journal cover
// photo, lying on the screen. The photo itself is never redrawn or
// replaced — only cropped, non-destructively, to trim the plain fabric
// background surrounding it (never the journal itself) and to split it
// along its own real seam: a large yellow-paper front cover (~70% of the
// width) and a narrower lace-wrapped spine strip (~30%). Both pieces open
// like real double doors — the large cover swings to its side on a
// left-edge hinge, the spine swings to its side on a right-edge hinge —
// revealing a baby-yellow felt inside page.
//
// The elastic band and the coin/pendant/shell charms hanging from it are
// left exactly as photographed, baked into the flap/spine artwork, rather
// than being separate draggable/animated pieces — they're static hardware
// in real life, not something a viewer tugs on. The paper stickers
// (cherries, the mushroom stamp card, the washi tape, the headphones
// sticker) are still separate, draggable pieces glued to the front cover,
// each traced to its own silhouette (a CSS clip-path polygon) instead of
// a plain rectangle, so dragging one shows its actual outline.
//
// Markup/positioning live here + css/cover.css; interaction physics
// (tilt, sticker drag) live in ../journal-physics.js.
import { initTilt, makeDraggable, prefersReducedMotion } from "../journal-physics.js";

const IMG_COVER = "icons/cover/journal-cover-large.jpg";
const IMG_SPINE = "icons/cover/journal-cover-spine.jpg";

// The cropped photo is 817x1208; the seam between the paper cover and the
// lace spine sits at x=572 (~70%). Sticker positions below are percentages
// of the COVER FLAP itself (572 wide), since that's what they're glued to
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

function stickerHtml(p) {
  return `<div class="jc-sticker" id="jc-piece-${p.id}" style="left:${p.left}%;top:${p.top}%;width:${p.width}%;"><div class="jc-sticker-inner" style="clip-path:polygon(${p.clip});"><img src="${p.src}" alt="" draggable="false" /></div></div>`;
}

export function renderCover(container, onOpened) {
  const reduced = prefersReducedMotion();
  let opened = false;

  const stickersHtml = STICKERS.map(stickerHtml).join("");

  container.innerHTML = `
    <div class="cover-backdrop"></div>
    <div class="cover-stage" id="cover-stage">
      <div class="cover-ambient-shadow"></div>
      <div class="journal-cover3d" id="journal-cover3d">
        <div class="jc-inner-page">
          <div class="jc-inside-hint">turning the page&hellip;</div>
        </div>
        <div class="jc-flap jc-spine" id="jc-spine" role="button" tabindex="0" aria-label="Open your journal" style="background-image:url('${IMG_SPINE}');"></div>
        <div class="jc-flap jc-cover-flap" id="jc-cover-flap" style="background-image:url('${IMG_COVER}');">
          ${stickersHtml}
        </div>
        <div class="jc-open-hint" id="jc-open-hint">tap to open</div>
      </div>
    </div>
  `;

  const stage = container.querySelector("#cover-stage");
  const book = container.querySelector("#journal-cover3d");
  const coverFlap = container.querySelector("#jc-cover-flap");
  const spineFlap = container.querySelector("#jc-spine");
  const hint = container.querySelector("#jc-open-hint");

  initTilt(stage, book, { max: 4 });
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
    hint.classList.add("hidden");
    const doFinish = finish(onOpened);

    if (reduced) {
      setTimeout(doFinish, 260);
      return;
    }

    // Both the cover and the spine swing open together, each to its own
    // side — a real double-door opening rather than a single hinge.
    coverFlap.classList.add("open");
    spineFlap.classList.add("open");

    coverFlap.addEventListener("transitionend", function handler(e) {
      if (e.propertyName !== "transform") return;
      coverFlap.removeEventListener("transitionend", handler);
      doFinish();
    });
    // Safety net in case a transitionend event gets dropped (e.g. tab
    // backgrounded mid-animation) — never leave the app stuck on the cover.
    setTimeout(doFinish, 2400);
  }

  function handleFlapClick(e) {
    if (e.target.closest(".jc-sticker.dragging, .jc-sticker.settling")) return;
    openJournal();
  }
  coverFlap.addEventListener("click", handleFlapClick);
  spineFlap.addEventListener("click", handleFlapClick);
  coverFlap.addEventListener("keydown", (e) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      openJournal();
    }
  });
  spineFlap.addEventListener("keydown", (e) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      openJournal();
    }
  });
}
