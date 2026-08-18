export default function firebaseApp() {
  return { apps: [], initializeApp: () => ({}), app: () => ({}) };
}
export const FirebaseApp = { initializeApp: () => ({}) };
