import { THEMES, applyTheme, setTheme } from "../theme.js";

export function renderModePicker(container, onDone) {
  let selected = "blossom";

  container.innerHTML = `
    <h1>Choose your vibe</h1>
    <p class="sub">Pick a look for Blossom — you can always change this later in Profile.</p>
    <div class="mode-list" id="mode-list"></div>
    <button class="btn btn-primary btn-block" id="mode-continue" style="margin-top:16px;">Continue</button>
  `;

  const list = document.getElementById("mode-list");
  THEMES.forEach((t) => {
    const card = document.createElement("button");
    card.className = "mode-card" + (t.id === selected ? " selected" : "");
    card.innerHTML = `
      <div class="mc-emoji">${t.emoji}</div>
      <div>
        <div class="mc-title">${t.label}</div>
        <div class="mc-tag">${t.tagline}</div>
        <div class="mc-swatches">${t.swatches.map((c) => `<span style="background:${c}"></span>`).join("")}</div>
      </div>
      <div class="mc-check"></div>
    `;
    card.addEventListener("click", () => {
      selected = t.id;
      applyTheme(t.id);
      list.querySelectorAll(".mode-card").forEach((c) => c.classList.remove("selected"));
      card.classList.add("selected");
    });
    list.appendChild(card);
  });

  document.getElementById("mode-continue").addEventListener("click", async () => {
    await setTheme(selected);
    onDone();
  });
}
