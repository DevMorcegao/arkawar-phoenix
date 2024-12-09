import { logger } from '../../../lib/logger'
import type { MockUser, MockIdTokenResult } from '../index'

const mockIdToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJ0ZXN0LXVpZCIsImVtYWlsIjoidGVzdEBleGFtcGxlLmNvbSIsInJvbGUiOiJ1c2VyIiwiZXhwIjoxNzA0OTUwNDAwfQ.mock-signature'

// Mock do usuário para testes
const mockUser: MockUser = {
  uid: 'testUID123',
  email: 'test@example.com',
  emailVerified: true,
  displayName: 'Test User',
  photoURL: null,
  phoneNumber: null,
  isAnonymous: false,
  tenantId: null,
  providerId: 'password',
  metadata: {
    creationTime: new Date().toISOString(),
    lastSignInTime: new Date().toISOString(),
    lastLoginAt: new Date().toISOString(),
    createdAt: new Date().toISOString()
  },
  providerData: [],
  refreshToken: 'mockRefreshToken',
  stsTokenManager: {
    refreshToken: 'mockRefreshToken',
    accessToken: 'mockAccessToken',
    expirationTime: Date.now() + 3600000
  },
  reloadUserInfo: {
    localId: 'testUID123',
    email: 'test@example.com',
    displayName: 'Test User',
    photoUrl: null,
    passwordHash: 'mockPasswordHash',
    emailVerified: true,
    passwordUpdatedAt: Date.now(),
    providerUserInfo: [{
      providerId: 'password',
      federatedId: 'test@example.com',
      email: 'test@example.com',
      rawId: 'testUID123',
      displayName: 'Test User',
      photoUrl: null
    }],
    validSince: (Date.now() / 1000).toString(),
    lastLoginAt: new Date().toISOString(),
    createdAt: new Date().toISOString()
  },
  async getIdToken() {
    return 'mockIdToken'
  },
  async getIdTokenResult(): Promise<MockIdTokenResult> {
    const now = new Date()
    const authTime = now.toISOString()
    const issuedAtTime = now.toISOString()
    const expirationTime = new Date(now.getTime() + 3600 * 1000).toISOString()

    return {
      token: 'mockIdToken',
      claims: {
        role: 'user',
        email: 'test@example.com',
        email_verified: true,
        auth_time: Math.floor(now.getTime() / 1000).toString(),
        iat: Math.floor(now.getTime() / 1000).toString(),
        exp: Math.floor((now.getTime() + 3600 * 1000) / 1000).toString(),
        sub: 'testUID123'
      },
      issuedAtTime,
      expirationTime,
      authTime,
      signInProvider: 'password',
      signInSecondFactor: null
    }
  },
  async delete() {
    // Implementação vazia para mock
  },
  async reload() {
    // Implementação vazia para mock
  },
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

// Configurar interceptações do Firebase Auth
export function setupAuthMocks(): MockUser {
  logger.debug('AuthMock', 'Configurando mocks de autenticação')

  let authStateListeners: Array<(user: any) => void> = []
  let currentUser: MockUser | null = null

  // Sobrescrever métodos do Firebase Auth
  cy.window().then((win: any) => {
    const auth = win.firebase?.auth()
    if (auth) {
      // Sobrescrever onAuthStateChanged
      auth.onAuthStateChanged = (callback: (user: any) => void) => {
        authStateListeners.push(callback)
        callback(currentUser)
        return () => {
          authStateListeners = authStateListeners.filter(listener => listener !== callback)
        }
      }

      // Sobrescrever createUserWithEmailAndPassword para usar o stub
      auth.createUserWithEmailAndPassword = (email: string, password: string) => {
        // Criar um novo usuário mock com o email fornecido
        currentUser = {
          ...mockUser,
          email,
          reloadUserInfo: {
            ...mockUser.reloadUserInfo,
            email
          }
        }

        // Chamar o stub e retornar a promessa
        return cy.get('@firebaseCreateUser')
          .then(stub => {
            (stub as any)(email, password)
            return { user: currentUser }
          })
      }

      // Sobrescrever signInWithEmailAndPassword
      auth.signInWithEmailAndPassword = async () => {
        currentUser = mockUser
        auth.currentUser = currentUser
        authStateListeners.forEach(listener => listener(currentUser))
        return { user: currentUser }
      }

      // Sobrescrever signOut
      auth.signOut = async () => {
        currentUser = null
        auth.currentUser = null
        authStateListeners.forEach(listener => listener(null))
      }
    }
  })

  // Interceptar todas as chamadas do Firebase
  cy.intercept('POST', '**/accounts:signUp*', (req) => {
    const { email } = req.body
    logger.debug('AuthMock', 'Interceptando registro', { email })

    req.reply({
      statusCode: 200,
      body: {
        kind: 'identitytoolkit#SignupNewUserResponse',
        idToken: mockIdToken,
        email,
        refreshToken: 'mock-refresh-token',
        expiresIn: '3600',
        localId: 'test-uid'
      }
    })
  }).as('signUpRequest')

  // Interceptar outras chamadas do Firebase
  cy.intercept('**/*.googleapis.com/**', (req) => {
    if (req.url.includes('accounts:signInWithPassword')) {
      req.reply({
        delay: 1000,
        statusCode: 200,
        body: {
          kind: 'identitytoolkit#SignInWithPasswordResponse',
          localId: mockUser.uid,
          email: mockUser.email,
          displayName: mockUser.displayName,
          idToken: mockIdToken,
          registered: true,
          refreshToken: mockUser.refreshToken,
          expiresIn: '3600'
        }
      })
    } else if (req.url.includes('accounts:lookup')) {
      req.reply({
        delay: 500,
        statusCode: 200,
        body: {
          kind: 'identitytoolkit#GetAccountInfoResponse',
          users: [{
            localId: mockUser.uid,
            email: mockUser.email,
            emailVerified: mockUser.emailVerified,
            displayName: mockUser.displayName,
            providerUserInfo: mockUser.providerData,
            photoUrl: mockUser.photoURL,
            passwordHash: mockUser.reloadUserInfo?.passwordHash || 'mock-password-hash',
            passwordUpdatedAt: mockUser.reloadUserInfo?.passwordUpdatedAt || Date.now(),
            validSince: mockUser.reloadUserInfo?.validSince || (Date.now() / 1000).toString(),
            disabled: false,
            lastLoginAt: mockUser.metadata.lastLoginAt,
            createdAt: mockUser.metadata.createdAt,
            customAuth: false
          }]
        }
      })
    }
  }).as('firebaseRequest')

  return mockUser
}
