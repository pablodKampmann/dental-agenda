import { useEffect, useState } from 'react';
import { getUser } from "../components/auth/getUser";

export function useCheckRoutine(getOnlyClinicId: boolean) {
    const [value, setValue] = useState<any>(null);

    useEffect(() => {
        let isMounted = true;

        async function handleGetUser() {
            try {
                const user = await getUser(getOnlyClinicId);
                if (isMounted) {
                    setValue(user);
                }
            } catch (error) {
                console.error("Failed to get user:", error);
            }
        }

        handleGetUser();

        return () => {
            isMounted = false;
        };
    }, []);

    return value;
}
