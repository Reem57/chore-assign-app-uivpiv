import { initializeApp } from 'firebase/app';
import { initializeAuth, getAuth, getReactNativePersistence } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const firebaseConfig = {
  apiKey: "AIzaSyACVUAagwb2i08zXh_o3UV0szuGxCB43OE",
  authDomain: "chores-d9ad9.firebaseapp.com",
  projectId: "chores-d9ad9",
  storageBucket: "chores-d9ad9.firebasestorage.app",
  messagingSenderId: "188117260274",
  appId: "1:188117260274:web:b1b4a7c62f96e5f7d86fbe"
};

const app = initializeApp(firebaseConfig);

// Use persistent Auth storage on native; web uses default
export const auth = Platform.OS === 'web'
  ? getAuth(app)
  : initializeAuth(app, {
      persistence: getReactNativePersistence(AsyncStorage),
    });
export const db = getFirestore(app);
