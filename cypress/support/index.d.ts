/// <reference types="cypress" />

export interface MockUser {
  uid: string
  email: string
  emailVerified: boolean
  getIdToken(): Promise<string>
}

export type FirebaseErrorCode = 
  | 'auth/wrong-password'
  | 'auth/user-not-found'
  | 'auth/invalid-email'
  | 'auth/too-many-requests'
  | 'auth/internal-error'

declare global {
  namespace Cypress {
    interface Chainable {
      /**
       * Mock Firebase authentication
       * @example cy.mockFirebaseAuth()
       */
      mockFirebaseAuth(): Chainable<void>

      /**
       * Mock successful login
       * @example cy.mockSuccessfulLogin()
       */
      mockSuccessfulLogin(): Chainable<void>

      /**
       * Mock logout
       * @example cy.mockLogout()
       */
      mockLogout(): Chainable<void>

      /**
       * Simula um login bem-sucedido no Firebase
       * @example cy.mockFirebaseAuthSuccess()
       */
      mockFirebaseAuthSuccess(): Chainable<void>

      /**
       * Simula um registro bem-sucedido no Firebase
       * @example cy.mockFirebaseRegisterSuccess()
       */
      mockFirebaseRegisterSuccess(): Chainable<void>

      /**
       * Simula um erro de autenticação do Firebase
       * @param errorCode - Código de erro do Firebase (ex: 'auth/wrong-password')
       * @example cy.mockFirebaseAuthError('auth/wrong-password')
       */
      mockFirebaseAuthError(errorCode: FirebaseErrorCode): Chainable<void>

      /**
       * Simula um estado de carregamento na autenticação
       * @example cy.mockFirebaseAuthLoadingState()
       */
      mockFirebaseAuthLoadingState(): Chainable<void>

      /**
       * Limpa todos os dados de autenticação do Firebase
       * @example cy.clearFirebaseAuth()
       */
      clearFirebaseAuth(): Chainable<void>

      /**
       * Espera a navegação para um caminho específico
       * @param path - Caminho para esperar
       * @example cy.waitForNavigation('/dashboard')
       */
      waitForNavigation(path: string): Chainable<void>
    }

    interface AUTWindow extends Window {
      import(module: string): Promise<any>
      mockFirebaseUser: MockUser | null
      firebase?: {
        auth?: () => {
          onAuthStateChanged?: (callback: (user: MockUser | null) => void) => () => void
          currentUser?: MockUser | null
          emulatorConfig?: any
        }
      }
    }
  }
}

declare global {
  interface Window {
    mockFirebaseUser: MockUser | null
    firebase?: {
      auth?: {
        (): {
          onAuthStateChanged: (callback: (user: MockUser | null) => void) => () => void
          currentUser: MockUser | null
        }
        emulatorConfig?: any
      }
    }
    require?: WebpackRequire
    mockModule?(module: string): any
    import?(module: string): Promise<any>
  }
}

interface RequireContext {
  id: string
  keys(): string[]
  resolve(id: string): string
}

interface WebpackRequire {
  context(directory: string, useSubdirectories?: boolean, regExp?: RegExp): RequireContext
}
