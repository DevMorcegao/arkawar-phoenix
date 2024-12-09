import { logger } from '../../lib/logger'
import { MockFirebaseAuth, MockFirestore, MockUser } from '../support'

describe('Authentication Tests', () => {
  const loginEmail = 'test@example.com'
  let registrationEmail: string

  beforeEach(() => {
    // Limpar qualquer estado anterior
    cy.clearFirebaseAuth()
    cy.clearLocalStorage()
    indexedDB.deleteDatabase('firebaseLocalStorageDb')

    // Gerar um email único apenas para registro
    registrationEmail = `test.${Date.now()}.${Math.floor(Math.random() * 1000)}@example.com`
    logger.debug('Registration', 'Email gerado para registro', { email: registrationEmail })

    // Criar stubs para o Firebase
    const createUserStub = cy.stub().as('firebaseCreateUser')
      .callsFake((email: string, password: string) => {
        logger.debug('Firebase', 'Stub createUser chamado', { email, password })
        return Promise.resolve({
          user: {
            email: registrationEmail,
            uid: 'test-uid',
            emailVerified: true,
            displayName: null,
            photoURL: null,
            phoneNumber: null,
            isAnonymous: false,
            tenantId: null,
            providerId: 'password',
            metadata: {
              creationTime: new Date().toISOString(),
              lastSignInTime: new Date().toISOString()
            },
            providerData: [],
            refreshToken: 'mock-refresh-token',
            getIdToken: () => Promise.resolve('mock-id-token'),
            getIdTokenResult: () => Promise.resolve({
              token: 'mock-id-token',
              claims: {
                role: 'user',
                email: registrationEmail,
                email_verified: true,
                auth_time: new Date().toISOString(),
                iat: new Date().toISOString(),
                exp: new Date(Date.now() + 3600000).toISOString(),
                sub: 'test-uid'
              },
              issuedAtTime: new Date().toISOString(),
              expirationTime: new Date(Date.now() + 3600000).toISOString(),
              authTime: new Date().toISOString(),
              signInProvider: 'password',
              signInSecondFactor: null
            }),
            delete: () => Promise.resolve(),
            reload: () => Promise.resolve(),
            toJSON: () => ({
              uid: 'test-uid',
              email: registrationEmail,
              emailVerified: true,
              displayName: null,
              photoURL: null,
              phoneNumber: null,
              isAnonymous: false,
              tenantId: null,
              providerId: 'password',
              metadata: {
                creationTime: new Date().toISOString(),
                lastSignInTime: new Date().toISOString()
              },
              providerData: [],
              refreshToken: 'mock-refresh-token',
              stsTokenManager: {
                refreshToken: 'mock-refresh-token',
                accessToken: 'mock-access-token',
                expirationTime: Date.now() + 3600000
              },
              reloadUserInfo: {
                localId: 'test-uid',
                email: registrationEmail,
                passwordHash: 'mock-hash',
                emailVerified: true,
                passwordUpdatedAt: Date.now(),
                providerUserInfo: [],
                validSince: '0',
                lastLoginAt: new Date().toISOString(),
                createdAt: new Date().toISOString()
              }
            }),
            stsTokenManager: {
              refreshToken: 'mock-refresh-token',
              accessToken: 'mock-access-token',
              expirationTime: Date.now() + 3600000
            },
            reloadUserInfo: {
              localId: 'test-uid',
              email: registrationEmail,
              passwordHash: 'mock-hash',
              emailVerified: true,
              passwordUpdatedAt: Date.now(),
              providerUserInfo: [],
              validSince: '0',
              lastLoginAt: new Date().toISOString(),
              createdAt: new Date().toISOString()
            }
          }
        })
      })

    // Criar mock do usuário para login
    const mockUser: MockUser = {
      email: loginEmail,
      uid: 'test-uid',
      emailVerified: true,
      displayName: null,
      photoURL: null,
      phoneNumber: null,
      isAnonymous: false,
      tenantId: null,
      providerId: 'password',
      metadata: {
        creationTime: new Date().toISOString(),
        lastSignInTime: new Date().toISOString()
      },
      providerData: [],
      refreshToken: 'mock-refresh-token',
      getIdToken: () => Promise.resolve('mock-id-token'),
      getIdTokenResult: () => Promise.resolve({
        token: 'mock-id-token',
        claims: {
          role: 'user',
          email: loginEmail,
          email_verified: true,
          auth_time: new Date().toISOString(),
          iat: new Date().toISOString(),
          exp: new Date(Date.now() + 3600000).toISOString(),
          sub: 'test-uid'
        },
        issuedAtTime: new Date().toISOString(),
        expirationTime: new Date(Date.now() + 3600000).toISOString(),
        authTime: new Date().toISOString(),
        signInProvider: 'password',
        signInSecondFactor: null
      }),
      delete: () => Promise.resolve(),
      reload: () => Promise.resolve(),
      toJSON: () => ({
        uid: 'test-uid',
        email: loginEmail,
        emailVerified: true,
        displayName: null,
        photoURL: null,
        phoneNumber: null,
        isAnonymous: false,
        tenantId: null,
        providerId: 'password',
        metadata: {
          creationTime: new Date().toISOString(),
          lastSignInTime: new Date().toISOString()
        },
        providerData: [],
        refreshToken: 'mock-refresh-token',
        stsTokenManager: {
          refreshToken: 'mock-refresh-token',
          accessToken: 'mock-access-token',
          expirationTime: Date.now() + 3600000
        },
        reloadUserInfo: {
          localId: 'test-uid',
          email: loginEmail,
          passwordHash: 'mock-hash',
          emailVerified: true,
          passwordUpdatedAt: Date.now(),
          providerUserInfo: [],
          validSince: '0',
          lastLoginAt: new Date().toISOString(),
          createdAt: new Date().toISOString()
        }
      }),
      stsTokenManager: {
        refreshToken: 'mock-refresh-token',
        accessToken: 'mock-access-token',
        expirationTime: Date.now() + 3600000
      },
      reloadUserInfo: {
        localId: 'test-uid',
        email: loginEmail,
        passwordHash: 'mock-hash',
        emailVerified: true,
        passwordUpdatedAt: Date.now(),
        providerUserInfo: [],
        validSince: '0',
        lastLoginAt: new Date().toISOString(),
        createdAt: new Date().toISOString()
      }
    }

    // Configurar stubs do Firestore
    const docRefStub = cy.stub()
    const getDocStub = cy.stub().resolves({
      exists: true,
      data: () => ({
        email: loginEmail,
        role: 'user',
        name: 'Test User',
        createdAt: new Date().toISOString()
      })
    })
    const setDocStub = cy.stub().resolves()

    // Configurar stubs
    cy.wrap(docRefStub).as('firestoreDocRef')
    cy.wrap(getDocStub).as('firestoreGetDoc')
    cy.wrap(setDocStub).as('firestoreSetDoc')

    // Interceptar requisições Firebase
    cy.intercept('POST', '**/accounts:signUp*', (req) => {
      logger.debug('Firebase', 'Interceptação signUp', { body: req.body })
      req.continue()
    }).as('signUpRequest')

    cy.intercept('POST', '**/accounts:signInWithPassword*', (req) => {
      logger.debug('Firebase', 'Interceptação signIn', { body: req.body })
      req.continue()
    }).as('signInRequest')

    cy.intercept('POST', '**/accounts:lookup*', {
      statusCode: 200,
      body: {
        users: [{
          localId: 'test-uid',
          email: loginEmail,
          emailVerified: true
        }]
      }
    }).as('userInfoRequest')

    // Interceptar todas as chamadas do Firebase com logging
    cy.intercept('**/*.googleapis.com/**', (req) => {
      const requestData = {
        method: req.method,
        url: req.url,
        headers: req.headers,
        body: req.body,
        timestamp: new Date().toISOString()
      }
      
      logger.debug('Firebase', 'Firebase Request', { request: requestData })
      
      req.continue((res) => {
        const responseData = {
          status: res.statusCode,
          headers: res.headers,
          body: res.body,
          timestamp: new Date().toISOString()
        }
        
        logger.debug('Firebase', 'Firebase Response', { response: responseData })
      })
    }).as('firebaseRequest')

    // Visitar a página com os stubs configurados
    cy.visit('/login', {
      onBeforeLoad(win) {
        logger.debug('Firebase', 'Configurando mocks no onBeforeLoad')
        const mockAuth = {
          currentUser: null,
          onAuthStateChanged: (callback: (user: MockUser | null) => void) => {
            logger.debug('Firebase', 'onAuthStateChanged chamado')
            callback(null)
            return () => {}
          },
          signInWithEmailAndPassword: cy.stub().resolves({ user: mockUser }),
          createUserWithEmailAndPassword: createUserStub,
          signOut: cy.stub().resolves(),
          app: {
            name: '[DEFAULT]',
            options: {},
            automaticDataCollectionEnabled: false,
            auth: () => mockAuth,
            firestore: () => mockFirestore
          },
          name: '[DEFAULT]',
          config: {
            apiKey: 'mock-api-key',
            authDomain: 'mock-auth-domain'
          },
            apiKey: 'mock-api-key',
            authDomain: 'mock-auth-domain',
            languageCode: null,
            tenantId: null,
            settings: {
              appVerificationDisabledForTesting: true
            },
            appVerificationDisabledForTesting: true,
            setPersistence: cy.stub().resolves(),
            useDeviceLanguage: cy.stub(),
            updateCurrentUser: cy.stub().resolves(),
            user: mockUser
          } as unknown as MockFirebaseAuth

          const mockFirestore: MockFirestore = {
            collection: docRefStub,
            doc: docRefStub
          }

          // Mock do Firebase Auth
          win.firebase = {
            auth: () => {
              logger.debug('Firebase', 'firebase.auth() chamado')
              return mockAuth
            },
            firestore: () => mockFirestore
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

    it('should show login form by default', () => {
      cy.get('[data-testid=email-input]').should('exist')
      cy.get('[data-testid=password-input]').should('exist')
      cy.get('[data-testid=login-button]').should('exist')
    })

    it('should switch between login and register forms', () => {
      // Verificar formulário de login
      cy.get('[data-testid=login-form]').should('be.visible')
      cy.get('[data-testid=register-form]').should('not.be.visible')
      cy.get('[data-testid=login-tab]').should('have.attr', 'data-state', 'active')
      cy.get('[data-testid=register-tab]').should('have.attr', 'data-state', 'inactive')

      // Mudar para registro
      cy.get('[data-testid=register-tab]').click()
      cy.get('[data-testid=register-form]').should('be.visible')
      cy.get('[data-testid=login-form]').should('not.be.visible')
      cy.get('[data-testid=register-tab]').should('have.attr', 'data-state', 'active')
      cy.get('[data-testid=login-tab]').should('have.attr', 'data-state', 'inactive')

      // Voltar para login
      cy.get('[data-testid=login-tab]').click()
      cy.get('[data-testid=login-form]').should('be.visible')
      cy.get('[data-testid=register-form]').should('not.be.visible')
      cy.get('[data-testid=login-tab]').should('have.attr', 'data-state', 'active')
      cy.get('[data-testid=register-tab]').should('have.attr', 'data-state', 'inactive')
    })

    it('should sign in successfully', () => {
      cy.get('[data-testid="email-input"]').type(loginEmail)
      cy.get('[data-testid="password-input"]').type('password123')
      cy.get('[data-testid="login-button"]').click()

      // Aguardar e verificar requisições Firebase
      cy.wait('@firebaseRequest').then((interception) => {
        const url = interception.request.url
        if (url.includes('accounts:signInWithPassword')) {
          logger.debug('Firebase', 'SignIn Request', { request: interception.request.body })
          logger.debug('Firebase', 'SignIn Response', { response: interception.response?.body })
        }
      })

      // Verificar redirecionamento e estado de autenticação
      cy.url().should('include', '/parties')
      cy.window().should('have.property', 'firebase')
    })

    it('should show loading state during authentication', () => {
      cy.mockFirebaseAuthLoadingState()

      cy.get('[data-testid="email-input"]').type(loginEmail)
      cy.get('[data-testid="password-input"]').type('password123')
      cy.get('[data-testid="login-button"]').click()

      cy.get('[data-testid="loading-spinner"]').should('be.visible')
      cy.get('[data-testid="login-button"]').should('be.disabled')
    })

    it('should register successfully', () => {
      const timestamp = Date.now()
      const registerEmail = `test.${timestamp}@example.com`

      // Executar registro
      cy.get('[data-testid="register-tab"]').click()
      cy.get('[data-testid="register-name"]').type('Test User')
      cy.get('[data-testid="register-email"]').type(registerEmail)
      cy.get('[data-testid="register-password"]').type('password123')
      cy.get('[data-testid="register-confirm-password"]').type('password123')

      // Configurar interceptações antes da ação
      cy.intercept('POST', '**/accounts:signUp*').as('signUp');
      cy.intercept('POST', '**/google.firestore.v1.Firestore/**').as('firestoreRequest');

      // Clicar no botão de registro
      cy.get('[data-testid="register-button"]').click();

      // Esperar pela resposta do Firebase Auth
      cy.wait('@signUp');
      cy.wait('@firestoreRequest', { timeout: 10000 });
      
      // Verificar redirecionamento e estado de autenticação
      cy.url().should('include', '/parties')
      cy.window().should('have.property', 'firebase')
    })

    it('should show error message with wrong credentials', () => {
      // Interceptar a requisição de login com erro
      cy.intercept('POST', '**/accounts:signInWithPassword*', {
        statusCode: 400,
        body: {
          error: {
            code: 400,
            message: 'INVALID_PASSWORD',
            errors: [
              {
                message: 'INVALID_PASSWORD',
                domain: 'global',
                reason: 'invalid'
              }
            ]
          }
        }
      }).as('signInRequest')

      // Tentar fazer login com credenciais erradas
      cy.get('[data-testid="email-input"]').type(loginEmail)
      cy.get('[data-testid="password-input"]').type('wrongpassword')
      cy.get('[data-testid="login-button"]').click()

      // Aguardar a requisição de erro e verificar a mensagem
      cy.wait('@signInRequest')
      cy.get('[data-testid="error-message"]')
        .should('be.visible')
        .and('contain', 'Email ou senha inválidos')
    })

    it('should handle too many requests error', () => {
      // Interceptar a requisição de login com erro de muitas tentativas
      cy.intercept('POST', '**/accounts:signInWithPassword*', {
        statusCode: 400,
        body: {
          error: {
            code: 400,
            message: 'TOO_MANY_ATTEMPTS_TRY_LATER',
            errors: [
              {
                message: 'TOO_MANY_ATTEMPTS_TRY_LATER',
                domain: 'global',
                reason: 'invalid'
              }
            ]
          }
        }
      }).as('signInRequest')

      // Tentar fazer login
      cy.get('[data-testid="email-input"]').type(loginEmail)
      cy.get('[data-testid="password-input"]').type('password123')
      cy.get('[data-testid="login-button"]').click()

      // Aguardar a requisição de erro e verificar a mensagem
      cy.wait('@signInRequest')
      cy.get('[data-testid="error-message"]')
        .should('be.visible')
        .and('contain', 'Muitas tentativas de login. Tente novamente mais tarde')
    })

    it('should sign in successfully and then logout', () => {
      cy.login('test@example.com', 'password123')
      cy.url().should('include', '/parties')
      
      // Aguardar a tela de carregamento desaparecer
      cy.get('[data-testid="theme-loading-screen"]').should('not.exist')
      
      // Encontrar e clicar no botão de logout
      cy.contains('button', 'Sair').as('logoutButton')
      cy.get('@logoutButton').should('be.visible').click()
      
      // Interceptar e ignorar erros de permissão do Firebase após o logout
      cy.on('uncaught:exception', (err) => {
        if (err.message.includes('Missing or insufficient permissions')) {
          return false
        }
      })

      // Verificar redirecionamento para página de login
      cy.url().should('include', '/login')
      
      // Verificar se o formulário de login está visível
      cy.get('[data-testid="email-input"]').should('be.visible')
      cy.get('[data-testid="password-input"]').should('be.visible')
    })
  })
  
