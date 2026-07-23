// The very first thing anyone sees: a handmade-feeling journal cover lying
// on the screen, styled after "Once upon a Tuesday" — pale yellow paper,
// lace trim, a stretched elastic with three hanging charms, and a little
// scattering of scrapbook stickers. Tapping it pulls the elastic loose and
// swings the cover open on a real hinge, handing off to whatever screen
// comes next (sign-in, or the theme page for a returning visitor).
//
// Markup/CSS live here + css/cover.css; interaction physics (tilt, charm
// sway, sticker drag) live in ../journal-physics.js so each concern can be
// read on its own.
import { initTilt, initCharmProximity, wireCharmPulseCleanup, pulseCharms, makeDraggable, prefersReducedMotion } from "../journal-physics.js";

const GOLD_CLIP = `<svg viewBox="0 0 24 40" fill="none"><path d="M12 2c-4 0-7 3-7 7v14c0 4 3 7 7 7s7-3 7-7" stroke="#c9a227" stroke-width="2.4" stroke-linecap="round"/><circle cx="12" cy="9" r="2.6" fill="#e8c766"/></svg>`;

const SAFETY_PIN = `<svg viewBox="0 0 60 36" fill="none"><path d="M4 30c0-8 6-14 14-14h20c6 0 10-4 10-9" stroke="#c9a227" stroke-width="2.6" stroke-linecap="round"/><circle cx="48" cy="7" r="5.5" fill="#f4d97e" stroke="#c9a227" stroke-width="2"/><circle cx="4" cy="30" r="3.6" fill="#f4d97e" stroke="#c9a227" stroke-width="2"/></svg>`;

const STAR = `<svg viewBox="0 0 24 24" fill="#f0c563" stroke="#c9962e" stroke-width="0.8"><path d="M12 1.5l2.7 6.6 7.1.5-5.5 4.6 1.8 6.9L12 16.2l-6.1 3.9 1.8-6.9-5.5-4.6 7.1-.5Z"/></svg>`;

const SPARKLE = `<svg viewBox="0 0 24 24" fill="#e0b84a"><path d="M12 2c.6 4 2.4 5.8 6.4 6.4C14.4 9 12.6 10.8 12 14.8c-.6-4-2.4-5.8-6.4-6.4C9.6 7.8 11.4 6 12 2Z"/></svg>`;

const BOW = `<svg viewBox="0 0 60 36" fill="none"><path d="M28 18 6 6C3 4.5 0 6.5 0 10v16c0 3.5 3 5.5 6 4L28 18Z" fill="#eddcae"/><path d="M32 18 54 6c3-1.5 6 .5 6 4v16c0 3.5-3 5.5-6 4L32 18Z" fill="#f4ecc9"/><circle cx="30" cy="18" r="5.5" fill="#c9962e"/></svg>`;

const HEADPHONES = `<svg viewBox="0 0 60 54" fill="none"><path d="M8 34V26c0-12 10-22 22-22s22 10 22 22v8" stroke="#5b5148" stroke-width="3.2" stroke-linecap="round"/><rect x="2" y="30" width="14" height="18" rx="6" fill="#4a423b"/><rect x="44" y="30" width="14" height="18" rx="6" fill="#4a423b"/><circle cx="9" cy="39" r="3.6" fill="#8b8078"/><circle cx="51" cy="39" r="3.6" fill="#8b8078"/></svg>`;

const MUSIC_NOTES = `<svg viewBox="0 0 40 34" fill="none" stroke="#7a6f63" stroke-width="1.8"><path d="M8 24V6l20-3v15" stroke-linejoin="round" stroke-linecap="round"/><circle cx="6" cy="25" r="3.4"/><circle cx="26" cy="20" r="3.4"/></svg>`;

