import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { logger } from '@/lib/logger';

const environment = process.env.NEXT_PUBLIC_FIREBASE_ENV || 'development';

const getFirebaseConfig = () => {
  if (environment === 'production') {
    return {
      apiKey: process.env.NEXT_PUBLIC_FIREBASE_PROD_API_KEY,
      authDomain: process.env.NEXT_PUBLIC_FIREBASE_PROD_AUTH_DOMAIN,
      projectId: process.env.NEXT_PUBLIC_FIREBASE_PROD_PROJECT_ID,
      storageBucket: process.env.NEXT_PUBLIC_FIREBASE_PROD_STORAGE_BUCKET,
      messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_PROD_MESSAGING_SENDER_ID,
      appId: process.env.NEXT_PUBLIC_FIREBASE_PROD_APP_ID,
      measurementId: process.env.NEXT_PUBLIC_FIREBASE_PROD_MEASUREMENT_ID,
    };
  }
  
  return {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_DEV_API_KEY,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_DEV_AUTH_DOMAIN,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_DEV_PROJECT_ID,
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_DEV_STORAGE_BUCKET,
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_DEV_MESSAGING_SENDER_ID,
    appId: process.env.NEXT_PUBLIC_FIREBASE_DEV_APP_ID,
    measurementId: process.env.NEXT_PUBLIC_FIREBASE_DEV_MEASUREMENT_ID,
  };
};

const firebaseConfig = getFirebaseConfig();
const app = initializeApp(firebaseConfig);
logger.info('Firebase', 'Firebase initialized', { environment });
export const auth = getAuth(app);
export const db = getFirestore(app);