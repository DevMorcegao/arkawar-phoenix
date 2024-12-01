import { vi } from 'vitest'
import { 
  Auth,
  UserCredential,
  User,
  Config
} from 'firebase/auth'
import { Firestore } from 'firebase/firestore'
import { FirebaseApp } from 'firebase/app'

const mockUserCredential: UserCredential = {
  user: {} as User,
  providerId: null,
  operationType: "signIn"
}

const mockApp = {} as FirebaseApp

const mockConfig: Config = {
  apiKey: 'mock-api-key',
  apiHost: 'identitytoolkit.googleapis.com',
  apiScheme: 'https',
  tokenApiHost: 'securetoken.googleapis.com',
  sdkClientVersion: 'mock-client-version'
}

// Primeiro criamos um objeto parcial do tipo Auth
const partialAuth: Partial<Auth> = {
  name: 'auth-mock',
  config: mockConfig,
  currentUser: null,
  app: mockApp,
  
  // Métodos da interface Auth
  setPersistence: vi.fn(),
  signOut: vi.fn(),
  updateCurrentUser: vi.fn(),
  onAuthStateChanged: vi.fn(),
  
  // Propriedades opcionais da interface Auth
  languageCode: null,
  tenantId: null,
  settings: { appVerificationDisabledForTesting: false },
  emulatorConfig: null
}

// Então fazemos o cast para Auth usando unknown como intermediário
const auth = partialAuth as unknown as Auth

// Mock das funções de autenticação
export const signInWithEmailAndPassword = vi.fn().mockResolvedValue(mockUserCredential)
export const createUserWithEmailAndPassword = vi.fn().mockResolvedValue(mockUserCredential)
export const signOut = vi.fn().mockResolvedValue(undefined)
export const onAuthStateChanged = vi.fn()
export const beforeAuthStateChanged = vi.fn().mockReturnValue(() => {})
export const onIdTokenChanged = vi.fn().mockReturnValue(() => {})
export const authStateReady = vi.fn().mockResolvedValue(undefined)
export const useEmulator = vi.fn()

const db = {
  collection: vi.fn(),
  doc: vi.fn(),
  getDoc: vi.fn(),
  setDoc: vi.fn(),
  updateDoc: vi.fn()
} as unknown as Firestore

// Mock da função initializeApp para evitar erro de API key
const initializeApp = vi.fn().mockReturnValue({
  auth: () => auth,
  firestore: () => db
})

const getAuth = vi.fn().mockReturnValue(auth)
const getFirestore = vi.fn().mockReturnValue(db)

export { 
  initializeApp, 
  getAuth, 
  getFirestore,
  auth,
  db
}
