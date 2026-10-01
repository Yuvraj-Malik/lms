// Firebase is only needed for "Continue with Google", so it's loaded on demand
// instead of being shipped in the main bundle.
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

// The Google button hides itself when Firebase isn't configured
export const googleEnabled = Boolean(firebaseConfig.apiKey && firebaseConfig.projectId);

let authPromise = null;
const loadAuth = () => {
  authPromise ||= Promise.all([import("firebase/app"), import("firebase/auth")]).then(([app, auth]) => ({
    auth: auth.getAuth(app.initializeApp(firebaseConfig)),
    mod: auth,
  }));
  return authPromise;
};

// Opens the Google popup and returns a Firebase ID token for our server to verify
export const getGoogleIdToken = async () => {
  if (!googleEnabled) throw new Error("Google sign-in isn't configured.");
  const { auth, mod } = await loadAuth();
  const provider = new mod.GoogleAuthProvider();
  provider.setCustomParameters({ prompt: "select_account" });
  const result = await mod.signInWithPopup(auth, provider);
  const idToken = await result.user.getIdToken();
  // The server issues its own session cookie, so Firebase doesn't need to keep one
  mod.signOut(auth).catch(() => {});
  return idToken;
};
