import { initializeApp, getApps } from 'firebase/app';
import { initializeAuth, getReactNativePersistence } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Configuración de Firebase
// NOTA: Reemplaza estas credenciales simuladas por las credenciales reales de tu consola de Firebase
const firebaseConfig = {
  apiKey: "AIzaSyFakeKey-ForThesisDemoPurposeOnly",
  authDomain: "medical-corp-app.firebaseapp.com",
  projectId: "medical-corp-app",
  storageBucket: "medical-corp-app.appspot.com",
  messagingSenderId: "123456789012",
  appId: "1:123456789012:web:abcdef123456"
};

let app;
let auth;
let db;

try {
  if (getApps().length === 0) {
    app = initializeApp(firebaseConfig);
    // Inicializar Auth con persistencia en AsyncStorage para React Native
    auth = initializeAuth(app, {
      persistence: getReactNativePersistence(AsyncStorage),
    });
    db = getFirestore(app);
  } else {
    app = getApps()[0];
    auth = initializeAuth(app);
    db = getFirestore(app);
  }
} catch (error) {
  console.error("Error al inicializar Firebase:", error);
}

const isFirebaseDisabled = !firebaseConfig.apiKey || firebaseConfig.apiKey.includes('FakeKey');

export { app, auth, db, isFirebaseDisabled };

