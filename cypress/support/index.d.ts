/// <reference types="cypress" />

import type { User as FirebaseUser, IdTokenResult, Auth, Persistence, NextOrObserver } from 'firebase/auth'
import type { Firestore } from 'firebase/firestore'
import type { FirebaseApp } from 'firebase/app'

export type FirebaseErrorCode = 
  | 'auth/user-not-found'
  | 'auth/wrong-password'
  | 'auth/invalid-email'
  | 'auth/user-disabled'
  | 'auth/email-already-in-use'
  | 'auth/operation-not-allowed'
  | 'auth/weak-password'
  | 'auth/too-many-requests'
  | 'auth/internal-error'

interface MockIdTokenResult {
  token: string
  claims: {
    role: string
    email: string
    email_verified: boolean
    auth_time: string
    iat: string
    exp: string
    sub: string
  }
  issuedAtTime: string
  expirationTime: string
  authTime: string
  signInProvider: string | null
  signInSecondFactor: string | null
}

interface MockUserMetadata {
  creationTime?: string
  lastSignInTime?: string
  lastLoginAt?: string
  createdAt?: string
}

interface MockUser extends Omit<FirebaseUser, 'metadata' | 'providerData'> {
  reloadUserInfo: any
  stsTokenManager: any
  uid: string
  email: string | null
  emailVerified: boolean
  displayName: string | null
  photoURL: string | null
  phoneNumber: string | null
  isAnonymous: boolean
  tenantId: string | null
  providerId: string
  metadata: MockUserMetadata
  providerData: any[]
  refreshToken: string
  delete: () => Promise<void>
  getIdToken: () => Promise<string>
  getIdTokenResult: () => Promise<MockIdTokenResult>
  reload: () => Promise<void>
  toJSON: () => {
    uid: string
    email: string | null
    emailVerified: boolean
    displayName: string | null
    photoURL: string | null
    phoneNumber: string | null
    isAnonymous: boolean
    tenantId: string | null
    providerId: string
    metadata: MockUserMetadata
    providerData: any[]
    refreshToken: string
    reloadUserInfo: any
    stsTokenManager: any
  }
}

interface MockFirebaseAuth {
  currentUser: MockUser | null
  onAuthStateChanged: (callback: (user: MockUser | null) => void) => () => void
  signInWithEmailAndPassword: (email: string, password: string) => Promise<{ user: MockUser }>
  signOut: () => Promise<void>
  app: MockFirebaseApp
  name: string
  config: { apiKey: string; authDomain: string }
  languageCode: string | null
  tenantId: string | null
  settings: { appVerificationDisabledForTesting: boolean }
  setPersistence: (persistence: Persistence) => Promise<void>
  useDeviceLanguage: () => void
  updateCurrentUser: (user: MockUser | null) => Promise<void>
}

interface MockFirestore {
  collection: (path: string) => any
  doc: (path: string) => any
}

interface MockFirebaseApp {
  name: string
  options: any
  automaticDataCollectionEnabled: boolean
  auth: () => MockFirebaseAuth
  firestore: () => MockFirestore
}

interface DocumentData {
  [key: string]: any
}

interface FirestoreDocument {
  exists: boolean
  data: () => DocumentData | null
  get: () => Promise<FirestoreDocument>
  onSnapshot: (callback: (doc: FirestoreDocument) => void) => () => void
}

interface FirestoreCollection {
  doc: (id: string) => FirestoreDocument
}

interface FirestoreInstance {
  collection: (path: string) => FirestoreCollection
  doc: (path: string) => FirestoreDocument
  settings: (settings: any) => void
  enableNetwork: () => Promise<void>
  disableNetwork: () => Promise<void>
  terminate: () => Promise<void>
  clearPersistence: () => Promise<void>
  waitForPendingWrites: () => Promise<void>
  onSnapshotsInSync: (observer: () => void) => () => void
  INTERNAL: {
    delete: () => Promise<void>
  }
}

interface FirebaseConfig {
  apiKey: string
  authDomain: string
  projectId: string
  storageBucket: string
  messagingSenderId: string
  appId: string
}

interface FirebaseApp {
  auth: () => Auth
  firestore: () => Firestore
}

interface FirebaseSDK {
  initializeApp: (config: FirebaseConfig) => FirebaseApp
  getAuth: () => Auth
  getFirestore: () => Firestore
}

interface FirebaseStubs extends FirebaseSDK {
  initializeApp: FirebaseAuthStub
  getAuth: FirebaseAuthStub
  getFirestore: FirebaseAuthStub
}

interface FirebaseInstance extends FirebaseApp {
  auth: () => Auth
  firestore: () => Firestore
}

interface FirebaseSDKType {
  initializeApp(config?: any): MockFirebaseApp | FirebaseApp
  getAuth(): MockFirebaseAuth | Auth
  getFirestore(): MockFirestore | Firestore
}

declare global {
  interface Window {
    firebase: {
      auth(): MockFirebaseAuth | Auth
      firestore(): MockFirestore | Firestore
    }
    firebaseSDK: FirebaseSDKType
  }

  namespace Cypress {
    interface Chainable<Subject = any> {
      /**
       * Limpa o estado de autenticação do Firebase
       * @example
       * cy.clearFirebaseAuth()
       */
      clearFirebaseAuth(): void

      /**
       * Configura o mock do Firebase Auth
       * @example
       * cy.mockFirebaseAuth()
       */
      mockFirebaseAuth(): void

      /**
       * Inicializa o Firebase com configurações de teste
       * @example
       * cy.initializeFirebase()
       */
      initializeFirebase(): Chainable<Promise<void>>

      /**
       * Reinicializa o Firebase após navegação se necessário
       * @example
       * cy.reinitializeFirebase()
       */
      reinitializeFirebase(): Chainable<void>

      /**
       * Simula erro de autenticação do Firebase
       * @example
       * cy.mockFirebaseAuthError('auth/user-not-found')
       */
      mockFirebaseAuthError(code: FirebaseErrorCode): Chainable<void>

      /**
       * Simula login bem-sucedido no Firebase
       * @example
       * cy.mockFirebaseLoginSuccess()
       */
      mockFirebaseLoginSuccess(): Chainable<void>

      /**
       * Simula registro bem-sucedido no Firebase
       * @example
       * cy.mockFirebaseRegisterSuccess()
       */
      mockFirebaseRegisterSuccess(): Chainable<void>

      /**
       * Simula estado de carregamento de autenticação do Firebase
       * @example
       * cy.mockFirebaseAuthLoadingState()
       */
      mockFirebaseAuthLoadingState(): Chainable<void>

      /**
       * Cria um stub para o Firebase Auth
       * @example
       * cy.createStub()
       */
      createStub(): FirebaseAuthStub
    }
  }

  namespace Cypress {
    interface AUTWindow extends Window {
      firebase: Window['firebase']
      firebaseSDK: Window['firebaseSDK']
    }
  }
}

export type {
  FirebaseConfig,
  FirebaseApp,
  FirebaseSDK,
  FirebaseStubs,
  FirebaseInstance,
  FirestoreInstance,
  FirestoreCollection,
  FirestoreDocument,
  DocumentData,
  FirebaseAuthStub, 
  MockIdTokenResult,
  MockFirebaseApp,
  MockFirebaseAuth,
  MockFirestore,
  MockUser,
  FirebaseSDKType
}
