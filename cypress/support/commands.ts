/// <reference types="cypress" />
/// <reference path="./index.d.ts" />
import { 
  MockUser, 
  FirebaseErrorCode, 
  FirestoreDocument, 
  FirestoreInstance, 
  MockFirebaseAuth,
  FirebaseInstance,
  MockFirestore,
  MockFirebaseApp,
  MockIdTokenResult
} from './index'
import { logger } from '../../lib/logger'
import { Auth, NextOrObserver, Persistence } from 'firebase/auth'
import { Firestore } from 'firebase/firestore'

// Definindo o tipo LogData localmente já que ele é interno ao logger
interface LogData {
  id?: string
  [key: string]: any
}

// Mock do usuário padrão para testes
const now = new Date()
const mockUser: MockUser = {
  uid: 'test-uid',
  email: 'test@example.com',
  emailVerified: true,
  displayName: 'Test User',
  photoURL: null,
  phoneNumber: null,
  isAnonymous: false,
  tenantId: null,
  providerId: 'password',
  metadata: {
    creationTime: now.toISOString(),
    lastSignInTime: now.toISOString(),
    lastLoginAt: now.toISOString(),
    createdAt: now.toISOString()
  },
  providerData: [],
  refreshToken: 'mock-refresh-token',
  delete: () => Promise.resolve(),
  getIdToken: () => Promise.resolve('mock-id-token'),
  getIdTokenResult: () => Promise.resolve({
    token: 'mock-id-token',
    claims: {
      role: 'user',
      email: 'test@example.com',
      email_verified: true,
      auth_time: now.toISOString(),
      iat: now.toISOString(),
      exp: new Date(now.getTime() + 3600000).toISOString(),
      sub: 'test-uid'
    },
    issuedAtTime: now.toISOString(),
    expirationTime: new Date(now.getTime() + 3600000).toISOString(),
    authTime: now.toISOString(),
    signInProvider: 'password',
    signInSecondFactor: null
  }),
  reload: () => Promise.resolve(),
  stsTokenManager: undefined,
  reloadUserInfo: undefined,
  toJSON: function() {
    return {
      uid: this.uid,
      email: this.email,
      emailVerified: this.emailVerified,
      displayName: this.displayName,
      photoURL: this.photoURL,
      phoneNumber: this.phoneNumber,
      isAnonymous: this.isAnonymous,
      tenantId: this.tenantId,
      providerId: this.providerId,
      metadata: this.metadata,
      providerData: this.providerData,
      refreshToken: this.refreshToken,
      reloadUserInfo: this.reloadUserInfo,
      stsTokenManager: this.stsTokenManager
    }
  }
}

// Função para criar um documento mock
function createMockDocument(data: any = null): FirestoreDocument {
  return {
    exists: data !== null,
    data: () => data,
    get: () => Promise.resolve({
      exists: data !== null,
      data: () => data,
      get: () => Promise.resolve(null as any),
      onSnapshot: () => () => {}
    }),
    onSnapshot: (callback) => {
      callback({
        exists: data !== null,
        data: () => data,
        get: () => Promise.resolve(null as any),
        onSnapshot: () => () => {}
      })
      return () => {}
    }
  }
}

// Mock do Firestore
const mockFirestore: FirestoreInstance = {
  collection: (path: string) => ({
    doc: (id: string) => createMockDocument({ id })
  }),
  doc: (path: string) => createMockDocument({ path }),
  settings: () => {},
  enableNetwork: () => Promise.resolve(),
  disableNetwork: () => Promise.resolve(),
  terminate: () => Promise.resolve(),
  clearPersistence: () => Promise.resolve(),
  waitForPendingWrites: () => Promise.resolve(),
  onSnapshotsInSync: () => () => {},
  INTERNAL: {
    delete: () => Promise.resolve()
  }
}