const CHERRIES = `<svg viewBox="0 0 60 66" fill="none"><path d="M30 6c-2 6-4 10-4 10M30 6c6 2 10 4 10 4" stroke="#5c8c4e" stroke-width="2.4" stroke-linecap="round"/><path d="M18 12c4 3 6 6 8 8" stroke="#8a5a3a" stroke-width="2" stroke-linecap="round"/><path d="M44 12c-4 3-6 6-8 8" stroke="#8a5a3a" stroke-width="2" stroke-linecap="round"/><ellipse cx="16" cy="46" rx="14" ry="15" fill="#f4dd7e" stroke="#c9a227" stroke-width="1.6"/><ellipse cx="44" cy="46" rx="14" ry="15" fill="#f0d158" stroke="#c9a227" stroke-width="1.6"/><ellipse cx="11" cy="40" rx="3.5" ry="2.4" fill="#fff6d6" opacity=".8"/><ellipse cx="39" cy="40" rx="3.5" ry="2.4" fill="#fff6d6" opacity=".8"/></svg>`;

const HEART_SCRIBBLE = `<svg viewBox="0 0 60 54" fill="none" stroke="#c9962e" stroke-width="1.6" stroke-linecap="round"><path d="M30 48C10 34 3 24 3 15 3 7 9 2 16 2c6 0 11 4 14 9 3-5 8-9 14-9 7 0 13 5 13 13 0 9-7 19-27 33Z" stroke-width="2.2"/><path d="M14 12l30 26M20 8l28 30M10 20l32 22M26 6l24 32" opacity=".55"/></svg>`;

const MUSHROOM = `<svg viewBox="0 0 60 54" fill="none"><path d="M6 30C6 16 17 6 30 6s24 10 24 24Z" fill="#eec24a" stroke="#c9962e" stroke-width="1.8"/><circle cx="16" cy="18" r="2.6" fill="#fff8e6"/><circle cx="30" cy="12" r="3.2" fill="#fff8e6"/><circle cx="44" cy="19" r="2.4" fill="#fff8e6"/><circle cx="24" cy="24" r="2" fill="#fff8e6"/><path d="M12 30h36l-3 16c-1 4-4 6-8 6H23c-4 0-7-2-8-6Z" fill="#fbf4e0" stroke="#c9a227" stroke-width="1.6"/></svg>`;

const FLOWERS_CUP = `<svg viewBox="0 0 54 60" fill="none"><path d="M12 30v16c0 6 5 10 11 10h8c6 0 11-4 11-10V30Z" fill="#fdf7e6" stroke="#c9a227" stroke-width="1.8"/><path d="M40 34h4c3 0 5 2 5 5s-2 5-5 5h-4" stroke="#c9a227" stroke-width="1.8"/><path d="M22 42c1-2 3-2 5 0" stroke="#c9962e" stroke-width="1.4" stroke-linecap="round"/><g stroke="#5c8c4e" stroke-width="2" stroke-linecap="round"><path d="M20 30V16M27 30V10M34 30V17"/></g><g fill="#f4d97e" stroke="#c9962e" stroke-width="1"><circle cx="20" cy="12" r="4.4"/><circle cx="27" cy="6" r="4.8"/><circle cx="34" cy="13" r="4.2"/></g></svg>`;

const DAISY = `<svg viewBox="0 0 30 30" fill="none"><g fill="#fffaf0" stroke="#e6dcc0" stroke-width="0.8"><circle cx="15" cy="6" r="4.4"/><circle cx="15" cy="24" r="4.4"/><circle cx="6" cy="15" r="4.4"/><circle cx="24" cy="15" r="4.4"/></g><circle cx="15" cy="15" r="5.4" fill="#eec24a"/></svg>`;

const LEAF_CHARM = `<svg viewBox="0 0 26 34" fill="none"><path d="M13 4c8 4 10 12 6 22-8-2-13-9-11-18Z" fill="#8fae6c" stroke="#5c7a45" stroke-width="1.4"/><path d="M13 8v18" stroke="#5c7a45" stroke-width="1.2"/></svg>`;

const COIN_CHARM = `<svg viewBox="0 0 26 26" fill="none"><circle cx="13" cy="13" r="10" fill="#f0d158" stroke="#c9962e" stroke-width="1.6"/><circle cx="13" cy="13" r="5.6" fill="none" stroke="#c9962e" stroke-width="1"/></svg>`;

const SHELL_CHARM = `<svg viewBox="0 0 26 26" fill="none"><path d="M13 4c6 0 9 5 9 11 0 4-3 7-9 7s-9-3-9-7c0-6 3-11 9-11Z" fill="#e9d9b8" stroke="#a68c58" stroke-width="1.4"/><path d="M13 6v16M9 8v13M17 8v13" stroke="#a68c58" stroke-width="1"/></svg>`;

