import { useEffect, useState } from 'react';
import { ref, onValue } from 'firebase/database';
import { db } from './../app/firebase';

export function useReloadPhotoURL(userUid: string) {
    const [reloadImage, setReloadImage] = useState(Date.now());

    useEffect(() => {
        if (!userUid) return;

        const photoUserRef = ref(db, `/admins/${userUid}/isPhotoUpdate/`);
        const unsubscribe = onValue(photoUserRef, async () => {
            setReloadImage(Date.now());
        });

        return () => unsubscribe();
    }, [userUid]);

    return reloadImage;
}
