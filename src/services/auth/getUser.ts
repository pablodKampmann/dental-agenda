import { get, ref } from "firebase/database";
import { db, auth } from "@/lib/firebase";

export async function getUser(getOnlyClinicId: boolean) {
  // authStateReady() waits until Firebase has finished restoring the persisted
  // session from localStorage — avoids the race where the first onAuthStateChanged
  // fires with null on fresh page loads before the session is rehydrated.
  await auth.authStateReady();
  const user = auth.currentUser;

  if (!user) {
    throw new Error("User not logged in");
  }

  const dbRef = ref(db, "admins/" + user.uid);
  const snapshot = await get(dbRef);

  if (!snapshot.exists()) {
    throw new Error("User data not found");
  }

  const data = snapshot.val();
  data.userUid = user.uid;

  return getOnlyClinicId ? data.clinicId : data;
}
