// The very first thing anyone sees: your actual handmade journal cover
// photo, filling the screen. The photo itself is never redrawn or
// replaced — only cropped, non-destructively, to trim the plain fabric
// background around it (never the journal itself). No flap animation:
// this is a single static page, and tapping it moves straight on to the
// next screen with a normal fade (already built into #cover-screen —
// see js/app.js's tryReveal/init) instead of a book-opening effect.
//
// It's still interactive, just not a book: a gentle cursor-tilt gives it
// physical depth, and the paper stickers (cherries, the mushroom stamp
// card, the washi tape, the headphones sticker) are draggable, each
// clipped to its own real die-cut silhouette (a CSS clip-path polygon)
// instead of a plain rectangle. The elastic band and its charms are left
// exactly as photographed — static hardware, not something you tug on.
//
// Markup/positioning live here + css/cover.css; interaction physics
// (tilt, sticker drag) live in ../journal-physics.js.
import { initTilt, makeDraggable, prefersReducedMotion } from "../journal-physics.js";

const IMG_COVER = "icons/cover/journal-cover-full.jpg";

// The cropped photo is 817x1208. Positions below are percentages of that
// full image. Each `clip` is a clip-path polygon traced to that sticker's
// real die-cut silhouette, not its bounding box.
const STICKERS = [
  {
    id: "cherries", src: "icons/cover/sticker-cherries.jpg",
    left: 6.61, top: 52.32, width: 20.32,
    clip: "84.0% 46.5%, 84.6% 53.4%, 79.7% 58.9%, 74.0% 62.7%, 70.8% 67.0%, 68.3% 72.0%, 62.7% 73.1%, 66.8% 93.2%, 61.1% 100.0%, 53.2% 100.0%, 45.3% 100.0%, 37.5% 100.0%, 30.0% 98.7%, 32.4% 74.7%, 25.4% 77.0%, 25.1% 68.9%, 32.7% 56.6%, 32.4% 53.8%, 32.6% 51.1%, 33.2% 48.7%, 33.0% 46.5%, 30.0% 43.8%, 7.2% 32.8%, 3.5% 22.9%, 7.3% 16.0%, 13.9% 11.7%, 18.8% 6.1%, 24.8% 2.0%, 31.7% 0.1%, 38.4% 0.0%, 45.3% 0.0%, 52.3% 0.0%, 59.6% 0.0%, 59.6% 15.5%, 62.5% 20.3%, 64.2% 25.6%, 68.4% 28.0%, 70.8% 32.2%, 75.2% 35.8%, 75.3% 41.3%",
  },
  {
    id: "mushroom", src: "icons/cover/sticker-mushroom.jpg",
    left: 10.77, top: 73.84, width: 27.66,
    clip: "4% 1%, 96% 1%, 99% 4%, 99% 96%, 96% 99%, 4% 99%, 1% 96%, 1% 4%",
  },
  {
    id: "tape", src: "icons/cover/sticker-tape.jpg",
    left: 22.03, top: 66.89, width: 17.63,
    clip: "72.2% 28.9%, 77.2% 33.5%, 74.5% 37.5%, 70.2% 40.2%, 66.4% 42.3%, 61.3% 42.5%, 58.5% 43.8%, 55.9% 45.3%, 53.0% 46.0%, 49.6% 43.5%, 47.2% 47.3%, 43.8% 49.5%, 39.6% 51.4%, 34.9% 52.1%, 31.5% 49.6%, 29.2% 46.2%, 14.8% 51.5%, 17.5% 43.5%, 21.4% 37.0%, 23.3% 32.6%, 24.3% 28.9%, 21.3% 25.0%, 22.2% 21.1%, 24.6% 17.8%, 27.7% 15.3%, 32.5% 14.8%, 35.4% 13.4%, 39.3% 14.0%, 41.3% 11.4%, 43.9% 9.2%, 47.2% 8.5%, 50.6% 8.4%, 54.0% 8.8%, 60.4% 4.0%, 67.5% 2.1%, 70.8% 6.3%, 71.5% 12.0%, 72.8% 16.4%, 74.5% 20.4%, 77.2% 24.4%",
  },
  {
    id: "headphones", src: "icons/cover/sticker-headphones.jpg",
    left: 50.67, top: 22.52, width: 15.91,
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
      <div class="jc-page" id="jc-page" role="button" tabindex="0" aria-label="Continue" style="background-image:url('${IMG_COVER}');">
        ${stickersHtml}
      </div>
      <div class="jc-open-hint" id="jc-open-hint">tap to continue</div>
    </div>
  `;

  const stage = container.querySelector("#cover-stage");
  const page = container.querySelector("#jc-page");
  const hint = container.querySelector("#jc-open-hint");

  initTilt(stage, page, { max: 4 });
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
    hint.classList.add("hidden");
    const doFinish = finish(onOpened);

    if (reduced) {
      doFinish();
      return;
    }

    // A quick, tactile press-down before handing off — the actual
    // transition to the next screen is the plain fade already built into
    // #cover-screen (see js/app.js), not a book-opening animation.
    page.classList.add("pressed");
    setTimeout(doFinish, 180);
  }

  function handleClick(e) {
    if (e.target.closest(".jc-sticker.dragging, .jc-sticker.settling")) return;
    openJournal();
  }
  page.addEventListener("click", handleClick);
  page.addEventListener("keydown", (e) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      openJournal();
    }
  });
}
