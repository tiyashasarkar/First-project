import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
} from "https://www.gstatic.com/firebasejs/12.16.0/firebase-auth.js";
import { auth } from "../firebase.js";
import { escapeHtml } from "../ui.js";

const FRIENDLY_ERRORS = {
  "auth/invalid-email": "That email address doesn't look right.",
  "auth/user-not-found": "We couldn't find an account with that email — try creating one instead.",
  "auth/wrong-password": "That password doesn't match this account.",
  "auth/invalid-credential": "That email or password doesn't match an account.",
  "auth/email-already-in-use": "An account already exists for that email — try signing in instead.",
  "auth/weak-password": "Please use at least 6 characters.",
  "auth/too-many-requests": "Too many attempts — please wait a moment and try again.",
  "auth/network-request-failed": "No connection — check your internet and try again.",
};

function friendlyError(err) {
  return FRIENDLY_ERRORS[err.code] || "Something went wrong — please try again.";
}

let mode = "signin";

// Set right before a sign-in/sign-up submit succeeds, so app.js can tell a
// fresh login apart from Firebase silently restoring an already-signed-in
// session on page load — the theme picker should greet every login, not
// every app open.
let justAuthenticated = false;
export function consumeJustAuthenticated() {
  const v = justAuthenticated;
  justAuthenticated = false;
  return v;
}

export function renderAuth(container) {
  container.innerHTML = `
    <div class="auth-card fade-in">
      <svg class="blossom-mark" viewBox="0 0 100 100" fill="none" style="width:64px;height:64px;margin:0 auto 10px;display:block;">
        <circle cx="50" cy="20" r="18" fill="#fffbf7"/>
        <circle cx="76" cy="35" r="18" fill="#fffbf7"/>
        <circle cx="67" cy="63" r="18" fill="#fffbf7"/>
        <circle cx="33" cy="63" r="18" fill="#fffbf7"/>
        <circle cx="24" cy="35" r="18" fill="#fffbf7"/>
        <circle cx="50" cy="45" r="13" fill="#f0bd82"/>
      </svg>
      <h1 style="text-align:center;">Blossom</h1>
      <p style="text-align:center;font-family:var(--font-script);font-size:20px;color:var(--dusty-rose);margin-top:2px;margin-bottom:22px;">where memories become pages</p>

      <div class="segmented" style="margin-bottom:18px;">
        <button data-mode="signin" class="${mode === "signin" ? "active" : ""}">Sign in</button>
        <button data-mode="signup" class="${mode === "signup" ? "active" : ""}">Create account</button>
      </div>

      <div id="auth-error" class="auth-error hidden"></div>

      <div class="field"><label>Email</label><input type="email" id="auth-email" autocomplete="email" placeholder="you@example.com" /></div>
      <div class="field"><label>Password</label><input type="password" id="auth-password" autocomplete="${mode === "signin" ? "current-password" : "new-password"}" placeholder="At least 6 characters" /></div>

      <button class="btn btn-primary btn-block" id="auth-submit">${mode === "signin" ? "Sign in" : "Create account"}</button>
      <button class="btn btn-ghost btn-block" id="auth-forgot" style="margin-top:12px;justify-content:center;display:${mode === "signin" ? "flex" : "none"};">Forgot password?</button>

      <p style="text-align:center;font-size:12px;color:var(--ink-soft);margin-top:18px;line-height:1.6;">
        Your memories are private to your account and sync securely across any browser or device you sign into.
      </p>
    </div>
  `;

  container.querySelectorAll("[data-mode]").forEach((btn) => {
    btn.addEventListener("click", () => {
      mode = btn.dataset.mode;
      renderAuth(container);
    });
  });

  const emailEl = document.getElementById("auth-email");
  const passEl = document.getElementById("auth-password");
  const errEl = document.getElementById("auth-error");
  const submitBtn = document.getElementById("auth-submit");

  function showError(msg) {
    errEl.textContent = msg;
    errEl.classList.remove("hidden");
  }

  submitBtn.addEventListener("click", async () => {
    const email = emailEl.value.trim();
    const password = passEl.value;
    if (!email || !password) {
      showError("Please fill in both fields.");
      return;
    }
    errEl.classList.add("hidden");
    submitBtn.disabled = true;
    const originalLabel = submitBtn.textContent;
    submitBtn.textContent = mode === "signin" ? "Signing in…" : "Creating account…";
    try {
      if (mode === "signin") {
        await signInWithEmailAndPassword(auth, email, password);
      } else {
        await createUserWithEmailAndPassword(auth, email, password);
      }
      justAuthenticated = true;
      // app.js's onAuthStateChanged listener takes it from here
    } catch (err) {
      showError(friendlyError(err));
      submitBtn.disabled = false;
      submitBtn.textContent = originalLabel;
    }
  });

  document.getElementById("auth-forgot").addEventListener("click", async () => {
    const email = emailEl.value.trim();
    if (!email) {
      showError("Enter your email above first, then tap “Forgot password?” again.");
      return;
    }
    try {
      await sendPasswordResetEmail(auth, email);
      showError(""); // clear any prior error styling
      errEl.classList.remove("hidden");
      errEl.classList.add("auth-success");
      errEl.textContent = `Check ${escapeHtml(email)} for a link to reset your password.`;
    } catch (err) {
      errEl.classList.remove("auth-success");
      showError(friendlyError(err));
    }
  });
}
