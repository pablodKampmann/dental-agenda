import { storage } from "../../firebase";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";

export async function changeImage(userUid: string, file: File) {
    try {
        if (!navigator.onLine) {
            throw new Error();
        }        
        const storageRef = ref(storage, `/userImages/${userUid}.jpg`);
        await uploadBytes(storageRef, file);
        //const currentImageUrl = await getDownloadURL(storageRef);
    } catch (error) {
        return ('error')
    }
}

