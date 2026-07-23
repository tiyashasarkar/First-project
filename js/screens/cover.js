// The very first thing anyone sees: your actual handmade journal cover
// photo, lying on the screen. The photo itself is never redrawn or
// replaced — every pixel shown is a crop straight out of the original
// image (icons/cover/journal-cover.jpg). Interactivity comes from
// layering small crops of that SAME photo (the charms, the elastic, a
// handful of stickers) exactly on top of where they already sit in the
// picture, then animating those layers — so at rest the page looks
// identical to your photo, and only moves when you actually touch it.
//
// Markup/positioning live here + css/cover.css; interaction physics
// (tilt, charm sway, sticker drag) live in ../journal-physics.js.
import { initTilt, initCharmProximity, wireCharmPulseCleanup, pulseCharms, makeDraggable, prefersReducedMotion } from "../journal-physics.js";

const IMG = "icons/cover/journal-cover.jpg";

// Every box below is a pixel-accurate crop from the 835x1208 source photo,
// converted to percentages so it re-aligns perfectly at any screen size.
// draggable: true -> a sticker you can pick up and move.
// charm: true -> hangs from the elastic and sways instead of dragging.
const PIECES = [
  { id: "star", src: "icons/cover/sticker-star.jpg", left: 56.53, top: 6.29, width: 8.14, draggable: true },
  { id: "bow", src: "icons/cover/sticker-bow.jpg", left: 61.68, top: 10.60, width: 27.90, draggable: true },
  { id: "headphones", src: "icons/cover/sticker-headphones.jpg", left: 51.74, top: 22.52, width: 15.57, draggable: true },
  { id: "cherries", src: "icons/cover/sticker-cherries.jpg", left: 8.62, top: 52.32, width: 19.88, draggable: true },
  { id: "heart", src: "icons/cover/sticker-heart.jpg", left: 35.69, top: 59.44, width: 20.12, draggable: true, z: 4 },
  { id: "tape", src: "icons/cover/sticker-tape.jpg", left: 23.71, top: 66.89, width: 17.25, draggable: true },
  { id: "mushroom", src: "icons/cover/sticker-mushroom.jpg", left: 12.69, top: 73.84, width: 27.07, draggable: true },
  { id: "flowers", src: "icons/cover/sticker-flowers.jpg", left: 40.48, top: 73.84, width: 27.54, draggable: true },
  { id: "coin", src: "icons/cover/charm-coin.jpg", left: 29.70, top: 43.71, width: 11.26, charm: true, swayDuration: 3.1, swayDelay: 0 },
  { id: "pendant", src: "icons/cover/charm-pendant.jpg", left: 43.47, top: 43.71, width: 16.05, charm: true, swayDuration: 3.6, swayDelay: 0.2 },
  { id: "shell", src: "icons/cover/charm-shell.jpg", left: 60.24, top: 44.12, width: 8.98, charm: true, swayDuration: 2.8, swayDelay: 0.4 },
];

const ELASTIC = { left: 0, top: 42.72, width: 100, height: 2.81, src: "icons/cover/elastic-band.jpg" };

export function renderCover(container, onOpened) {
  const reduced = prefersReducedMotion();
  let opened = false;

  const piecesHtml = PIECES.map((p) => {
    const style = `left:${p.left}%;top:${p.top}%;width:${p.width}%;${p.z ? `z-index:${p.z};` : ""}`;
    if (p.charm) {
      return `<div class="jc-charm" id="jc-charm-${p.id}" style="${style}animation-duration:${p.swayDuration}s;animation-delay:${p.swayDelay}s;"><img src="${p.src}" alt="" draggable="false" /></div>`;
    }
    return `<div class="jc-sticker" id="jc-piece-${p.id}" style="${style}"><div class="jc-sticker-inner"><img src="${p.src}" alt="" draggable="false" /></div></div>`;
  }).join("");

  container.innerHTML = `
    <div class="cover-stage" id="cover-stage">
      <div class="cover-ambient-shadow"></div>
      <div class="journal-cover3d" id="journal-cover3d">
        <div class="jc-page-inside">
          <div class="jc-inside-hint">turning the page&hellip;</div>
        </div>
        <div class="jc-front" id="jc-front" role="button" tabindex="0" aria-label="Open your journal" style="background-image:url('${IMG}');">
          <div class="jc-elastic" id="jc-elastic" style="left:${ELASTIC.left}%;top:${ELASTIC.top}%;width:${ELASTIC.width}%;height:${ELASTIC.height}%;">
            <img class="jc-elastic-img" src="${ELASTIC.src}" alt="" draggable="false" />
          </div>
          ${piecesHtml}
          <div class="jc-open-hint">tap to open</div>
        </div>
      </div>
    </div>
  `;

  const stage = container.querySelector("#cover-stage");
  const book = container.querySelector("#journal-cover3d");
  const front = container.querySelector("#jc-front");
  const elastic = container.querySelector("#jc-elastic");

  initTilt(stage, book, { max: 4 });
  initCharmProximity(elastic, container);
  wireCharmPulseCleanup(container);
  container.querySelectorAll(".jc-sticker").forEach((el) => makeDraggable(el));

  function openJournal() {
    if (opened) return;
    opened = true;
    container.classList.add("is-opening");
    pulseCharms(container);

    if (reduced) {
      setTimeout(onOpened, 260);
      return;
    }

    elastic.classList.add("releasing");
    setTimeout(() => front.classList.add("open"), 260);

    let done = false;
    const finish = () => {
      if (done) return;
      done = true;
      onOpened();
    };
    front.addEventListener("transitionend", function handler(e) {
      if (e.propertyName !== "transform") return;
      front.removeEventListener("transitionend", handler);
      finish();
    });
    // Safety net in case a transitionend event gets dropped (e.g. tab
    // backgrounded mid-animation) — never leave the app stuck on the cover.
    setTimeout(finish, 1600);
  }

  front.addEventListener("click", (e) => {
    // Dragging a sticker shouldn't also trigger the open animation.
    if (e.target.closest(".jc-sticker.dragging, .jc-sticker.settling")) return;
    openJournal();
  });
  front.addEventListener("keydown", (e) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      openJournal();
    }
  });
}
