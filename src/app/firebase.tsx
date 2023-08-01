import { initializeApp } from "firebase/app";
import { getDatabase } from "firebase/database";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
    apiKey: "AIzaSyAskzVCKV-MT0ZrGafZC_igOLiFKses1-c",
    authDomain: "dental-agenda-22448.firebaseapp.com",
    databaseURL: "https://dental-agenda-22448-default-rtdb.firebaseio.com",
    projectId: "dental-agenda-22448",
    storageBucket: "dental-agenda-22448.appspot.com",
    messagingSenderId: "117012483079",
    appId: "1:117012483079:web:d72a363b6ed8c2f9696ea2",
    measurementId: "G-19RM1SQK54"
};

const app = initializeApp(firebaseConfig);
export const db = getDatabase(app);
export const auth = getAuth(app);