// Helper para criar mock do Firebase App
function createMockApp(auth: MockFirebaseAuth): MockFirebaseApp {
  return {
    name: 'mock-app',
    options: {
      apiKey: 'mock-api-key',
      authDomain: 'mock-auth-domain'
    },
    automaticDataCollectionEnabled: false,
    auth: () => auth,
    firestore: () => mockFirestore
  }
}

// Função auxiliar para criar mock do Auth
function createMockAuth(app: MockFirebaseApp): MockFirebaseAuth {
  return {
    currentUser: null,
    app: app,
    name: '[DEFAULT]',
    config: {
      apiKey: 'mock-api-key',
      authDomain: 'mock-auth-domain'
    },
    languageCode: 'en',
    tenantId: null,
    settings: {
      appVerificationDisabledForTesting: true
    },
    onAuthStateChanged: (callback: (user: any) => void) => {
      callback(null)
      return () => {}
    },
    signInWithEmailAndPassword: () => Promise.reject(new Error('Not implemented')),
    signOut: () => Promise.resolve(),
    setPersistence: () => Promise.resolve(),
    useDeviceLanguage: () => {},
    updateCurrentUser: () => Promise.resolve()
  }
}

// Mock do Firebase Auth com timing realista
Cypress.Commands.add('mockFirebaseAuth', () => {
  let authStateCallback: ((user: MockUser | null) => void) | null = null
  let currentUser: MockUser | null = null

  const mockUser: MockUser = {
    uid: 'mock-uid',
    email: 'test@example.com',
    emailVerified: true,
    isAnonymous: false,
    metadata: {
      creationTime: '2024-01-01T00:00:00Z',
      lastSignInTime: '2024-01-01T00:00:00Z',
      lastLoginAt: '2024-01-01T00:00:00Z',
      createdAt: '2024-01-01T00:00:00Z'
    },
    providerData: [],
    refreshToken: 'mock-refresh-token',
    reloadUserInfo: {
      email: 'test@example.com',
      federatedId: 'mock-federated-id',
      localId: 'mock-local-id'
    },
    stsTokenManager: {
      accessToken: 'mock-access-token',
      refreshToken: 'mock-refresh-token',
      expirationTime: Date.now() + 3600000 // 1 hora
    },
    delete: () => Promise.resolve(),
    getIdToken: () => Promise.resolve('mock-id-token'),
    reload: () => Promise.resolve(),
    toJSON: () => ({
      uid: mockUser.uid,
      email: mockUser.email,
      emailVerified: mockUser.emailVerified,
      displayName: null,
      photoURL: null,
      phoneNumber: null,
      isAnonymous: mockUser.isAnonymous,
      tenantId: mockUser.tenantId,
      providerData: mockUser.providerData,
      stsTokenManager: mockUser.stsTokenManager,
      providerId: 'password',
      metadata: mockUser.metadata,
      refreshToken: mockUser.refreshToken,
      reloadUserInfo: mockUser.reloadUserInfo
    }),
    displayName: null,
    photoURL: null,
    phoneNumber: null,
    tenantId: null,
    providerId: '',
    getIdTokenResult: function (): Promise<MockIdTokenResult> {
      throw new Error('Function not implemented.')
    }
  }

  // Criar mock do Firestore
  const mockFirestore: MockFirestore = {
    collection: (path: string) => ({
      doc: (id: string) => ({
        get: () => Promise.resolve({ exists: false, data: () => null }),
        set: (data: any) => Promise.resolve(),
        update: (data: any) => Promise.resolve(),
        delete: () => Promise.resolve()
      }),
      add: (data: any) => Promise.resolve({ id: 'mock-id' }),
      where: () => ({ get: () => Promise.resolve({ docs: [] }) })
    }),
    doc: (path: string) => ({
      get: () => Promise.resolve({ exists: false, data: () => null }),
      set: (data: any) => Promise.resolve(),
      update: (data: any) => Promise.resolve(),
      delete: () => Promise.resolve()
    })
  }

  // Criar mocks recursivamente
  const mockAuthTemp: Partial<MockFirebaseAuth> = {}
  const mockAppTemp = {
    name: 'mock-app',
    options: {
      apiKey: 'mock-api-key',
      authDomain: 'mock-auth-domain'
    },
    automaticDataCollectionEnabled: false,
    auth: () => mockAuth,
    firestore: () => mockFirestore
  }

  const mockAuth: MockFirebaseAuth = {
    currentUser,
    app: mockAppTemp,
    name: '[DEFAULT]',
    config: {
      apiKey: 'mock-api-key',
      authDomain: 'mock-auth-domain'
    },
    languageCode: 'en',
    tenantId: null,
    settings: {
      appVerificationDisabledForTesting: true
    },
    onAuthStateChanged: (callback: NextOrObserver<MockUser | null>) => {
      if (typeof callback === 'function') {
        authStateCallback = callback
        // Chamar imediatamente com o estado atual
        callback(currentUser)
      }
      return () => {
        authStateCallback = null
      }
    },
    signInWithEmailAndPassword: async () => {
      // Simular delay de rede
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      // Atualizar estado e notificar listeners
      currentUser = mockUser
      mockAuth.currentUser = currentUser
      
      if (authStateCallback) {
        authStateCallback(currentUser)
      }
      
      return { user: currentUser }
    },
    signOut: async () => {
      currentUser = null
      mockAuth.currentUser = null
      if (authStateCallback) {
        authStateCallback(null)
      }
    },
    setPersistence: () => Promise.resolve(),
    useDeviceLanguage: () => {},
    updateCurrentUser: async (user: MockUser | null) => {
      currentUser = user
      mockAuth.currentUser = user
      if (authStateCallback) {
        authStateCallback(user)
      }
    }
  }

  // Atualizar a referência do auth no app
  mockAppTemp.auth = () => mockAuth

  // Configurar interceptações
  cy.intercept('POST', '**/accounts:signInWithPassword*', {
    statusCode: 200,
    body: {
      idToken: 'mock-id-token',
      email: 'test@example.com',
      refreshToken: 'mock-refresh-token',
      expiresIn: '3600',
      localId: 'mock-local-id'
    }
  }).as('signInRequest')

  cy.window().then((win) => {
    // Mock do Firebase SDK
    win.firebaseSDK = {
      initializeApp: () => mockAppTemp,
      getAuth: () => mockAuth,
      getFirestore: () => mockFirestore
    }

    // Mock do Firebase Legacy
    win.firebase = {
      auth: () => mockAuth,
      firestore: () => mockFirestore
    }
  })

  logger.debug('Firebase', 'Auth mockado com sucesso')
})

