// src/firebase/firebaseConfig.js

// 1) Importa las funciones de Firebase que vayas a usar
import { initializeApp }   from 'firebase/app';
import { getAnalytics }    from 'firebase/analytics';
import { getAuth }         from 'firebase/auth';
import { getFirestore }    from 'firebase/firestore';
import { getStorage }      from 'firebase/storage';
import { getFunctions }    from 'firebase/functions';

// 2) Tu configuración de Firebase (la misma que ya tenías)
const firebaseConfig = {
  apiKey: "AIzaSyBMt-xxyYg7ymLLch4h3EY3DpIyGTSAH0A",
  authDomain: "studentproject-4c33d.firebaseapp.com",
  projectId: "studentproject-4c33d",
  storageBucket: "studentproject-4c33d.appspot.com",   // ojo: aquí debe ir ".appspot.com"
  messagingSenderId: "296236131547",
  appId: "1:296236131547:web:3eb3380f92488fdf3798fe",
  measurementId: "G-WPD4CPV32V"
};

// 3) Inicializa la app de Firebase
const app = initializeApp(firebaseConfig);

// 4) Inicializa los servicios que vas a usar
const analytics = getAnalytics(app);
export const auth      = getAuth(app);
export const db        = getFirestore(app);
export const storage   = getStorage(app);
export const functions = getFunctions(app);

// 5) Opcionalmente exporta analytics si lo necesitas en alguna parte
export { analytics };
