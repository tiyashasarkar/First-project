// Initializes your Blossom app's connection to Firebase (Auth + Firestore)
// using the plain browser-native ES module CDN build — no npm install, no
// bundler, nothing to build. Every screen imports auth/db from here.
//
// Note: there's deliberately no Firebase Storage here. Photos are
// compressed and stored directly in Firestore (see db.js) so the whole
// app runs on Firebase's free Spark plan with no billing setup required.

import { initializeApp } from "https://www.gstatic.com/firebasejs/12.16.0/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/12.16.0/firebase-auth.js";
import { getFirestore, enableIndexedDbPersistence } from "https://www.gstatic.com/firebasejs/12.16.0/firebase-firestore.js";
import { firebaseConfig, isFirebaseConfigured } from "./firebase-config.js";

export { isFirebaseConfigured };

let app, auth, firestore;

if (isFirebaseConfigured) {
  app = initializeApp(firebaseConfig);
  auth = getAuth(app);
  firestore = getFirestore(app);

  // Lets journals/pages keep working offline (and feel instant) by caching
  // Firestore reads/writes on-device, syncing automatically once back online.
  enableIndexedDbPersistence(firestore).catch(() => {
    // Fails harmlessly if multiple tabs are open, or the browser doesn't
    // support it — the app still works, just without the offline cache.
  });
}

export { auth, firestore };