Cypress.Commands.add('clearFirebaseAuth', () => {
  cy.window().then(win => {
    if ('firebase' in win) {
      // @ts-ignore - Permitir delete em propriedade opcional
      delete win.firebase
    }
  })
})

Cypress.Commands.add('mockFirebaseAuthError', (errorCode: FirebaseErrorCode) => {
  // Criar mock do auth e app de forma recursiva
  const mockAuthTemp: Partial<MockFirebaseAuth> = {}
  const mockAppTemp = createMockApp(mockAuthTemp as MockFirebaseAuth)
  
  const mockAuth: MockFirebaseAuth = {
    currentUser: null,
    app: mockAppTemp,
    name: '[DEFAULT]',
    config: {
      apiKey: 'mock-api-key',
      authDomain: 'mock-auth-domain'
    },
    languageCode: 'en',
    tenantId: null,
    settings: {
      appVerificationDisabledForTesting: true
    },
    onAuthStateChanged: (callback: (user: any) => void) => {
      callback(null)
      return () => {}
    },
    signInWithEmailAndPassword: () => Promise.reject(new Error(getFirebaseErrorMessage(errorCode))),
    signOut: () => Promise.resolve(),
    setPersistence: () => Promise.resolve(),
    useDeviceLanguage: () => {},
    updateCurrentUser: () => Promise.resolve()
  }

  // Atualizar a referência do auth no app
  mockAppTemp.auth = () => mockAuth

  cy.window().then((win) => {
    win.firebase = {
      auth: () => mockAuth,
      firestore: () => mockFirestore
    }

    win.firebaseSDK = {
      initializeApp: () => mockAppTemp,
      getAuth: () => mockAuth,
      getFirestore: () => mockFirestore
    }
  })
})

