// Your Blossom app's connection to your own free Firebase account.
//
// Where to get these values (see README.md "Setting up your free account"
// for full step-by-step screenshots-style instructions):
//   Firebase console → your project → ⚙️ Project settings → General tab
//   → scroll to "Your apps" → click the web app (</>) → "SDK setup and
//   configuration" → "Config". Copy each value below.
//
// These values are NOT secret — they just identify your project. Your
// actual data is protected by the security rules you set up in Firestore
// and Storage (also covered in the README).

export const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT_ID.appspot.com",
  messagingSenderId: "YOUR_SENDER_ID",
  appId: "YOUR_APP_ID",
};

// True until you've pasted your real values in above.
export const isFirebaseConfigured = firebaseConfig.apiKey !== "YOUR_API_KEY";
