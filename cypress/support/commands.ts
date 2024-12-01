/// <reference types="cypress" />
import type { MockUser, FirebaseErrorCode } from './index.d.ts'

declare global {
  namespace Cypress {
    interface Chainable {
      mockFirebaseAuthSuccess(): Chainable<void>
      mockFirebaseRegisterSuccess(): Chainable<void>
      mockFirebaseAuthError(errorCode: FirebaseErrorCode): Chainable<void>
      mockFirebaseAuthLoadingState(): Chainable<void>
      clearFirebaseAuth(): Chainable<void>
    }
  }
}

const createMockUser = (): MockUser => ({
  uid: 'testuid123',
  email: 'test@example.com',
  emailVerified: true,
  getIdToken: () => Promise.resolve('mock-token-123')
})

Cypress.Commands.add('mockFirebaseAuthSuccess', () => {
  const mockUser = createMockUser()
  const projectId = Cypress.env('FIREBASE_PROJECT_ID') || 'arkawar'

  // Mock sign in request
  cy.intercept('POST', 'https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword*', {
    statusCode: 200,
    body: {
      kind: 'identitytoolkit#VerifyPasswordResponse',
      localId: mockUser.uid,
      email: mockUser.email,
      displayName: '',
      idToken: 'mock-token-123',
      registered: true
    }
  }).as('signInRequest')

  // Mock token refresh
  cy.intercept('POST', 'https://securetoken.googleapis.com/v1/token*', {
    statusCode: 200,
    body: {
      access_token: 'mock-token-123',
      expires_in: '3600',
      token_type: 'Bearer'
    }
  })

  // Mock Firestore getDoc request
  cy.intercept('POST', '**/google.firestore.v1.Firestore/Get*', {
    statusCode: 200,
    body: {
      document: {
        name: `projects/${projectId}/databases/(default)/documents/users/${mockUser.uid}`,
        fields: {
          email: { stringValue: mockUser.email },
          role: { stringValue: 'user' },
          name: { stringValue: 'Test User' },
          createdAt: { timestampValue: new Date().toISOString() }
        },
        createTime: new Date().toISOString(),
        updateTime: new Date().toISOString()
      }
    }
  }).as('getUserDoc')

  // Mock Firestore REST API request (fallback)
  cy.intercept('GET', `**/projects/${projectId}/databases/(default)/documents/users/${mockUser.uid}`, {
    statusCode: 200,
    body: {
      name: `projects/${projectId}/databases/(default)/documents/users/${mockUser.uid}`,
      fields: {
        email: { stringValue: mockUser.email },
        role: { stringValue: 'user' },
        name: { stringValue: 'Test User' },
        createdAt: { timestampValue: new Date().toISOString() }
      },
      createTime: new Date().toISOString(),
      updateTime: new Date().toISOString()
    }
  }).as('getUserDocREST')

  cy.window().then((win) => {
    win.mockFirebaseUser = mockUser

    // Mock Firebase Auth
    win.firebase = {
      ...win.firebase,
      auth: () => ({
        currentUser: mockUser,
        onAuthStateChanged: (callback: (user: MockUser | null) => void) => {
          callback(mockUser)
          return () => {}
        },
        signInWithEmailAndPassword: () => Promise.resolve({ user: mockUser }),
        signOut: () => Promise.resolve()
      })
    }
  })
})

Cypress.Commands.add('mockFirebaseAuthError', (errorCode: FirebaseErrorCode) => {
  cy.intercept('POST', 'https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword*', {
    statusCode: 400,
    body: {
      error: {
        code: 400,
        message: `FIREBASE_ERROR_${errorCode}`,
        errors: [
          {
            message: `FIREBASE_ERROR_${errorCode}`,
            domain: 'global',
            reason: errorCode
          }
        ]
      }
    }
  }).as('signInError')

  cy.window().then((win) => {
    win.mockFirebaseUser = null
  })
})

Cypress.Commands.add('mockFirebaseRegisterSuccess', () => {
  cy.intercept('POST', 'https://identitytoolkit.googleapis.com/v1/accounts:signUp*', {
    statusCode: 200,
    body: {
      kind: 'identitytoolkit#SignupNewUserResponse',
      idToken: 'mock-token-123',
      email: 'newuser@example.com',
      refreshToken: 'mock-refresh-token',
      expiresIn: '3600',
      localId: 'newuserid123'
    }
  }).as('signUpRequest')

  cy.window().then((win) => {
    const mockUser = {
      ...createMockUser(),
      email: 'newuser@example.com',
      uid: 'newuserid123'
    }
    win.mockFirebaseUser = mockUser
  })
})

Cypress.Commands.add('mockFirebaseAuthLoadingState', () => {
  cy.intercept('POST', 'https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword*', {
    delay: 5000, // Delay de 5 segundos
    statusCode: 200,
    body: {
      kind: 'identitytoolkit#VerifyPasswordResponse',
      localId: 'testuid123',
      email: 'test@example.com',
      displayName: '',
      idToken: 'mock-token-123',
      registered: true
    }
  }).as('signInLoadingRequest')
})

Cypress.Commands.add('clearFirebaseAuth', () => {
  cy.window().then((win) => {
    win.mockFirebaseUser = null
  })
})