Cypress.Commands.add('mockFirebaseAuthLoadingState', () => {
  const mockAuthTemp: Partial<MockFirebaseAuth> = {}
  const mockAppTemp = createMockApp(mockAuthTemp as MockFirebaseAuth)
  
  const mockAuth: MockFirebaseAuth = {
    currentUser: null,
    app: mockAppTemp,
    name: '[DEFAULT]',
    config: {
      apiKey: 'mock-api-key',
      authDomain: 'mock-auth-domain'
    },
    languageCode: 'en',
    tenantId: null,
    settings: {
      appVerificationDisabledForTesting: true
    },
    onAuthStateChanged: (callback: (user: any) => void) => {
      setTimeout(() => callback(null), 1000)
      return () => {}
    },
    signInWithEmailAndPassword: () => new Promise((resolve) => {
      setTimeout(() => resolve({ user: mockUser }), 1000)
    }),
    signOut: function (): Promise<void> {
      throw new Error('Function not implemented.')
    },
    setPersistence: function (persistence: Persistence): Promise<void> {
      throw new Error('Function not implemented.')
    },
    useDeviceLanguage: function (): void {
      throw new Error('Function not implemented.')
    },
    updateCurrentUser: function (user: MockUser | null): Promise<void> {
      throw new Error('Function not implemented.')
    }
  }

  // Atualizar a referência do auth no app
  mockAppTemp.auth = () => mockAuth

  cy.window().then((win) => {
    win.firebaseSDK = {
      initializeApp: () => mockAppTemp,
      getAuth: () => mockAuth,
      getFirestore: () => mockFirestore
    }

    win.firebase = {
      auth: () => mockAuth,
      firestore: () => mockFirestore
    }
  })

  logger.debug('Firebase', 'Auth mockado em estado de loading')
})

Cypress.Commands.add('mockFirebaseLoginSuccess', () => {
  // Mock da requisição de login
  cy.intercept('POST', '**/identitytoolkit.googleapis.com/v1/accounts:signInWithPassword*', {
    statusCode: 200,
    body: {
      kind: 'identitytoolkit#VerifyPasswordResponse',
      localId: mockUser.uid,
      email: mockUser.email,
      displayName: mockUser.displayName,
      idToken: mockUser.stsTokenManager.accessToken,
      registered: true,
      refreshToken: mockUser.refreshToken,
      expiresIn: '3600'
    }
  }).as('signInRequest')

  // Mock da requisição de lookup
  cy.intercept('POST', '**/identitytoolkit.googleapis.com/v1/accounts:lookup*', {
    statusCode: 200,
    body: {
      kind: 'identitytoolkit#GetAccountInfoResponse',
      users: [{
        localId: mockUser.uid,
        email: mockUser.email,
        emailVerified: true,
        displayName: mockUser.displayName,
        providerUserInfo: [{
          providerId: 'password',
          displayName: mockUser.displayName,
          photoUrl: null,
          federatedId: mockUser.email,
          email: mockUser.email,
          rawId: mockUser.email,
          screenName: mockUser.displayName
        }],
        lastLoginAt: now.getTime().toString(),
        createdAt: now.getTime().toString()
      }]
    }
  }).as('lookupRequest')

  // Mock da requisição de refresh token
  cy.intercept('POST', '**/securetoken.googleapis.com/v1/token*', {
    statusCode: 200,
    body: {
      access_token: mockUser.stsTokenManager.accessToken,
      expires_in: '3600',
      token_type: 'Bearer',
      refresh_token: mockUser.refreshToken,
      id_token: mockUser.stsTokenManager.accessToken,
      user_id: mockUser.uid,
      project_id: 'test-project'
    }
  }).as('refreshTokenRequest')

  // Mock da requisição do Firestore
  cy.intercept('GET', '**/firestore.googleapis.com/**', {
    statusCode: 200,
    body: {
      documents: [{
        name: `projects/test-project/databases/(default)/documents/users/${mockUser.uid}`,
        fields: {
          role: { stringValue: 'user' },
          email: { stringValue: mockUser.email },
          name: { stringValue: mockUser.displayName },
          createdAt: { stringValue: now.toISOString() }
        },
        createTime: now.toISOString(),
        updateTime: now.toISOString()
      }]
    }
  }).as('firestoreGet')

  // Mock do cookie de autenticação
  cy.window().then(win => {
    win.localStorage.setItem('firebase:authUser:test-api-key:test-project', JSON.stringify(mockUser))
    win.localStorage.setItem('firebase:token', mockUser.stsTokenManager.accessToken)
  })

  // Simular o evento de mudança de estado de autenticação
  cy.window().then(win => {
    if (win.firebase?.auth) {
      win.firebase.auth().onAuthStateChanged((callback: any) => {
        callback(mockUser)
      })
    }
  })
})

