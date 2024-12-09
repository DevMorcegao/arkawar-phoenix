import { logger } from '../../lib/logger'
import type { MockUser, FirebaseInstance } from '../support'

describe('Authentication Flow Capture', () => {
  beforeEach(() => {
    // Limpar qualquer estado anterior
    cy.clearFirebaseAuth()
    indexedDB.deleteDatabase('firebaseLocalStorageDb')

    // Criar stubs antes da visita à página
    const onAuthStateChangedStub = Cypress.sinon.stub().returns(() => {})
    const signInStub = Cypress.sinon.stub().resolves({
      user: {
        email: 'test@example.com',
        uid: 'test-uid',
        getIdToken: () => Promise.resolve('mock-id-token')
      }
    })

    const authStub = Cypress.sinon.stub().returns({
      onAuthStateChanged: onAuthStateChangedStub,
      signInWithEmailAndPassword: signInStub,
      currentUser: null
    })

    const firestoreStub = Cypress.sinon.stub().returns({
      collection: Cypress.sinon.stub(),
      doc: Cypress.sinon.stub()
    })

    const initializeAppStub = Cypress.sinon.stub().returns({
      auth: authStub,
      firestore: firestoreStub
    })

    // Criar aliases para os stubs
    cy.wrap(initializeAppStub).as('firebaseInitializeApp')
    cy.wrap(authStub).as('firebaseAuth')
    cy.wrap(signInStub).as('firebaseSignIn')

    // Interceptar requisições Firebase
    cy.intercept('**/*.googleapis.com/**', (req) => {
      const requestData = {
        method: req.method,
        url: req.url,
        headers: req.headers,
        body: req.body,
        timestamp: new Date().toISOString()
      }
      
      logger.debug('Firebase Request', JSON.stringify(requestData, null, 2))
      
      req.continue((res) => {
        const responseData = {
          status: res.statusCode,
          headers: res.headers,
          body: res.body,
          timestamp: new Date().toISOString()
        }
        
        logger.debug('Firebase Response', JSON.stringify(responseData, null, 2))
      })
    }).as('firebaseRequest')

    // Visitar a página com os stubs configurados
    cy.visit('/login', {
      onBeforeLoad(win) {
        win.firebaseSDK = {
          initializeApp: initializeAppStub,
          getAuth: Cypress.sinon.stub().returns(authStub()),
          getFirestore: Cypress.sinon.stub().returns(firestoreStub())
        }
      }
    })
    
    // Inicializar Firebase
    cy.initializeFirebase()
    
    // Aguardar carregamento do Firebase
    cy.window().should('have.property', 'firebase')
    
    // Aguardar tela de carregamento
    cy.get('[data-testid="theme-loading-screen"]').should('exist')
    cy.get('[data-testid="theme-loading-screen"]').should('not.exist')
  })

  it('should capture real authentication flow', () => {
    // Usar credenciais reais de teste
    cy.get('[data-testid="email-input"]').type('test@example.com')
    cy.get('[data-testid="password-input"]').type('password123')
    cy.get('[data-testid="login-button"]').click()

    // Aguardar requisições de autenticação
    cy.wait('@firebaseRequest').then((interception) => {
      const url = interception.request.url
      if (url.includes('accounts:signInWithPassword')) {
        logger.debug('SignIn Request', JSON.stringify(interception.request.body, null, 2))
        logger.debug('SignIn Response', JSON.stringify(interception.response?.body, null, 2))
      }
    })

    cy.wait('@firebaseRequest').then((interception) => {
      const url = interception.request.url
      if (url.includes('accounts:lookup')) {
        logger.debug('Lookup Request', JSON.stringify(interception.request.body, null, 2))
        logger.debug('Lookup Response', JSON.stringify(interception.response?.body, null, 2))
      }
    })

    // Aguardar redirecionamento
    cy.url().should('include', '/parties')

    // Verificar estado da autenticação
    cy.window().should((win) => {
      expect(win.firebase).to.exist
      expect(win.firebase.auth()).to.exist
    })

    // Monitorar mudanças no estado de autenticação
    cy.window().then((win) => {
      const unsubscribe = win.firebase.auth().onAuthStateChanged((user: any) => {
        if (user) {
          unsubscribe()
          logger.debug('Auth State Changed - User:', JSON.stringify(user, null, 2))
        }
      })
    })
  })
})
