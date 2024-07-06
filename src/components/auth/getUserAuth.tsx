import { onAuthStateChanged } from "firebase/auth";
import { auth } from "./../../app/firebase";

export async function getUserAuth() {
    console.log("uibfwbuiw");
    
    onAuthStateChanged(auth, (user) => {
        if (user) {
            return(user);
        } else {
            return('notSign');
        }
    });
}