Cypress.Commands.add('mockFirebaseRegisterSuccess', () => {
  cy.window().then((win) => {
    if (!win.firebase) return

    // Variável para armazenar o callback atual
    let currentAuthStateCallback: ((user: MockUser | null) => void) | null = null

    // Mock da requisição de registro
    cy.intercept('POST', '**/identitytoolkit.googleapis.com/v1/accounts:signUp*', {
      statusCode: 200,
      body: {
        kind: 'identitytoolkit#SignupNewUserResponse',
        localId: mockUser.uid,
        email: mockUser.email,
        displayName: mockUser.displayName,
        idToken: mockUser.stsTokenManager.accessToken,
        refreshToken: mockUser.refreshToken,
        expiresIn: '3600'
      }
    }).as('signUpRequest')

    // Mock da requisição de token
    cy.intercept('POST', '**/securetoken.googleapis.com/v1/token*', {
      statusCode: 200,
      body: {
        access_token: mockUser.stsTokenManager.accessToken,
        expires_in: '3600',
        token_type: 'Bearer',
        refresh_token: mockUser.refreshToken,
        id_token: mockUser.stsTokenManager.accessToken,
        user_id: mockUser.uid,
        project_id: 'test-project'
      }
    }).as('refreshTokenRequest')

    // Mock da requisição do Firestore
    cy.intercept('GET', '**/firestore.googleapis.com/**', {
      statusCode: 200,
      body: {
        documents: [{
          name: `projects/test-project/databases/(default)/documents/users/${mockUser.uid}`,
          fields: {
            role: { stringValue: 'user' },
            email: { stringValue: mockUser.email },
            name: { stringValue: mockUser.displayName },
            createdAt: { stringValue: now.toISOString() }
          },
          createTime: now.toISOString(),
          updateTime: now.toISOString()
        }]
      }
    }).as('firestoreGet')

    // Mock do cookie de autenticação
    cy.window().then(win => {
      win.localStorage.setItem('firebase:authUser:test-api-key:test-project', JSON.stringify(mockUser))
      win.localStorage.setItem('firebase:token', mockUser.stsTokenManager.accessToken)
    })

    // Simular o evento de mudança de estado de autenticação
    cy.window().then(win => {
      if (win.firebase?.auth) {
        win.firebase.auth().onAuthStateChanged((callback: any) => {
          callback(mockUser)
        })
      }
    })
  })
})

Cypress.Commands.add('mockFirebaseAuth', () => {
  cy.window().then(win => {
    const mockAuth = createMockAuth({} as MockFirebaseApp)
    const mockFirestoreInstance: FirestoreInstance = {
      collection: (path: string) => ({
        doc: (id: string) => createMockDocument({})
      }),
      doc: (path: string) => createMockDocument({}),
      settings: (settings: any) => {},
      enableNetwork: () => Promise.resolve(),
      disableNetwork: () => Promise.resolve(),
      terminate: () => Promise.resolve(),
      clearPersistence: () => Promise.resolve(),
      waitForPendingWrites: () => Promise.resolve(),
      onSnapshotsInSync: (observer: () => void) => () => {},
      INTERNAL: { delete: () => Promise.resolve() }
    }

    win.firebase = {
      auth: () => mockAuth as unknown as Auth,
      firestore: () => mockFirestoreInstance as unknown as Firestore
    }
  })
})

