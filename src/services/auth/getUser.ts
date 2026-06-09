import { get, ref } from "firebase/database";
import { db, auth } from "@/lib/firebase";

const RETRY_DELAYS = [500, 1000, 1500];

function sleep(ms: number) {
  return new Promise<void>((resolve) => setTimeout(resolve, ms));
}

async function resolveCurrentUser() {
  await auth.authStateReady();

  for (let i = 0; i <= RETRY_DELAYS.length; i++) {
    if (auth.currentUser) return auth.currentUser;
    if (i < RETRY_DELAYS.length) await sleep(RETRY_DELAYS[i]);
  }

  return null;
}

export async function getUser(getOnlyClinicId: boolean) {
  const user = await resolveCurrentUser();

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
