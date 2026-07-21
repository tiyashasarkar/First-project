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
  apiKey: "AIzaSyBq6N6PccfKxVRBjjg_TLWV5_T-1VFV7JY",
  authDomain: "blossom-5df43.firebaseapp.com",
  projectId: "blossom-5df43",
  storageBucket: "blossom-5df43.firebasestorage.app",
  messagingSenderId: "703993352931",
  appId: "1:703993352931:web:d30713667db01fb0ed6bd6",
};

// True until you've pasted your real values in above.
export const isFirebaseConfigured = firebaseConfig.apiKey !== "YOUR_API_KEY";