// Comando para fazer login
Cypress.Commands.add('login', (email: string, password: string) => {
  // Type credentials
  cy.get('[data-testid="email-input"]').type(email)
  cy.get('[data-testid="password-input"]').type(password)
  cy.get('[data-testid="login-button"]').click()

  // Wait for Firebase initialization
  cy.window().should('have.property', 'firebase')

  // Wait for loading screen to disappear
  cy.get('[data-testid="theme-loading-screen"]').should('not.exist')

  // Verify successful navigation
  cy.url().should('include', '/parties')
})

// Inicializar Firebase
Cypress.Commands.add('initializeFirebase', () => {
  cy.log('Inicializando Firebase')
  cy.window().then(win => {
    // Se já estiver inicializado, não precisa fazer nada
    if (win.firebase) {
      cy.log('Firebase já está inicializado')
      return
    }

    // Verificar se o SDK está disponível
    if (!win.firebaseSDK) {
      throw new Error('Firebase SDK não está disponível')
    }

    // Inicializar o app
    const app = win.firebaseSDK.initializeApp({
      apiKey: 'mock-api-key',
      authDomain: 'mock-auth-domain',
      projectId: 'mock-project-id'
    })

    // Configurar auth e firestore
    const auth = win.firebaseSDK.getAuth()
    const firestore = win.firebaseSDK.getFirestore()

    // Atribuir ao window
    win.firebase = {
      auth: () => auth,
      firestore: () => firestore
    }

    cy.log('Firebase inicializado com sucesso')
  })
})

// Comando para reinicializar o Firebase após navegação
Cypress.Commands.add('reinitializeFirebase', () => {
  cy.log('Reinicializando Firebase após navegação')
  cy.window().then(win => {
    if (!win.firebase) {
      cy.log('Firebase perdido após navegação, reinicializando')
      cy.initializeFirebase().then(() => {
        cy.log('Firebase reinicializado com sucesso')
      })
    } else {
      cy.log('Firebase ainda está presente após navegação')
    }
  })
})

// Função auxiliar para obter mensagens de erro do Firebase
function getFirebaseErrorMessage(code: string): string {
  switch (code) {
    case 'auth/user-not-found':
      return 'There is no user record corresponding to this identifier. The user may have been deleted.'
    case 'auth/wrong-password':
      return 'The password is invalid or the user does not have a password.'
    case 'auth/invalid-email':
      return 'The email address is badly formatted.'
    case 'auth/user-disabled':
      return 'The user account has been disabled by an administrator.'
    case 'auth/email-already-in-use':
      return 'The email address is already in use by another account.'
    case 'auth/operation-not-allowed':
      return 'Password sign-in is disabled for this project.'
    case 'auth/weak-password':
      return 'The password must be 6 characters long or more.'
    case 'auth/too-many-requests':
      return 'Access to this account has been temporarily disabled due to many failed login attempts.'
    case 'auth/internal-error':
      return 'An internal error has occurred.'
    default:
      return 'An unknown error occurred.'
  }
}

declare global {
  namespace Cypress {
    interface Chainable {
      clearFirebaseAuth(): Chainable<void>
      mockFirebaseAuth(): Chainable<void>
      mockFirebaseAuthError(code: FirebaseErrorCode): Chainable<void>
      mockFirebaseLoginSuccess(): Chainable<void>
      mockFirebaseRegisterSuccess(): Chainable<void>
      mockFirebaseAuthLoadingState(): Chainable<void>
      initializeFirebase(): Chainable<Promise<void>>
      login(email: string, password: string): Chainable<void>
    }
  }
}
