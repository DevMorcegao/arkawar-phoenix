import { vi } from 'vitest'

// Mock do processo do Node para variáveis de ambiente
vi.mock('process', () => ({
  env: {
    NEXT_PUBLIC_FIREBASE_API_KEY: 'mock-api-key',
    NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN: 'mock-auth-domain',
    NEXT_PUBLIC_FIREBASE_PROJECT_ID: 'mock-project-id',
    NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET: 'mock-storage-bucket',
    NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID: 'mock-sender-id',
    NEXT_PUBLIC_FIREBASE_APP_ID: 'mock-app-id',
    NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID: 'mock-measurement-id',
    NODE_ENV: 'test'
  }
}));
