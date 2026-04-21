import { storage, db } from "./../../app/firebase";
import { ref, uploadBytes } from "firebase/storage";
import { set, get, ref as databaseRef } from "firebase/database";

export async function changeImage(userUid: string, file: File) {
    function generateRandomString() {
        let result = '';
        const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        const charactersLength = characters.length;
        for (let i = 0; i < 10; i++) {
            result += characters.charAt(Math.floor(Math.random() * charactersLength));
        }
        return result;
    }

    try {
        if (!navigator.onLine) {
            throw new Error();
        }
        const storageRef = ref(storage, `/userImages/${userUid}.jpg`);
        await uploadBytes(storageRef, file);
        const dbRef = databaseRef(db, `/admins/${userUid}/isPhotoUpdate`);        
        const snapshot = await get(dbRef);
        if (snapshot) {            
            const randomString = generateRandomString();
            set(dbRef, randomString)
        }


    } catch (error) {
        console.error(error);
        return (error instanceof Error ? error.message : 'unknown-error');
    }
}