const PEARL_LEAF_CHARM = `<svg viewBox="0 0 30 40" fill="none"><circle cx="15" cy="7" r="4.2" fill="#fbf7ee" stroke="#c9c1a8" stroke-width="1.2"/><path d="M15 12c9 4 10 14 3 22-9-3-13-13-3-22Z" fill="#7ba05b" stroke="#5c7a45" stroke-width="1.3"/></svg>`;

function scatteredDoodles() {
  const items = [
    { style: "left:8%;top:6%;width:14px;", svg: STAR },
    { style: "left:44%;top:4%;width:10px;", svg: SPARKLE },
    { style: "left:14%;top:34%;width:11px;", svg: SPARKLE },
    { style: "left:60%;top:30%;width:13px;", svg: STAR },
    { style: "left:6%;top:58%;width:12px;", svg: SPARKLE },
    { style: "left:52%;top:64%;width:11px;", svg: STAR },
  ];
  return items.map((it) => `<div class="jc-doodle" style="${it.style}">${it.svg}</div>`).join("");
}

// Every draggable sticker is a plain-positioned `.jc-sticker` wrapping a
// `.jc-sticker-inner` — the outer div is where journal-physics.js writes its
// live --drag-x/--drag-y/--drag-rot transform, and the inner div carries the
// sticker's own resting tilt (set per-class in cover.css) plus the hover
// micro-motion, so the two never fight over the same transform.
function sticker(extraClass, svg) {
  return `<div class="jc-sticker ${extraClass}"><div class="jc-sticker-inner">${svg}</div></div>`;
}

export function renderCover(container, onOpened) {
  const reduced = prefersReducedMotion();
  let opened = false;

  container.innerHTML = `
    <div class="cover-stage" id="cover-stage">
      <div class="cover-ambient-shadow"></div>
      <div class="journal-cover3d" id="journal-cover3d">
        <div class="jc-page-inside">
          <div class="jc-inside-hint">turning the page&hellip;</div>
        </div>
        <div class="jc-front" id="jc-front" role="button" tabindex="0" aria-label="Open your journal">
          <div class="jc-paper"></div>
          <div class="jc-doodles">${scatteredDoodles()}</div>

          <div class="jc-clip jc-clip-top">${GOLD_CLIP}</div>
          <div class="jc-clip jc-clip-bottom">${LEAF_CHARM}</div>

          <div class="jc-lace"><div class="jc-lace-pattern"></div></div>
          <div class="jc-ribbon"></div>
          <div class="jc-pin-cluster">
            <div class="jc-pin">${SAFETY_PIN}</div>
            ${sticker("jc-pin-star", STAR)}
            <div class="jc-bow-knot">${BOW}</div>
          </div>

          <div class="jc-sticker jc-title-card">
            <div class="jc-sticker-inner jc-title-frame">
              <div class="jc-title-flower">${FLOWERS_CUP}</div>
              <h1 class="jc-title">Once upon a<br />Tuesday</h1>
            </div>
          </div>

          ${sticker("jc-headphones", HEADPHONES)}
          ${sticker("jc-notes", MUSIC_NOTES)}

          <div class="jc-elastic" id="jc-elastic">
            <div class="jc-elastic-band"></div>
            <div class="jc-charm jc-charm-1">${COIN_CHARM}</div>
            <div class="jc-charm jc-charm-2">${PEARL_LEAF_CHARM}</div>
            <div class="jc-charm jc-charm-3">${SHELL_CHARM}</div>
          </div>

          ${sticker("jc-cherries", CHERRIES)}
          ${sticker("jc-heart", HEART_SCRIBBLE)}
          ${sticker("jc-mushroom", MUSHROOM)}
          ${sticker("jc-daisy jc-daisy-1", DAISY)}
          ${sticker("jc-daisy jc-daisy-2", DAISY)}
          <div class="jc-washi"></div>

          <div class="jc-open-hint">tap to open</div>
        </div>
      </div>
    </div>
  `;

  const stage = container.querySelector("#cover-stage");
  const book = container.querySelector("#journal-cover3d");
  const front = container.querySelector("#jc-front");
  const elastic = container.querySelector("#jc-elastic");

  initTilt(stage, book, { max: 5 });
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
