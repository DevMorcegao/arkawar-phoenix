import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { logger } from './logger';

const env = process.env.NEXT_PUBLIC_FIREBASE_ENV || 'development';

logger.info('Firebase', `🔥 Inicializando Firebase no ambiente: ${env}`);
logger.info('Firebase', `🏢 Project ID: ${env === 'production' ? process.env.NEXT_PUBLIC_FIREBASE_PROD_PROJECT_ID : process.env.NEXT_PUBLIC_FIREBASE_DEV_PROJECT_ID}`);

const config = {
  apiKey: env === 'production'
    ? process.env.NEXT_PUBLIC_FIREBASE_PROD_API_KEY
    : process.env.NEXT_PUBLIC_FIREBASE_DEV_API_KEY,
  authDomain: env === 'production'
    ? process.env.NEXT_PUBLIC_FIREBASE_PROD_AUTH_DOMAIN
    : process.env.NEXT_PUBLIC_FIREBASE_DEV_AUTH_DOMAIN,
  projectId: env === 'production'
    ? process.env.NEXT_PUBLIC_FIREBASE_PROD_PROJECT_ID
    : process.env.NEXT_PUBLIC_FIREBASE_DEV_PROJECT_ID,
  storageBucket: env === 'production'
    ? process.env.NEXT_PUBLIC_FIREBASE_PROD_STORAGE_BUCKET
    : process.env.NEXT_PUBLIC_FIREBASE_DEV_STORAGE_BUCKET,
  messagingSenderId: env === 'production'
    ? process.env.NEXT_PUBLIC_FIREBASE_PROD_MESSAGING_SENDER_ID
    : process.env.NEXT_PUBLIC_FIREBASE_DEV_MESSAGING_SENDER_ID,
  appId: env === 'production'
    ? process.env.NEXT_PUBLIC_FIREBASE_PROD_APP_ID
    : process.env.NEXT_PUBLIC_FIREBASE_DEV_APP_ID,
  measurementId: env === 'production'
    ? process.env.NEXT_PUBLIC_FIREBASE_PROD_MEASUREMENT_ID
    : process.env.NEXT_PUBLIC_FIREBASE_DEV_MEASUREMENT_ID
};

const app = initializeApp(config);
const db = getFirestore(app);
const auth = getAuth(app);

export { db, auth };