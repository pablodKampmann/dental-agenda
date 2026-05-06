import { onAuthStateChanged } from "firebase/auth";
import { get, ref } from "firebase/database";
import { db, auth } from "@/lib/firebase";

export async function getUser(getOnlyClinicId: boolean) {
  return new Promise((resolve, reject) => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      unsubscribe();
      if (user) {
        let dbRef = ref(db, "admins/" + user.uid);
        let snapshot = await get(dbRef);
        if (snapshot.exists()) {
          let data = snapshot.val();
          data.userUid = user.uid;
          data.photoURL = `https://firebasestorage.googleapis.com/v0/b/${process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET}/o/userImages%2F${user.uid}.jpg?alt=media`;
          if (getOnlyClinicId) {
            resolve(data.clinicId);
          } else {
            resolve(data);
          }
        }
      } else {
        reject("User not logged in");
      }
    });
  });
}
